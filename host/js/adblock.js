// -----------------------------------------------------------------------------
// StreamView Minimal - Adblock & Preload Script
// -----------------------------------------------------------------------------
// This script is injected via AHK2 WebView2 AddScriptToExecuteOnDocumentCreated
// It runs before the page loads to block ads and inject custom behaviors.

(function () {

    const adKeywords = ['disable', 'devtool', 'antiad', 'adblock', 'detect', '/ads/', 'tracker', 'analytics', 'popunder', 'adsystem', 'evasivelimnite', 'umommy', 'gtag', 'googletag', 'doubleclick'];
    const redirectKeywords = ['casino', 'gamble', 'betting', 'crypto', 'slot', 'poker', 'bitcoin', 'roulette'];
    const inlineKeywords = ['debugger', 'dstate', 'eval'];

    function isAdScript(src) {
        if (!src) return false;
        const lowerSrc = src.toLowerCase();
        return adKeywords.some(keyword => lowerSrc.includes(keyword));
    }

    function isBadRedirect(url) {
        if (!url) return false;
        const lowerUrl = url.toLowerCase();
        return redirectKeywords.some(keyword => lowerUrl.includes(keyword));
    }

    function isBadInlineScript(text) {
        if (!text) return false;
        const lowerText = text.toLowerCase();
        return inlineKeywords.some(keyword => lowerText.includes(keyword));
    }

    // 1. Block Popups immediately
    window.open = function () {
        console.log("StreamView AdBlock: Prevented window.open popup.");
        return null;
    };

    // 2. Prevent common anti-adblock detection scripts via createElement
    const originalCreateElement = document.createElement;
    document.createElement = function (tagName) {
        if (tagName.toLowerCase() === 'script') {
            const script = originalCreateElement.call(document, tagName);
            const originalSetAttribute = script.setAttribute;
            script.setAttribute = function (name, value) {
                if (name === 'src' && isAdScript(value)) {
                    console.log("StreamView AdBlock: Blocked script injection via setAttribute.");
                    return;
                }
                originalSetAttribute.call(script, name, value);
            };
            return script;
        }
        return originalCreateElement.call(document, tagName);
    };

    // 3. Intercept dynamic DOM insertions (Catches inline scripts before execution)
    const originalAppendChild = Node.prototype.appendChild;
    Node.prototype.appendChild = function (node) {
        if (node.nodeName === 'SCRIPT' && (isAdScript(node.src) || (!node.src && isBadInlineScript(node.textContent)))) {
            console.log("StreamView AdBlock: Blocked script via appendChild");
            return node; // Return node to prevent breaking calling scripts
        }
        return originalAppendChild.call(this, node);
    };

    const originalInsertBefore = Node.prototype.insertBefore;
    Node.prototype.insertBefore = function (node, referenceNode) {
        if (node.nodeName === 'SCRIPT' && (isAdScript(node.src) || (!node.src && isBadInlineScript(node.textContent)))) {
            console.log("StreamView AdBlock: Blocked script via insertBefore");
            return node;
        }
        return originalInsertBefore.call(this, node, referenceNode);
    };

    const originalInnerHTML = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
    if (originalInnerHTML) {
        Object.defineProperty(Element.prototype, 'innerHTML', {
            set: function (value) {
                if (typeof value === 'string' && isBadInlineScript(value)) {
                    console.log("StreamView AdBlock: Blocked innerHTML injection");
                    return; // Drop the entire assignment
                }
                originalInnerHTML.set.call(this, value);
            },
            get: originalInnerHTML.get
        });
    }

    const originalWrite = document.write;
    document.write = function (content) {
        if (typeof content === 'string' && isBadInlineScript(content)) {
            console.log("StreamView AdBlock: Blocked document.write injection");
            return;
        }
        originalWrite.call(document, content);
    };

    const originalWriteln = document.writeln;
    document.writeln = function (content) {
        if (typeof content === 'string' && isBadInlineScript(content)) {
            console.log("StreamView AdBlock: Blocked document.writeln injection");
            return;
        }
        originalWriteln.call(document, content);
    };

    // 4. MutationObserver as a fallback for scripts that bypass property overrides
    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                if (node.tagName === 'SCRIPT') {
                    if (isAdScript(node.src) || (!node.src && isBadInlineScript(node.textContent))) {
                        node.type = 'javascript/blocked';
                        node.remove();
                        console.log("StreamView AdBlock: Removed script via MutationObserver:", node.src || "[Inline Script]");
                    }
                }
                else if (node.tagName === 'META' && node.httpEquiv && node.httpEquiv.toLowerCase() === 'refresh') {
                    if (isBadRedirect(node.content)) {
                        node.remove();
                        console.log("StreamView AdBlock: Removed meta refresh redirect:", node.content);
                    }
                }
                else if (node.nodeType === Node.ELEMENT_NODE) {
                    const scripts = node.querySelectorAll('script');
                    for (const script of scripts) {
                        if (isAdScript(script.src) || (!script.src && isBadInlineScript(script.textContent))) {
                            script.type = 'javascript/blocked';
                            script.remove();
                            console.log("StreamView AdBlock: Removed nested script via MutationObserver:", script.src || "[Inline Script]");
                        }
                    }
                }
            }
        }
    });

    observer.observe(document, { childList: true, subtree: true });

    // 5. Network Request Interception (Mocking / Blocking)
    const originalFetch = window.fetch;
    window.fetch = async function (...args) {
        const url = typeof args[0] === 'string' ? args[0] : args[0]?.url;
        if (url && (isAdScript(url) || isBadRedirect(url))) {
            console.log("StreamView AdBlock: Blocked fetch request to", url);
            return new Response('Blocked by StreamView', { status: 200, statusText: 'Blocked' });
        }
        return originalFetch.apply(this, args);
    };

    // 6. Redirect Prevention (Location assignment)
    const originalAssign = window.location.assign;
    window.location.assign = function (url) {
        if (isBadRedirect(url)) {
            console.log("StreamView AdBlock: Blocked location.assign redirect to:", url);
            return;
        }
        return originalAssign.call(window.location, url);
    };

    const originalReplace = window.location.replace;
    window.location.replace = function (url) {
        if (isBadRedirect(url)) {
            console.log("StreamView AdBlock: Blocked location.replace redirect to:", url);
            return;
        }
        return originalReplace.call(window.location, url);
    };

    // 7. Event interception (Blocks custom events used by anti-adblockers)
    const originalDispatchEvent = window.dispatchEvent;
    window.dispatchEvent = function (event) {
        if (event && event.type === 'dState') {
            console.log("StreamView AdBlock: Blocked anti-debugger custom event.");
            return false;
        }
        return originalDispatchEvent.call(window, event);
    };

    // 8. Basic CSS Adblocking (Hiding known ad containers and overlays)
    window.addEventListener("DOMContentLoaded", () => {
        const style = document.createElement('style');
        style.textContent =
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
    });
})();