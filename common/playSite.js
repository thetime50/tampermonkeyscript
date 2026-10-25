/**
 * play-site 后台接口公共模块（可选）
 * 登录态仅内存管理；请求经同源 iframe 桥（credentials 带 Cookie）
 *
 * 站点脚本按需使用：
 *   cb: playSiteHandle.tryLogin
 *   console.log(playSiteHandle.user)
 */
const getPlaySiteHandle = ((handelCfg = {}) => {
    const BRIDGE_NAME = 'site-tool'
    const BRIDGE_VERSION = '1.0.0'
    // 生产地址；本地调试由 switch-env.js 换为 http://localhost:3000
    const PLAY_SITE_ORIGIN = handelCfg.origin // 'https://pst.thetime50.com' // 发布 通过插件跨域请求接口
    const IFRAME_CHANNEL = 'site-tool-bridge'
    const IFRAME_PATH = '/site-tool-bridge.html'
    const IFRAME_ID = 'site-tool-request-bridge'

    function pageWindow() {
        return (typeof unsafeWindow !== 'undefined' && unsafeWindow) ? unsafeWindow : window
    }
    pageWindow().__psdbg__ = false

    function playSite() {
        const w = pageWindow()
        return w.__site_tool && w.__site_tool.playSite
    }

    function setUser(user) {
        const ps = playSite()
        if (!ps) return
        ps.user = user || null
        ps.loggedIn = !!user
        ps.token = null
        ps.updatedAt = Date.now()
    }

    function clearUser() {
        setUser(null)
    }

    function ensureBridge() { // 通过插件暴露给全局，让其他项目页面可以用
        const w = pageWindow()
        if (w.__site_tool && w.__site_tool.ready && w.__site_tool.playSite) {
            return w.__site_tool
        }
        w.__site_tool = {
            name: BRIDGE_NAME,
            version: BRIDGE_VERSION,
            ready: true,
            playSite: {
                loggedIn: false,
                user: null,
                token: null,
                updatedAt: 0,
            },
        }
        w.dispatchEvent(new CustomEvent('site-tool:ready', {
            detail: { name: BRIDGE_NAME, version: BRIDGE_VERSION },
        }))
        return w.__site_tool
    }

    /** @deprecated 归档：原 GM_xmlhttpRequest 实现，不修改、不调用 */
    function requestGmArchived(path, options) {
        options = options || {}
        return new Promise((resolve, reject) => {
            if (pageWindow().__psdbg__){
                console.log('request', path, options)
            }
            const headers = Object.assign({}, options.headers || {})
            let data = options.body
            const isFormData = typeof FormData !== 'undefined' && data instanceof FormData
            if (isFormData) {
                // 交由运行时带 multipart boundary，勿强制 application/json
                delete headers['Content-Type']
                delete headers['content-type']
            } else if (data != null && typeof data !== 'string') {
                headers['Content-Type'] = headers['Content-Type'] || 'application/json'
                data = JSON.stringify(data)
            }
            GM_xmlhttpRequest({
                method: options.method || 'GET',
                url: PLAY_SITE_ORIGIN + path,
                headers: headers,
                data: data,
                onload: function (res) {
                    let body = res.responseText
                    try {
                        body = JSON.parse(res.responseText)
                    } catch (e) {}
                    if (res.status === 401) {
                        clearUser()
                    }
                    if (res.status >= 200 && res.status < 300) {
                        resolve({ status: res.status, data: body })
                        return
                    }
                    const err = new Error(
                        (body && (body.statusMessage || body.message)) ||
                        res.statusText ||
                        ('HTTP ' + res.status)
                    )
                    err.status = res.status
                    err.data = body
                    reject(err)
                },
                onerror: function () {
                    reject(new Error('network error'))
                },
                ontimeout: function () {
                    reject(new Error('timeout'))
                },
            })
        })
    }

    let iframeEl = null
    let iframeReadyPromise = null
    let iframeContentWindow = null
    const pendingRequests = Object.create(null)
    let msgListenerInstalled = false
    let reqSeq = 0

    function installMessageListener() {
        if (msgListenerInstalled) return
        msgListenerInstalled = true
        pageWindow().addEventListener('message', function (ev) {
            if (!PLAY_SITE_ORIGIN || ev.origin !== PLAY_SITE_ORIGIN) return
            const msg = ev.data
            if (!msg || msg.channel !== IFRAME_CHANNEL) return
            if (msg.type === 'ready') {
                iframeContentWindow = ev.source
                return
            }
            if (msg.type !== 'response' || !msg.id) return
            const pending = pendingRequests[msg.id]
            if (!pending) return
            delete pendingRequests[msg.id]
            clearTimeout(pending.timer)
            if (msg.error && !msg.status) {
                pending.reject(new Error(msg.error))
                return
            }
            if (msg.status === 401) {
                clearUser()
            }
            if (msg.status >= 200 && msg.status < 300) {
                pending.resolve({ status: msg.status, data: msg.data })
                return
            }
            const body = msg.data
            const err = new Error(
                (body && (body.statusMessage || body.message)) ||
                msg.error ||
                msg.statusText ||
                ('HTTP ' + msg.status)
            )
            err.status = msg.status
            err.data = body
            pending.reject(err)
        })
    }

    function ensureRequestIframe() {
        installMessageListener()
        if (iframeReadyPromise) return iframeReadyPromise
        iframeReadyPromise = new Promise((resolve, reject) => {
            const doc = pageWindow().document
            let el = doc.getElementById(IFRAME_ID)
            if (!el) {
                el = doc.createElement('iframe')
                el.id = IFRAME_ID
                el.name = IFRAME_ID
                el.src = PLAY_SITE_ORIGIN + IFRAME_PATH
                el.setAttribute('title', 'site-tool-bridge')
                el.style.cssText = 'position:fixed;width:0;height:0;border:0;opacity:0;pointer-events:none;left:-9999px;top:0;'
                ;(doc.body || doc.documentElement).appendChild(el)
            }
            iframeEl = el

            const readyTimer = setTimeout(() => {
                pageWindow().removeEventListener('message', onReady)
                reject(new Error('site-tool bridge timeout'))
            }, 15000)

            function onReady(ev) {
                if (ev.origin !== PLAY_SITE_ORIGIN) return
                const msg = ev.data
                if (!msg || msg.channel !== IFRAME_CHANNEL || msg.type !== 'ready') return
                clearTimeout(readyTimer)
                pageWindow().removeEventListener('message', onReady)
                iframeContentWindow = ev.source || (el.contentWindow)
                resolve(iframeContentWindow)
            }
            pageWindow().addEventListener('message', onReady)

            el.addEventListener('load', function () {
                try {
                    if (el.contentWindow) {
                        el.contentWindow.postMessage(
                            { channel: IFRAME_CHANNEL, type: 'ping' },
                            PLAY_SITE_ORIGIN
                        )
                    }
                } catch (e) {}
            })
        })
        return iframeReadyPromise
    }

    async function serializeBody(body, headers) {
        const h = Object.assign({}, headers || {})
        if (body == null) {
            return { bodyKind: 'none', headers: h, transfer: [] }
        }
        if (typeof FormData !== 'undefined' && body instanceof FormData) {
            delete h['Content-Type']
            delete h['content-type']
            const formParts = []
            const transfer = []
            for (const entry of body.entries()) {
                const name = entry[0]
                const value = entry[1]
                if (typeof value === 'string') {
                    formParts.push({ name: name, kind: 'text', text: value })
                } else {
                    const buffer = await value.arrayBuffer()
                    formParts.push({
                        name: name,
                        kind: 'file',
                        filename: value.name || 'blob',
                        mime: value.type || 'application/octet-stream',
                        buffer: buffer,
                    })
                    transfer.push(buffer)
                }
            }
            return { bodyKind: 'formdata', headers: h, formParts: formParts, transfer: transfer }
        }
        if (typeof body === 'string') {
            return { bodyKind: 'text', headers: h, bodyText: body, transfer: [] }
        }
        h['Content-Type'] = h['Content-Type'] || 'application/json'
        return {
            bodyKind: 'json',
            headers: h,
            bodyText: JSON.stringify(body),
            transfer: [],
        }
    }

    function request(path, options) {
        options = options || {}
        return (async () => {
            if (pageWindow().__psdbg__) {
                console.log('request', path, options)
            }
            const win = await ensureRequestIframe()
            const serialized = await serializeBody(options.body, options.headers)
            const id = 'r' + (++reqSeq) + '_' + Date.now()
            const isForm = serialized.bodyKind === 'formdata'
            const timeoutMs = options.timeout != null
                ? options.timeout
                : (isForm ? 600000 : 60000)

            const payload = {
                channel: IFRAME_CHANNEL,
                type: 'request',
                id: id,
                path: path,
                method: options.method || 'GET',
                headers: serialized.headers,
                bodyKind: serialized.bodyKind,
                bodyText: serialized.bodyText,
                formParts: serialized.formParts,
            }

            return new Promise((resolve, reject) => {
                const timer = setTimeout(() => {
                    delete pendingRequests[id]
                    reject(new Error('timeout'))
                }, timeoutMs)
                pendingRequests[id] = { resolve: resolve, reject: reject, timer: timer }
                try {
                    win.postMessage(payload, PLAY_SITE_ORIGIN, serialized.transfer || [])
                } catch (e) {
                    clearTimeout(timer)
                    delete pendingRequests[id]
                    reject(e)
                }
            })
        })()
    }

    function redirectToLogin(returnUrl) {
        const redirect = encodeURIComponent(returnUrl || pageWindow().location.href)
        pageWindow().open(
            PLAY_SITE_ORIGIN + '/login?from=site-tool&redirect=' + redirect,
            '_blank'
        )
    }

    /** 探测鉴权：成功写入内存 user；401 清 user 并打开登录页 */
    async function tryLogin() {
        // ensureBridge()
        try {
            const res = await request('/api/auth/me')
            const user = res.data && res.data.user
            if (user) setUser(user)
            return res.data
        } catch (e) {
            if (e && e.status === 401) {
                clearUser()
                redirectToLogin()
                return null
            }
            throw e
        }
    }

    // ensureBridge()

    return { // 提供给插件
        get origin() { return PLAY_SITE_ORIGIN },
        get user() {
            const ps = playSite()
            return (ps && ps.user) || null
        },
        get loggedIn() {
            const ps = playSite()
            return !!(ps && ps.loggedIn)
        },
        get token() {
            const ps = playSite()
            return (ps && ps.token) || null
        },
        clearUser,
        request,
        requestGmArchived,
        tryLogin,
        ensureBridge,
        redirectToLogin,
    }
})
