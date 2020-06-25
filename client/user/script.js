
const button = document.getElementById("los");
const xwiper = new Xwiper("#content", 8);

let currentSlideIndex = 0;
let currentMenuName = 'home';
let backButtonLoc = 'home';

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

socket.on("load_content", (html_link, name, data) => {

  importContent(html_link);
  currentMenuName = name;
  initContent(name, data);
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


function initContent(name, data) {

  switch (name) {
    // options[0] ist immer die startseite (das Hauptmenü)
    case options[0]:
      setTimeout(initHome, 300);
      break;

    //Registerkarten
    case options[1]:
      backButtonLoc = options[0];
      setTimeout(initOpt01, 300);
      break;

    //Registerkarten Details
    case (options[1] + '_details'):
      currentSlideIndex = data;
      backButtonLoc = options[1];
      setTimeout(initOpt01, 300);
      break;

    // Lageplan
    case options[2]:
      backButtonLoc = options[0];
      setTimeout(initMapController, 300);
      break;

    //Quiz
    case options[3]:
      backButtonLoc = options[0];
      setTimeout(initQuiz, 300);
      break;

    //Themenübersicht
    case options[4]:
      backButtonLoc = options[0];
      setTimeout(() => {
        initThemenueb(data)
      }, 300);
      break;

    //Themenübersicht UnterMenü
    case (`${options[4]}_details`):
      backButtonLoc = `${options[4]}_d`;
      setTimeout(() => {
        initThema();
      }, 300);
      break;

    //Galerie
    case options[5]:
      backButtonLoc = options[0];
      setTimeout(() => {
        initGalerie(data);
      }, 300);
      break;

    // wenn nichts definiert wird --> zurück zum hauptmenü
    default:
      setTimeout(initHome, 300);
  }

}


function initHome() {

  initMenu();

  currentMenuName = options[0];

  for (let i = 1; i <= 5; i++) {
    btn = document.getElementById(`btn-${i}`);
    let txt = btn.getElementsByClassName("text_ueb")[0];
    txt.innerHTML = options[i];
    txt.style.opacity = 1;
    btn.addEventListener("click", () => {
      btn.classList.add("btn-active");
      btnClick(options[i]);
    });
  }

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

  tabsControls = elem.getElementsByClassName("tabs__controls");

  for (let i = 0; i < tabsControls.length; i++) {

    tabsControls[i].addEventListener("click", (e) => {
      socket.emit('slideChange', i);
    });
  }

  setTimeout(initScrollItems, 300);

}


function initMapController() {
  initMenu();

  document.getElementById('btn_up').addEventListener("click", (e) => {
    socket.emit('mapControl', 'up');
  });
  document.getElementById('btn_left').addEventListener("click", (e) => {
    socket.emit('mapControl', 'left');
  });
  document.getElementById('btn_right').addEventListener("click", (e) => {
    socket.emit('mapControl', 'right');
  });
  document.getElementById('btn_down').addEventListener("click", (e) => {
    socket.emit('mapControl', 'down');
  });
  document.getElementById('btn_in').addEventListener("click", (e) => {
    socket.emit('mapControl', 'in');
  });
  document.getElementById('btn_out').addEventListener("click", (e) => {
    socket.emit('mapControl', 'out');
  });

}





function initScrollItems() {
  initMenu();

  let last_known_scroll_position = 0;
  let current_Item_in_view = 0;
  let ticking = false;

  function doSomething(scroll_pos) {
    let elem = document.getElementsByClassName('item');

    if (last_known_scroll_position > scroll_pos) {

      for (let i = 0; i < elem.length; i++) {
        if (isElementInViewport(elem[i])) {
          if (current_Item_in_view != i) {
            socket.emit('scrollToItem', i);
            current_Item_in_view = i;
          }
        }
      }

    } else {

      for (let i = 0; i < elem.length; i++) {
        if (isElementInViewport(elem[i])) {
          if (current_Item_in_view != i) {
            socket.emit('scrollToItem', i);
            current_Item_in_view = i;
          }
        }
      }

    }

  }

  function isElementInViewport(el) {
    var rect = el.getBoundingClientRect();
    return (
      rect.top + ((el.offsetHeight / 2) + 20) >= (window.innerHeight / 2) - 150 &&
      rect.left >= 0 &&
      rect.bottom - ((el.offsetHeight / 2) - 20) <= (window.innerHeight / 2) + 150 &&
      rect.right <= (window.innerWidth)

    );
  }

  window.addEventListener('scroll', (e) => {
    if (!ticking) {
      window.requestAnimationFrame(function () {
        doSomething(window.scrollY);
        last_known_scroll_position = window.scrollY;
        ticking = false;
      });
      ticking = true;
    }
  });

  let e = document.getElementsByClassName("tabs__line");
  e[0].style.width = tabsControls[currentSlideIndex].offsetWidth + "px";
  e[0].style.transform = "translate3D(" + tabsControls[currentSlideIndex].offsetLeft + "px, 0px , 0px)";

}

function btnClick(option) {
  socket.emit('btn_click', option);
}

function btnClick(option, slide) {
  socket.emit('btn_click', option, slide);
}

function itemGaClick(a, b) {
  socket.emit('details_Tabs', a, b);
}


function initMenu() {
  let menu = document.getElementById("menu").getElementsByTagName('menu');
  menu[0].addEventListener("click", (e) => {
    e.stopImmediatePropagation();
    btnClick(options[0]);
  });

  initBack();

}

function initBack() {
  let bc = document.getElementById('back');
  if (bc) {
    bc.addEventListener("click", (e) => {
      e.stopImmediatePropagation();
      currentSlideIndex = 0;

      switch (backButtonLoc) {
        case 'home':
          btnClick(options[0], '0');
          break;

        case options[1]:
          btnClick(options[1], '0');
          break;

        case `${options[4]}_d`:
          btnClick(options[4], '0');
          break;

        default:
          btnClick(options[0], '0');

      }
    });
  }

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
}

function setTabbarOffset() {

  let lastI = tabsControls[tabsControls.length - 1]
  let currentI = tabsControls[currentSlideIndex];

  let ci_off_l = currentI.offsetLeft;
  let ci_width = currentI.offsetWidth;

  let tabbarlist = document.getElementById("tabbarlist");

  let x = window.innerWidth - lastI.getBoundingClientRect().right;
  let y = window.innerWidth - lastI.getBoundingClientRect().right + lastI.offsetWidth

  if (ci_off_l <= 0) {
    tabbarlist.style.transform = `translateX(-${0}px)`;
  }
  else if (ci_off_l > 10) {
    tabbarlist.style.transform = `translateX(-${ci_off_l - 60}px)`;
  }

  let e = document.getElementsByClassName("tabs__line");
  e[0].style.width = tabsControls[currentSlideIndex].offsetWidth + "px";
  e[0].style.transform = "translate3D(" + tabsControls[currentSlideIndex].offsetLeft + "px, 0px , 0px)";

}



/*
=============================

Quiz

================================
*/

function initQuiz() {

  let qz_nr = 0;
  let ready = true;
  initMenu();
  if (ready) {
    ready = false;
    socket.emit("neueQuizSession");
  }



  socket.on("QuizSessionBereit", (nr, qs) => {
    let losBtn = document.getElementById("los");
    losBtn.style.visibility = "visible";

    let ready = true;
    losBtn.addEventListener("click", (e) => {
      if (ready) {
        ready = false;
        socket.emit("starteQuizSession", nr, qs);
      }
    });
  });

  socket.on("neueFrageBereit", (nr, qs) => {
    ready = true;
    importContent('Quiz.html');
    setTimeout(() => {
      let losBtn = document.getElementById("los");

      document.getElementById("los_text").innerHTML = "weiter";
      losBtn.style.visibility = "visible";

      losBtn.addEventListener("click", (e) => {
        if (ready) {
          ready = false;
          socket.emit("starteNeueFrage", nr, qs);
        }
      });
    }, 200);

  });

  socket.on("zeigeFrageAntwort", (fa, nr, qs) => {
    ready = true;
    importContent('QuizAntwortenBtn.html');
    setTimeout(initFragen, 500);

    function initFragen() {
      let startTime, endTime;

      function stopTime() {
        endTime = performance.now();
        var timeDiff = endTime - startTime;
        timeDiff /= 100;
        return Math.round(timeDiff);
      }

      let frage = document.getElementById('frage');
      frage.innerHTML = fa.frage;

      document.getElementById("content_html").style.visibility = "visible";

      startTime = performance.now();

      for (let i = 0; i < 4; i++) {
        let a = document.getElementById(`btn_${i}`);
        let a_text = document.getElementById(`antw_${i}`);
        a_text.innerHTML = fa.antworten[i];
        a.addEventListener("click", () => {
          document.getElementById("content_html").innerHTML = "warten...";

          socket.emit("antwort", i, stopTime(), nr, qs);

        });
      }

    }

  });

  socket.on("ladeStatistik", () => {
    let html =
      `
      <div class="row center-xs middle-xs around-xs" id="punkte">
        <div class="col-xs-12">
            <div class="box box-arround">
                <div class="row middle-xs center-xs">
                    <div class="col-xs-12">
                        <div class="box">
                            <div id="punkte_text">Deine Punkte sind: ...</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div class="menu_arround" id="menu">
        <div id="back"></div>
        <menu>
            <div class="box">MENÜ</div>
        </menu>
    </div>
    `
    document.getElementById("content_html").innerHTML = html;
    setTimeout(initMenu, 300);
    socket.emit("ladeStatistik");


  });

  socket.on("zeigeStatistik", (fa) => {
    let html = `Deine Punkte sind: ${fa} `
    document.getElementById("punkte_text").innerHTML = html;
  });

  socket.on("platzhalter", () => {
    let html =
      `
      <div class="row center-xs middle-xs around-xs" id="punkte">
        <div class="col-xs-12">
            <div class="box box-arround">
                <div class="row middle-xs center-xs">
                    <div class="col-xs-12">
                        <div class="box">
                            <div>warten...</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `
    document.getElementById("content_html").innerHTML = html;
  });




}//initQuiz


/*
================================

 T h e m e n ü b e r s i c h t 

================================
*/

function initThemenueb(themen) {

  initMenu();

  for (let i = 1; i < 7; i++) {
    if (themen) {
      let a = document.getElementById(`btn-${i}`);

      let ueb = a.getElementsByClassName("text_ueb")[0];
      ueb.innerHTML = themen.Name[i - 1];;
      ueb.style.opacity = 1;
      a.addEventListener("click", (e) => {
        e.stopImmediatePropagation();
        a.classList.add("btn-active");
        socket.emit("themaÖffnen", i - 1);
      });

    }
  }



}


function initThema() {

  initMenu();

}




/*
================================

 G A L E R I E

================================
*/





function initGalerie(galerie) {

  initMenu();

  let nummer = 0;
  let e = document.getElementsByClassName(`user_`)[0];
  let f = e.getElementsByClassName('row')[0];
  f.style.opacity = 1;

  socket.on("next_Pic", (nummer) => {
    ladeInhalt(nummer);
  });

  function ladeInhalt(nummer) {
    try {
      let box = document.getElementById(`box_galerie`);
      let h1 = box.getElementsByTagName('h1')[0];
      let h2 = box.getElementsByTagName('h2')[0];
      let p = box.getElementsByTagName('p')[0];

      h1.innerHTML = galerie.bild[nummer].titel;
      h2.innerHTML = galerie.bild[nummer].author;
      p.innerHTML = galerie.bild[nummer].beschreibung;

      box.style.opacity = 1;
      document.getElementById(`left_col`).style.opacity = 1;
      document.getElementById(`right_col`).style.opacity = 1;

    } catch (error) {
      console.log(error);
      socket.emit('err', error);
    }
  }

  function initBtn() {
    try {
      console.log(galerie.bild.length);

      let prev = document.getElementById(`left_col`);
      let next = document.getElementById(`right_col`);

      prev.addEventListener("click", () => prevPic());
      next.addEventListener("click", () => nextPic());

    } catch (error) {
      console.log(error);
      socket.emit('err', error);
    }
  }

  ladeInhalt(nummer);
  initBtn();


  function prevPic() {

    if (nummer >= 1) nummer--;
    else nummer = galerie.bild.length - 1;


    let prev = document.getElementById(`left_col`);
    let next = document.getElementById(`right_col`);
    prev.style.opacity = 0;
    next.style.opacity = 0;
    document.getElementById(`box_galerie`).style.opacity = 0;

    setTimeout(() => {
      socket.emit("next_Pic", nummer);
    }, 400);

  }

  function nextPic() {

    if (nummer < galerie.bild.length - 1) nummer++;
    else nummer = 0;
    let prev = document.getElementById(`left_col`);
    let next = document.getElementById(`right_col`);
    prev.style.opacity = 0;
    next.style.opacity = 0;
    document.getElementById(`box_galerie`).style.opacity = 0;

    setTimeout(() => {
      socket.emit("next_Pic", nummer);
    }, 400);

  }

  xwiper.onSwipeLeft(() => nextPic());
  xwiper.onSwipeRight(() => prevPic());

}








socket.on("refresh", () => {
  location.reload();
});


/*
==================================
 
    Wischbewegungen erkennen
 
==================================
*/



xwiper.onSwipeLeft(() => {
  socket.emit('say', 'Swiped left')
  switch (currentMenuName) {
    // options[0] ist immer die startseite (das Hauptmenü)
    case options[1]:
      nextSlide();
      break;
    case options[2]:
      socket.emit('mapControl', 'right');
      break;

    // wenn nichts definiert wurde --> 
    default:
      break;
  }

  // window.navigator.vibrate([260]);

});

xwiper.onSwipeRight(() => {
  socket.emit('say', 'Swiped r');
  switch (currentMenuName) {

    // options[0] ist immer die startseite (das Hauptmenü)
    case options[1]:
      prevSlide();
      break;

    case options[2]:
      socket.emit('mapControl', 'left');
      break;

    // wenn nichts definiert wurde --> 
    default:
      break;
  }
  // window.navigator.vibrate([80,80,80]);
});

xwiper.onSwipeUp(() => {
  socket.emit('say', 'Swiped u')
  switch (currentMenuName) {

    // options[0] ist immer die startseite (das Hauptmenü)
    case options[1]:

      break;

    case options[2]:
      socket.emit('mapControl', 'down');
      break;

    // wenn nichts definiert wurde --> 
    default:
      break;
  }
  // window.navigator.vibrate([260,80,80]);
});

xwiper.onSwipeDown(() => {
  socket.emit('say', 'Swiped d')
  switch (currentMenuName) {

    // options[0] ist immer die startseite (das Hauptmenü)
    case options[1]:
      break;

    case options[2]:
      socket.emit('mapControl', 'up');
      break;

    // wenn nichts definiert wurde --> 
    default:
      break;
  }
  // window.navigator.vibrate([80,80,260]);
});




xwiper.onTap(() => socket.emit('say', 'tap'));



// Remove listener
// xwiper.destroy();