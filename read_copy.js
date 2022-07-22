// ==UserScript==
// @name         read_copy
// @namespace    http://thetime50.com/
// @version      0.4
// @description  try to take over the world!
// @author       You
// @match        https://www.bilibili.com/read/*
// @match        https://blog.csdn.net/*
// @grant        none
// @require      http://libs.baidu.com/jquery/1.7.2/jquery.min.js
// @updateURL    https://thetime50.github.io/tampermonkeyscript/read_copy.js
// ==/UserScript==
function delay(ms) {
    return new Promise((resolve, reject) => {
        setTimeout(resolve, ms);
    })
}
(async function() {
    'use strict';

    const cfgList=[
        {
            hostname: 'bilibili.com',
            selector: ['.unable-reprint'],
        }, {
            hostname: 'blog.csdn.net',
            selector: [
                '.prettyprint', '.prettyprint>code',
                'pre', 'pre>code',
            ],
        }
    ]

    function getStyle(selector){
        let content = selector.map((v,i,a)=>{
            return `${v} {
                -webkit-user-select: auto !important;
                user-select: auto !important;
              /*
                -webkit-user-select: text !important;
                user-select: text !important;
              */
            }
            `
        }).join('')
        return `
            <style>
            ${ content }
            </style>
        `
    }


    function removeEventListener(node) {
        var parent = node.parentElement
        var copy = node.cloneNode()
        copy.innerHTML = node.innerHTML
        parent.replaceChild(copy, node)
    }

    await delay(2000)

    console.log("read-copy 2333")
    // $(document).unbind("copy")
    // $(".unable-reprint").unbind("copy")
    // document.oncopy=()=>{}
    // $(".unable-reprint").each((i,el)=>{
    //     el.oncopy=()=>{}
    // })
    // console.log(window.getEventListeners(document))
    let cfg = cfgList.find(v=>{
        return window.location.hostname.indexOf(v.hostname)>-1
    })
    if (cfg) {
        $("html").append(getStyle(cfg.selector));

        $(cfg.selector.join(',')).each((i, el) => {
            removeEventListener(el)
        })
    }

    // Your code here...
})();
