function getDocsQqCfg() {
    // 侧栏批注卡片半透明
    function injectDocsQqCommentOpacity() {
        if (document.querySelector('#read-copy-docs-qq-style')) return
        const style = document.createElement('style')
        style.id = 'read-copy-docs-qq-style'
        style.textContent = `div.comment-external-group-wrapper { opacity: .9; }`
        ;(document.head || document.documentElement).appendChild(style)
    }

    // canvas 批注底色：非激活 #fffceb -> #fff4b6（激活 #ffdd99 不变）
    function hookDocsQqCommentHighlightColor() {
        const win = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window
        if (win.__readCopyDocsQqFillStyleHooked) return
        win.__readCopyDocsQqFillStyleHooked = true
        const desc = Object.getOwnPropertyDescriptor(win.CanvasRenderingContext2D.prototype, 'fillStyle')
        if (!desc?.set) return
        Object.defineProperty(win.CanvasRenderingContext2D.prototype, 'fillStyle', {
            configurable: true,
            enumerable: desc.enumerable,
            get: desc.get,
            set(v) {
                const s = String(v).replace(/\s+/g, '').toLowerCase()
                if (
                    s === '#fffceb' ||
                    s === 'rgb(255,252,235)' ||
                    s === 'rgba(255,252,235,1)' ||
                    s === 'rgba(255,252,235,1.0)'
                ) {
                    v = 'rgba(255, 244, 182, 1)'
                }
                return desc.set.call(this, v)
            },
        })
    }

    // 双击批注卡片：悬浮出更多按钮 → 点「编辑」
    function bindDocsQqCommentDblEdit() {
        const win = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window
        if (win.__readCopyDocsQqDblEditBound) return
        win.__readCopyDocsQqDblEditBound = true
        const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
        const waitEl = async (fn, n = 20) => {
            for (let i = 0; i < n; i++) {
                const el = fn()
                if (el) return el
                await sleep(50)
            }
        }
        document.addEventListener(
            'dblclick',
            async (e) => {
                const box = e.target.closest?.('.comment-external-group-wrapper .melo-comment-content-box')
                if (!box || box.querySelector('.editor-container')) return
                const textBox = box.querySelector('.comment-text-box')
                if (textBox) {
                    textBox.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }))
                    textBox.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }))
                }
                const more = await waitEl(() => box.isConnected && box.querySelector('.tool-item-more-wrapper'))
                if (!more || !box.isConnected) return
                ;(more.closest('.comment-toolbar-item') || more).click()
                const edit = await waitEl(
                    () =>
                        box.isConnected &&
                        [...document.querySelectorAll('.dui-tooltip-content .context-comment-toolbar-item')].find(
                            (el) => (el.textContent || '').trim() === '编辑',
                        ),
                )
                edit?.click()
            },
            true,
        )
    }

    return {
        includes: '//docs.qq.com/doc/',
        cb: () => {
            injectDocsQqCommentOpacity()
            hookDocsQqCommentHighlightColor()
            bindDocsQqCommentDblEdit()
        },
    }
}
