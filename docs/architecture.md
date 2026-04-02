# BingeKit Architecture & Technical Foundation

BingeKit operates on a specialized hybrid architecture built on top of AutoHotkey v2 (AHK2) and the Microsoft Edge WebView2 runtime. It functions not just as a typical wrapper, but as a customized, highly-privileged browser controller and frontend host.

## 1. Storage & Configuration Paths (Power User)

BingeKit is fully portable but stores its working context natively on the disk. This allows power users to externally edit configurations, bulk load JSON profiles, or script external data mutations without running the application.

All data is stored inside Windows Local AppData:
`%LOCALAPPDATA%\BingeKit`

### Default Storage Layout
- `\config.json` - Global layout and application-level settings.
- `\workspaces\` - The container for independent application profiles.
  - `\Default\` (Or your active workspace name)
    - `network_filters.json` - Global adblock/domain interception strings.
    - `plugins\` - Directory containing individual `.json` Site Plugin configurations.
    - `flows\` - Directory of custom `.json` automated Macro Flows.
    - `scripts\` - Directory of custom Userscript injections.

## 2. IPC Messaging: The React / AHK Bridge

While the [API Reference](api.md) shows synchronous methods (e.g. `ahk.Minimize()`), heavy tasks (like processing large JSON Payloads from hidden scrapers or tracking native file downloads) must be asynchronous.

### Native -> React (Asynchronous PostMessage)
The AHK host dispatches stringified payloads directly to the React window via `ICoreWebView2::PostWebMessageAsJson()`.

As a power user developing inside the React Frontend, you must listen for them on the global `window` object:
```javascript
// React useEffect or Global Initialization
window.addEventListener('message', (event) => {
    // Only accept payloads originating from the trusted Host bridge
    if (event.origin !== "http://localhost" && event.origin !== "file://") {
        try {
            const payload = JSON.parse(event.data);
            
            switch (payload.type) {
                case "SF_RESULT":
                    console.log(`SmartFetch Callback #${payload.callbackId} returned:`, payload.data);
                    break;
                case "DL_PROGRESS":
                    console.log(`Download progress for ${payload.path}: ${payload.percent}%`);
                    break;
                case "NAV_STATE":
                    // Updates about the PlayerVW navigation state
                    break;
            }
        } catch (e) {
            // Un-parseable message
        }
    }
});
```

To see exact JSON shapes expected, refer to [SmartFetch](smartfetch.md) and [Flows](flows.md).

## 3. The WebView2 Controller ("Puppeteer-Lite")

Rather than simply rendering a web page, BingeKit heavily instruments the WebView2 instance:
*   **Hidden Off-Screen Controller:** BingeKit utilizes background/hidden WebView2 instances (SmartFetchers) to silently parse, extract, evaluate JS, and manipulate resources without disrupting the main user UI.
*   **Deep Navigation & DOM Control:** Relying on precise COM interfaces and execution contexts, the host can dynamically bypass standard browser safeguards (like enforcing injection on `about:blank` proxies or tightly bound custom protocols) to ensure execution persistence.

## 4. Multi-Tiered Ad & Tracking Blocker

The ad-blocking pipeline acts across multiple scopes to ensure sites remain pristine, regardless of how aggressively they obfuscate their ad payloads:
*   **Network-Level Blocking:** Hooks into the native `WebResourceRequested` event to catch and cancel HTTP requests to ad, telemetry, and tracking networks at the host level before network I/O occurs.
*   **Inline Resource Sanitization:** Capable of sniffing and blocking malicious or intrusive inline `<script>` tags dynamically.
*   **Cosmetic JS Blocking:** Injects early-execution scripts that set up robust `MutationObserver` listeners. Undesirable DOM nodes (popups, overlays, anti-adblock modals) are instantly caught and removed (`display: none`) the moment they enter the DOM.

## 5. Adaptation & Open Source
While BingeKit was initially focused on organizing and controlling media streams seamlessly, the foundation is completely agnostic. The heavy lifting—bridging AHK2 with WebView2, network interception, automated hidden flows, userscript injection, and IPC logic—has effectively created a framework for building highly capable desktop utilities, scrapers, and local-first software. This architecture can easily be adapted into entirely different projects needing granular web automation and a native desktop experience.
