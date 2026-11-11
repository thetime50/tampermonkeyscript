function getDocsQqCfg() {
    return {
        includes: '//docs.qq.com/doc/',
        cb: () => {
            if (!document.querySelector('#read-copy-docs-qq-style')) {
                const style = document.createElement('style')
                style.id = 'read-copy-docs-qq-style'
                style.textContent = `div.comment-external-group-wrapper { opacity: .9; }`
                ;(document.head || document.documentElement).appendChild(style)
            }
            const win = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window
            if (win.__readCopyDocsQqFillStyleHooked) return
            win.__readCopyDocsQqFillStyleHooked = true
            const proto = win.CanvasRenderingContext2D.prototype
            const desc = Object.getOwnPropertyDescriptor(proto, 'fillStyle')
            if (!desc || !desc.set) return
            Object.defineProperty(proto, 'fillStyle', {
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
        },
    }
}
