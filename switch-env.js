/**
 * 透传静态服务 + 路径加工规则（不改源文件）
 * 用法: node switch-env.js
 * 安装: http://localhost:5500/read_copy/index.js
 */
const http = require('http')
const fs = require('fs')
const path = require('path')

const ROOT = __dirname
const PORT = 5500
const ORIGIN = `http://localhost:${PORT}`

/**
 * 遍历并替换油猴配置区（// ==UserScript== ... // ==/UserScript==）每一行
 * cb({ key, value, row }) =>
 *   string  → 整行替换
 *   { key } → 构造 `// ${key} ${value || ''}`
 *   其它    → 保持原行
 */
function tmMetaEach(body, cb) {
    const startMark = '// ==UserScript=='
    const endMark = '// ==/UserScript=='
    const start = body.indexOf(startMark)
    const end = body.indexOf(endMark)
    if (start < 0 || end < 0 || end < start) return body

    const head = body.slice(0, start)
    const meta = body.slice(start, end + endMark.length)
    const tail = body.slice(end + endMark.length)
    const lines = meta.split('\n')

    for (let i = 0; i < lines.length; i++) {
        const row = lines[i]
        const m = row.match(/^\/\/\s*(@\S+)(?:\s+(.*))?$/)
        if (!m) continue
        const key = m[1]
        const value = m[2] != null ? m[2] : ''
        const r = cb({ key, value, row })
        if (r == null || r === '') continue
        if (typeof r === 'string') {
            lines[i] = r
        } else if (typeof r === 'object' && r.key) {
            lines[i] = `// ${r.key} ${r.value || ''}`
        }
    }

    return head + lines.join('\n') + tail
}

function bili_text_format(){
    const PLAY_ONLINE = 'pst.thetime50.com'
    const PLAY_LOCAL = 'localhost:3000'
    return [
        {includes:'read_copy/index.js',cb:(body) => {
            const GH = 'https://thetime50.github.io/tampermonkeyscript'
            const ORIGIN = `http://localhost:${PORT}`

            body = tmMetaEach(body, (meta) => {
                if (meta.key === '@connect') {
                    return { key: '@connect', value: 'localhost' }
                }
            })

            body = body.split(GH).join(ORIGIN) // 依赖源
            return body.split(PLAY_ONLINE).join(PLAY_LOCAL) // 插件生效页面替换
        }},
        {includes:'common/play-site.js',cb:(body) => {
            return body.split(PLAY_ONLINE).join(PLAY_LOCAL)
        }}
    ]
}

const RULES = [
    ...bili_text_format()
]

function applyRules(rel, body) {
    for (const rule of RULES) {
        if (rule.includes && rel.includes(rule.includes)) {
            body = rule.cb(body)
        }
    }
    return body
}

http.createServer((req, res) => {
    const noCache = {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Access-Control-Allow-Origin': '*',
    }
    const rel = path.normalize(decodeURIComponent((req.url || '/').split('?')[0]).replace(/^\/+/, '')).replace(/\\/g, '/')
    if (!rel || rel === '.' || rel.startsWith('..')) {
        res.writeHead(200, { ...noCache, 'Content-Type': 'text/plain; charset=utf-8' })
        return res.end(`install: ${ORIGIN}/read_copy/index.js\n`)
    }
    const file = path.join(ROOT, rel)
    fs.readFile(file, 'utf8', (err, body) => {
        if (err) {
            res.writeHead(404, noCache)
            return res.end('Not Found')
        }
        body = applyRules(rel, body)
        const type = path.extname(file) === '.js'
            ? 'application/javascript; charset=utf-8'
            : 'text/plain; charset=utf-8'
        res.writeHead(200, { ...noCache, 'Content-Type': type })
        res.end(body)
    })
}).listen(PORT, 'localhost', () => {
    console.log(`[site_tool] ${ORIGIN}/read_copy/index.js`)
}).on('error', (e) => {
    console.error(e.code === 'EADDRINUSE' ? `端口 ${PORT} 已被占用` : e)
    process.exit(1)
})
