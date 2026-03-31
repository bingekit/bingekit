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
})();
