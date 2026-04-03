// -----------------------------------------------------------------------------
// BingeKit Minimal - Adblock & Preload Script
// -----------------------------------------------------------------------------
// This script is injected via AHK2 WebView2 AddScriptToExecuteOnDocumentCreated
// It runs before the page loads to block ads and inject custom behaviors.

(function () {
    try {
        if (!window.chrome.webview.hostObjects.sync.ahk.GetAdblockStatus()) return;

        const whitelistStr = window.chrome.webview.hostObjects.sync.ahk.GetAdblockWhitelist();
        if (whitelistStr) {
            const whitelist = JSON.parse(whitelistStr);
            const currentHost = location.href || location.hostname;
            if (whitelist.some(w => currentHost.includes(w))) return;
        }
    } catch (e) { }

    let adKeywords = ['disable', 'devtool', 'antiad', 'adblock', 'detect', '/ads/', 'tracker', 'analytics', 'popunder', 'adsystem', 'gamble', 'evasivelimnite', 'umommy', 'gtag', 'googletag', 'doubleclick'];
    let redirectKeywords = ['casino', 'gamble', 'betting', 'crypto', 'slot', 'poker', 'bitcoin', 'roulette'];
    let inlineKeywords = ['debugger', 'eval', 'gtag'];

    try {
        const customRulesStr = window.chrome.webview.hostObjects.sync.ahk.GetSiteBlockers();
        if (customRulesStr) {
            const rulesMap = JSON.parse(customRulesStr);
            Object.keys(rulesMap).forEach(domain => {
                if (location.hostname.includes(domain) || domain.includes(location.hostname) || location.href.includes(domain) || domain.startsWith('custom:')) {
                    const rules = rulesMap[domain];
                    if (rules.inline && rules.inline.length) {
                        inlineKeywords = inlineKeywords.concat(rules.inline);
                    }
                    if (rules.redirect && rules.redirect.length) {
                        redirectKeywords = redirectKeywords.concat(rules.redirect);
                    }
                }
            });
        }
    } catch (e) { }

    function isAdScript(src) {
        if (!src) return false;
        const lowerSrc = src.toString().toLowerCase();
        return adKeywords.some(keyword => lowerSrc.includes(keyword));
    }

    function isBadRedirect(url) {
        if (!url) return false;
        const lowerUrl = url.toString().toLowerCase();
        return redirectKeywords.some(keyword => lowerUrl.includes(keyword));
    }

    function isBadInlineScript(text) {
        if (!text) return false;
        const lowerText = text.toString().toLowerCase();

        return inlineKeywords.filter(keyword => lowerText.includes(keyword));
    }

    // 1. Block Popups immediately
    window.open = function () {
        console.log("BingeKit AdBlock: Prevented window.open popup.");
        return null;
    };
    window.debugger = function () {
        console.log("BingeKit AdBlock: Prevented debugger call.");
        return null;
    };
    window.console.clear = function () {
        console.log("BingeKit AdBlock: Prevented console.clear call.");
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
                    console.log("BingeKit AdBlock: Blocked script injection via setAttribute.");
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
        const badMatches = isBadInlineScript(node.textContent);
        if (node.nodeName === 'SCRIPT' && (isAdScript(node.src) || (!node.src && badMatches.length > 0))) {
            console.log("BingeKit AdBlock: Blocked script via appendChild", badMatches);
            return node; // Return node to prevent breaking calling scripts
        }
        return originalAppendChild.call(this, node);
    };

    const originalInsertBefore = Node.prototype.insertBefore;
    Node.prototype.insertBefore = function (node, referenceNode) {
        const badMatches = isBadInlineScript(node.textContent);
        if (node.nodeName === 'SCRIPT' && (isAdScript(node.src) || (!node.src && badMatches.length > 0))) {
            console.log("BingeKit AdBlock: Blocked script via insertBefore", badMatches);
            return node;
        }
        return originalInsertBefore.call(this, node, referenceNode);
    };

    const originalInnerHTML = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
    if (originalInnerHTML) {
        Object.defineProperty(Element.prototype, 'innerHTML', {
            set: function (value) {
                const badMatches = isBadInlineScript(value);
                if (typeof value === 'string' && badMatches.length > 0) {
                    console.log("BingeKit AdBlock: Blocked innerHTML injection", badMatches);
                    return; // Drop the entire assignment
                }
                originalInnerHTML.set.call(this, value);
            },
            get: originalInnerHTML.get
        });
    }

    const originalWrite = document.write;
    document.write = function (content) {
        const badMatches = isBadInlineScript(content);
        if (typeof content === 'string' && badMatches.length > 0) {
            console.log("BingeKit AdBlock: Blocked document.write injection", badMatches);
            return;
        }
        originalWrite.call(document, content);
    };

    const originalWriteln = document.writeln;
    document.writeln = function (content) {
        const badMatches = isBadInlineScript(content);
        if (typeof content === 'string' && badMatches.length > 0) {
            console.log("BingeKit AdBlock: Blocked document.writeln injection", badMatches);
            return;
        }
        originalWriteln.call(document, content);
    };

    // 4. MutationObserver as a fallback for scripts that bypass property overrides
    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                if (node.tagName === 'SCRIPT') {
                    const badMatches = isBadInlineScript(node.textContent);
                    if (isAdScript(node.src) || (!node.src && badMatches.length > 0)) {
                        node.type = 'javascript/blocked';
                        node.remove();
                        console.log("BingeKit AdBlock: Removed script via MutationObserver:", node.src || "[Inline Script]", badMatches);
                    }
                }
                else if (node.tagName === 'META' && node.httpEquiv && node.httpEquiv.toLowerCase() === 'refresh') {
                    if (isBadRedirect(node.content)) {
                        node.remove();
                        console.log("BingeKit AdBlock: Removed meta refresh redirect:", node.content);
                    }
                }
                else if (node.nodeType === Node.ELEMENT_NODE) {
                    const scripts = node.querySelectorAll('script');
                    for (const script of scripts) {
                        const badMatches = isBadInlineScript(script.textContent);
                        if (isAdScript(script.src) || (!script.src && badMatches.length > 0)) {
                            script.type = 'javascript/blocked';
                            script.remove();
                            console.log("BingeKit AdBlock: Removed nested script via MutationObserver:", script.src)
                            console.log("[Inline Script]", badMatches);
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
            console.log("BingeKit AdBlock: Blocked fetch request to", url);
            return new Response('Blocked by BingeKit', { status: 200, statusText: 'Blocked' });
        }
        return originalFetch.apply(this, args);
    };

    // 6. Redirect Prevention (Location assignment)
    const originalAssign = window.location.assign;
    window.location.assign = function (url) {
        if (isBadRedirect(url)) {
            console.log("BingeKit AdBlock: Blocked location.assign redirect to:", url);
            return;
        }
        return originalAssign.call(window.location, url);
    };

    const originalReplace = window.location.replace;
    window.location.replace = function (url) {
        if (isBadRedirect(url)) {
            console.log("BingeKit AdBlock: Blocked location.replace redirect to:", url);
            return;
        }
        return originalReplace.call(window.location, url);
    };

    // 7. Event interception (Blocks custom events used by anti-adblockers)
    const originalDispatchEvent = window.dispatchEvent;
    window.dispatchEvent = function (event) {
        if (event && event.type === 'dState') {
            console.log("BingeKit AdBlock: Blocked anti-debugger custom event.");
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
            footer,
            footer~*,
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