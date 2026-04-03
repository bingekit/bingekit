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

## 5. Native AHK Overlays (Global UI)

Unlike standard electron apps, BingeKit separates its dashboard UI (React) from global notification UI to ensure absolute visibility.

### The Toast System
If notifications (Toasts) were rendered within the React DOM, they would be trapped inside the Main Menu window boundaries. If the user had a Player view running full-screen or as a PiP element on a secondary monitor, a React-bound toast would be invisible.

To solve this, BingeKit exposes a **Global Native Toast System**:
- Initiated through JavaScript via the `window.showToast` global alias or directly at `ahk.ShowToast(message, typeOrConfig)`.
- The AHK host generates a frameless (`-Caption`), always-on-top native Windows GUI.
- These GUI nodes dynamically track available slots recursively on the Primary Monitor desktop bounds and float cleanly above *all* applications (including full-screen games).
- The Native COM bridge dynamically parses JSON from the WebView to allow the unprivileged JavaScript environment to theme the system-level popup dynamically.

## 6. Adaptation & Open Source
While BingeKit was initially focused on organizing and controlling media streams seamlessly, the foundation is completely agnostic. The heavy lifting—bridging AHK2 with WebView2, network interception, automated hidden flows, userscript injection, and IPC logic—has effectively created a framework for building highly capable desktop utilities, scrapers, and local-first software. This architecture can easily be adapted into entirely different projects needing granular web automation and a native desktop experience.

## 7. Secure Credential Storage (DPAPI & IndexedDB)

BingeKit manages an internal credential subsystem to enable automated login flows (e.g., bypassing repetitive streaming site authentications).

Because storing passwords in plain text or simple base64 `.json` files is insecure, BingeKit utilizes a highly-privileged, host-driven encryption mechanism:
*   **Windows DPAPI (Data Protection API):** Whenever a credential is saved, the React frontend passes the plaintext to the AutoHotkey host via a private IPC command. The AHK host securely encrypts the payload using `Crypt32.dll` (`CryptProtectData`), cryptographically binding the password to the current Windows User account profile and hardware.
*   **Sandboxed IndexedDB Persistence:** The encrypted DPAPI payloads are managed transparently alongside viewing history in the WebView2's sandboxed `BingeKitDB` IndexedDB container. This neatly isolates passwords across independent BingeKit Workspaces.
*   **Internal Access Only:** To prevent malicious scraping pipelines or third-party userscripts from harvesting your connected accounts, the `EncryptCredential` and `DecryptCredential` host methods are strictly sequestered to core BingeKit execution hooks (such as `authHelper.ts`). These methods are completely insulated and **cannot** be queried by Userscripts or open `Deep Scan` evaluators.
