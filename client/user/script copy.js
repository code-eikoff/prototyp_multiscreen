
const button = document.getElementById("los");

let currentSlideIndex = 0;
let currentMenuName = 'home';

let options = ["home"];

let elm, tabs, tabsControls = null;

const socket = io("http://eikoff:3030/user");
window.addEventListener("load", socket.emit("user_connect", window.location.hash));
window.onhashchange = () => socket.emit("user_connect", window.location.hash);



button.addEventListener("click", (e) => {
  document.getElementById("los").classList.add("hidden");
  document.getElementById("loader").classList.remove("hidden");

  e.stopImmediatePropagation();

  var doc = window.document;
  var docEl = doc.documentElement;

  // var requestFullScreen = docEl.requestFullscreen || docEl.mozRequestFullScreen || docEl.webkitRequestFullScreen || docEl.msRequestFullscreen;
  // var cancelFullScreen = doc.exitFullscreen || doc.mozCancelFullScreen || doc.webkitExitFullscreen || doc.msExitFullscreen;

  // if (
  //   !doc.fullscreenElement && !doc.mozFullScreenElement && !doc.webkitFullscreenElement && !doc.msFullscreenElement) {
  //   requestFullScreen.call(docEl);
  // }

  socket.emit('start');
  // socket.emit("lade_Seite", "quiz");

});

socket.on("vibrate", (pattern) => {
  window.navigator.vibrate(pattern);
});


socket.on("load_options", (data) => options = data);

socket.on("load_content", (html_link, name) => {

  importContent(html_link);

  switch (name) {

    // options[0] ist immer die startseite (das Hauptmenü)
    case options[0]:
      setTimeout(initHome, 350);
      break;

    case options[1]:
      setTimeout(initOpt01, 350);
      break;

    // wenn nichts definiert wird --> zurück zum hauptmenü
    default:
      setTimeout(initHome, 350);
  }

});



function importContent(link) {

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
  };
  xhr.send();
}




function initHome() {

  initMenu();


  currentMenuName = options[0];

  btn_opt_1 = document.getElementById("btn-01");
  btn_opt_2 = document.getElementById("btn-02");
  btn_opt_3 = document.getElementById("btn-03");


  btn_opt_1.addEventListener("click", (e) => {
    e.stopImmediatePropagation();
    btn_opt_1.classList.add("btn-active");
    socket.emit('btn_click', options[1]);

  });

  btn_opt_2.addEventListener("click", (e) => {
    e.stopImmediatePropagation();
    btn_opt_2.classList.add("btn-active");


    socket.emit('btn_click', options[2]);

  });

  btn_opt_3.addEventListener("click", (e) => {
    e.stopImmediatePropagation();
    btn_opt_3.classList.add("btn-active");

    socket.emit('btn_click', options[3]);

  });
}

function initOpt01() {
  initMenu();
  elem = document.querySelector('.tabs');

  tabs = new TabsSlider(elem, {
    animate: true,
    slide: currentSlideIndex,
    draggable: false,
    underline: true,
    heightAnimate: true,
    duration: 800,
    easing: 'cubic-bezier(0.0, 0.0, 0.2, 1)'
  });



  socket.on("change_Slide", (nr) => {
    currentSlideIndex = nr;
    tabs.show(currentSlideIndex);
    setTabbarOffset();

    let e = document.getElementsByClassName("tabs__line");
    e[0].style.width = tabsControls[currentSlideIndex].offsetWidth + "px";
    e[0].style.transform = "translate3D(" + tabsControls[currentSlideIndex].offsetLeft + "px, 0px , 0px)";
    // socket.emit("say", tabsControls[currentSlideIndex].offsetWidth)
  });

  tabsControls = elem.getElementsByClassName("tabs__controls");

  for (let i = 0; i < tabsControls.length; i++) {

    tabsControls[i].addEventListener("click", (e) => {
      socket.emit('slideChange', i);
    });
  }




}

function initMenu() {
  let menu = document.getElementById("menu");
  menu.addEventListener("click", (e) => {
    e.stopImmediatePropagation();
    socket.emit('btn_click', options[0]);
  });
}

function prevSlide() {

  switch (currentSlideIndex) {
    case 0:
      currentSlideIndex = tabsControls.length - 1;
      break;
    default:
      currentSlideIndex--;
  }
  socket.emit("slideChange", currentSlideIndex);
}

function nextSlide() {
  switch (currentSlideIndex) {
    case tabsControls.length - 1:
      currentSlideIndex = 0;
      break;

    default:

      currentSlideIndex++;
  }
  socket.emit("slideChange", currentSlideIndex);
  // tabs.show(currentSlideIndex);
}



function setTabbarOffset() {

  let firstI = tabsControls[0]
  let lastI = tabsControls[tabsControls.length]
  let currentI = tabsControls[currentSlideIndex];

  let ci_off_l = currentI.offsetLeft;
  let ci_width = currentI.offsetWidth;

  let tabbarlist = document.getElementById("tabbarlist");

  let x = (tabbarlist.offsetWidth - window.innerWidth) + 0;

  console.log(
    `
    ci_off_l=${ci_off_l} \n 
    ci_width=${ci_width} \n 
    tabbarlist.offsetWidth=${tabbarlist.offsetWidth} \n
    x=${x}
    `
  )

  if (ci_off_l <= 0) {
    tabbarlist.style.transform = `translateX(-${0}px)`;
  }
  else if (ci_off_l > 10) {
    tabbarlist.style.transform = `translateX(-${ci_off_l - 60}px)`;
  }
  else if (ci_off_l > x) {

    tabbarlist.style.transform = `translateX(-${x}px)`;

  }




  // console.log(`x=${x} y=${y} tabbarlist.offsetWidth=${tabbarlist.offsetWidth}`)




  //   if (z <= 0) {
  //     tabbarlist.style.transform = `translateX(${0}px)`;
  //   }
  //   else if (y > x) {
  //     tabbarlist.style.transform = `translateX(-${x}px)`;
  //   }
  //   else {
  //     tabbarlist.style.transform = `translateX(-${y}px)`;
  //   }
}


/*===================
 
Wischbewegungen erkennen
 
=====================*/


const xwiper = new Xwiper("#content", 8);

xwiper.onSwipeLeft(() => {
  socket.emit('say', 'Swiped left')
  nextSlide();

  // switch (currentMenuName) {

  //   // options[0] ist immer die startseite (das Hauptmenü)
  //   case options[0]:
  //     nextSlide();
  //     break;
  //   // wenn nichts definiert wurde --> 
  //   default:
  //     nextSlide();
  // }

  // window.navigator.vibrate([260]);

});

xwiper.onSwipeRight(() => {
  socket.emit('say', 'Swiped r');
  prevSlide();
  // window.navigator.vibrate([80,80,80]);
});

xwiper.onSwipeUp(() => {
  socket.emit('say', 'Swiped u')
  // window.navigator.vibrate([260,80,80]);
});

xwiper.onSwipeDown(() => {
  socket.emit('say', 'Swiped d')
  // window.navigator.vibrate([80,80,260]);
});




xwiper.onTap(() => socket.emit('say', 'tap'));

// Remove listener
// xwiper.destroy();