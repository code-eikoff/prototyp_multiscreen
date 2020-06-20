// const socket = io("http://eikoff:3030/host");

// socket.on("load_home", (html_link) => {

    // var xhr = new XMLHttpRequest();
    // xhr.open("GET", html_link, true);
    // xhr.onreadystatechange = function () {
    //   if (this.readyState !== 4) return;
    //   if (this.status !== 200) return;
    //   parser = new DOMParser();
    //   var doc = parser.parseFromString(this.responseText, "text/html");
    //   let content = document.getElementsByTagName("html")[0];
    //   content.innerHTML = new XMLSerializer().serializeToString(
    //     doc.getElementsByTagName("html")[0]
    //   );
    // };
    // xhr.send();
  // });

// socket.on('number', data => number_div.innerHTML = data );

// socket.on("qrlink", (link) => {
    // let typeNumber = 4;
    // let errorCorrectionLevel = "M";
    // let qr = qrcode(typeNumber, errorCorrectionLevel);
    // qr.addData(link);
    // qr.make();
    
    // let qrcode_div = document.getElementById("qrcode");
    // qrcode_div.innerHTML = qr.createImgTag("10", "0", "qrcode");

// });
