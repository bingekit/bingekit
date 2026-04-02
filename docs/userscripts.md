# Userscripts

Userscripts natively inject CSS/Javascript logic forcefully into domains to optimize the user experience, reshape external UIs, or bridge custom UI components into BingeKit.

## 1. Blueprint & Execution (JSON format)
Userscripts are stored locally into `%LOCALAPPDATA%\BingeKit\workspaces\Default\scripts\script_{id}.json` directly inside the AutoHotkey Workspace profile memory. 

A standard power-user configuration looks like this:
```json
{
  "id": "12345-remove-ads",
  "name": "Global Remove Sidebars",
  "enabled": true,
  "match": "*youtube.com/watch*",
  "code": "document.querySelector('#secondary-inner').remove();",
  "css": "#header { position: absolute; z-index: 99; }"
}
```

### Execution Timing
The script payload is executed natively via `ICoreWebView2::AddScriptToExecuteOnDocumentCreatedAsync`.
Because this is invoked *before* the V8 JavaScript engine starts processing the document, Userscript CSS applies instantly avoiding ugly flashes of unstyled content (FOUC), and Javascript mutations can establish `MutationObserver` traps before anti-adblock scripts manage to load!

## 2. Match Rules & Protocols

Every Userscript defines a `match` URL parameter standardizing execution locations.

### Wildcard Matching
Standard Regex or Partial String Matching formats (e.g., `*youtube.com/watch*` or regex expressions natively handled by the AHK bridge).

### Custom Application Matching
Because BingeKit renders React layouts independently alongside the external `WebView2` Player, there are circumstances where you want to execute Userscripts against internal views.

BingeKit maps internal React dashboards through the `custom:` prefix.
- `custom:dashboard`
- `custom:settings`
- `custom:discover`

**Example Use Case:**
If you want to append a Custom RSS feed widget directly onto the main BingeKit dashboard, you would create a Userscript matching `custom:dashboard` containing JS that locates the React container tree and injects a formatted widget block overlay!

## 3. Power Context: Bridging the Native API
Because your injected Userscripts execute inside the BingeKit Chromium process, they uniquely inherit access to the BingeKit COM bridge if their execution context permits it (typically restricted through origin flags for safety, but globally accessible if intentionally scoped).

This means a Userscript can actively call [Native Host APIs](api.md) directly from a streaming site!

```javascript
// A Userscript running on Wikipedia that grabs the page title
// and uses the Native API to save it cleanly to text!
const title = document.querySelector('h1').innerText;

// Access the AHK bridge
const ahk = window.chrome.webview.hostObjects.sync.ahk;

// Safely call the native save API directly to disk without Prompt!
ahk.SaveData("wiki-log.txt", "Harvested Title: " + title);
```

## 4. Debugging & Workarounds
If a script fails to execute, you can check if DevTools are being actively blocked by the provider. 

BingeKit overrides restrictive anti-debugging protections built by streaming sites by manually disabling `disable-devtool.min.js` natively. However, if a site utilizes custom protections:
1. Hit `F12` inside the Player view.
2. If it kicks you out, identify the exact network script blocking it.
3. Append that specific script URL to the **Native Adblocker WebResource Filters** grid (via Settings -> Network Filters) to instantly eliminate the block permanently across the entire app.
