/**
 * play-site 后台接口公共模块（可选）
 * 协议见 play-site: doc/tm-site-tool-play-site-login.md
 *
 * 站点脚本按需使用：
 *   const playSiteHandle = playSiteHandle // 或直接用全局 playSiteHandle
 *   cb: playSiteHandle.tryLogin
 *   console.log(playSiteHandle.user)
 */
const playSiteHandle = (() => {
    const STORAGE_KEY = 'play-site-login'
    const BRIDGE_NAME = 'site-tool'
    const BRIDGE_VERSION = '1.0.0'
    // 开发/生产各一套；按需改生产地址
    const PLAY_SITE_ORIGIN = (typeof localStorage !== 'undefined' && localStorage.getItem('play_site_origin'))
        || 'http://localhost:3000'

    function pageWindow() {
        return (typeof unsafeWindow !== 'undefined' && unsafeWindow) ? unsafeWindow : window
    }

    function readRecord() {
        const raw = GM_getValue(STORAGE_KEY, '')
        if (!raw || raw === '{}') return null
        try {
            return JSON.parse(raw)
        } catch (e) {
            return null
        }
    }

    function isEmptyRecord(record) {
        if (!record || !record.token || !record.user || !record.user.id || !record.user.username) return true
        if (record.expiresAt && Date.now() >= record.expiresAt) return true
        return false
    }

    function refreshSnapshot() {
        const w = pageWindow()
        if (!w.__site_tool || !w.__site_tool.playSite) return
        const record = readRecord()
        const empty = isEmptyRecord(record)
        const ps = w.__site_tool.playSite
        ps.record = empty ? null : record
        ps.token = empty ? null : (record.token || null)
        ps.user = empty ? null : (record.user || null)
        ps.loggedIn = !empty
        ps.updatedAt = Date.now()
    }

    function emitLoginChanged(loggedIn, user) {
        pageWindow().dispatchEvent(new CustomEvent('site-tool:play-site-login-changed', {
            detail: { loggedIn: !!loggedIn, user: user || null },
        }))
    }

    function writeRecord(record) {
        GM_setValue(STORAGE_KEY, JSON.stringify(record))
        refreshSnapshot()
        emitLoginChanged(true, record && record.user)
    }

    async function getLogin() {
        const record = readRecord()
        return isEmptyRecord(record) ? null : record
    }

    async function setLogin(record) {
        if (isEmptyRecord(record)) {
            await clearLogin()
            return
        }
        writeRecord(record)
    }

    async function clearLogin() {
        GM_setValue(STORAGE_KEY, '')
        refreshSnapshot()
        emitLoginChanged(false, null)
    }

    async function refresh() {
        refreshSnapshot()
    }

    async function isEmpty() {
        return isEmptyRecord(readRecord())
    }

    function ensureBridge() {
        const w = pageWindow()
        if (w.__site_tool && w.__site_tool.ready && w.__site_tool.playSite) {
            refreshSnapshot()
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
                record: null,
                updatedAt: 0,
                getLogin,
                setLogin,
                clearLogin,
                refresh,
                isEmpty,
            },
        }
        refreshSnapshot()
        w.dispatchEvent(new CustomEvent('site-tool:ready', {
            detail: { name: BRIDGE_NAME, version: BRIDGE_VERSION },
        }))
        return w.__site_tool
    }

    function request(path, options) {
        options = options || {}
        return new Promise((resolve, reject) => {
            const record = readRecord()
            const headers = Object.assign({}, options.headers || {})
            if (record && record.token && !isEmptyRecord(record)) {
                headers.Authorization = 'Bearer ' + record.token
            }
            let data = options.body
            if (data != null && typeof data !== 'string') {
                headers['Content-Type'] = headers['Content-Type'] || 'application/json'
                data = JSON.stringify(data)
            }
            GM_xmlhttpRequest({
                method: options.method || 'GET',
                url: (options.origin || PLAY_SITE_ORIGIN) + path,
                headers: headers,
                data: data,
                onload: function (res) {
                    let body = res.responseText
                    try {
                        body = JSON.parse(res.responseText)
                    } catch (e) {}
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
        pageWindow().location.href =
            PLAY_SITE_ORIGIN + '/login?from=site-tool&redirect=' + redirect
    }

    /**
     * 探测鉴权：仅接口判定未登录（401）时清本地并跳转登录。
     * getLogin() 为空不跳转。
     */
    async function tryLogin() {
        ensureBridge()
        try {
            const res = await request('/api/auth/me')
            const user = res.data && res.data.user
            if (user) {
                const record = readRecord()
                if (record && !isEmptyRecord(record)) {
                    record.user = {
                        id: user.id,
                        username: user.username,
                        nickname: user.nickname || '',
                        role: user.role,
                    }
                    writeRecord(record)
                }
            }
            return res.data
        } catch (e) {
            if (e && e.status === 401) {
                await clearLogin()
                redirectToLogin()
                return null
            }
            throw e
        }
    }

    ensureBridge()

    return {
        get origin() { return PLAY_SITE_ORIGIN },
        get user() {
            const w = pageWindow()
            return (w.__site_tool && w.__site_tool.playSite && w.__site_tool.playSite.user) || null
        },
        get loggedIn() {
            const w = pageWindow()
            return !!(w.__site_tool && w.__site_tool.playSite && w.__site_tool.playSite.loggedIn)
        },
        get token() {
            const w = pageWindow()
            return (w.__site_tool && w.__site_tool.playSite && w.__site_tool.playSite.token) || null
        },
        get record() {
            const w = pageWindow()
            return (w.__site_tool && w.__site_tool.playSite && w.__site_tool.playSite.record) || null
        },
        getLogin,
        setLogin,
        clearLogin,
        refresh,
        isEmpty,
        request,
        tryLogin,
        ensureBridge,
        redirectToLogin,
    }
})()
