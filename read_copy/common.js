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

async function cfgListExec(list){
    list = list.reduce((arr, v) => arr.concat(v), [])
    let cfg = list.find(v=>{
        if(v.hostname){
            return window.location.href.indexOf(v.hostname)>-1 ||
                window.location.hostname.indexOf(v.hostname)>-1
        }
        if(v.includes){
            return v.includes(window.location.href)
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
