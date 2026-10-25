function getBiliCfg(getPSHandle) {
    const playSiteHandle = getPSHandle()
    const SUBTITLE_SELECTORS = [
        '.bpx-player-ctrl-subtitle',
        '[class*="bpx-player-ctrl-subtitle"]',
        '[class*="subtitle"]',
        '.bpx-player-subtitle-wrap',
    ]
    // 真正的字幕控制按钮（排除仅用于渲染的 subtitle-wrap）
    const SUBTITLE_BUTTON_SELECTORS = [
        '.bpx-player-ctrl-subtitle',
        '[class*="bpx-player-ctrl-subtitle"]',
    ]
    // .bpx-player-ctrl-subtitle-major-inner>.bpx-player-ctrl-subtitle-language-item

    const ACTION_KEY = 'read_copy_bili_subtitle_action'
    const FORMAT_KEY = 'read_copy_bili_subtitle_format'
    const ACTIONS = [
        { key: 'copyText', label: '复制文本', format: true },
        { key: 'downloadText', label: '下载文本', format: true },
        { key: 'downloadSubtitle', label: '下载字幕' },
    ]

    let subtitleCache = null // { title, data }
    let subtitleFormatCache = null // { text, formatted }
    let lastSubtitleApiCache = null // 最后一次字幕接口响应
    let interceptInstalled = false
    let pendingResolve = null
    let lastSubtitleUrl = location.href
    let urlObserver = null

    let toastHideTimer = null

    const asrApi = getBiliAudioAsr({
        playSiteHandle,
        onProgress: function (text) { showToast(text) },
    })

    function clearSubtitleCaches() {
        subtitleCache = null
        subtitleFormatCache = null
        lastSubtitleApiCache = null
    }

    function watchUrlChange() {
        if (urlObserver) return
        const onUrlChange = () => {
            if (location.href === lastSubtitleUrl) return
            lastSubtitleUrl = location.href
            clearSubtitleCaches()
        }
        urlObserver = new MutationObserver(onUrlChange)
        urlObserver.observe(document.documentElement, { childList: true, subtree: true })
    }
    function getAction() {
        const v = localStorage.getItem(ACTION_KEY)
        return ACTIONS.some(a => a.key === v) ? v : 'copyText'
    }

    function getActionLabel(key) {
        const action = ACTIONS.find(a => a.key === (key || getAction()))
        return action ? action.label : '复制文本'
    }

    function getFormat() {
        return localStorage.getItem(FORMAT_KEY) === '1'
    }

    function setSelection(key, format) {
        localStorage.setItem(ACTION_KEY, key)
        localStorage.setItem(FORMAT_KEY, format ? '1' : '0')
        syncMainTitle()
    }

    function syncMainTitle() {
        const btn = document.querySelector('#read-copy-bili-sub-btn')
        if (btn) btn.title = getActionLabel()
    }

    function ensureToast() {
        let el = document.querySelector('.read-copy-bili-sub-toast')
        if (el) return el
        const item = document.querySelector('.read-copy-bili-sub')
        if (!item) return null
        el = document.createElement('div')
        el.className = 'read-copy-bili-sub-toast'
        item.appendChild(el)
        return el
    }

    function showToast(text, autoHideMs, opts) {
        const el = ensureToast()
        if (!el) return
        if (toastHideTimer) {
            clearTimeout(toastHideTimer)
            toastHideTimer = null
        }
        el.textContent = text
        el.classList.toggle('is-error', !!(opts && opts.error))
        el.classList.add('is-show')
        if (autoHideMs) {
            toastHideTimer = setTimeout(() => {
                hideToast()
            }, autoHideMs)
        }
    }

    function hideToast() {
        const el = document.querySelector('.read-copy-bili-sub-toast')
        if (el) {
            el.classList.remove('is-show')
            el.classList.remove('is-error')
        }
        if (toastHideTimer) {
            clearTimeout(toastHideTimer)
            toastHideTimer = null
        }
    }

    function hasSubtitleSelector() {
        return SUBTITLE_SELECTORS.some(s => document.querySelector(s))
    }

    function hasSubtitleButton() {
        return SUBTITLE_BUTTON_SELECTORS.some(s => document.querySelector(s))
    }

    function sanitizeFilename(name) {
        return (name || 'unknown').replace(/[\\/:*?"<>|]/g, '_').trim() || 'unknown'
    }

    async function ensureSubtitleFormat(text) {
        if (subtitleFormatCache && subtitleFormatCache.text === text) {
            return subtitleFormatCache.formatted
        }
        try {
            showToast("AI分段中...")
            console.log("[bili-subtitle] AI分段中...")
            const res = await playSiteHandle.request('/api/site-tool/text-format', {
                method: 'POST',
                body: { text },
            })
            if (res.status == 200 && res.data && typeof res.data.text === 'string') {
                subtitleFormatCache = { text, formatted: res.data.text }
                return res.data.text
            }
            return text
        } catch (e) {
            if (e && e.status === 401) {
                playSiteHandle.redirectToLogin()
            }
            showToast((e && e.message) || String(e), 1500, { error: true })
            // return text
            console.log('%cerror', 'color:#f00', e)
            throw e
        }
    }

    async function formatSubtitleText(headData,data) {
        const body = (data && data.body) || []
        let text = body.map(v => v.content || '').filter(Boolean).join('\n')

        if (getFormat()) {
            text = await ensureSubtitleFormat(text)
        }
        text = headData.map(v => v.content || '').filter(Boolean).join('\n') + '\n\n' + text
        return text
    }

    function downloadBlob(filename, content, mime) {
        const blob = new Blob([content], { type: mime })
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(a.href)
    }

    async function copyText(text) {
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(text)
            } else {
                const ta = document.createElement('textarea')
                ta.value = text
                document.body.appendChild(ta)
                ta.select()
                document.execCommand('copy')
                document.body.removeChild(ta)
            }
            console.log('[bili-subtitle] 已复制文本')
        } catch (e) {
            console.error('[bili-subtitle] 复制失败', e)
        }
    }
    
    function getAuthor() {
        return ((document.querySelector('.right-container .up-info-container .up-name') || {}).textContent || 'unknown').trim()
    }
    function getPubDate() {
        const pubdate = ((
            document.querySelector('.pubdate-ip-text') ||
            document.querySelector('.pubdate') ||
            document.querySelector('.video-info-detail .pubdate')
        ) || {}).textContent || ''
        return pubdate.replace(/^\s*发布[于於]?\s*/, '').trim()
    }

    async function applyAction(action, title, data) {
        const name = sanitizeFilename(title)
        const author = getAuthor()
        const date = getPubDate()
        const headData = [
            { from: 0, to: 0, content: `[${title} - ${author}]` },
            { from: 0, to: 0, content: `[${location.origin + location.pathname}]` },
            { from: 0, to: 0, content: `[${date}]` }
        ]
        if (getFormat() && !subtitleFormatCache && !playSiteHandle.loggedIn) {
            const me = await playSiteHandle.tryLogin()
            if (!me) {
                playSiteHandle.redirectToLogin()
                return
            }
        }
        if (action === 'copyText') {
            await copyText(await formatSubtitleText(headData,data))
        } else if (action === 'downloadText') {
            downloadBlob(name + '.txt', await formatSubtitleText(headData,data), 'text/plain;charset=utf-8')
        } else if (action === 'downloadSubtitle') {
            const jsonData = Object.assign({}, data, { body: headData.concat(data.body) })
            downloadBlob(name + '.json', JSON.stringify(jsonData, null, 2), 'application/json;charset=utf-8')
        }
    }

    function matchSubtitleUrl(url) {
        return typeof url === 'string' && /aisubtitle\.hdslb\.com\/bfs\/ai_subtitle\/prod\//.test(url)
    }

    function onSubtitleData(data) {
        lastSubtitleApiCache = data
        if (pendingResolve) {
            const resolve = pendingResolve
            pendingResolve = null
            resolve(data)
        }
    }

    function installInterceptor() {
        if (interceptInstalled) return
        interceptInstalled = true

        const origFetch = window.fetch
        if (origFetch) {
            window.fetch = async function (...args) {
                const res = await origFetch.apply(this, args)
                try {
                    const url = typeof args[0] === 'string' ? args[0] : (args[0] && args[0].url)
                    if (matchSubtitleUrl(url)) {
                        res.clone().json().then(onSubtitleData).catch(() => {})
                    }
                } catch (e) {}
                return res
            }
        }

        const XHR = XMLHttpRequest.prototype
        const origOpen = XHR.open
        const origSend = XHR.send
        XHR.open = function (method, url) {
            this.__biliSubtitleUrl = url
            return origOpen.apply(this, arguments)
        }
        XHR.send = function () {
            if (matchSubtitleUrl(this.__biliSubtitleUrl)) {
                this.addEventListener('load', () => {
                    try {
                        onSubtitleData(JSON.parse(this.responseText))
                    } catch (e) {}
                })
            }
            return origSend.apply(this, arguments)
        }
    }

    function waitSubtitleResponse(timeoutMs) {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                if (pendingResolve === resolveWrap) {
                    pendingResolve = null
                }
                reject(new Error('等待字幕请求超时'))
            }, timeoutMs)

            function resolveWrap(data) {
                clearTimeout(timer)
                resolve(data)
            }
            pendingResolve = resolveWrap
        })
    }

    function hoverPlayer() {
        const videoWrap = document.querySelector('.bpx-player-video-wrap')
        if (!videoWrap) return
        const rect = videoWrap.getBoundingClientRect()
        const x = rect.left + rect.width * (0.3 + Math.random() * 0.4)
        const y = rect.top + rect.height * (0.3 + Math.random() * 0.4)
        ;['mouseenter', 'mouseover', 'mousemove'].forEach(type => {
            videoWrap.dispatchEvent(new MouseEvent(type, {
                bubbles: true,
                cancelable: true,
                clientX: x,
                clientY: y,
                view: typeof unsafeWindow !== 'undefined' ? unsafeWindow : window,
            }))
        })
    }

    function forceClick(selector) {
        const elem = document.querySelector(selector)
        if (!elem) return false
        elem.style.display = 'block'
        elem.style.visibility = 'visible'
        elem.click()
        return true
    }

    async function clickSubtitleButton() {
        for (const selector of SUBTITLE_SELECTORS) {
            const el = document.querySelector(selector)
            if (!el) continue
            try {
                if (el.offsetParent !== null || el.getClientRects().length) {
                    el.click()
                    return true
                }
                if (forceClick(selector)) return true
            } catch (e) {
                continue
            }
        }
        const textNodes = Array.from(document.querySelectorAll('*')).filter(el =>
            el.childNodes.length === 1 &&
            el.childNodes[0].nodeType === 3 &&
            el.textContent.trim() === '字幕'
        )
        if (textNodes[0]) {
            textNodes[0].click()
            return true
        }
        return false
    }

    async function selectAiSubtitle() {
        await delay(300 + Math.random() * 200)
        const aiZh = document.querySelector('[data-lan="ai-zh"]')
        if (aiZh) {
            // 已激活则不会重新请求，走接口缓存
            if (aiZh.classList.contains('bpx-state-active') || aiZh.matches('.bpx-state-active')) {
                return { ok: true, alreadyActive: true }
            }
            aiZh.click()
            return { ok: true, alreadyActive: false }
        }
        const chinese = Array.from(document.querySelectorAll('*')).find(el =>
            el.childNodes.length === 1 &&
            el.childNodes[0].nodeType === 3 &&
            el.textContent.trim() === '中文'
        )
        if (chinese) {
            if (chinese.classList.contains('bpx-state-active') || chinese.matches('.bpx-state-active')) {
                return { ok: true, alreadyActive: true }
            }
            chinese.click()
            return { ok: true, alreadyActive: false }
        }
        return { ok: false, alreadyActive: false }
    }

    async function fetchSubtitleBySimulate() {
        installInterceptor()
        const dataPromise = waitSubtitleResponse(15000)

        let title = 'unknown'
        try {
            const titleEl = document.querySelector('.video-title')
            if (titleEl) {
                title = (titleEl.textContent || titleEl.innerText || '').trim() || 'unknown'
            }
        } catch (e) {}

        console.log('[bili-subtitle] 鼠标悬浮到视频播放器...')
        hoverPlayer()
        await delay(1000 + Math.random() * 500)

        console.log('[bili-subtitle] 点击字幕按钮...')
        const clicked = await clickSubtitleButton()
        if (!clicked) {
            console.warn('[bili-subtitle] 未能点击字幕按钮，尝试继续')
        }
        await delay(500 + Math.random() * 300)

        console.log('[bili-subtitle] 点击AI字幕选项...')
        const selected = await selectAiSubtitle()
        if (!selected.ok) {
            console.warn('[bili-subtitle] 未找到AI/中文字幕选项')
            pendingResolve = null
            return { title, data: null }
        }

        // 已激活：优先用切换视频时自动请求留下的接口缓存
        if (selected.alreadyActive && lastSubtitleApiCache) {
            pendingResolve = null
            return { title, data: lastSubtitleApiCache }
        }

        try {
            const data = await dataPromise
            return { title, data }
        } catch (e) {
            // 等待超时：回退接口缓存
            if (lastSubtitleApiCache) {
                return { title, data: lastSubtitleApiCache }
            }
            console.error('[bili-subtitle]', e)
            showToast((e && e.message) || '等待字幕请求超时', 1500, { error: true })
            return { title, data: null }
        }
    }

    async function ensureSubtitle() {
        if (subtitleCache && subtitleCache.data) {
            return subtitleCache
        }
        subtitleFormatCache = null

        // 无字幕按钮：B 站已登录则走音频 ASR
        if (!hasSubtitleButton()) {
            if (!asrApi.isBiliLoggedIn()) {
                showToast('无字幕且未登录 B 站', 1500, { error: true })
                return { title: 'unknown', data: null }
            }
            subtitleCache = await asrApi.fetchSubtitleByAsr()
            return subtitleCache
        }

        subtitleCache = await fetchSubtitleBySimulate()
        if (subtitleCache && subtitleCache.data) {
            return subtitleCache
        }

        // 有字幕按钮但无中文选项 / 未拿到数据：登录态下落到 ASR
        if (asrApi.isBiliLoggedIn()) {
            subtitleCache = await asrApi.fetchSubtitleByAsr()
            return subtitleCache
        }
        return subtitleCache
    }

    async function onMainClick() {
        const action = getAction()
        const btn = document.querySelector('#read-copy-bili-sub-btn')
        if (btn) btn.classList.add('is-loading')
        showToast('下载中')
        try {
            const { title, data } = await ensureSubtitle()
            if (!data) {
                console.warn('[bili-subtitle] 无字幕数据')
                hideToast()
                return
            }
            await applyAction(action, title, data)
            showToast(action === 'copyText' ? '已复制' : '下载完成', 1500)
        } catch (e) {
            showToast((e && e.message) || String(e), 1500, { error: true })
            console.log('%cerror', 'color:#f00', e)
        } finally {
            if (btn) btn.classList.remove('is-loading')
        }
    }

    function injectStyle() {
        if (document.querySelector('#read-copy-bili-sub-style')) return
        const style = document.createElement('style')
        style.id = 'read-copy-bili-sub-style'
        style.textContent = `
            .read-copy-bili-sub.video-toolbar-right-item {
                position: relative;
                display: inline-flex;
                align-items: center;
                margin-right: 8px;
                cursor: pointer;
                user-select: none;
            }
            .read-copy-bili-sub-main {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                min-width: 28px;
                height: 28px;
                font-size: 18px;
                line-height: 1;
                border: none;
                background: transparent;
                color: var(--text2, #61666d);
                cursor: pointer;
                padding: 0 4px;
            }
            .read-copy-bili-sub-main:hover {
                color: var(--brand_pink, #00a1d6);
            }
            .read-copy-bili-sub-main.is-loading {
                opacity: 0.5;
                pointer-events: none;
            }
            .read-copy-bili-sub-caret {
                font-size: 10px;
                margin-left: 2px;
                padding: 4px 2px;
                color: var(--text3, #9499a0);
                cursor: pointer;
            }
            .read-copy-bili-sub-caret:hover {
                color: var(--brand_pink, #00a1d6);
            }
            .read-copy-bili-sub-menu {
                display: none;
                position: absolute;
                top: 100%;
                left: 0;
                z-index: 1000;
                min-width: 110px;
                padding: 6px 0;
                margin-top: 4px;
                background: var(--bg1_float, #fff);
                border: 1px solid var(--line_regular, #e3e5e7);
                border-radius: 6px;
                box-shadow: 0 4px 12px rgba(0,0,0,.1);
            }
            .read-copy-bili-sub-menu.is-open {
                display: block;
            }
            .read-copy-bili-sub-menu-item {
                padding: 6px 12px;
                font-size: 13px;
                color: var(--text1, #18191c);
                white-space: nowrap;
            }
            .read-copy-bili-sub-menu-item.is-split {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 8px;
                padding-right: 6px;
            }
            .read-copy-bili-sub-menu-label {
                flex: 1;
            }
            .read-copy-bili-sub-menu-format {
                flex: 0 0 auto;
                width: 22px;
                height: 22px;
                padding: 0;
                border: 1px solid var(--line_regular, #e3e5e7);
                border-radius: 4px;
                background: transparent;
                color: var(--text3, #9499a0);
                font-size: 12px;
                font-weight: 600;
                line-height: 20px;
                text-align: center;
                cursor: pointer;
            }
            .read-copy-bili-sub-menu-format:hover,
            .read-copy-bili-sub-menu-format.is-active {
                color: var(--brand_pink, #00a1d6);
                border-color: var(--brand_pink, #00a1d6);
            }
            .read-copy-bili-sub-menu-item:hover {
                background: var(--bg2, #f1f2f3);
            }
            .read-copy-bili-sub-menu-item.is-active {
                color: var(--brand_pink, #00a1d6);
                font-weight: 600;
            }
            .read-copy-bili-sub-toast {
                display: none;
                position: absolute;
                bottom: calc(100% + 6px);
                left: 50%;
                transform: translateX(-50%);
                z-index: 1001;
                padding: 4px 10px;
                font-size: 12px;
                line-height: 1.4;
                white-space: nowrap;
                color: #fff;
                background: rgba(0, 0, 0, 0.75);
                border: 1px solid transparent;
                border-radius: 4px;
                pointer-events: none;
            }
            .read-copy-bili-sub-toast.is-error {
                color: #fb7299;
                background: #fff;
                border-color: #fb7299;
            }
            .read-copy-bili-sub-toast.is-show {
                display: block;
            }
        `
        document.head.appendChild(style)
    }

    function renderMenuActive($menu) {
        const action = getAction()
        const format = getFormat()
        $menu.find('.read-copy-bili-sub-menu-item').each(function () {
            const key = $(this).data('action')
            $(this).toggleClass('is-active', key === action)
            $(this).find('.read-copy-bili-sub-menu-format')
                .toggleClass('is-active', key === action && format)
        })
    }

    function insertToolbarButton(toolbar) {
        if (document.querySelector('.read-copy-bili-sub')) return
        injectStyle()
        installInterceptor()

        const $item = $('<div class="video-toolbar-right-item read-copy-bili-sub"></div>')
        const $btn = $('<button type="button" class="read-copy-bili-sub-main" id="read-copy-bili-sub-btn"></button>')
            .text("🅂") // String.fromCodePoint(0x1F142))
            .attr('title', getActionLabel())
        const $caret = $('<span class="read-copy-bili-sub-caret">▾</span>')
        const $menu = $('<div class="read-copy-bili-sub-menu"></div>')

        ACTIONS.forEach(a => {
            const $row = $('<div class="read-copy-bili-sub-menu-item"></div>').data('action', a.key)
            if (a.format) {
                $row.addClass('is-split')
                $row.append($('<span class="read-copy-bili-sub-menu-label"></span>').text(a.label))
                $row.append($('<button type="button" class="read-copy-bili-sub-menu-format">M</button>'))
            } else {
                $row.text(a.label)
            }
            $menu.append($row)
        })
        renderMenuActive($menu)

        let hideMenuTimer = null
        function showMenu() {
            if (hideMenuTimer) {
                clearTimeout(hideMenuTimer)
                hideMenuTimer = null
            }
            $menu.addClass('is-open')
        }
        function scheduleHideMenu() {
            if (hideMenuTimer) clearTimeout(hideMenuTimer)
            hideMenuTimer = setTimeout(() => {
                $menu.removeClass('is-open')
                hideMenuTimer = null
            }, 300)
        }

        $btn.on('click', function (e) {
            e.preventDefault()
            e.stopPropagation()
            onMainClick()
        })
        $menu.on('click', '.read-copy-bili-sub-menu-item', function (e) {
            e.preventDefault()
            e.stopPropagation()
            if ($(e.target).closest('.read-copy-bili-sub-menu-format').length) return
            setSelection($(this).data('action'), false)
            renderMenuActive($menu)
        })
        $menu.on('click', '.read-copy-bili-sub-menu-format', function (e) {
            e.preventDefault()
            e.stopPropagation()
            const key = $(this).closest('.read-copy-bili-sub-menu-item').data('action')
            setSelection(key, true)
            renderMenuActive($menu)
        })
        $caret.on('mouseenter', showMenu)
        $caret.on('mouseleave', scheduleHideMenu)
        $menu.on('mouseenter', showMenu)
        $menu.on('mouseleave', scheduleHideMenu)

        $item.append($btn).append($caret).append($menu)
        $(toolbar).prepend($item)
        console.log('[bili-subtitle] 工具栏按钮已插入')
    }

    async function waitAndInsertToolbar() {
        const deadline = Date.now() + 10000
        while (Date.now() < deadline) {
            const toolbar = document.querySelector('.video-toolbar-right')
            // 等待 toolbar>div >1 个元素（无字幕按钮时也插入，供 ASR 回退）
            if (toolbar && toolbar.querySelectorAll(':scope > div').length > 1) {
                insertToolbarButton(toolbar)
                return
            }
            await delay(200)
        }
        console.warn('[bili-subtitle] 10s内未找到字幕控件/工具栏')
    }

    async function bindTitleClickCopy() {
        const deadline = Date.now() + 10000
        while (Date.now() < deadline) {
            const el = document.querySelector('.video-info-title-inner')
            if (el && !el.__readCopyTitleBound) {
                el.__readCopyTitleBound = true
                el.addEventListener('click', async () => {
                    const title = ((document.querySelector('.video-title') || el).textContent || '').trim() || 'unknown'
                    const author = getAuthor()
                    const date = getPubDate()
                    const label = date ? `${title} - ${author} - ${date}` : `${title} - ${author}`
                    await copyText(`[${label}](${location.href})`)
                })
                return
            }
            await delay(200)
        }
    }

    return [{
        includes: '//www.bilibili.com/read/',
        cb: () => readToCopy(['.unable-reprint']),
    }, {
        includes: '//www.bilibili.com/video/',
        cb: () => Promise.all([waitAndInsertToolbar(), bindTitleClickCopy(), watchUrlChange()]),
    }]
};
