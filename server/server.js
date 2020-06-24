const io = require("socket.io")(3030);
const fs = require("fs");
const parseString = require("xml2js").parseString;
// const xml2js = require("xml2js");
// var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;


const qrcode = require("./qrcode");

const link_host = "eikoff:5500";
const link_user = link_host + "/client/user/";
const link_host_base = "client/host/";


const options = ["home", "Detailansicht", "Lageplan", "Quiz", "Themenübersicht"];

const socket_host = io.of("/host");
const socket_user = io.of("/user");

const timer_quiz_frage = 20;
const anzahlFragen = 2;

let client_hosts = [];
let client_users = [];

// function getNumber() {
//   fs.readFile("server/db.xml", "utf-8", (err, data) => {
//     if (err) console.log(err);

//     parseString(data, (err, result) => {
//       if (err) console.log(err);
//       var json = result;
//       number = json.zahlen.tee[0].toString();
//     });
//   });
// }

let user_in_room = [];
let quiz_sessions = [];
let qs_geantwortet = [];

/*

-----  H O S T   C O N N E C T I O N  -----

*/

socket_host.on("connection", (socket) => {
  client_hosts.push(socket); //host wird im array gespeichert
  // let room = 'room'+client_hosts.length;

  let room = makeid(3);
  room = "test";
  user_in_room.push([room, 0]);
  socket.join(room);

  var htmlContent = `<script>window.location='/client/user/index.html#${room}'</script>`;

  try {
    if (fs.existsSync(`${room}.html`)) {
      //file exists
    } else {
      fs.writeFile(`${room}.html`, htmlContent, (error) => { console.log(error) });
    }
  } catch (err) {
    console.error(err)
  }

  socket.on("getQRCode", () => {
    let qrcode_img = getQRcode("http://" + link_user + "index.html#" + room);
    // socket_host.to(room).emit("qrimg", qrcode_img, link_user + "#" + room); //schicke qr-code img
    socket_host.to(room).emit("qrimg", qrcode_img, link_host + "/" + room + '.html'); //schicke qr-code img
  });

  socket.on("set_user_antworten", (nr) => {
    setTimeout(() => {
      let qs = quiz_sessions[nr];
      let fnr = qs.FrageNr;
      if (fnr < qs.Fragen.length) {
        socket_user.to(qs.Room).emit('zeigeFrageAntwort', qs.Fragen[fnr], nr);
      }
    }, 2000);
  });




  //wenn der Host sich trennt
  socket.on("disconnect", () => {
    client_hosts.pop(socket);
    // fs.unlink(`${room}.html`, (err) => {
    //   if (err) {
    //     console.error(err)
    //     return
    //   }
    // })

  });


});



/*
===========================================
-----  U S E R   C O N N E C T I O N  -----
===========================================

User verbindet sich
*/

socket_user.on("connection", (socket) => {
  client_users.push(socket);
  let room = "";
  let room_nr = 0;
  let quiz_nr = 0;
  let geantwortet = false;
  let punkte = 0;
  let ready = true;
  let readyF = true;


  socket.on("user_connect", (r) => {
    room = r;
    while (room.charAt(0) === "#") {
      room = room.substr(1);
    } //entferne # am Anfang
    socket.join(room);

    if (user_in_room[0]) {
      for (i = 0; i < user_in_room.length; i++) {
        if (user_in_room[i][0] === room) {
          user_in_room[i][1]++;
          room_nr = i;
          console.log(
            `new user in "${user_in_room[i][0]}": ${user_in_room[i][1]}`
          );
        }
      }
    }
    socket_host.to(room).emit("verbunden");
  });

  // Wenn der Nutzer start drückt um Interaktion zu starten
  socket.on("start", () => {
    socket_user.to(room).emit('load_options', options);
    socket_host.to(room).emit('load_options', options);

    socket_user.to(room).emit('load_content', 'home.html', 'home');
    socket_host.to(room).emit("load_content", link_host_base + "index.html");
  });



  // wenn ein button der Themen-Auswahl im Hauptmenü geklickt wird
  socket.on("btn_click", (option, slide) => {

    switch (option) {
      case options[0]: //"home"
        socket_user.to(room).emit('load_content', `${options[0]}.html`, options[0]);
        socket_host.to(room).emit("load_content", `${link_host_base}index.html`, options[0]);

        break;
      case options[1]: //"kaiserpf"

        if (slide) {
          socket_user.to(room).emit('load_content', `${options[1]}.html`, options[1], slide);
          socket_host.to(room).emit("load_content", `${link_host_base}${options[1]}.html`, options[1], slide);

        } else {
          socket_user.to(room).emit('load_content', `${options[1]}.html`, options[1]);
          socket_host.to(room).emit("load_content", `${link_host_base}${options[1]}.html`, options[1]);

        }
        break;
      case options[2]: //"lageplan"
        socket_user.to(room).emit('load_content', `${options[2]}.html`, options[2]);
        socket_host.to(room).emit("load_content", `${link_host_base}${options[2]}.html`, options[2]);
        break;
      case options[3]: //"quiz"
        socket_user.to(room).emit('load_content', `${options[3]}.html`, options[3]);
        socket_host.to(room).emit("load_content", `${link_host_base}${options[3]}.html`, options[3]);
        break;
      case options[4]:
        socket_user.to(room).emit('load_content', `${options[4]}.html`, options[4]);
        socket_host.to(room).emit("load_content", `${link_host_base}${options[4]}.html`, options[4]);
        break;

      default:
        console.log("Sorry, we are out of options... in btn_click");
    }

  });



  socket.on("slideChange", (slideNr) => {
    socket_user.to(room).emit('change_Slide', slideNr);
    socket_host.to(room).emit("change_Slide", slideNr);
  });

  socket.on("details_Galerie", (nr, slide) => {
    socket_user.to(room).emit('load_content', `details/${options[1]}_${nr}.html`, options[1] + '_details', slide);
    socket_host.to(room).emit('load_content', `${link_host_base}details/${options[1]}_${nr}.html`, options[1] + '_details', slide);
  });




  socket.on("scrollToItem", (i) => {
    socket_host.to(room).emit('scrollToItem', i);
  });

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


  socket.on("neueQuizSession", () => {
    if (ready) {
      ready = false;
      console.log("neueQuizSession");//ooooooooo

      neueQuizSession(room, anzahlFragen);
    }


    console.log("l " + quiz_sessions.length);
    // setTimeout(() => {
    //   console.log(quiz_sessions[0]);
    // }, 1000);

  });

  socket.on("starteQuizSession", (nr) => {

    console.log("starteQuizSession");//ooooooooo

    quiz_nr = nr;
    let qs = quiz_sessions[nr];

    qs_geantwortet.push([0, user_in_room[room_nr][1]]);

    console.log(user_in_room[room_nr][1]);

    socket_user.to(qs.Room).emit('platzhalter');
    socket_host.to(qs.Room).emit('zeigeFrage', qs.Fragen[qs.FrageNr].frage, timer_quiz_frage, nr);
  });

  socket.on("starteNeueFrage", (nr) => {
    // if (readyF) {
    // readyF = false;
    console.log("starteNeueFrage");//ooooooooo

    let qs = quiz_sessions[nr];
    qs_geantwortet[room_nr][0] = 0;
    try {
      let frage = qs.Fragen[qs.FrageNr].frage;
      if (qs.FrageNr <= anzahlFragen) {
        socket_user.to(qs.Room).emit('platzhalter');
        socket_host.to(qs.Room).emit('zeigeFrage', frage, timer_quiz_frage, nr);

      }
    } catch (error) {
      socket_host.to(qs.Room).emit("zeigeStatistik", "hier kommen die Statistiken hin");

    }



  });


  socket.on("antwort", (antw, t, nr) => {

    let ga = 0;
    let ges = 1;
    let qs = quiz_sessions[nr];


    try {
      let correctAntw = qs.Fragen[qs.FrageNr].correct;
      if (!geantwortet) {

        geantwortet = true;
        qs_geantwortet[room_nr][0] += 1;
        ga = qs_geantwortet[room_nr][0];
        ges = user_in_room[room_nr][1];
        console.log(ga + " " + ges);
        if (correctAntw == antw) {
          punkte += 300 - t;
        }
        console.log(ga + " von " + ges);

      }
      if (ga >= ges) {
        readyF = true;

        qs_geantwortet[room_nr][0] = 0;
        geantwortet = false;

        neueFage(nr);
      }

    } catch (err) {

      readyF = true;

      geantwortet = false;

      socket_user.to(room).emit('load_content', `${options[0]}.html`, options[0]);
      socket_host.to(room).emit("load_content", `${link_host_base}index.html`, options[0]);


      console.error("error in Antwort: " + err)
    }



  });


  // nur zum Testen
  // socket.on("say", (t) => {
  //   console.log(`user say: "${t}"`);
  // });



  socket.on("disconnect", () => {
    // console.log(socket_user.in(room).listenerCount.length)
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
                user_in_room.pop(user_in_room[i]);
              }
              else {
                user_in_room.pop(user_in_room[i]);
              }
            } catch (err) {
              console.error(err)
            }


          }
          // console.log(`user disconnect in "${room}"`);
        }
      }
    }
  });



});




/*
erstelle ein QRCode-Link als Bild
*/
function getQRcode(link) {
  let typeNumber = 4;
  let errorCorrectionLevel = "M";
  let qr = qrcode(typeNumber, errorCorrectionLevel);
  qr.addData(link);
  qr.make();
  return qr.createImgTag("10", "0", "qrcode");
}

function makeid(length) {
  var result = "";
  var characters = "123456789abcdefghikmpqrstuwxyz";
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result;
}




function neueQuizSession(room, fragen_anzahl) {

  let quiz_id = makeid(6);
  let quiz_session_number = quiz_sessions.length;
  let fragen = [];
  let aktuelleFrageNr = 0;

  for (var i = 0; i < fragen_anzahl; i++) {
    fragen.push(getFrageAntwort(i));
  }

  let quiz_session = { ID: quiz_id, Room: room, SessionNumber: quiz_session_number, Fragen: fragen, FrageNr: aktuelleFrageNr };

  quiz_sessions.push(quiz_session);

  socket_user.to(room).emit('QuizSessionBereit', quiz_session_number);

}



function neueFage(nr) {
  let qs = quiz_sessions[nr];

  qs.FrageNr += 1;

  if (qs.FrageNr < qs.Fragen.length) {
    console.log("socket_user.to(qs.Room).emit('neueFrageBereit')")
    socket_user.to(qs.Room).emit('neueFrageBereit');

    let correctAntw = qs.Fragen[qs.FrageNr - 1].correct;
    socket_host.to(qs.Room).emit("zeigeFrageAntwort", qs.Fragen[qs.FrageNr - 1], correctAntw);


  } else {
    socket_user.to(qs.room).emit('zeigeStatistikSeite');
    socket_host.to(qs.Room).emit("zeigeStatistik", "hier kommen die Statistiken hin");

  }

}



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


// function getHTMLText(link) {
//   fs.readFile(link, "utf-8", (err, data) => {
//     if (err) console.log(err);
//     console.log(data);
//     return data;
//   });
// }

// io.on("connection", (socket) => {
//   if (io.engine.clientsCount <= 1) socket.emit("qrlink", link_click);

//   socket.on("request", (url_s) => {
//     console.log("url: " + url_s);
//     socket.broadcast.emit("show_number", number);
//     socket.emit("number", number);
//   });

//   socket.on("addOne", () => {
//     number++;
//     socket.broadcast.emit("number", number);
//     socket.emit("number", number);
//   });

//   socket.on("disconnect", () => {
//     console.log(io.engine.clientsCount);
//     if (io.engine.clientsCount <= 1) {
//       saveNumber(number);
//       socket.broadcast.emit("qrlink", link_click);
//       console.log("x");
//     }
//   });
// });

// function saveNumber(n) {
//   let fileLoc = "server/db.xml";

//   fs.readFile(fileLoc, "utf-8", (err, data) => {
//     if (err) console.log(err);

//     parseString(data, (err, result) => {
//       if (err) console.log(err);
//       var json = result;
//       json.zahlen.tee[0] = n;
//       var builder = new xml2js.Builder();
//       var xml = builder.buildObject(json);

//       fs.writeFile(fileLoc, xml, (err, data) => {
//         if (err) console.log(err);
//       });
//     });
//   });
// }



