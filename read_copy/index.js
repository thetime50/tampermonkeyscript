// ==UserScript==
// @name         site_tool
// @namespace    http://thetime50.com/
// @version      0.25
// @description  try to take over the world!
// @author       You
// @match        https://www.bilibili.com/read/*
// @match        https://www.bilibili.com/video/*
// @match        https://blog.csdn.net/*
// @match        https://finance.sina.com.cn/realstock/company/*
// @match        https://chat.deepseek.com/a/chat/s/*
// @match        https://*.github.io/*
// @match        https://github.com/*
// @match        https://docs.qq.com/*
// @match        https://pst.thetime50.com/*
// --@match        http://pst.thetime50.com/*
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow
// @connect      pst.thetime50.com
// @require      http://libs.baidu.com/jquery/1.7.2/jquery.min.js
// @require      https://thetime50.github.io/tampermonkeyscript/common/common.js
// @require      https://thetime50.github.io/tampermonkeyscript/common/playSite.js
// @require      https://thetime50.github.io/tampermonkeyscript/read_copy/bili.js
// @require      https://thetime50.github.io/tampermonkeyscript/read_copy/sinaFinance.js
// @require      https://thetime50.github.io/tampermonkeyscript/read_copy/deepseek.js
// @require      https://thetime50.github.io/tampermonkeyscript/read_copy/github.js
// @require      https://thetime50.github.io/tampermonkeyscript/read_copy/docsQq.js
// @require      https://thetime50.github.io/tampermonkeyscript/read_copy/play-site.js
// @updateURL    https://thetime50.github.io/tampermonkeyscript/read_copy/index.js
// @downloadURL  https://thetime50.github.io/tampermonkeyscript/read_copy/index.js
// ==/UserScript==

// 本地调试: 仓库根目录 node switch-env.js ，油猴安装 http://localhost:5500/read_copy/index.js

// update

(async function() {
    'use strict';

    console.log("read-copy 2333")
    // $(document).unbind("copy")
    // $(".unable-reprint").unbind("copy")
    // document.oncopy=()=>{}
    // $(".unable-reprint").each((i,el)=>{
    //     el.oncopy=()=>{}
    // })
    // console.log(window.getEventListeners(document))
    function getPSHandle(){
        return getPlaySiteHandle({origin: 'http://pst.thetime50.com'}) // 通过插件跨域请求接口
    }
    const cfgList=[
        ...getPlaySiteCfg(getPSHandle),
        ...getBiliCfg(getPSHandle),
        {
            hostname: 'blog.csdn.net',
            cb: ()=>readToCopy(['.prettyprint', '.prettyprint>code','pre', 'pre>code']),
        },
        getDocsQqCfg(),
        getSinaFinanceCfg(),
        getDeepseekCfg(),
        ...getGithubCfg(),
    ]

    cfgListExec(cfgList)
    // Your code here...
})();

this.bind = function(e) {
    if ("undefined" != typeof e)
        for (var t in e)
            this._objectConfig[t] = e[t];
    this._elementInput = "string" == typeof this._objectConfig.input ? document.getElementById(this._objectConfig.input) : this._objectConfig.input,
    null != this._objectConfig.loader && (this._elementScriptLoader = "string" == typeof this._objectConfig.loader ? document.getElementById(this._objectConfig.loader) : this._objectConfig.loader),
    this._elementInput && (this._stringOriginalValue = null == this._objectConfig["default"] || "" == this._objectConfig["default"] ? this._elementInput.value : this._objectConfig["default"],
    this.changeType(this._objectConfig.type),
    this._elementInput.value = this._stringOriginalValue,
    this._elementInput.setAttribute("autocomplete", "off"),
    this._elementInput.autoComplete = "off",
    this._aevent(this._elementInput, "focus", this._bind(this._eventFocus)),
    this._aevent(this._elementInput, "blur", this._bind(this._eventBlur)),
    this._aevent(this._elementInput, "keyup", this._bind(this._eventButtonUp)),
    this._aevent(this._elementInput, "mouseup", this._bind(this._eventButtonUp)),
    this._functionCallback = this._objectConfig.callback)
}
