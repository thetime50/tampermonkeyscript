/**
 * B 站无中文字幕时：取 dash 音频 → 查 result-cache → 否则 asr-subtitle
 */
function getBiliAudioAsr(deps) {
    const playSiteHandle = deps && deps.playSiteHandle
    const onProgress = (deps && deps.onProgress) || function () {}
    const ASR_API = '/api/site-tool/asr-subtitle'
    const DIGEST_KEY_PREFIX = 'read_copy_bili_asr_digest_'

    function isBiliLoggedIn() {
        const m = document.cookie.match(/(?:^|;\s*)DedeUserID=(\d+)/)
        return !!(m && m[1] && m[1] !== '0')
    }

    function getBvid() {
        const m = location.pathname.match(/\/video\/(BV[\w]+)/i)
        return (m && m[1]) || ''
    }

    function pickAudioFromPlayinfo() {
        const playinfo = (typeof unsafeWindow !== 'undefined' && unsafeWindow.__playinfo__)
            || window.__playinfo__
            || null
        const dash = playinfo && playinfo.data && playinfo.data.dash
        const list = dash && Array.isArray(dash.audio) ? dash.audio.slice() : []
        if (!list.length) return null
        list.sort((a, b) => (b.bandwidth || 0) - (a.bandwidth || 0))
        const best = list[0]
        const primary = best.baseUrl || best.base_url || ''
        const backups = best.backupUrl || best.backup_url || []
        const candidates = [primary].concat(backups).filter(Boolean)
        // 优先公网 bilivideo（便于服务端拉取），避开带端口的 mcdn
        const preferred = candidates.find(u =>
            /^https:\/\//i.test(u) &&
            /bilivideo\.com\//i.test(u) &&
            !/:\d+\//.test(u.split('?')[0])
        ) || candidates.find(u => /^https:\/\//i.test(u)) || candidates[0]
        return {
            url: preferred,
            id: best.id,
            bandwidth: best.bandwidth,
            duration: dash.duration,
            candidates,
        }
    }

    function digestStorageKey(audioId) {
        return DIGEST_KEY_PREFIX + (getBvid() || 'unknown') + '_' + (audioId || '0')
    }

    function loadLocalDigest(audioId) {
        try {
            const raw = localStorage.getItem(digestStorageKey(audioId))
            if (!raw) return null
            const obj = JSON.parse(raw)
            if (obj && /^[a-f0-9]{64}$/.test(obj.hash) && Number.isFinite(obj.size) && obj.size >= 0) {
                return { hash: obj.hash, size: obj.size }
            }
        } catch (e) {}
        return null
    }

    function saveLocalDigest(audioId, hash, size) {
        try {
            localStorage.setItem(digestStorageKey(audioId), JSON.stringify({ hash, size }))
        } catch (e) {}
    }

    function bufToHex(buf) {
        const arr = new Uint8Array(buf)
        let hex = ''
        for (let i = 0; i < arr.length; i++) {
            hex += arr[i].toString(16).padStart(2, '0')
        }
        return hex
    }

    function filenameFromUrl(url, audioId) {
        const name = ((url || '').split('?')[0].split('/').pop() || '')
        if (name && /\.\w+$/.test(name)) return name
        return (audioId ? String(audioId) : 'audio') + '.m4s'
    }

    async function downloadAudio(url) {
        onProgress('下载音频...')
        const res = await fetch(url, { credentials: 'omit', mode: 'cors' })
        if (!res.ok) throw new Error('下载音频失败 HTTP ' + res.status)
        const buf = await res.arrayBuffer()
        onProgress('计算音频指纹...')
        const digest = await crypto.subtle.digest('SHA-256', buf)
        return { buf, hash: bufToHex(digest), size: buf.byteLength }
    }

    async function downloadAudioWithFallback(audio) {
        let lastErr = null
        const urls = [audio.url].concat((audio.candidates || []).filter(u => u !== audio.url))
        for (const url of urls) {
            try {
                const got = await downloadAudio(url)
                return Object.assign({ url }, got)
            } catch (e) {
                lastErr = e
            }
        }
        throw lastErr || new Error('下载音频失败')
    }

    async function readResultCache(hash, size) {
        const qs = 'api=' + encodeURIComponent(ASR_API)
            + '&hash=' + encodeURIComponent(hash)
            + '&size=' + encodeURIComponent(String(size))
        try {
            const res = await playSiteHandle.request('/api/result-cache?' + qs)
            if (res && res.data && typeof res.data.text === 'string') {
                return res.data.text
            }
        } catch (e) {
            if (e && e.status === 404) return null
            throw e
        }
        return null
    }

    async function requestAsrSubtitle(buf, filename) {
        onProgress('语音转字幕中...')
        const form = new FormData()
        form.append('audio', new Blob([buf], { type: 'audio/mp4' }), filename || 'audio.m4s')
        const res = await playSiteHandle.request(ASR_API, {
            method: 'POST',
            body: form,
        })
        if (!(res && res.data && typeof res.data.text === 'string')) {
            throw new Error('asr-subtitle 无有效字幕')
        }
        return res.data
    }

    function srtTimeToSec(t) {
        const m = String(t || '').trim().match(/^(\d+):(\d+):(\d+)[,.](\d+)$/)
        if (!m) return 0
        return (+m[1]) * 3600 + (+m[2]) * 60 + (+m[3]) + (+m[4]) / 1000
    }

    function srtToSubtitleData(srt) {
        const text = String(srt || '').replace(/^\uFEFF/, '').trim()
        if (!text) return { body: [] }
        const blocks = text.split(/\n\s*\n/)
        const body = []
        for (const block of blocks) {
            const lines = block.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
            if (lines.length < 2) continue
            let idx = 0
            if (/^\d+$/.test(lines[0])) idx = 1
            const tm = lines[idx] && lines[idx].match(/^(.+?)\s*-->\s*(.+)$/)
            if (!tm) continue
            const content = lines.slice(idx + 1).join('\n').trim()
            if (!content) continue
            body.push({
                from: srtTimeToSec(tm[1]),
                to: srtTimeToSec(tm[2]),
                content,
            })
        }
        return { body }
    }

    async function ensurePlaySiteLogin() {
        if (playSiteHandle.loggedIn) return true
        const me = await playSiteHandle.tryLogin()
        return !!me
    }

    /**
     * 抓取音频并取字幕：先 result-cache，未命中再 asr-subtitle
     * @returns {{ title: string, data: object, from: 'cache'|'asr' }}
     */
    async function fetchSubtitleByAsr() {
        if (!isBiliLoggedIn()) {
            throw new Error('请先登录 B 站后再使用语音字幕')
        }
        if (!(await ensurePlaySiteLogin())) {
            throw new Error('请先登录 play-site')
        }

        onProgress('获取音频地址...')
        const audio = pickAudioFromPlayinfo()
        if (!audio || !audio.url) {
            throw new Error('未找到可拉取的音频流')
        }

        let dig = loadLocalDigest(audio.id)
        if (dig) {
            onProgress('查询字幕缓存...')
            const cachedText = await readResultCache(dig.hash, dig.size)
            if (cachedText) {
                return {
                    title: getVideoTitle(),
                    data: srtToSubtitleData(cachedText),
                    from: 'cache',
                }
            }
        }

        // 缓存未命中：下载音频，先算指纹再查一次，仍无则 multipart 上传 audio
        const fresh = pickAudioFromPlayinfo() || audio
        const downloaded = await downloadAudioWithFallback(fresh)
        dig = { hash: downloaded.hash, size: downloaded.size }
        saveLocalDigest(fresh.id || audio.id, dig.hash, dig.size)

        onProgress('查询字幕缓存...')
        const cachedAfterDownload = await readResultCache(dig.hash, dig.size)
        if (cachedAfterDownload) {
            return {
                title: getVideoTitle(),
                data: srtToSubtitleData(cachedAfterDownload),
                from: 'cache',
            }
        }

        const asr = await requestAsrSubtitle(
            downloaded.buf,
            filenameFromUrl(downloaded.url, fresh.id || audio.id)
        )
        if (asr.hash && asr.size != null) {
            saveLocalDigest(fresh.id || audio.id, asr.hash, asr.size)
        }
        return {
            title: getVideoTitle(),
            data: srtToSubtitleData(asr.text),
            from: 'asr',
        }
    }

    function getVideoTitle() {
        try {
            const titleEl = document.querySelector('.video-title')
            if (titleEl) {
                return (titleEl.textContent || titleEl.innerText || '').trim() || 'unknown'
            }
        } catch (e) {}
        return 'unknown'
    }

    return {
        isBiliLoggedIn,
        pickAudioFromPlayinfo,
        srtToSubtitleData,
        fetchSubtitleByAsr,
    }
}
