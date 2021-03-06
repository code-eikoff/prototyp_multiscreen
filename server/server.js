const io = require("socket.io")(3030);
const fs = require("fs");
const parseString = require("xml2js").parseString;

const qrcode = require("./qrcode");

const link_host = "ms.eikoff.de";
// const link_host = "eikoff:5500";
const link_user2 = "/client/user/";
const link_host_base = "client/host/";

const socket_host = io.of("/host");
const socket_user = io.of("/user");

let client_hosts = [];
let client_users = [];
let user_in_room = [];

let quiz_sessions = [];
let qs_geantwortet = [];
const timer_quiz_frage = 4000; //ms
const timer_next_qz = 105000 + timer_quiz_frage; //ms
const anzahlFragen = 3;
const punkte_max = timer_next_qz / 100;

/**
 * Menü namen in richtiger Reihenfolge, werden als id verwendet
 * home, Lageplan, Themenübersicht, Detailansicht,..
 */
const options = [
  "home",
  "Lageplan",
  "Themenübersicht",
  "Detailansicht",
  "Galerie",
  "Quiz"
];


const themenueb = {
  Name: [],
  Beschreibung: [],
  Link: []
}
let htmlContent = 'x';

//liest die HTML Datei für die tempotäre neue Unterseite aus
fs.readFile("client/user/user.html", "utf-8", (err, data) => {
  if (err) console.log(err);
  else htmlContent = data;
});


/**
  * @desc liest die Themenübersicht-Daten aus einer xml Datei aus und speichert sie in "themenueb" object
*/
function ladeThemen() {
  fs.readFile("server/themen.xml", "utf-8", (err, data) => {
    if (err) {
      console.log(err);
      return;
    }
    parseString(data, (err, result) => {
      if (err) {
        console.log(err);
        return;
      }
      var json = result;
      for (let i = 0; i < 6; i++) {
        themenueb.Name[i] = json.Themenueb.Thema[i].$.Titel;
        themenueb.Beschreibung[i] = json.Themenueb.Thema[i].Beschreibung.toString();
        themenueb.Link[i] = json.Themenueb.Thema[i].Link.toString();
      }
    });
  });
}

/*

===========================================
===========================================

-----  H O S T   C O N N E C T I O N  -----

===========================================
===========================================

*/

socket_host.on("connection", (socket) => {
  ladeThemen();
  client_hosts.push(socket); //host wird im array gespeichert
  let room = makeid(3);
  // room = "b";
  user_in_room.push([room, 0]);
  socket.join(room);


  try {
    if (fs.existsSync(`${room}.html`)) {
      //file exists
    } else {
      fs.writeFile(`${room}.html`, htmlContent, (error) => { console.log(error) });
    }
  } catch (err) {
    console.error(err)
  }

  let qrcode_img = getQRcode("http://" + link_host + '/' + room);
  socket_host.to(room).emit("qrimg", qrcode_img, link_host + "/" + room + ''); //schicke qr-code img


  socket.on("frage_ist_bereit", (nr, qs) => {
    setTimeout(() => {
      // let qs = quiz_sessions[nr];
      let fnr = qs.FrageNr;
      if (fnr < qs.Fragen.length) {
        socket_user.to(qs.Room).emit('zeigeFrageAntwort', qs.Fragen[fnr], nr, qs);
      }
    }, 2000);
  });

  socket.on("getrennt", () => {
    console.log("getrennt");
    deleteRoom(room)
    client_hosts.pop(socket);
  });

  socket.on("err", (err) => {
    console.log(err);
  });

  //wenn der Host sich trennt
  socket.on("disconnect", () => {
    deleteRoom(room)
    client_hosts.pop(socket);
  });


});
/**
  * @desc löscht den Raum
  * @param string room - name vom zu löschenden raum
*/
function deleteRoom(room) {
  fs.unlink(`${room}.html`, (err) => {
    if (err) {
      console.error(err)
      return
    }
  })
}

/*
===========================================
===========================================

-----  U S E R   C O N N E C T I O N  -----

===========================================
===========================================

User verbindet sich
*/

socket_user.on("connection", (socket) => {

  client_users.push(socket);
  let room = "";
  let room_nr = 0;
  let punkte = 0;
  let geantwortet = false;
  let readyF = true;

  let galerie = getGalerie();

  let timer_qz;

  /*
  Verbindung herstellen und in Room einloggen
  */
  socket.on("user_connect", (r) => {
    room = r.slice(-3);
    socket.join(room);
    room_nr = 0;

    /**
     * prüft ob der Raum existiert
     * speichert neuen user
     * 
     * //ist vielleicht besser mit Objekten zu lösen oder so
     */
    if (user_in_room[0]) {
      for (i = 0; i < user_in_room.length; i++) {
        if (user_in_room[i][0] === room) {
          user_in_room[i][1]++;
          room_nr = i;
          socket_host.to(room).emit("verbunden");
        }
      }
    }
  });

  /*
  Verbindung trennen
  anzahl der User im Raum um eins verringern
  falls dann keiner im Raum ist - host getrennt schicken, der läd dann neu
  */
  socket.on("disconnect", () => {
    client_users.pop(socket);

    if (user_in_room[0]) {
      for (i = 0; i < user_in_room.length; i++) {

        if (user_in_room[i][0] === room) {
          user_in_room[i][1] -= 1;

          if (user_in_room[i][1] < 1) {
            socket_host.to(room).emit("getrennt");

            try {
              if (qs_geantwortet[room_nr][1]) {
                qs_geantwortet[room_nr][1] -= 1;
              }
              else {
              }
            } catch (err) {
              //  console.error(err) //  hat noch ken quiz gespeilt
            }

            user_in_room.pop(user_in_room[i]);

          }
          // console.log(`user disconnect in "${room}"`);
        }
      }
    }
  });


  // Wenn der Nutzer start drückt um Interaktion zu starten
  socket.on("err", (err) => {
    console.error(`ERROR: ${err}`);
  });


  // Wenn der Nutzer start drückt um Interaktion zu starten
  socket.on("start", () => {
    socket_user.to(room).emit('load_options', options);
    socket_host.to(room).emit('load_options', options);

    socket_user.to(room).emit('load_content', `${link_user2 + options[0]}.html`, 'home');
    socket_host.to(room).emit("load_content", link_host_base + "index.html", 'home');
  });


  // wenn ein button der Themen-Auswahl im Hauptmenü geklickt wird
  socket.on("btn_click", (option, slide) => {

    switch (option) {
      case options[0]: //"home"
        socket_user.to(room).emit('load_content', `${link_user2 + options[0]}.html`, options[0]);
        socket_host.to(room).emit("load_content", `${link_host_base}index.html`, options[0]);
        break;

      case "Detailansicht": //"kaiserpf"
        if (slide) {
          socket_user.to(room).emit('load_content', `${link_user2}Detailansicht.html`, "Detailansicht", slide);
          socket_host.to(room).emit("load_content", `${link_host_base}Detailansicht".html`, "Detailansicht", slide);
        } else {
          socket_user.to(room).emit('load_content', `${link_user2}Detailansicht.html`, "Detailansicht");
          socket_host.to(room).emit("load_content", `${link_host_base}Detailansicht.html`, "Detailansicht");
        }
        break;

      case "Lageplan": //"lageplan"
        socket_user.to(room).emit('load_content', `${link_user2}Lageplan.html`, "Lageplan");
        socket_host.to(room).emit("load_content", `${link_host_base}Lageplan.html`, "Lageplan");
        break;

      case "Quiz": //"quiz"
        socket_user.to(room).emit('load_content', `${link_user2}Quiz.html`, "Quiz");
        socket_host.to(room).emit("load_content", `${link_host_base}Quiz.html`, "Quiz");
        break;

      case "Themenübersicht"://themenübersicht
        socket_user.to(room).emit('load_content', `${link_user2}Themenübersicht.html`, "Themenübersicht", themenueb);
        socket_host.to(room).emit("load_content", `${link_host_base}Themenübersicht.html`, "Themenübersicht", themenueb);
        break;

      case "Galerie"://galerie
        socket_user.to(room).emit('load_content', `${link_user2}Galerie.html`, "Galerie", galerie);
        socket_host.to(room).emit("load_content", `${link_host_base}Galerie.html`, "Galerie", galerie);
        break;

      default:
        console.log("Sorry, we are out of options... in btn_click");
    }

  });




  /*
  
  ==================================================
  ==================================================
  
      R E G I S T E R K A R T E N   /   Tabs
  
  ==================================================
  ==================================================
  
  */

  socket.on("slideChange", (slideNr) => {
    socket_user.to(room).emit('change_Slide', slideNr);
    socket_host.to(room).emit("change_Slide", slideNr);
  });

  socket.on("details_Tabs", (nr, slide) => {
    socket_user.to(room).emit('load_content', `${link_user2}details/Detailansicht_${nr}.html`, "Detailansicht" + '_details', slide);
    socket_host.to(room).emit('load_content', `${link_host_base}details/Detailansicht_${nr}.html`, "Detailansicht" + '_details', slide);
  });

  socket.on("scrollToItem", (i) => {
    socket_host.to(room).emit('scrollToItem', i);
  });





  /*
  
  ==================================================
  ==================================================
  
      L A G E P L A N
  
  ==================================================
  ==================================================
  
  */
  socket.on("mapControl", (cmd) => {
    switch (cmd) {
      case "up":
        socket_host.to(room).emit('panBy', [0, -200]);
        break;
      case "down":
        socket_host.to(room).emit('panBy', [0, 200]);
        break;
      case "left":
        socket_host.to(room).emit('panBy', [-200, 0]);
        break;
      case "right":
        socket_host.to(room).emit('panBy', [200, 0]);
        break;
      case "in":
        socket_host.to(room).emit('zoom', "in");
        break;
      case "out":
        socket_host.to(room).emit('zoom', "out");
        break;
      default:
        console.log("out of options... in mapControl");
    }
  });




  /*
  
  ==================================================
  ==================================================
  
      Q U I Z
  
  ==================================================
  ==================================================
  
  */


  /**
  * @desc starte den Timer neu der die Frage stoppt
  * @param string nr - Fragenummer
  * @param string nr - Fragenummer
  */
  function starteTimerStoppFrage(nr, qs) {
    timer_qz = setTimeout(() => {
      neueFage(nr, qs);
    }, timer_next_qz);
  }

  /**
   * Stoppt den Timer für das Quiz
   */
  function stopTimerQz() {
    clearTimeout(timer_qz);
  }

  socket.on("neueQuizSession", () => {
    stopTimerQz();
    neueQuizSession(room, anzahlFragen);

  });

  socket.on("starteQuizSession", (nr, qs) => {
    try {
      qs_geantwortet.push([0, user_in_room[nr][1]]);
      console.log(user_in_room[nr][1]);
      stopTimerQz();

      socket_user.to(qs.Room).emit('platzhalter');
      socket_host.to(qs.Room).emit('zeigeFrage', qs.Fragen[qs.FrageNr].frage, timer_quiz_frage, nr, qs);
      starteTimerStoppFrage(nr, qs);
    } catch (error) {
      socket_user.to(qs.Room).emit("refresh");
      socket_host.to(qs.Room).emit("refresh");
    }
  });

  /**
   * neue Frage starten
   * falls alle Fragen durch - statistik anzeigen
   */
  socket.on("starteNeueFrage", (nr, qs) => {

    stopTimerQz();

    if (readyF) {
      readyF = false;
      qs_geantwortet[nr][0] = 0;
      try {
        let frage = qs.Fragen[qs.FrageNr].frage;

        if (qs.FrageNr <= anzahlFragen) {

          if (qs.FrageNr + 1 == anzahlFragen) {
            setTimeout(() => {
              console.log("hier time");
              stopTimerQz();
              socket_user.to(qs.Room).emit("ladeStatistik");
              socket_host.to(qs.Room).emit("zeigeStatistik", "<h2>Quiz ist vorbei<br/>hier würden die Statistiken angezeigt werden</h2>");
            }, timer_next_qz);

          } else {
            socket_user.to(qs.Room).emit('platzhalter');
            socket_host.to(qs.Room).emit('zeigeFrage', frage, timer_quiz_frage, nr, qs);

            starteTimerStoppFrage(nr, qs);
          }

        }
        else {
          stopTimerQz();
          socket_user.to(qs.Room).emit("ladeStatistik");
          socket_host.to(qs.Room).emit("zeigeStatistik", "<h2>Fehler im Spiel<br/>qs.FrageNr + 1 == anzahlFragen</h2>");

        }
      } catch (error) {
        stopTimerQz();
        socket_user.to(qs.Room).emit("ladeStatistik");
        socket_host.to(qs.Room).emit("zeigeStatistik", `<h2>Fehler im Spiel:</h2>${error}`);
      }

    }

  });

  /**
   * wenn ein Spieler antwortet
   * wertet Antwort aus
   * falls letzte Frage und alle anderen geantwortet - beende Quiz
   */
  socket.on("antwort", (antw, t, nr, qs) => {

    let ga = 0;
    let ges = 1;

    try {
      let correctAntw = qs.Fragen[qs.FrageNr].correct;
      if (!geantwortet) {
        geantwortet = true;
        qs_geantwortet[nr][0] += 1;
        ga = qs_geantwortet[nr][0];
        ges = user_in_room[nr][1];

        if (correctAntw == antw) {
          punkte += punkte_max - t;
        }

        setTimeout(() => {
          if (ga >= ges) {
            readyF = true;
            qs_geantwortet[nr][0] = 0;
            console.log(qs.FrageNr + " Fragen von " + anzahlFragen);
            if (qs.FrageNr + 1 >= anzahlFragen) {
              stopTimerQz();
              socket_user.to(qs.Room).emit("ladeStatistik");
              socket_host.to(qs.Room).emit("zeigeStatistik", "<h2>Quiz ist vorbei<br/>hier würden die Statistiken angezeigt werden</h2>");

            } else {
              stopTimerQz();
              neueFage(nr, qs);
              geantwortet = false;
            }
          }
        }, 400);


      }
    } catch (err) {

      readyF = true;
      geantwortet = false;

      socket_user.to(room).emit('load_content', `${link_user2 + options[0]}.html`, options[0]);
      socket_host.to(room).emit("load_content", `${link_host_base}index.html`, options[0]);


      console.error("error in Antwort: " + err)
    }

  });

  /**
   * Zeigt die Punkte des Spielers an
   *  //hier können Statistiken eingefügt werden, die auf dem Host angezeigt werden
   */
  socket.on("ladeStatistik", () => {
    stopTimerQz();
    socket.emit("zeigeStatistik", Math.round((punkte / 10)));
  });





  /*

==================================================
==================================================

    T H E M E N Ü B E R S I C H T

==================================================
==================================================

  */

  /**
   * Unterthema bei der Themenübersicht anzeigen
   */
  socket.on("themaÖffnen", (i) => {
    socket_user.to(room).emit('load_content', `${link_user2}details/${themenueb.Link[i]}`, `Themenübersicht_details`);
  });





  /*  

==================================================
==================================================

    G A L E R I E

==================================================
==================================================

  */


  /**
    * neues Bild anzeigen
    * sendet Bildnummer an Clients
  */
  socket.on("next_Pic", (n) => {
    socket_user.to(room).emit('next_Pic', n);
    socket_host.to(room).emit('next_Pic', n);
  });




});




/*

==================================================
==================================================

 -------------  Weitere Funktionen  -------------

==================================================
==================================================

*/

/**
  * @desc erstelle ein QRCode-Link als Bild
  * @param string link - Link zum verbinden als User
  * @return img - QRCode
*/
function getQRcode(link) {
  let typeNumber = 4;
  let errorCorrectionLevel = "M";
  /**
   * @author Kazuhiko Arase (2009)
   * @source https://github.com/kazuhikoarase/qrcode-generator
   */
  let qr = qrcode(typeNumber, errorCorrectionLevel);
  qr.addData(link);
  qr.make();
  return qr.createImgTag("10", "0", "qrcode");
}

/**
  * erstelle eine zufällige id
  * @param {int} int length, länge der Zeichen der id
  * @return {sting} string - zufällige id
*/
function makeid(length) {
  var result = "";
  var characters = "abcdefghikmpqrstuwxyz";
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result;
}

/**
  * @desc startet neues Quiz. Läd Fragen. Sendet quizsession an user
  * @param string room - Raumname
  * @param int fragen_anzahl - Anzahl der Fragen
*/
function neueQuizSession(room, fragen_anzahl) {

  let quiz_session_number = quiz_sessions.length;
  let fragen = [];
  let aktuelleFrageNr = 0;

  for (var i = 0; i < fragen_anzahl; i++) {
    fragen.push(getFrageAntwort(i));
  }

  let quiz_session = { Room: room, SessionNumber: quiz_session_number, Fragen: fragen, FrageNr: aktuelleFrageNr };

  // quiz_sessions.push(quiz_session);
  setTimeout(() => {
    console.log("1: " + quiz_session);
    socket_user.to(room).emit('QuizSessionBereit', quiz_session_number, quiz_session);
  }, 3500);

}

/**
  * @desc startet neue Frage
  * @param int nr - Frage Nummer
  * @param object qs - Quizsession {Raum, SessionNumber, Fragen,...}
*/
function neueFage(nr, qs) {
  // let qs = quiz_sessions[nr];
  qs.FrageNr++;
  // if (qs.FrageNr < qs.Fragen.length) {
  console.log("socket_user.to(qs.Room).emit('neueFrageBereit')");
  socket_user.to(qs.Room).emit('neueFrageBereit', nr, qs);

  let correctAntw = qs.Fragen[qs.FrageNr - 1].correct;
  socket_host.to(qs.Room).emit("zeigeFrageAntwort", qs.Fragen[qs.FrageNr - 1], correctAntw, qs);


  // } else {
  //   socket_user.to(qs.room).emit('zeigeStatistikSeite');
  //   socket_host.to(qs.Room).emit("zeigeStatistik", "hier kommen die Statistiken hin");
  // }

}

/**
  * @desc liest aus der quiz.xml Datei eine bestimmte Frage aus
  * @param int n - nummer der Frage
  * @return Object {frage_nummer: number; frage: string; antworten: array[]; correct: number;
}
*/
function getFrageAntwort(n) {

  let fa = { frage_nummer: n, frage: "?", antworten: [], correct: 0 };

  try {
    if (fs.existsSync(`server/quiz.xml`)) {
      fs.readFile("server/quiz.xml", "utf-8", (err, data) => {

        if (err) console.err(err);

        parseString(data, (err, result) => {
          if (err) console.log(err);
          var json = result;

          fa.frage = json.quiz.item[n].question.toString();
          for (var i = 0; i < 4; i++) {
            if (json.quiz.item[n].answer[i].$) {
              if (json.quiz.item[n].answer[i].$.correct) {
                fa.correct = i;
                fa.antworten.push(json.quiz.item[n].answer[i]._);
              } else {
                fa.antworten.push(json.quiz.item[n].answer[i].$);
              }
            } else {
              fa.antworten.push(json.quiz.item[n].answer[i]);
            }
          }
        });
      });

    } else {
      console.error("nicht vorhanden");
    }
  } catch (err) {
    console.error(err);
  }
  return fa;
}

/**
  * @desc Läd die Daten für die Galerie aus einer json Datei
  * @return json objekt
*/
function getGalerie() {
  let rawdata = fs.readFileSync('server/galerie.json');
  return JSON.parse(rawdata);
}


