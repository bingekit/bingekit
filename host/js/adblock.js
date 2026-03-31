// -----------------------------------------------------------------------------
// StreamView Minimal - Adblock & Preload Script
// -----------------------------------------------------------------------------
// This script is injected via AHK2 WebViewToo AddScriptToExecuteOnDocumentCreated
// It runs before the page loads to block ads and inject custom behaviors.

(function () {
    // 1. Block Popups immediately
    window.open = function () {
        console.log("StreamView AdBlock: Prevented window.open popup.");
        return null;
    };

    // 2. Prevent common anti-adblock detection scripts
    const originalCreateElement = document.createElement;
    document.createElement = function (tagName) {
        if (tagName.toLowerCase() === 'script') {
            const script = originalCreateElement.call(document, tagName);
            const originalSetAttribute = script.setAttribute;
            script.setAttribute = function (name, value) {
                if (name === 'src' && (value.includes('antiad') || value.includes('adblock') || value.includes('detect'))) {
                    console.log("StreamView AdBlock: Blocked anti-adblock script injection.");
                    return;
                }
                originalSetAttribute.call(script, name, value);
            };
            return script;
        }
        return originalCreateElement.call(document, tagName);
    };
    //alert(location.href);
    window.addEventListener("DOMContentLoaded", () => {
        // 3. Basic CSS Adblocking (Hiding known ad containers and overlays)
        const style = document.createElement('style');
        style.innerHTML =
            `iframe[src*="ads"],
            iframe[id*="ads"],
            .ad-container,
            .sponsored,
            [id*="google_ads"],
            [data-testid="consent-banner"],
            [aria-label="Sponsored Content"],
            .video-ads,
            .pop-under,
            #popad,
            body~*,
            .overlay-ad {
                display: none!important;
                width: 0!important;
                height: 0!important;
                pointer-events: none!important;
                opacity: 0!important;
                visibility: hidden!important;
            }`;
        document.documentElement.appendChild(style);

        // 4. Network Request Interception (Mocking / Blocking)
        // In a real WebView2 environment, you'd use CoreWebView2.AddWebResourceRequestedFilter
        // from the AHK side for true network blocking. This is a client-side fallback.
        const originalFetch = window.fetch;
        window.fetch = async function (...args) {
            const url = typeof args[0] === 'string' ? args[0] : args[0]?.url;
            if (url && (url.includes('/ads/') || url.includes('tracker') || url.includes('analytics') || url.includes('popunder') || url.includes('adsystem'))) {
                console.log("StreamView AdBlock: Blocked fetch request to", url);
                return new Response('Blocked by StreamView', { status: 200, statusText: 'Blocked' });
            }
            return originalFetch.apply(this, args);
        };
    });
})();
