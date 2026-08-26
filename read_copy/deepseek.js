const deepseekCfg = (() => {
    // deepseek插件

    async function deepseekAutoClickCopy() {
        const keyList = []
        let lastUrl = location.href
        let observedEl = null
        let observer = null

        function processAnswers() {
            const els = document.querySelectorAll('[data-virtual-list-item-key]>.ds-message ._245c867')
            els.forEach(el => {
                const wrap = el.closest('[data-virtual-list-item-key]')
                const key = wrap && wrap.getAttribute('data-virtual-list-item-key')
                if (!key || keyList.includes(key)) return
                el.click()
                keyList.push(key)
            })
        }

        function watchList() {
            const listEl = document.querySelector('.ds-virtual-list-visible-items')
            if (!listEl || listEl === observedEl) return
            if (observer) observer.disconnect()
            observedEl = listEl
            observer = new MutationObserver(processAnswers)
            observer.observe(listEl, { childList: true, subtree: true })
            processAnswers()
        }

        function onUrlChange() {
            if (location.href === lastUrl) return
            lastUrl = location.href
            keyList.length = 0
        }

        const origPushState = history.pushState
        history.pushState = function () {
            origPushState.apply(this, arguments)
            onUrlChange()
        }
        const origReplaceState = history.replaceState
        history.replaceState = function () {
            origReplaceState.apply(this, arguments)
            onUrlChange()
        }
        window.addEventListener('popstate', onUrlChange)

        const deadline = Date.now() + 15000
        while (Date.now() < deadline) {
            watchList()
            if (observedEl) break
            await delay(200)
        }

        setInterval(() => {
            onUrlChange()
            watchList()
        }, 500)
    }

    return {
        includes: 'chat.deepseek.com/a/chat/s/',
        cb: deepseekAutoClickCopy,
    }
})();
