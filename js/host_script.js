
let currentSlideIndex = 0;
let currentMenuName = 'home';
let backButtonLoc = 'home';

let options = ["home"];

// console.time();

const socket = io("http://eikoff:3030/host");

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

    case options[0]:
      currentSlideIndex = 0;
      break;

    case options[1]: //Detailansicht Kaiserpfalz
      if (data) currentSlideIndex = data;
      setTimeout(initOpt01, 400);
      break;

    case (`${options[1]}_details`)://Detailansicht Kaiserpfalz_details
      if (data) currentSlideIndex = data;
      setTimeout(initOpt01, 400);
      break;

    case options[2]: //Lageplan
      setTimeout(initOptMap, 400);
      break;

    case options[3]://Quiz
      setTimeout(initQuiz, 400);
      break;

    case options[4]: //"Themenübersicht"
      setTimeout(() => {
        initThemenueb(data);
      }, 40);
      break;

    case options[5]: //Galerie
      setTimeout(() => initGalerie(data), 40);
      break;


    // wenn nichts definiert wird --> zurück zum hauptmenü
    default:
      currentSlideIndex = 0;
  }
}

// R e g i s t e r k a r t e n
function initOpt01() {

  let elem = document.getElementById("tabs_host");
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
    tabs.show(currentSlideIndex);
    setTabbarOffset();

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

}

// L a g e p l a n
function initOptMap() {
  let mymap = L.map('mapid').setView([51.9050, 10.4281], 17);

  L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 20,
    minZoom: 16,
    id: 'mapbox/streets-v11',
    tileSize: 512,
    zoomOffset: -1,
    accessToken: 'pk.eyJ1IjoiZWZma2ZmIiwiYSI6ImNrYm0wNnFxdDBnaGQycnBvenV0b2J2bnIifQ.vQjzCC0bOtce9bQYQ_AvSQ'
  }).addTo(mymap);

  // var marker = L.marker([51.902887, 10.425524]).addTo(mymap);
  // marker.bindPopup("<b>Kaiserpfalz</b><br>Hier könnte eine verlinkung drin sein");

  var popupLocation1 = new L.LatLng(51.902887, 10.425524);
  var popupLocation2 = new L.LatLng(51.905573, 10.427703);

  var popupContent1 = '<b>Kaiserpfalz</b><br>Hier stehen grobe Details',
    popup1 = new L.Popup({
      closeOnClick: false,
      autoClose: false
    });
  popup1.setLatLng(popupLocation1);
  popup1.setContent(popupContent1);

  var popupContent2 = '<b>Marktkirche</b><br>Hier könnte Ihre Werbung stehen',
    popup2 = new L.Popup({
      closeOnClick: false,
      autoClose: false
    });

  popup2.setLatLng(popupLocation2);
  popup2.setContent(popupContent2);

  mymap.addLayer(popup1).addLayer(popup2);

  var polylinePoints = [
    [51.905377, 10.427435],
    [51.905245, 10.427627],
    [51.904801, 10.427891],
    [51.904281, 10.427821],
    [51.903472, 10.427886],
    [51.903386, 10.427447],
    [51.903304, 10.427444],
    [51.903160, 10.426402],
    [51.903199, 10.425985],
    [51.903056, 10.425678]
  ];

  mymap.addLayer(L.polyline(polylinePoints));



  socket.on("panBy", (i) => {
    mymap.panBy(i);
  });

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
    console.error(qs);

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
    console.log(neueFrage + " " + fa)
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