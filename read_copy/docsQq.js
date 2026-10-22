function getDocsQqCfg() {
    return {
        includes: '//docs.qq.com/doc/',
        cb: () => {
            if (document.querySelector('#read-copy-docs-qq-style')) return
            const style = document.createElement('style')
            style.id = 'read-copy-docs-qq-style'
            style.textContent = `.comment-external-group-wrapper { opacity: .9; }`
            ;(document.head || document.documentElement).appendChild(style)
        },
    }
}
