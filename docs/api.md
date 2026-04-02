# BingeKit API Reference

BingeKit heavily relies on the Microsoft Edge WebView2 runtime. To enable native capabilities (like file downloads, precise window management, process launching) inside the restricted React context, BingeKit exposes a large bridge of functions from the main AutoHotkey (AHK) process.

This bridge is accessible globally inside the React app (and injected userscripts) via the synchronous COM interface:
```javascript
const ahk = window.chrome.webview.hostObjects.sync.ahk;

// Example call:
ahk.Minimize();
```

For brevity, the rest of this documentation assumes you have mapped the `ahk` object or are accessing it directly via the `sync` path.

---

## 1. Application / Host Interface
*These APIs control the main bounding window of BingeKit, deal with internal configs, workspaces, and application updates.*

### Window Management
*   **`Minimize()`**: Minimizes the main application window.
*   **`Maximize()`**: Toggles maximize/restore state of the main window.
*   **`Close()`**: Forces the application to shut down cleanly.
*   **`TogglePiP()`**: Toggles Picture-in-Picture mode for the entire application, stripping window borders and forcing it always-on-top.
*   **`ResizePiP(width, height)`**: Sets specific dimensions for the PiP window.
*   **`DragMove()`**: Called on `mousedown` of a custom titlebar to initiate native OS window dragging.
*   **`ResizeEdge(edge)`**: Triggers native edge-resizing (used on custom borderless frames). Map edge parameters appropriately.
*   **`HideSplash()`**: Dismisses the native loading splash screen (usually called once React has mounted).

### Data & Configuration
*   **`GetAboutConfig()`**: Returns the JSON schema for internal BingeKit developer options (`about:config` flags).
*   **`SetAboutConfig(jsonStr)`**: Saves the updated internal flags object to disk.
*   **`SaveData(filename, data)`**: Saves raw text/JSON `data` to the `AppData/Local/BingeKit` folder under the given `filename`.
*   **`LoadData(filename)`**: Synchronously reads and returns the file content as a string.
*   **`CacheSet(key, data)`**: Quickly sets temporary or persistent memory variables in the host map without touching disk.
*   **`CacheGet(key)`**: Retrieves the mapped value.
*   **`CacheClear()`**: Reinitializes the internal memory map.

### Workspaces
*   **`GetCurrentWorkspace()`**: Returns the name of the active workspace.
*   **`ListWorkspaces()`**: Returns a JSON array of all initialized workspace profiles.
*   **`CreateWorkspace(name)`**: Creates a new, isolated workspace directory.
*   **`CloneWorkspace(srcName, destName)`**: Copies `srcName` configuration completely to `destName`.
*   **`DeleteWorkspace(name)`**: Deletes the specified workspace entirely.
*   **`RestartWorkspace(name)`**: Restarts the BingeKit process bound to the specified `name`.

### Updates & System Dialogs
*   **`GetAppVersion()`**: Returns the current build version of the application.
*   **`CheckForUpdates()`**: Pings the remote repository API for newer releases and returns a JSON object with update metadata.
*   **`InstallUpdate(downloadUrl)`**: Initiates an automated update/patch loop using the provided URL.
*   **`RevealPath(path)`**: Opens Windows Explorer precisely selecting the matched `path`.
*   **`PromptSelectFolder(id)`**: Triggers a native `FileSelect` (directory mode) and reports the user's choice back via IPC (using the referenced `id`).

---

## 2. The Player Interface (PlayerVW)
*These functions apply **exclusively** to the primary media player wrapper, separating host-layer UI logic from raw media presentation logic. Use these to track or navigate whatever video stream the user has currently opened.*

### Player State & Control
*   **`ToggleMedia()`**: Tries to evaluate play/pause on the active player. Fallback invokes full screen toggle if media hooks fail.
*   **`PlayerGoBack()`** / **`PlayerGoForward()`**: Executes navigation history on the player's WebView2 instance.
*   **`PlayerReload()`**: Reloads the player's active page.
*   **`UpdatePlayerRect(x, y, w, h, visible)`**: Moves and resizes the secondary Player window securely beneath or inside the main React view boundary.
*   **`UpdatePlayerUrl(url)`**: Commands the Player instance to navigate to a new site URL.

### Media Hooks (Extraction & Subtitles)
*   **`GetActiveMedia()`**: Re-parses the current view looking for `<video>` tags or supported iframe streams, returning metadata about what is physically loaded.
*   **`GetActiveMediaQualities()`**: Prompts HLS/DASH or direct source nodes to report their available quality ladder (e.g., 1080p, 720p).
*   **`SetMediaStream(id)`**: Forces the loaded media to switch to the corresponding quality/source stream ID.
*   **`GetActiveSubtitle()`**: Checks the current video source or generic `<track>` tags for active VTT/SRT data.
*   **`SetSubtitleStream(id)`**: Switches the active track.

### Scoped Injection
*   **`EvalPlayerJS(js)`**: Sends a raw string of JavaScript to be executed globally on the *Player's* active DOM. Bypasses the React host's local scope.

---

## 3. Remote Parsing (Hidden WebViews & Smart Fetchers)
*BingeKit avoids blocking the UI thread (React) by allocating DOM processing to background instances.*

*   **`StartSmartFetch(url, actionJs, callbackId)`**: Instantiates a hidden edge WebView, navigates it to `url`, waits for hydration, and executes `actionJs`. Extracted data responds asynchronously to React using the `callbackId`.
*   **`StartRawFetchParse(url, actionJs, callbackId)`**: A faster alternative to `SmartFetch` that requests raw HTML through WinHttpRequest, loads it into a virtual DOM, and runs `actionJs`. Ideal for non-JS heavy scraping.
*   **`RawFetchHTML(url)`**: Synchronously performs a standard HTTP GET via the AHK host and returns the string response. Overcomes normal browser CORS limits.
*   **`InjectJS(js)`**: Pushes JavaScript directly to a targeted background worker layer (or active DOM sequence, depending on active focus contexts).

---

## 4. Download & Media Conversion Capabilities
*BingeKit includes a robust background downloader, capable of replacing external cURL or Python dependencies, tightly coupled with FFmpeg.*

*   **`CheckFFmpegStatus()`**: Validates if the local FFmpeg binary exists and is accessible.
*   **`EnsureFFmpeg(force)`**: Attempts to download and unzip FFmpeg into the project's dependency folder.
*   **`DownloadActiveVideo(url, targetFilename, subUrl)`**: Routes the provided `url` (often HLS streams) to the native downloader. Option to overlay `subUrl` for automated subtitle merging during muxing.
*   **`DownloadSubtitle(url, targetFilename)`**: Standard HTTP get intended for `vtt`/`srt` assets, saved safely to the user's destination folder.
*   **`ListDownloads()`**: Fetches a serialized object of all currently queued, downloading, or completed background HTTP tasks.
*   **`CancelDownload(path)`**: Safely halts an active download thread matching the destination string.
*   **`DeleteDownload(path, deleteSubs)`**: Removes a completed file from disk. Optionally cleans up associated detached subtitle tracks.
*   **`RenameDownload(oldPath, newName)`**: Moves and renames file locations post-completion safely.

---

## 5. Network Filters & Native Adblock
*BingeKit natively hooks inside the `ICoreWebView2` COM pipeline to block analytic servers or intrusive ad services *before* they initiate sockets.*

### Modifying the Block List
Any injected scope (Userscript or PlayerJS) can register an interdicted URI to the rules engine instantly:

```javascript
window.ahk.AddNetworkFilter("custom-tracker.com");
```
*   **`AddNetworkFilter(term)`**: Immediately maps a string into the active host blocklist, instantly blocking it. It also broadcasts state changes out to React `window.postMessage` listeners to update Settings UI state.
*   **`UpdateNetworkFilters(jsonStr)`**: Overwrites the entire active block list cache (usually invoked from the *Settings > Network* page).
*   **`UpdateAdblockStatus(status)`**: Toggles the global status boolean (0 or 1) of the adblock routing engine.
*   **`UpdateSiteBlockers(jsonStr)`**: Updates the granular allowed/blocked scope rules mapped directly inside a Site Plugin. 

---

## 6. Project Abstractions (Plugins, Flows, Scripts)
*Functions utilized to manage BingeKit's custom JSON configurations defining dynamic logic.*

*   **Sites**: `ListSites()`, `LoadSite(name)`, `SaveSite(name, json)`, `DeleteSite(name)`
    *   *Sites define individual web services (e.g., Netflix, YouTube) tracking configurations and specific user agents.*
*   **Flows**: `ListFlows()`, `LoadFlow(name)`, `SaveFlow(name, json)`, `DeleteFlow(name)`
    *   *Flows are sequential instruction arrays detailing how to mimic user interaction and navigate complex pagination securely.*
*   **Scripts**: `ListScripts()`, `LoadScript(name)`, `SaveScript(name, jsCode)`, `DeleteScript(name)`
    *   *Scripts are Tampermonkey-style arbitrary code blocks applied across domains to sanitize web pages or report media state back to the UI.*
