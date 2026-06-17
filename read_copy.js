// ==UserScript==
// @name         read_copy
// @namespace    http://thetime50.com/
// @version      0.5
// @description  try to take over the world!
// @author       You
// @match        https://www.bilibili.com/read/*
// @match        https://blog.csdn.net/*
// @match        https://finance.sina.com.cn/realstock/company/*
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


    console.log("read-copy 2333")
    // $(document).unbind("copy")
    // $(".unable-reprint").unbind("copy")
    // document.oncopy=()=>{}
    // $(".unable-reprint").each((i,el)=>{
    //     el.oncopy=()=>{}
    // })
    // console.log(window.getEventListeners(document))

    async function cfgListExec(list){
        
        let cfg = list.find(v=>{
            if(v.hostname){
                return window.location.hostname.indexOf(v.hostname)>-1
            }
            if(v.re){
                return v.re.test(window.location.href)
            }
            return false
        })
        if (cfg) {
            try{
                await cfg.cb()
            } catch (e) {
                console.error('cfgListExec error')
                console.log(cfg, e)
            }
        }
    }

    
    async function readToCopy(selector){
        await delay(2000)
        $("html").append(getStyle(selector));

        $(selector.join(',')).each((i, el) => {
            removeEventListener(el)
        })
    }

    // 新浪财经 自动关闭窗口 间隔0.3s循环执行
    function sinaFinanceAutoCloseWindow(){
        setInterval(()=>{
            document.querySelectorAll('[class*="close"]').forEach(el=>{
                if (el.style.display !== 'none' && el.offsetParent !== null) {
                    console.log('click', el)
                    el.click()
                }
            })
        }, 300)
    }


    const cfgList=[
        {
            hostname: 'bilibili.com',
            cb: ()=>readToCopy(['.unable-reprint']),
        }, {
            hostname: 'blog.csdn.net',
            cb: ()=>readToCopy(['.prettyprint', '.prettyprint>code','pre', 'pre>code']),
        }, {
            re:/\/\/finance.sina.com.cn\/realstock\/company\/\w+\/nc.shtml/,
            cb: sinaFinanceAutoCloseWindow,
        }
    ]

    cfgListExec(cfgList)
    // Your code here...
})();
