
let currentSlideIndex = 0;
let currentMenuName = 'home';
let backButtonLoc = 'home';

let options = ["home"];

// console.time();

const socket = io("http://ms.eikoff.de:3030/host");

socket.emit("getQRCode");


// socket.on('number', data => number_div.innerHTML = data );

socket.on("qrimg", (img, link, color) => {
  // console.timeEnd();
  document.getElementById("scan_me").classList.remove("hidden");
  let qrcode_div = document.getElementById("qrcode");
  qrcode_div.innerHTML = img + `<h3>${link}</h3>`;

});

socket.on("verbunden", () => {

  if (document.getElementById("border")) document.getElementById("border").classList.remove("hidden");
  let anw = document.getElementById("anweisung");
  if (anw) anw.innerHTML = `<h3>Du bist verbunden. Drücke jetzt auf Start.</h3>`;

});

socket.on("getrennt", () => location.reload());



socket.on("load_options", (data) => options = data);

socket.on("load_content", (html_link, name) => {
  importContent(html_link, name);
  initContent(name, null);
});

socket.on("load_content", (html_link, name, data) => {
  importContent(html_link, name);
  initContent(name, data);
});

function importContent(link, name) {
  let xhr = new XMLHttpRequest();
  xhr.open("GET", link, true);
  xhr.onreadystatechange = function () {
    if (this.readyState !== 4) return;
    if (this.status !== 200) return;

    parser = new DOMParser();
    let doc = parser.parseFromString(this.responseText, "text/html");
    let content = document.getElementById("content");
    content.innerHTML = new XMLSerializer().serializeToString(
      doc.getElementById("content_html")
    );

    // console.log(name);
    // if (name == "opt_map") {
    //   let contentScript = doc.getElementById("script");
    //   let script = document.createElement("script");
    //   script.textContent = contentScript.textContent;
    //   document.body.appendChild(script);

    // }

  };
  xhr.send();
}


function initContent(name, data) {
  switch (name) {
    // options[0] ist immer die startseite (das Hauptmenü)

    case "home":
      currentSlideIndex = 0;
      setTimeout(initHome, 400);
      break;

    case "Detailansicht": //Detailansicht Kaiserpfalz
      if (data) currentSlideIndex = data;
      setTimeout(initOpt01, 400);
      break;

    case (`Detailansicht_details`)://Detailansicht Kaiserpfalz_details
      if (data) currentSlideIndex = data;
      setTimeout(initOpt01, 400);
      break;

    case "Lageplan": //Lageplan
      setTimeout(initOptMap, 400);
      break;

    case "Quiz"://Quiz
      setTimeout(initQuiz, 400);
      break;

    case "Themenübersicht": //
      setTimeout(() => {
        initThemenueb(data);
      }, 40);
      break;

    case "Galerie": //Galerie
      setTimeout(() => initGalerie(data), 40);
      break;


    // wenn nichts definiert wird --> zurück zum hauptmenü
    default:
      currentSlideIndex = 0;
      setTimeout(initHome, 400);
  }
}

function initHome() {
  for (let i = 1; i <= 5; i++) {
    let txt = document.getElementById(`btn-${i}`);
    txt.innerHTML = options[i];
  }
}



// R e g i s t e r k a r t e n
function initOpt01() {

  let elem = document.getElementById("tabs_host");
  try {
    let tabs = new TabsSlider(elem, {
      animate: true,
      slide: currentSlideIndex,
      draggable: false,
      underline: true,
      heightAnimate: true,
      duration: 600,
      easing: 'cubic-bezier(0.0, 0.0, 0.2, 1)'
    });


    setTimeout(setTabbarOffset, 300);

    socket.on("change_Slide", (nr) => {
      currentSlideIndex = nr;
      try {

        tabs.show(currentSlideIndex);
        setTabbarOffset();
      } catch (error) {
        socket.emit("err", error);

      }

      let e = document.getElementsByClassName("tabs__line");
      e[0].style.width = tabsControls[currentSlideIndex].offsetWidth + "px";
      e[0].style.transform = "translate3D(" + tabsControls[currentSlideIndex].offsetLeft + "px, 0px , 0px)";
      // socket.emit("say", tabsControls[currentSlideIndex].offsetWidth)
    });

    socket.on("scrollToItem", (i) => {
      let e = document.getElementsByClassName('item');
      let y = e[i].getBoundingClientRect().top + window.scrollY - 70;
      window.scrollTo(window.scrollX, y)
    });



    tabsControls = elem.getElementsByClassName("tabs__controls");

    for (let i = 0; i < tabsControls.length; i++) {
      tabsControls[i].addEventListener("click", (e) => {
        socket.emit('slideChange', i);
      });
    }
  } catch (error) {
    console.log(error);
  }



}

// L a g e p l a n
function initOptMap() {
  let mymap;
  try {
    mymap = L.map('mapid').setView([51.9045, 10.4281], 17);

    L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
      attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
      maxZoom: 20,
      minZoom: 16,
      id: 'mapbox/streets-v11',
      tileSize: 512,
      zoomOffset: -1,
      accessToken: 'pk.eyJ1IjoiZWZma2ZmIiwiYSI6ImNrYm0wNnFxdDBnaGQycnBvenV0b2J2bnIifQ.vQjzCC0bOtce9bQYQ_AvSQ'
    }).addTo(mymap);


    let location = L.icon({
      iconUrl: '/img/standort.png',
      iconSize: [72, 100], // size of the icon
      iconAnchor: [36, 100], // point of the icon which will correspond to marker's location
    });
    let stand = L.marker([51.902759, 10.428433], {
      icon: location,
      forceZIndex: 1000
    });


    var popupLocation1 = new L.LatLng(51.902887, 10.425524);
    var popupLocation2 = new L.LatLng(51.905673, 10.427703);

    var popupContent1 = '<b>Kaiserpfalz</b><br>Hier wird eine Themenübersicht gezeigt',
      popup1 = new L.Popup({
        closeOnClick: false,
        autoClose: false,
        forceZIndex: 100
      });
    popup1.setLatLng(popupLocation1);
    popup1.setContent(popupContent1);

    var popupContent2 = '<b>Marktkirche</b><br>Eine Galerie ist hier zu finden',
      popup2 = new L.Popup({
        closeOnClick: false,
        autoClose: false,
        forceZIndex: 100
      });

    popup2.setLatLng(popupLocation2);
    popup2.setContent(popupContent2);


    var popup3 = L.popup({
      closeOnClick: false,
      autoClose: false,
      forceZIndex: 100
    })
      .setLatLng([51.905941, 10.429067])
      .setContent("<b>Marktplatz</b><br>Hier gibt es ein Quiz");
    mymap.addLayer(popup3);

    var popup4 = L.popup({
      closeOnClick: false,
      autoClose: false,
      forceZIndex: 100
    })
      .setLatLng([51.903271, 10.427731])
      .setContent("<b>Domvorhalle</b><br>Hier sind viele Detaills in einer Registeransicht");
    mymap.addLayer(popup4);

    mymap.addLayer(popup1).addLayer(popup2);

    var polylinePoints = [
      [51.905943, 10.42907],
      [51.905723, 10.428914],
      [51.905607, 10.428724],
      [51.905413, 10.428284],
      [51.905249, 10.427552],
      [51.905153, 10.427659],
      [51.90499, 10.427769],
      [51.904612, 10.42789],
      [51.904225, 10.427814],
      [51.903474, 10.427879],
      [51.903373, 10.427401],
      [51.903328, 10.427415],
      [51.903173, 10.426707],
      [51.903189, 10.426009],
      [51.903087, 10.425615],
      [51.902605, 10.425918],
      [51.902489, 10.426438],
      [51.902517, 10.426996],
      [51.902507, 10.427275],
      [51.902622, 10.42742],
      [51.902709, 10.427659],
      [51.902794, 10.428348]
    ];

    mymap.addLayer(L.polyline(polylinePoints, {
      color: 'red'
    }));


    // function onMapClick(e) {
    //   alert(e.latlng);
    // }

    // mymap.on('click', onMapClick);


    var marktkirche = L.polygon([
      [51.905575, 10.427334],
      [51.905593, 10.427434],
      [51.905611, 10.427423],
      [51.905709, 10.427814],
      [51.905702, 10.427822],
      [51.905761, 10.428068],
      [51.905694, 10.428113],
      [51.905687, 10.428168],
      [51.90565, 10.428195],
      [51.90562, 10.428163],
      [51.905587, 10.428036],
      [51.90557, 10.428085],
      [51.905532, 10.428075],
      [51.905516, 10.428084],
      [51.90549, 10.427959],
      [51.905479, 10.427962],
      [51.905386, 10.427566],
      [51.905398, 10.427554],
      [51.905377, 10.427456]
    ]);
    var pfalz = L.polygon([
      [51.903116, 10.425168],
      [51.903173, 10.425418],
      [51.902694, 10.425725],
      [51.902703, 10.425784],
      [51.902513, 10.425905],
      [51.902497, 10.425854],
      [51.902413, 10.42591],
      [51.902398, 10.426037],
      [51.902349, 10.426047],
      [51.902318, 10.426008],
      [51.902302, 10.425949],
      [51.902325, 10.425878],
      [51.902325, 10.425878],
      [51.902536, 10.425761],
      [51.902487, 10.425567]
    ]);
    var dom = L.polygon([
      [51.903261, 10.42762],
      [51.903288, 10.427845],
      [51.903188, 10.427877],
      [51.903161, 10.427653]
    ]);
    mymap.addLayer(marktkirche);
    mymap.addLayer(pfalz);
    mymap.addLayer(dom);

    mymap.addLayer(stand);
    socket.on("panBy", (i) => {
      mymap.panBy(i);
    });
  } catch (error) {
    console.log('Map init');
  }


  socket.on("zoom", (z) => {
    switch (z) {
      case "in":
        mymap.zoomIn();
        break;
      case "out":
        mymap.zoomOut();
        break;
      default:
        console.log("out of options... in zoom");
    }
  });


  // Force zIndex of Leaflet
  (function (global) {
    var MarkerMixin = {
      _updateZIndex: function (offset) {
        this._icon.style.zIndex = this.options.forceZIndex ? (this.options.forceZIndex + (this.options.zIndexOffset || 0)) : (this._zIndex + offset);
      },
      setForceZIndex: function (forceZIndex) {
        this.options.forceZIndex = forceZIndex ? forceZIndex : null;
      }
    };
    if (global) global.include(MarkerMixin);
  })(L.Marker);



}

function setTabbarOffset() {

  let e = document.getElementsByClassName("tabs__line");
  e[0].style.width = tabsControls[currentSlideIndex].offsetWidth + "px";
  e[0].style.transform = "translate3D(" + tabsControls[currentSlideIndex].offsetLeft + "px, 0px , 0px)";

}

// Q U I Z
function initQuiz() {

  neueFrage = true;

  //zeigt eine neue Frage an
  socket.on("zeigeFrage", (frage, timer, nr, qs) => {

    if (!neueFrage) importContent("/client/host/Quiz.html");

    //nach einem kleinen Puffer, bis der Inhalt geladen wurde
    setTimeout(() => {

      let ready = true;
      let f = document.getElementById("frage_box");
      let seconds = (timer / 1000) + 1;

      f.innerHTML = String(seconds);

      //countdown bevor die frage angezeigt wird
      function tick() {
        seconds--;
        f.innerHTML = String(seconds);
        if (seconds >= 1) {
          setTimeout(tick, 990);
        }
        else {
          f.innerHTML = frage;
          if (ready) {
            ready = false;
            //übermittle, dass nun die Antworten angezeigt werden können
            socket.emit("set_user_antworten", nr, qs);
            neueFrage = true;
          }
        }
      }

      tick();
    }, 500);


  });

  socket.on("zeigeFrageAntwort", (fa, correct) => {
    if (neueFrage) {
      neueFrage = false;
      importContent('/client/host/QuizAntwortenBtn.html');

      setTimeout(initFragen, 1000);

      function initFragen() {

        let frage = document.getElementById('frage');
        frage.innerHTML = fa.frage;

        document.getElementById("content_html").style.visibility = "visible";

        for (let i = 0; i < 4; i++) {

          let a = document.getElementById(`btn_${i}`);
          let a_text = document.getElementById(`antw_${i}`);
          a_text.innerHTML = fa.antworten[i];
          if (i == correct) a.getElementsByClassName("antw")[0].style.backgroundColor = "#7bc387";
        }


      }
    }


  });

  socket.on("zeigeStatistik", (stats) => {
    document.getElementById("content_html").innerHTML = stats;
  });

}

// T h e m e n ü b e r s i c h t
function initThemenueb(themen) {

  setTimeout(() => {

    for (let i = 1; i < 7; i++) {
      if (themen) {
        let a = document.getElementById(`ch-0${i}`);
        let a_ueb = a.getElementsByTagName(`h2`)[0];
        let a_text = a.getElementsByTagName(`p`)[0];
        a_ueb.innerHTML = themen.Name[i - 1];
        a_text.innerHTML = themen.Beschreibung[i - 1];

      }
    }

  }, 300);
}

// G a l e r i e
function initGalerie(galerie) {

  let nummer = 0;

  socket.on("next_Pic", (nummer) => {
    ladeInhalt(nummer);
  });


  function ladeInhalt(nummer) {
    try {
      let pic = document.getElementById(`galerie_img`);
      pic.style.backgroundImage = `url('${galerie.bild[nummer].bild_link}')`;
    } catch (error) {
      socket.emit('err', error);
    }
  }

  ladeInhalt(nummer);


}


socket.on("refresh", () => {
  location.reload();
});