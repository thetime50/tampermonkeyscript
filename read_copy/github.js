const githubCfg = (() => {
    function getGithubIoUser() {
        const m = location.hostname.match(/^([^.]+)\.github\.io$/i)
        return m ? m[1] : null
    }

    function getFirstPath() {
        return location.pathname.split('/').filter(Boolean)[0] || ''
    }

    function injectGithubIoButtons() {
        const user = getGithubIoUser()
        if (!user || document.querySelector('.read-copy-gh-fab')) return
        const firstPath = getFirstPath()

        const wrap = document.createElement('div')
        wrap.className = 'read-copy-gh-fab'
        wrap.innerHTML = `
            <style>
                .read-copy-gh-fab {
                    position: fixed;
                    top: 12px;
                    right: 12px;
                    z-index: 2147483647;
                    display: flex;
                    flex-direction: column;
                    align-items: flex-end;
                    gap: 6px;
                    font-family: sans-serif;
                }
                .read-copy-gh-fab a {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-sizing: border-box;
                    min-width: 36px;
                    height: 36px;
                    padding: 0 10px;
                    border-radius: 18px;
                    background: #24292f;
                    color: #fff;
                    text-decoration: none;
                    font-size: 12px;
                    line-height: 1;
                    box-shadow: 0 2px 8px rgba(0,0,0,.25);
                    white-space: nowrap;
                }
                .read-copy-gh-fab-menu {
                    display: none;
                    flex-direction: column;
                    align-items: flex-end;
                    gap: 6px;
                }
                .read-copy-gh-fab:hover .read-copy-gh-fab-menu {
                    display: flex;
                }
            </style>
            <a class="read-copy-gh-fab-main" href="javascript:void(0)">GH</a>
            <div class="read-copy-gh-fab-menu">
                <a href="https://github.com/${user}">github.com/${user}</a>
                ${firstPath ? `<a href="https://github.com/${user}/${firstPath}">github.com/${user}/${firstPath}</a>` : ''}
            </div>
        `
        document.body.appendChild(wrap)
    }

    async function injectGithubComButton() {
        const tryInsert = () => {
            const user = location.pathname.split('/').filter(Boolean)[0]
            const nav = document.querySelector('nav[aria-label="Breadcrumbs"]')
            if (!user || !nav) return
            let btn = nav.querySelector('.read-copy-gh-pages-btn')
            const href = `https://${user}.github.io`
            if (btn) {
                if (btn.getAttribute('href') !== href) btn.setAttribute('href', href)
                return
            }
            btn = document.createElement('a')
            btn.className = 'read-copy-gh-pages-btn'
            btn.href = href
            btn.textContent = `${user}.github.io`
            btn.style.marginLeft = '8px'
            btn.style.fontSize = '12px'
            nav.appendChild(btn)
        }

        const deadline = Date.now() + 10000
        while (Date.now() < deadline) {
            tryInsert()
            if (document.querySelector('.read-copy-gh-pages-btn')) break
            await delay(200)
        }
        setInterval(tryInsert, 500)
    }

    return [{
        re: /^https:\/\/[a-z0-9-]+\.github\.io(\/|$)/i,
        cb: injectGithubIoButtons,
    }, {
        re: /^https:\/\/github\.com\/[^\/?#]+/i,
        cb: injectGithubComButton,
    }]
})();
