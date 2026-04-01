(function () {
    console.log("Global Script Loaded", location.href);
    let runSync = true;
    if (location.href === "chrome-error://chromewebdata/") {
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
        return;
    } else if ((location.href.startsWith("about:blank#") || location.href.startsWith("data:text/html")) && location.href.includes("#custom:")) {
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

    setInterval(() => {
        let playing = false;
        let pTime = 0;
        let pDur = 0;
        document.querySelectorAll('video').forEach(v => {
            if (v.readyState !== 0 && !v.paused) {
                playing = true;
                pTime = v.currentTime;
                pDur = v.duration;
            }
        });
        if (playing) {
            window._svLastPlayingLocal = true;
            window._svLastTimeLocal = pTime;
            window._svLastDurLocal = pDur;
            if (window.top !== window) {
                window.top.postMessage({ type: 'sv-play-state', playing: true, currentTime: pTime, duration: pDur }, '*');
            } else {
                window.updateGlobalPlayState && window.updateGlobalPlayState();
            }
        } else {
            if (window._svLastPlayingLocal) {
                window._svLastPlayingLocal = false;
                if (window.top !== window) {
                    window.top.postMessage({ type: 'sv-play-state', playing: false, currentTime: window._svLastTimeLocal, duration: window._svLastDurLocal }, '*');
                } else {
                    window.updateGlobalPlayState && window.updateGlobalPlayState();
                }
            }
        }
    }, 1000);

    let lastPausedVideo = null;
    window.addEventListener('message', (e) => {
        if (e.data === 'sv-toggle-play') {
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
                try { f.contentWindow?.postMessage('sv-toggle-play', '*'); } catch (err) { }
            });
        } else if (e.data && e.data.type === 'sv-seek-cmd') {
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
        }
    });

    if (window.top === window) {
        window._svPlayingTimers = new Map();
        window._svIsGloballyPlaying = false;

        window.updateGlobalPlayState = function () {
            const now = Date.now();
            let cTime = window._svLastTimeLocal || 0;
            let cDur = window._svLastDurLocal || 0;

            for (let [win, data] of window._svPlayingTimers.entries()) {
                if (now - data.time > 3000) {
                    window._svPlayingTimers.delete(win);
                } else {
                    cTime = data.currentTime || cTime;
                    cDur = data.duration || cDur;
                }
            }
            let isPlaying = window._svLastPlayingLocal || window._svPlayingTimers.size > 0;
            let timeDiff = Math.abs(cTime - (window._svLastReportedTime || 0));
            if (window._svIsGloballyPlaying !== isPlaying || (isPlaying && timeDiff >= 10)) {
                window._svIsGloballyPlaying = isPlaying;
                window._svLastReportedTime = cTime;
                try { window.chrome.webview.hostObjects.ahk.ReportPlayState(isPlaying, cTime, cDur); } catch (err) { }
            }
        };

        window.addEventListener('message', (e) => {
            if (e.data && e.data.type === 'sv-play-state') {
                if (e.data.playing) window._svPlayingTimers.set(e.source, { time: Date.now(), currentTime: e.data.currentTime, duration: e.data.duration });
                else window._svPlayingTimers.delete(e.source);
                window.updateGlobalPlayState();
            }
        });

        setInterval(() => {
            window.updateGlobalPlayState();
        }, 1500);
    }
})();
