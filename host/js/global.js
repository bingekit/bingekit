(function () {
    window.ahk = {
        CacheSet: function (k, v) { return window.chrome.webview.hostObjects.sync.ahk.CacheSet(k, v); },
        CacheGet: function (k) { return window.chrome.webview.hostObjects.sync.ahk.CacheGet(k); },
        CacheClear: function () { return window.chrome.webview.hostObjects.sync.ahk.CacheClear(); },
        AddNetworkFilter: function (t) { return window.chrome.webview.hostObjects.sync.ahk.AddNetworkFilter(t); }
    };

    function syncUrlToAhk() {
        try { window.chrome.webview.hostObjects.ahk.UpdateURL(location.href.replace("/index.htm", "/")); } catch(e) {}
    }

    if (!window._svGlobalAjaxHooked) {
        window._svGlobalAjaxHooked = true;
        const origPush = window.history.pushState;
        window.history.pushState = function() {
            var res = origPush.apply(this, arguments);
            setTimeout(syncUrlToAhk, 50);
            return res;
        };
        const origReplace = window.history.replaceState;
        window.history.replaceState = function() {
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
        document.querySelectorAll('video').forEach(v => {
            if (v.readyState !== 0 && !v.paused) playing = true;
        });
        if (window._svLastPlaying !== playing) {
            window._svLastPlaying = playing;
            if (window.top !== window) {
                window.top.postMessage({ type: 'sv-play-state', playing }, '*');
            } else {
                window.updateGlobalPlayState && window.updateGlobalPlayState();
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
                if (window.top === window) { window._svIsGloballyPlaying = false; }
            } else {
                if (lastPausedVideo) {
                    lastPausedVideo.play();
                    if (window.top === window) { window._svIsGloballyPlaying = true; }
                } else if (window.top === window && videos.length > 0) {
                    // Fallback: only try playing the biggest video in the top frame if we never paused anything
                    const largest = videos.sort((a,b) => (b.videoWidth*b.videoHeight) - (a.videoWidth*a.videoHeight))[0];
                    if (largest) largest.play();
                    window._svIsGloballyPlaying = true;
                }
            }
            Array.from(document.querySelectorAll('iframe')).forEach(f => {
                try { f.contentWindow?.postMessage('sv-toggle-play', '*'); } catch(err){}
            });
        }
    });

    if (window.top === window) {
        window._svPlayingFrames = new Set();
        window._svIsGloballyPlaying = false;
        window.addEventListener('message', (e) => {
            if (e.data && e.data.type === 'sv-play-state') {
                if (e.data.playing) window._svPlayingFrames.add(e.source);
                else window._svPlayingFrames.delete(e.source);
                window.updateGlobalPlayState && window.updateGlobalPlayState();
            }
        });
        window.updateGlobalPlayState = function() {
            let isPlaying = window._svLastPlaying || window._svPlayingFrames.size > 0;
            window._svIsGloballyPlaying = isPlaying;
            try { window.chrome.webview.hostObjects.ahk.ReportPlayState(isPlaying); } catch(err){}
        };
    }
})();
