// ==UserScript==
// @name         sasscss.com restyle
// @namespace    http://thetime50.com/
// @version      0.2
// @description  sasscss.com restyle
// @author       TheTime50
// @match        https://www.sasscss.com/*
// @grant        none
// @updateURL    https://thetime50.github.io/tampermonkeyscript/sasscss_com_restyle.js
// ==/UserScript==

(function () {
  'use strict';

  $("nav.main").css("height", "40px");
  $("nav.main *").css("height", "80%");
  $("nav.main *").css("line-height", "100%");
  // $("nav.main,nav.main *").removeAttr("@media (max-width: 960px)");

  // 宽页面
  let sidebarEle=$(".sidebar")[0]
  sidebarEle.parentNode.removeChild(sidebarEle)
  $(".scotch-panel-wrapper")[0].appendChild(sidebarEle)
  $(".sidebar").css({
    "display":"none",
    // "position":"absolute",
    "position":"fixed",
    "top":"5rem",
    "bottom":"2rem",
    "overflow":"auto",
    "left":"0",
    "padding":"0.5rem",
    "background-color":"#ffe0e8",
    "border":"2px solid #c69",
    "border-radius":"4px",
    "z-index":"1",
  })
  $(".sidebar *").css({"font-size":"10px"})
  $(".sidebar ul").css({
    "margin":"0",
    "padding":"0 0 0 25px",
    "position": "relative",
    "top": "-10px"})
  $(".sidebar li:not(:has(ul))").css({"height":"20px"})
  $(".docs-wrapper.container article").css({"margin-left":"0"})
  let menuSwitch=document.createElement("div")
  menuSwitch.innerText="menu"
  menuSwitch.className="btn"
  menuSwitch.style.position="fixed"
  menuSwitch.style.top="3rem"
  menuSwitch.style.left="0.5rem"
  menuSwitch.style.width="3rem"
  menuSwitch.style.height="1.5rem"
  menuSwitch.style.lineHeight=menuSwitch.style.height
  menuSwitch.style.padding=0
  menuSwitch.style.fontSize="0.9rem"

  menuSwitch.addEventListener("click",()=>{
    let menuEle=$(".sidebar")[0]
    console.dir(menuEle)
    if(menuEle.style.display==="none"){
      menuEle.style.display="block"
    }else{
      menuEle.style.display="none"
    }
  })
  // $(".scotch-panel-wrapper")[0].insertBefore(menuSwitch,$(".scotch-panel-canvas")[0])
  $(".scotch-panel-wrapper")[0].appendChild(menuSwitch)

  $(".slide-menu").css({"width":"180px"})
  //$(".scotch-panel-wrapper>.scotch-panel-canvas").removeClass("scotch-panel-canvas")
})();
