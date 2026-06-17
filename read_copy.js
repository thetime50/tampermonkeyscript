// ==UserScript==
// @name         read_copy
// @namespace    http://thetime50.com/
// @version      0.6
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

function waitElement(selector){
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            let el = document.querySelector(selector)
            if (el) {
                resolve(el)
            }
        }, 100)
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

    // 新浪财经 
    async function sinaFinanceAutoCloseWindow(){
        let symbolIds = JSON.parse(localStorage.getItem('symbolIds')) || []

        let compareIndexH5Is = $(await waitElement('#compareIndexH5 .is'))
        compareIndexH5Is.on('click', 'a[x-symbol]', async function(e) {
            e.preventDefault()
            let symbolId = $(this).attr('x-symbol')
            $('#compareTxtH5').val(symbolId)
            await delay(10)
            // $('#compareBtnH5').trigger('click')
            document.querySelector('#compareBtnH5').click()
        })
        compareIndexH5Is.on('click', 'label', function(e) {
            e.preventDefault()
            let symbolId = $(this).siblings('a').attr('x-symbol')
            $(this).closest('.i').remove()
            let idx = symbolIds.findIndex(v => v.id === symbolId)
            if (idx > -1) {
                symbolIds.splice(idx, 1)
                localStorage.setItem('symbolIds', JSON.stringify(symbolIds))
            }
        })
        compareIndexH5Is.css({
            top: 'unset',
            bottom: '25px',
            width: '180px',
        })
        function addSymbolItem(symbolId, name){
            let $item = $('<div class="i" style="display: flex;"></div>')
                .css({flex: '1'})
            $item.append($('<a href="javascript:void(0)">')
                .attr('x-symbol', symbolId).text(name).css({
                    flex: '1 1 auto',
                })
            )
            $item.append(' ')
            $item.append($('<label>').text('x').css({
                flex: '0 0 auto',
                width: '20px',
                height: '20px',
                textAlign: 'center',
            }))
            compareIndexH5Is.append($item)
        }
        symbolIds.forEach(v=>{
            addSymbolItem(v.id, v.name)
        })

        setInterval(()=>{
            let addNewSymbol = false
            // 自动关闭窗口 间隔0.3s循环执行
            document.querySelectorAll('[class*="close"]').forEach(el=>{
                if (el.style.display !== 'none' && el.offsetParent !== null) {
                    // console.log('click', el)
                    el.click()
                }
            })
            /* 如果selectAll #h5CompareCon>[data-symbol] 有值 去重加入symbolIds数组
            */
            let symbolEls = document.querySelectorAll('#h5CompareCon>[data-symbol]')
            symbolEls.forEach(v=>{
                let symbolId = v.getAttribute('data-symbol')
                if (!symbolIds.some(v => v.id === symbolId)) {
                    let name = $(v).text().trim() || symbolId
                    symbolIds.push({id: symbolId, name})
                    addSymbolItem(symbolId, name)
                    addNewSymbol = true
                }
            })
            if (addNewSymbol) {
                localStorage.setItem('symbolIds', JSON.stringify(symbolIds))
            }
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
