// -----------------------------------------------------------------------------
// StreamView Minimal - Adblock & Preload Script
// -----------------------------------------------------------------------------
// This script is injected via AHK2 WebViewToo AddScriptToExecuteOnDocumentCreated
// It runs before the page loads to block ads and inject custom behaviors.

(function () {
    window.addEventListener("DOMContentLoaded", () => {
        // 1. Basic CSS Adblocking (Hiding known ad containers)
        const style = document.createElement('style');
        style.innerHTML =
            `iframe[src*="ads"],
iframe[id*="ads"],
.ad-container,
.sponsored,
[id*="google_ads"],
[data-testid="consent-banner"],
[aria-label="Sponsored Content"],
.video-ads {
    display: none!important;
    width: 0!important;
    height: 0!important;
    pointer-events: none!important;
}`;
        document.documentElement.appendChild(style);
        // 2. Network Request Interception (Mocking / Blocking)
        // In a real WebView2 environment, you 'd use CoreWebView2.AddWebResourceRequestedFilter
        // from the AHK side for true network blocking.This is a client - side fallback.
        const originalFetch = window.fetch;
        window.fetch = async function (...args) {
            const url = typeof args[0] === 'string' ? args[0] : args[0]?.url;
            if (url && (url.includes('/ads/') || url.includes('tracker') || url.includes('analytics'))) {
                return new Response('Blocked by StreamView', { status: 200 });
            }
            return originalFetch.apply(this, args);
        };
    });
})();
