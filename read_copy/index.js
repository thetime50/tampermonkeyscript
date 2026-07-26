// ==UserScript==
// @name         read_copy
// @namespace    http://thetime50.com/
// @version      0.12
// @description  try to take over the world!
// @author       You
// @match        https://www.bilibili.com/read/*
// @match        https://www.bilibili.com/video/*
// @match        https://blog.csdn.net/*
// @match        https://finance.sina.com.cn/realstock/company/*
// @grant        none
// @require      http://libs.baidu.com/jquery/1.7.2/jquery.min.js
// @require      https://thetime50.github.io/tampermonkeyscript/read_copy/common.js
// @require      https://thetime50.github.io/tampermonkeyscript/read_copy/bili.js
// @require      https://thetime50.github.io/tampermonkeyscript/read_copy/sinaFinance.js
// @updateURL    https://thetime50.github.io/tampermonkeyscript/read_copy/index.js
// ==/UserScript==

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

    const cfgList=[
        ...biliCfg(),
        {
            hostname: 'blog.csdn.net',
            cb: ()=>readToCopy(['.prettyprint', '.prettyprint>code','pre', 'pre>code']),
        },
        sinaFinanceCfg(),
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
