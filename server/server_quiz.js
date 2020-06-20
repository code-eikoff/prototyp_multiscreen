const io = require("socket.io")(3030),
  fs = require("fs"),
  parseString = require("xml2js").parseString,
  xml2js = require("xml2js"),
  link_click = "http://eikoff:5500/client_click/";

let frage,
  frage_nummer = 1,
  antworten = [],
  correct;

io.on("connection", (socket) => {
  console.log("Connections: " + io.engine.clientsCount);

  // if(io.engine.clientsCount <= 1)  socket.emit('qrlink', link_click);

  // socket.on( 'antwort', antwort_nummer => {
  //   antwort_nummer = Number(antwort_nummer);
  //   console.log("antw: " + antwort_nummer);
  // socket.broadcast.emit('show_number', number);
  // socket.emit('number', number);
  // });

  socket.on("frage", () => {
    leseFrage(1);
    socket.broadcast.emit("lade_frage", frage);
    socket.emit("lade_frage", frage);
  });

  // socket.on( 'request', url_s => {
  //   console.log("url: " + url_s);
  //   socket.broadcast.emit('show_number', number);
  //   socket.emit('number', number);
  // });

  socket.on("disconnect", () => {
    // console.log(io.engine.clientsCount);
    // if ( io.engine.clientsCount <=1 ) {
    //   saveNumber(number);
    //   socket.broadcast.emit('qrlink', link_click);
    //   console.log("x");
    // }
  });
});

function leseFrage(n) {
  antworten = [];
  fs.readFile("server/quiz.xml", "utf-8", (err, data) => {
    if (true) console.log("true");
    if (err) console.log(err);

    parseString(data, (err, result) => {
      if (err) console.log(err);
      var json = result;

      frage = json.quiz.item[n].question.toString();
      for (var i = 0; i < 4; i++) {
        if (json.quiz.item[n].answer[i].$) {
          if (json.quiz.item[n].answer[i].$.correct) {
            correct = i;
            antworten.push(json.quiz.item[n].answer[i]._);
          } else {
            antworten.push(json.quiz.item[n].answer[i].$);
          }
        } else {
          antworten.push(json.quiz.item[n].answer[i]);
        }
      }
    });
  });
}



function saveNumber(n) {
  // let fileLoc = 'server/db.xml';
  // fs.readFile(fileLoc, "utf-8", (err, data) => {
  //   if (err) console.log(err);
  //   parseString(data, (err, result) => {
  //     if (err) console.log(err);
  //     var json = result;
  //     json.zahlen.tee[0] = n;
  //     var builder = new xml2js.Builder();
  //     var xml = builder.buildObject(json);
  //     fs.writeFile(fileLoc, xml, (err, data) => {
  //       if (err) console.log(err);
  //     });
  //   });
  // });
}
