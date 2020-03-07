// ==UserScript==
// @name         bili_read_copy
// @namespace    https://www.bilibili.com/
// @version      0.2
// @description  try to take over the world!
// @author       You
// @match        https://www.bilibili.com/read/*
// @grant        none
// @require      http://libs.baidu.com/jquery/1.7.2/jquery.min.js
// @updateURL    https://thetime50.github.io/tampermonkeyscript/bili_read_copy.js
// ==/UserScript==

(function() {
    'use strict';
    $("html").append(`
        <style>
            .unable-reprint{
                -webkit-user-select: auto !important;
                user-select: auto !important;
              /*
                -webkit-user-select: text !important;
                user-select: text !important;
              */
            }
        </style>
    `);

    function removeEventListener(node) {
        var parent = node.parentElement
        var copy = node.cloneNode()
        copy.innerHTML = node.innerHTML
        parent.replaceChild(copy, node)
    }

    setTimeout(()=>{
        console.log("bili-read-copy 2333")
        // $(document).unbind("copy")
        // $(".unable-reprint").unbind("copy")
        // document.oncopy=()=>{}
        // $(".unable-reprint").each((i,el)=>{
        //     el.oncopy=()=>{}
        // })
        // console.log(window.getEventListeners(document))
        $(".unable-reprint").each((i,el)=>{
            removeEventListener(el)
        })
    },2000)

    // Your code here...
})();
