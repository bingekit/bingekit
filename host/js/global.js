(function () {
    console.log("Global Script Loaded", location.href);
    let runSync = true;
    window.throwNavigationError = () => {
        window.chrome.webview.hostObjects.sync.ahk.UpdateURL("err://");
        window.addEventListener("DOMContentLoaded", () => {
            var style = document.createElement('style');
            style.textContent = `body{background:var(--theme-mainBg);color:var(--theme-textMain);font-family:sans-serif}::selection{background:var(--theme-accent)}`;
            document.head.appendChild(style);
            document.body.innerHTML =
                `<div style='display:flex;text-align:center;flex-direction:column;color:var(--theme-accent);justify-content:center;align-items:center;height:100%;font-size:2rem;'>
                    Navigation Failed
                    <div style='font-size:1rem;margin-top:1rem;color:var(--theme-textSec);'>Request failed.<br><br>Either the site is: down, blocked, fails to load, or fails smartscreen checks.</div>
                </div>`;
        });
    };
    if (location.href === "chrome-error://chromewebdata/") {
        window.throwNavigationError();
        return;
    } else if ((location.href.startsWith("about:blank#") || location.href.startsWith("http://blank.localhost/#") || location.href.startsWith("data:text/html")) && location.href.includes("#custom:")) {
        const url = location.href.substring(location.href.indexOf("#custom:") + 1);
        runSync = false;
        window.addEventListener("DOMContentLoaded", () => {
            window.chrome.webview.hostObjects.sync.ahk.UpdateURL(url);
        });
    }
    window.ahk = {
        CacheSet: function (k, v) { return window.chrome.webview.hostObjects.sync.ahk.CacheSet(k, v); },
        CacheGet: function (k) { return window.chrome.webview.hostObjects.sync.ahk.CacheGet(k); },
        CacheClear: function () { return window.chrome.webview.hostObjects.sync.ahk.CacheClear(); },
        AddNetworkFilter: function (t) { return window.chrome.webview.hostObjects.sync.ahk.AddNetworkFilter(t); }
    };

    window.showToast = function(msg, type = "info") {
        try { window.chrome.webview.hostObjects.sync.ahk.ShowToast(msg, type); } catch(e) {}
    };

    function syncUrlToAhk() {
        if (!runSync) return;
        try { window.chrome.webview.hostObjects.ahk.UpdateURL(location.href.replace(/\/index\.html?$/i, "/")); } catch (e) { }
    }

    if (!window._svGlobalAjaxHooked) {
        window._svGlobalAjaxHooked = true;
        const origPush = window.history.pushState;
        window.history.pushState = function () {
            var res = origPush.apply(this, arguments);
            setTimeout(syncUrlToAhk, 50);
            return res;
        };
        const origReplace = window.history.replaceState;
        window.history.replaceState = function () {
            var res = origReplace.apply(this, arguments);
            setTimeout(syncUrlToAhk, 50);
            return res;
        };
        window.addEventListener('popstate', () => setTimeout(syncUrlToAhk, 50));
    }
    window.addEventListener("DOMContentLoaded", async () => {
        syncUrlToAhk();
        console.log({
            "URL": location.href,
            "Title": document.title,
            "Referrer": document.referrer
        });
    });

    const bkParseM3U8Qualities = (txt, baseUrl) => {
        try {
            if (!txt.includes('#EXT-X-STREAM-INF')) return null;
            let lines = txt.split(/\r?\n/);
            let qualities = [];
            for (let i = 0; i < lines.length; i++) {
                if (lines[i].startsWith('#EXT-X-STREAM-INF')) {
                    let resMatch = lines[i].match(/RESOLUTION=\d+x(\d+)/);
                    let bwMatch = lines[i].match(/BANDWIDTH=(\d+)/);
                    let label = "Stream";
                    if (resMatch) label = resMatch[1] + "p";
                    else if (bwMatch) label = Math.round(bwMatch[1] / 1024) + "kbps";

                    let nextLine = lines[i + 1];
                    if (nextLine && !nextLine.startsWith('#')) {
                        qualities.push({ label, url: new URL(nextLine, baseUrl).href });
                    }
                }
            }
            return qualities.length > 0 ? qualities : null;
        } catch (e) { return null; }
    };

    const postSniffed = (type, url, extra = {}) => {
        try {
            window.top.postMessage({
                type,
                url,
                ...extra,
                auth: { referer: location.href, userAgent: navigator.userAgent, cookie: document.cookie }
            }, '*');
        } catch (e) { }
    };

    const bkCheckStreamUrl = (u) => {
        if (!u || typeof u !== 'string') return;
        if (u.match(/\.(m3u8?|mp4|flv|webm|mkv)/i) || u.includes('/playlist') || u.includes('/manifest') || u.includes('/master') || u.includes('/hls/index') || u.includes('/hls/master')) {
            postSniffed('bk-media-sniffed', new URL(u, location.href).href);
        } else if (u.match(/\.(vtt|srt)/i)) {
            postSniffed('bk-sub-sniffed', new URL(u, location.href).href);
        }
    };

    const origFetch = window.fetch;
    window.fetch = async function () {
        let u = typeof arguments[0] === 'string' ? arguments[0] : (arguments[0]?.url || "");
        bkCheckStreamUrl(u);
        let res = await origFetch.apply(this, arguments);
        try {
            let ct = res.headers.get('content-type') || '';
            if (ct.includes('mpegurl') || ct.includes('x-mpegURL') || ct.includes('vnd.apple.mpegurl')) {
                let clone = res.clone();
                clone.text().then(txt => {
                    let qualities = bkParseM3U8Qualities(txt, u);
                    postSniffed('bk-media-sniffed', new URL(u, location.href).href, { qualities });
                }).catch(() => { });
            } else if (u && res.ok && (ct.includes('text') || ct === '')) {
                let clone = res.clone();
                clone.text().then(txt => {
                    if (txt && typeof txt === 'string' && txt.trim().startsWith('#EXTM3U')) {
                        let qualities = bkParseM3U8Qualities(txt, u);
                        postSniffed('bk-media-sniffed', new URL(u, location.href).href, { qualities });
                    } else if (u.match(/\.(vtt|srt)/i) || (typeof txt === 'string' && txt.trim().startsWith('WEBVTT'))) {
                        postSniffed('bk-sub-sniffed', new URL(u, location.href).href);
                    }
                }).catch(() => { });
            }
        } catch (e) { }
        return res;
    };

    const origOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function () {
        let u = arguments[1] || "";
        bkCheckStreamUrl(u);
        this.addEventListener('load', function () {
            try {
                const ct = this.getResponseHeader('Content-Type') || '';
                let txt = '';
                if (this.responseType === 'text' || this.responseType === '') txt = this.responseText || '';

                if (ct.includes('mpegurl') || ct.includes('x-mpegURL') || ct.includes('vnd.apple.mpegurl')) {
                    let qualities = bkParseM3U8Qualities(txt, u);
                    postSniffed('bk-media-sniffed', new URL(u, location.href).href, { qualities });
                } else if (txt) {
                    if (typeof txt === 'string' && txt.trim().startsWith('#EXTM3U')) {
                        let qualities = bkParseM3U8Qualities(txt, u);
                        postSniffed('bk-media-sniffed', new URL(u, location.href).href, { qualities });
                    } else if (u.match(/\.(vtt|srt)/i) || (typeof txt === 'string' && txt.trim().startsWith('WEBVTT'))) {
                        postSniffed('bk-sub-sniffed', new URL(u, location.href).href);
                    }
                }
            } catch (e) { }
        });
        return origOpen.apply(this, arguments);
    };

    setInterval(() => {
        let playing = false;
        let pTime = 0;
        let pDur = 0;
        let pSrc = "";

        if (window._svIgnoreVideoUrls && window._svIgnoreVideoUrls.split(',').some(u => u.trim() && location.href.includes(u.trim()))) {
            return; // Ignore this entire frame
        }

        document.querySelectorAll('video').forEach(v => {
            if (window._svIgnoreVideoCSS && v.matches(window._svIgnoreVideoCSS)) return;
            if (v.readyState !== 0 && !v.paused) {
                playing = true;
                pTime = v.currentTime;
                pDur = v.duration;
                pSrc = v.src || v.querySelector('source')?.src || "";
                if (pSrc.startsWith('blob:')) pSrc = ""; // blob URLs cannot be natively passed/downloaded

                let activeTrack = Array.from(v.querySelectorAll('track')).find(t => t.mode === 'showing' || t.mode === 'hidden' || t.getAttribute('default') !== null) || v.querySelector('track');
                if (activeTrack && activeTrack.src) {
                    postSniffed('bk-sub-sniffed', new URL(activeTrack.src, location.href).href);
                }
            }
        });
        if (playing) {
            window._svLastPlayingLocal = true;
            window._svLastTimeLocal = pTime;
            window._svLastDurLocal = pDur;
            window._svLastSrcLocal = pSrc;
            if (window.top !== window) {
                window.top.postMessage({ type: 'bk-play-state', playing: true, currentTime: pTime, duration: pDur, activeSrc: pSrc }, '*');
            } else {
                window.updateGlobalPlayState && window.updateGlobalPlayState();
            }
        } else {
            if (window._svLastPlayingLocal) {
                window._svLastPlayingLocal = false;
                if (window.top !== window) {
                    window.top.postMessage({ type: 'bk-play-state', playing: false, currentTime: window._svLastTimeLocal, duration: window._svLastDurLocal, activeSrc: "" }, '*');
                } else {
                    window.updateGlobalPlayState && window.updateGlobalPlayState();
                }
            }
        }
    }, 1000);

    let lastPausedVideo = null;
    window.addEventListener('message', (e) => {
        if (e.data === 'bk-toggle-play') {
            const videos = Array.from(document.querySelectorAll('video'));
            let active = videos.find(v => !v.paused && v.readyState !== 0);
            if (active) {
                lastPausedVideo = active;
                active.pause();
            } else {
                if (lastPausedVideo) {
                    lastPausedVideo.play();
                } else if (window.top === window && videos.length > 0) {
                    const largest = videos.sort((a, b) => (b.videoWidth * b.videoHeight) - (a.videoWidth * a.videoHeight))[0];
                    if (largest) largest.play();
                }
            }
            Array.from(document.querySelectorAll('iframe')).forEach(f => {
                try { f.contentWindow?.postMessage('bk-toggle-play', '*'); } catch (err) { }
            });
        } else if (e.data && e.data.type === 'bk-seek-cmd') {
            if (window.top === window && e.data.mainUrl) {
                const currentMain = location.href.replace(/\/index\.html?$/i, "/").replace(/\/$/, "");
                const targetMain = e.data.mainUrl.replace(/\/index\.html?$/i, "/").replace(/\/$/, "");
                if (currentMain !== targetMain) return;
            }

            if (window._svSeekObserver) {
                window._svSeekObserver.disconnect();
            }

            const attemptSeek = () => {
                document.querySelectorAll('video').forEach(v => {
                    if (v.dataset.svAutoSeeked === e.data.mainUrl) return;
                    v.dataset.svAutoSeeked = e.data.mainUrl;

                    if (v.readyState >= 1) { v.currentTime = e.data.time; }
                    else {
                        v.addEventListener('loadedmetadata', function onLoaded() {
                            v.currentTime = e.data.time;
                            v.removeEventListener('loadedmetadata', onLoaded);
                        });
                    }
                });
            };

            attemptSeek();
            window._svSeekObserver = new MutationObserver(() => attemptSeek());
            window._svSeekObserver.observe(document.body, { childList: true, subtree: true });
            setTimeout(() => { if (window._svSeekObserver) window._svSeekObserver.disconnect(); }, 15000);

            Array.from(document.querySelectorAll('iframe')).forEach(f => {
                try { f.contentWindow?.postMessage(e.data, '*'); } catch (err) { }
            });
        } else if (e.data && e.data.type === 'bk-ignore-cfg') {
            window._svIgnoreVideoUrls = e.data.urls;
            window._svIgnoreVideoCSS = e.data.css;
            Array.from(document.querySelectorAll('iframe')).forEach(f => {
                try { f.contentWindow?.postMessage(e.data, '*'); } catch (err) { }
            });
        }
    });

    if (window.top === window) {
        window._svPlayingTimers = new Map();
        window._svIsGloballyPlaying = false;

        window.updateGlobalPlayState = function () {
            const now = Date.now();
            let cTime = window._svLastTimeLocal || 0;
            let cDur = window._svLastDurLocal || 0;
            let aSrc = window._svLastSrcLocal || "";

            for (let [win, data] of window._svPlayingTimers.entries()) {
                if (now - data.time > 3000) {
                    window._svPlayingTimers.delete(win);
                } else {
                    cTime = data.currentTime || cTime;
                    cDur = data.duration || cDur;
                    if (data.activeSrc && !aSrc) aSrc = data.activeSrc;
                }
            }
            let isPlaying = window._svLastPlayingLocal || window._svPlayingTimers.size > 0;
            let timeDiff = Math.abs(cTime - (window._svLastReportedTime || 0));
            if (window._svIsGloballyPlaying !== isPlaying || (isPlaying && timeDiff >= 10) || window._svLastReportedSrc !== aSrc) {
                window._svIsGloballyPlaying = isPlaying;
                window._svLastReportedTime = cTime;
                window._svLastReportedSrc = aSrc;
                try { window.chrome.webview.hostObjects.ahk.ReportPlayState(isPlaying, cTime, cDur, aSrc); } catch (err) { }
            }
        };

        window.addEventListener('message', (e) => {
            if (e.data && e.data.type === 'bk-play-state') {
                if (e.data.playing) window._svPlayingTimers.set(e.source, { time: Date.now(), currentTime: e.data.currentTime, duration: e.data.duration, activeSrc: e.data.activeSrc });
                else window._svPlayingTimers.delete(e.source);
                window.updateGlobalPlayState();
            } else if (e.data && e.data.type === 'bk-media-sniffed' && e.data.url) {
                try { window.chrome.webview.hostObjects.ahk.SetMediaStream(e.data.url, e.data.qualities ? JSON.stringify(e.data.qualities) : "", e.data.auth ? JSON.stringify(e.data.auth) : ""); } catch (err) { }
            } else if (e.data && e.data.type === 'bk-sub-sniffed' && e.data.url) {
                try { window.chrome.webview.hostObjects.ahk.SetSubtitleStream(e.data.url, e.data.auth ? JSON.stringify(e.data.auth) : ""); } catch (err) { }
            }
        });

        setInterval(() => {
            window.updateGlobalPlayState();
        }, 1500);
    }
})();
