(function () {
    window.ahk = {
        CacheSet: function (k, v) { return window.chrome.webview.hostObjects.sync.ahk.CacheSet(k, v); },
        CacheGet: function (k) { return window.chrome.webview.hostObjects.sync.ahk.CacheGet(k); },
        CacheClear: function () { return window.chrome.webview.hostObjects.sync.ahk.CacheClear(); }
    };

    window.addEventListener("DOMContentLoaded", async () => {
        window.chrome.webview.hostObjects.ahk.UpdateURL(location.href.replace("/index.htm", "/"));
        console.log({
            "URL": location.href,
            "Title": document.title,
            "Referrer": document.referrer
        });
    });
})();
