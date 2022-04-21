// ==UserScript==
// @name         code-no-translate
// @namespace    http://thetime50.com/
// @version      0.2
// @description  try to take over the world!
// @author       thetime50
// @match        https://pyimagesearch.com/*
// @match        https://github.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=pyimagesearch.com
// @grant        none
// @require      http://libs.baidu.com/jquery/1.7.2/jquery.min.js
// @updateURL    https://thetime50.github.io/tampermonkeyscript/code_no_translate.js
// ==/UserScript==

(function() {
    'use strict';
    let classList = []
    // https://pyimagesearch.com/
    if(location.host.indexOf('pyimagesearch')){
        classList = ['.enlighter-codegroup-wrapper']
    }
    // https://github.com/
    if(location.host.indexOf('github')){
        // js-blob-code-container blob-code-content
        classList = ['table[data-tagsearch-lang]','[class*=highlight-source-]']
    }
    if(classList.length > 0){
        classList.forEach((v,i,a)=>{
            $(v).attr( "translate","no")
        })
    }
})();
