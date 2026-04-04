# BingeKit API Reference

BingeKit functions are securely bound to `window.chrome.webview.hostObjects.sync.ahk`. To make developing easier, the BingeKit React architecture naturally aliases this directly, whereas userscripts will need to access it utilizing the full qualified path.

> [!TIP]
> We strongly recommend creating a constant for the API boundary inside your custom files for cleanliness:
> `const ahk = window.chrome.webview.hostObjects.sync.ahk;`

---

## 🛠 Internal APIs
*These endpoints are designed specifically to construct the core React User Interface. They manipulate system OS behaviors and internal application configuration. They should **rarely** be called by automated userscripts or plugins.*

### Window OS Management
*   **`Minimize()`** / **`Maximize()`** / **`Close()`**: Standard native window state controllers.
*   **`TogglePiP()`**: Elevates the target window into a borderless, always-on-top Picture-in-Picture window native to Windows shell.
*   **`DragMove()`**: Fires upon an HTML `onMouseDown` event inside the custom Titlebar component, allowing Edge/React to tell Windows DWM to drag the application.
*   **`ShowToast(message, typeOrConfig)`**: Pops a native, unblockable OS-level popup toast over other apps. `type` can parse strings like `"error"` or a JSON string adjusting exact native UI colors.

### Storage & Workspaces
*   **`SaveData(filename, strData)`**: Synchronously commits UTF-8 payload exclusively to the active Workspace config folder.
*   **`LoadData(filename)`**: Retrieves Workspace-scoped configuration text.
*   **`CacheSet(key, strData)`** / **`CacheGet(key)`**: Extremely fast volatile memory store. Lives purely inside the RAM of the Host during execution. 
*   **`ListWorkspaces()`** / **`CreateWorkspace(name)`**: Triggers native filesystem routing to manage separate Chromium user data configurations (similar to Chrome Profiles).

### Native Processing
*   **`CheckForUpdates()`** / **`InstallUpdate(url)`**: Queries GitHub releases and pulls native `.exe` diff payloads.
*   **`EnsureFFmpeg(force)`**: Background pulls FFmpeg binaries locally for muxing.

---

## 🎮 User-Facing APIs
*These endpoints control the primary **Player Window**, initiate background extractions, or intercept network traffic natively. These are the tools leveraged by Site Plugins, Flows, and Userscripts.*

### Web & Scraper Control
*   **`UpdatePlayerUrl(url)`**: Forces the visible Player WebView to navigate identically as clicking a URL natively.
*   **`PlayerGoBack()`** / **`PlayerGoForward()`** / **`PlayerReload()`**: Safely traverses Edge history stacks.
*   **`StartSmartFetch(url, actionJs, callbackId)`**: Instantiates a hidden browser tab, directs it to `url`, waits out delays (such as Cloudflare verification), evalulates `actionJs` securely, and routes a JSON string securely back to `callbackId` via the global event emitter.
*   **`StartRawFetchParse(url, actionJs, callbackId)`**: Fast-tracks scraping by natively issuing an AHK `WinHttpRequest`. Bypasses Chromium layout completely (30ms vs 1.2s). Great for extracting raw DOM elements if no active javascript framework blocks it.
*   **`RawFetchHTML(url)`**: Similar to above, but resolves synchronously returning exclusively the stringified body.

### Adblock & Network Interception
*   **`AddNetworkFilter(domainString)`**: Appends a specific string block to the native `ICoreWebView2` rules engine dynamically.
*   **`UpdateAdblockStatus(0|1)`**: Kills all web resource block rules temporarily natively.
*   **`UpdateSiteBlockers(jsonRules)`**: Binds specific JSON scope rules. BingeKit catches network requests before HTTP dispatch occurs!

### Media Controls
*   **`GetActiveMedia()`**: Fires deep hooks sequentially checking `video` tags or `iframe` bounds to map out the dynamically instantiated stream.
*   **`GetActiveMediaQualities()`**: Prompts HLS extraction and returns available playback variants.
*   **`SetMediaStream(url)`**: Restarts playback injecting specific media variants accurately.
*   **`DownloadActiveVideo(url, targetFilename, subUrl)`**: Hands the currently streaming M3U8 string buffer into the native FFmpeg pipe to seamlessly download background videos while playing.
