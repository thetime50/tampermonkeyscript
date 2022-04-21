// ==UserScript==
// @name         code-no-translate
// @namespace    http://thetime50.com/
// @version      0.4
// @description  try to take over the world!
// @author       thetime50
// @match        https://pyimagesearch.com/*
// @match        https://github.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=pyimagesearch.com
// @grant        none
// @require      http://libs.baidu.com/jquery/1.7.2/jquery.min.js
// @updateURL    https://thetime50.github.io/tampermonkeyscript/code_no_translate.js
// ==/UserScript==

function delay(ms) {
    return new Promise((resolve, reject) => {
        setTimeout(resolve, ms);
    })
}

(async function() {
    'use strict';
    let classList = []
    // https://pyimagesearch.com/
    if(location.host.indexOf('pyimagesearch')>=0){
        await delay(2000)
        classList = ['.enlighter-codegroup-wrapper']
        console.log('pyimagesearch', classList)
    }
    // https://github.com/
    if(location.host.indexOf('github')>=0){
        // js-blob-code-container blob-code-content
        await delay(2000)
        classList = ['table[data-tagsearch-lang]','[class*=highlight-source-]']
        console.log('github', classList)
    }
    if(classList.length > 0){
        classList.forEach((v,i,a)=>{
            let domList = $(v).attr( "translate","no")
            console.log('domList', domList)
        })
    }
})();
