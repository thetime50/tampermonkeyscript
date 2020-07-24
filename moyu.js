// ==UserScript==
// @name         moyu
// @namespace    http://*.*/
// @version      0.2
// @description  moyu restyle
// @author       TheTime50
// @match        http*://*/*
// @exclude      http*://www.baidu.com/*
// @exclude      http*://127.0.0.1:*/*
// @exclude      http*://localhost:*/*
// @grant        none
// @require      http://libs.baidu.com/jquery/1.7.2/jquery.min.js
// @updateURL    https://thetime50.github.io/tampermonkeyscript/moyu.js
// ==/UserScript==

(function() {
    'use strict';
    $("html").append(`
        <style>
            img,[style*=background-image],canvas{
                opacity: 0.1 !important;
            }
            img:hover,[style*=background-image]:hover,canvas:hover{
                opacity: 1 !important;
            }
        </style>
    `);

    //style="background-image
    // Your code here...
})();
