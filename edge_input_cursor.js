// ==UserScript==
// @name         edge_input_cursor
// @namespace    http://thetime50.com/
// @version      0.2
// @description  try to take over the world!
// @author       thetime50
// @match        *://*/*
// @grant        none
// @require      http://libs.baidu.com/jquery/1.7.2/jquery.min.js
// @updateURL    https://thetime50.github.io/tampermonkeyscript/edge_input_cursor.js
// ==/UserScript==
function delay(ms) {
    return new Promise((resolve, reject) => {
        setTimeout(resolve, ms);
    })
}
(async function() {
    'use strict';


    await delay(1500)
    $("html").append(`
        <style>
        body {
            caret-color: black; /*输入状态的光标颜色为黑色*/
        }
        </style>
    `);

    // Your code here...
})();
