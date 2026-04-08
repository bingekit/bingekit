(function () {
    console.log("Global Script Loaded", location.href);
    window.BingeKit = window.BingeKit || {};
    window.BingeKit.localPlayerState = { isPlaying: false, currentTime: 0, duration: 0, src: "" };
    window.BingeKit.globalPlayerState = { isPlaying: false, currentTime: 0, duration: 0, src: "" };

    let runSync = true;
    window.throwNavigationError = (codeStr, msgStr) => {
        if (window.__svErrorFired && window.__svErrorCode) return; // Only lock if we have a real error code
        window.__svErrorFired = true;
        if (codeStr) window.__svErrorCode = codeStr;
        let codeLabel = codeStr ? "err://" + codeStr : "err://";
        window.chrome?.webview?.hostObjects.sync.ahk.UpdateURL(codeLabel);

        let displayMsg = msgStr || "Request failed.<br><br>Either the site is: down, blocked, fails to load, or fails smartscreen checks.";

        window.addEventListener("DOMContentLoaded", () => {
            var style = document.createElement('style');
            style.textContent = `body{background:var(--theme-main);color:var(--theme-textMain);font-family:sans-serif}::selection{        background-color: color-mix(in srgb, var(--theme-accent) 20%, transparent) !important;        color: var(--theme-accent) !important;}`;
            document.head.appendChild(style);
            document.body.innerHTML =
                `<div style='display:flex;text-align:center;flex-direction:column;color:var(--theme-accent);justify-content:center;align-items:center;height:100%;font-size:2rem;'>
                    Navigation Failed
                    <div style='font-size:1rem;margin-top:1rem;color:var(--theme-textSec);'>${displayMsg}</div>
                </div>`;
        });

        // If already loaded, apply now
        if (document.readyState === "interactive" || document.readyState === "complete") {
            var style = document.createElement('style');
            style.textContent = `body{background:var(--theme-main);color:var(--theme-textMain);font-family:sans-serif}::selection{        background-color: color-mix(in srgb, var(--theme-accent) 20%, transparent) !important;        color: var(--theme-accent) !important;}`;
            try { document.head.appendChild(style); } catch (e) { }
            try {
                document.body.innerHTML =
                    `<div style='display:flex;text-align:center;flex-direction:column;color:var(--theme-accent);justify-content:center;align-items:center;height:100%;font-size:2rem;'>
                        Navigation Failed
                        <div style='font-size:1rem;margin-top:1rem;color:var(--theme-textSec);'>${displayMsg}</div>
                    </div>`;
            } catch (e) { }
        }
    };
    if (location.href === "chrome-error://chromewebdata/") {
        window.throwNavigationError();
        return;
    } else if ((location.href.startsWith("about:blank#") || location.href.startsWith("http://blank.localhost/#") || location.href.startsWith("data:text/html")) && location.href.includes("#custom:")) {
        const url = location.href.substring(location.href.indexOf("#custom:") + 8);
        runSync = false;

        if (url.startsWith("view-source#")) {
            const tgtUrl = url.substring(12);
            window.addEventListener("DOMContentLoaded", async () => {
                window.chrome?.webview?.hostObjects.sync.ahk.UpdateURL("view-source:" + tgtUrl);
                document.body.innerHTML = "<div style='color:#d4d4d4;padding:20px;font-family:Consolas,monospace;'>Loading source...</div>";
                document.body.style.background = "#09090b";
                document.body.style.margin = "0";
                try {
                    let txt = await window.chrome?.webview?.hostObjects.ahk.RawFetchHTML(tgtUrl);
                    if (!txt) throw new Error("Empty response or failed request.");
                    let code = document.createElement("code");
                    code.textContent = txt;
                    let pre = document.createElement("pre");
                    pre.style.color = "#d4d4d4";
                    pre.style.margin = "0";
                    pre.style.padding = "20px";
                    pre.style.whiteSpace = "pre-wrap";
                    pre.style.wordWrap = "break-word";
                    pre.appendChild(code);
                    document.body.innerHTML = "";
                    document.body.appendChild(pre);
                } catch (err) {
                    document.body.innerHTML = "<div style='color:red;padding:20px;font-family:Consolas,monospace;'>Failed to fetch source: " + (err.message || "Unknown error") + "</div>";
                }
            });
        } else {
            window.addEventListener("DOMContentLoaded", () => {
                window.chrome?.webview?.hostObjects.sync.ahk.UpdateURL("custom:" + url);
            });
        }
    }
    window.ahk = {
        CacheSet: function (k, v) { return window.chrome?.webview?.hostObjects.sync.ahk.CacheSet(k, v); },
        CacheGet: function (k) { return window.chrome?.webview?.hostObjects.sync.ahk.CacheGet(k); },
        CacheClear: function () { return window.chrome?.webview?.hostObjects.sync.ahk.CacheClear(); },
        AddNetworkFilter: function (t) { return window.chrome?.webview?.hostObjects.sync.ahk.AddNetworkFilter(t); }
    };

    window.showToast = function (msg, type = "info") {
        try { window.chrome?.webview?.hostObjects.sync.ahk.ShowToast(msg, type); } catch (e) { }
    };

    window.toggleBookmark = function () { if (window.chrome?.webview?.hostObjects?.sync?.ahk?.ToggleBookmark) { window.chrome.webview.hostObjects.sync.ahk.ToggleBookmark(); } else { document.title = "bk-evt:toggle-bookmark"; } };

    window.gotoHistory = function () { if (window.chrome?.webview?.hostObjects?.sync?.ahk?.GotoHistory) { window.chrome.webview.hostObjects.sync.ahk.GotoHistory(); } else { document.title = "bk-evt:goto-history"; } };

    window.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 't') {
            e.preventDefault();
            if (window.chrome?.webview?.hostObjects?.sync?.ahk?.RestoreTab) { window.chrome.webview.hostObjects.sync.ahk.RestoreTab(); } else { document.title = "bk-evt:restore-tab"; }
        }
        if (e.ctrlKey && e.key.toLowerCase() === 'd') {
            e.preventDefault();
            window.toggleBookmark();
        }
        if (e.ctrlKey && e.key.toLowerCase() === 'h') {
            e.preventDefault();
            window.gotoHistory();
        }
    });

    function syncUrlToAhk() {
        if (!runSync || window !== window.top) return;
        try { window.chrome?.webview?.hostObjects.ahk.UpdateURL(location.href.replace(/\/index\.html?$/i, "/")); } catch (e) { }
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

        try {
            // Only perform IPC queries strictly on the top window to prevent Iframe COM DDoS storms
            const isSafeContext = window === window.top;
            
            if (isSafeContext) {
                const listRaw = await window.chrome?.webview?.hostObjects.ahk.CacheList("bkLiveLogin_");
                if (listRaw && listRaw !== "[]" && listRaw !== "") {
                const keys = JSON.parse(listRaw);
                for (const k of keys) {
                    const payload = await window.chrome?.webview?.hostObjects.ahk.CacheGet(k);
                    if (payload && payload !== "") {
                        console.log(`[BingeKit] Resuming persistent Live Setup task block for ${k}...`);
                        try { eval(`(async function() { ${payload} })()`); } catch (e) { console.error(`[BingeKit] Live Setup expr error for ${k}:`, e); }
                    }
                }
                }
            }
        } catch (e) { 
            if (!String(e).includes("0x80070490")) {
                console.error("[BingeKit] Failed to fetch Live Setup cache keys:", e); 
            }
        }
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
            window.BingeKit.localPlayerState = { isPlaying: true, currentTime: pTime, duration: pDur, src: pSrc };
            if (window.top !== window) {
                window.top.postMessage({ type: 'bk-play-state', playing: true, currentTime: pTime, duration: pDur, activeSrc: pSrc }, '*');
            } else {
                window.updateGlobalPlayState && window.updateGlobalPlayState();
            }
        } else {
            window.BingeKit.localPlayerState.isPlaying = false;
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
            window._svElementBlockers = e.data.elements;

            if (window._svElementBlockers) {
                if (!window._svElBlocker) {
                    window._svElBlocker = new MutationObserver((mutations) => {
                        if (!window._svElementBlockers) return;
                        for (let i = 0; i < mutations.length; i++) {
                            const nodes = mutations[i].addedNodes;
                            for (let j = 0; j < nodes.length; j++) {
                                const n = nodes[j];
                                if (n.nodeType === 1) {
                                    if (n.matches && n.matches(window._svElementBlockers)) {
                                        n.remove();
                                    } else if (n.querySelectorAll) {
                                        const bad = n.querySelectorAll(window._svElementBlockers);
                                        for (let k = 0; k < bad.length; k++) bad[k].remove();
                                    }
                                }
                            }
                        }
                    });
                    if (document.documentElement) {
                        window._svElBlocker.observe(document.documentElement, { childList: true, subtree: true });
                    } else {
                        document.addEventListener('DOMContentLoaded', () => {
                            if (window._svElBlocker) window._svElBlocker.observe(document.documentElement, { childList: true, subtree: true });
                        });
                    }
                }
                // Initial scan
                if (document.body) {
                    try { document.querySelectorAll(window._svElementBlockers).forEach(el => el.remove()); } catch (err) { }
                }
            } else if (!window._svElementBlockers && window._svElBlocker) {
                window._svElBlocker.disconnect();
                window._svElBlocker = null;
            }

            Array.from(document.querySelectorAll('iframe')).forEach(f => {
                try { f.contentWindow?.postMessage(e.data, '*'); } catch (err) { }
            });
        } else if (e.data && e.data.type === 'bk-sync-global-state') {
            window.BingeKit = window.BingeKit || {};
            window.BingeKit.globalPlayerState = e.data.state;
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

            window.BingeKit.globalPlayerState = { isPlaying, currentTime: cTime, duration: cDur, src: aSrc };
            Array.from(document.querySelectorAll('iframe')).forEach(f => {
                try { f.contentWindow?.postMessage({ type: 'bk-sync-global-state', state: window.BingeKit.globalPlayerState }, '*'); } catch (err) { }
            });

            if (window._svIsGloballyPlaying !== isPlaying || (isPlaying && timeDiff >= 10) || window._svLastReportedSrc !== aSrc) {
                window._svIsGloballyPlaying = isPlaying;
                window._svLastReportedTime = cTime;
                window._svLastReportedSrc = aSrc;
                try { window.chrome?.webview?.hostObjects.ahk.ReportPlayState(isPlaying, cTime, cDur, aSrc); } catch (err) { }
            }
        };

        window.addEventListener('message', (e) => {
            if (e.data && e.data.type === 'bk-play-state') {
                if (e.data.playing) window._svPlayingTimers.set(e.source, { time: Date.now(), currentTime: e.data.currentTime, duration: e.data.duration, activeSrc: e.data.activeSrc });
                else window._svPlayingTimers.delete(e.source);
                window.updateGlobalPlayState();
            } else if (e.data && e.data.type === 'bk-media-sniffed' && e.data.url) {
                try { window.chrome?.webview?.hostObjects.ahk.SetMediaStream(e.data.url, e.data.qualities ? JSON.stringify(e.data.qualities) : "", e.data.auth ? JSON.stringify(e.data.auth) : ""); } catch (err) { }
            } else if (e.data && e.data.type === 'bk-sub-sniffed' && e.data.url) {
                try { window.chrome?.webview?.hostObjects.ahk.SetSubtitleStream(e.data.url, e.data.auth ? JSON.stringify(e.data.auth) : ""); } catch (err) { }
            }
        });

        setInterval(() => {
            window.updateGlobalPlayState();
        }, 1500);
    }
})();
