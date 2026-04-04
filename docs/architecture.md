# BingeKit Architecture & Foundation

BingeKit operates on a specialized hybrid architecture. It is essentially a high-privileged **AutoHotkey wrapper** driving an army of **Microsoft Edge WebView2** child processes. 

## The Boundary: Host vs. Client

To develop successfully for BingeKit, you must understand the two distinctly sandboxed environments:

1. **The Host (AHK):** The native Windows executable. It manages the filesystem, creates GUI windows natively, handles WebRequests directly to bypass CORS, and spawns the WebView instances.
2. **The Client (React / WebViews):** The HTML/JS rendering layer. The Client cannot touch the filesystem or bypass CORS on its own. It must ask the Host cleanly over an IPC channel to act on its behalf.

## The Communications Bridge (IPC)

Because the environments are sandboxed, BingeKit establishes a high-performance COM bridge.

### 1. Synchronous Hooks (Client -> Host)
BingeKit maps core functions securely to a synchronous handler on the `window` object:
```javascript
// Calling the native host to perform a window action
window.chrome.webview.hostObjects.sync.ahk.Minimize();
```
*For a full list of accessible methods, refer to the [API Guide](api.md).*

### 2. Asynchronous Messages (Host -> Client)
While UI bindings are synchronous, heavy native jobs (like downloading gigabytes of video, or executing a heavy 15-second background SmartFetch) must occur asynchronously in AHK's runtime. The Host will instead `postMessage` asynchronously back to the React UI when complete.

> [!WARNING]
> React must listen to the global `window` message bus to receive these async results.

```javascript
window.addEventListener('message', (event) => {
    // Only trust the host bridge
    if (event.origin !== "http://localhost" && event.origin !== "file://") return;

    const payload = JSON.parse(event.data);
    if (payload.type === "DL_PROGRESS") {
        console.log(`Download at: ${payload.percent}%`);
    }
});
```

## Hidden Browsers: "Puppeteer-Lite"

BingeKit does not just render web pages. It spawns **invisible** off-screen WebView controllers.

By isolating tasks to a background Chromium instance, you can silently query React-based Single Page Applications (SPAs), bypass Cloudflare "Checking your browser" checkpoints, or harvest complex dynamic APIs without the main user interface ever stuttering or pausing music playback.

*See [The Background Fetcher](smartfetch.md) to learn how to wield this power.*

## Data Persistence & Security

BingeKit separates functional code from user contextual data. All user metadata lives securely inside Windows AppData:
`%LOCALAPPDATA%\BingeKit\workspaces\Default\`

### DPAPI & IndexedDB Encrypted Credentials
To facilitate automated logins across streaming sites cleanly, BingeKit stores internal access tokens. To prevent any malicious script injected during navigation from scraping passwords, BingeKit aggressively sandboxes them:

1. **Host-Enforced Crypto:** Passwords are encrypted on disk utilizing Windows DPAPI `CryptProtectData`, binding the decryption keys strictly to the active Windows User's hardware.
2. **Isolated IndexedDB Storage:** The heavily encrypted blob is further hidden securely deep within the active Workspace's sandboxed Chromium `IndexedDB`.
3. **No External APIs:** There are absolutely no User APIs exposed to scripts to decrypt these passwords. Decryption only occurs passively in isolated `authHelper.ts` pipelines right prior to injection.
