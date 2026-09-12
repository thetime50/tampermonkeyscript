/**
 * play-site 后台接口公共模块（可选）
 * 登录态仅内存管理（依赖 GM 请求携带站点 Cookie）
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

    function pageWindow() {
        return (typeof unsafeWindow !== 'undefined' && unsafeWindow) ? unsafeWindow : window
    }

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

    function request(path, options) {
        options = options || {}
        return new Promise((resolve, reject) => {
            const headers = Object.assign({}, options.headers || {})
            let data = options.body
            if (data != null && typeof data !== 'string') {
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
        tryLogin,
        ensureBridge,
        redirectToLogin,
    }
})
