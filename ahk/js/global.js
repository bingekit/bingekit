(function () {
    window.addEventListener("DOMContentLoaded", async () => {
        window.chrome.webview.hostObjects.ahk.UpdateURL(location.href.replace("/index.htm", "/"));
    });
})();
