# The Background Fetcher Pipeline

BingeKit completely sidesteps typical scraping pain points (like blocking the UI loop, running into CORS walls, or failing against Cloudflare proxy guards). It does this through **SmartFetch** and **RawFetch**.

## Unlocking Hidden WebViews (`SmartFetch`)

`SmartFetch` is primarily utilized during Deep Scans, Discovery feeds, or resolving complicated Site Plugins. 

When you issue a `SmartFetch` call, BingeKit seamlessly spawns a secondary Chromium process layered invisibly beneath your active application window.

### The Lifecycle of a SmartFetch

1. **Invocation**: You fire the async command: `ahk.StartSmartFetch(url, actionJs, "callback-123")`
2. **Launch**: AHK creates the invisible GUI instance natively and navigates Chromium to the URL.
3. **Execution Pipeline**: `actionJs` is injected globally using `AddScriptToExecuteOnDocumentCreatedAsync`.
4. **Resolution**: Your custom logic runs asynchronously mapping the DOM until you securely call the `resolve` primitive.
5. **Callback**: AHK immediately kills the hidden browser window to free up RAM, and executes a targeted `postMessage` globally on the React window pushing `SF_RESULT`.

### Practical Scraper Example

If a site requires Javascript to render an episode grid, or sits behind a 5-second protective Cloudflare interstitial challenge:

```javascript
// Step 1: Write Custom Extraction Logic (To be injected off-screen)
const scraperJS = `
return new Promise(async (resolve) => {
    // A. Wait for any Cloudflare checking UI elements to disappear
    while (document.querySelector('.cf-browser-verification')) {
        await new Promise(r => setTimeout(r, 1000));
    }
    
    // B. Wait for a specific streaming API to fire inside Chromium's network panel
    await window.BK_WAIT_XHR('api/v1/episodes');
    
    // C. Navigate DOM
    const nodes = document.querySelectorAll('.episode-item');
    const result = Array.from(nodes).map(ep => ({
       title: ep.innerText,
       url: ep.getAttribute('href')
    }));
    
    // D. Safely return back across the AHK bridge!
    resolve(JSON.stringify(result)); 
});
`;

// Step 2: Ensure your React component prepares the catch basin
window.addEventListener("message", (e) => {
    let payload = JSON.parse(e.data);
    if (payload.callbackId === "my-scraper-id") {
       console.log("Scraped from off-screen:", payload.data);
    }
});

// Step 3: Trigger the execution natively!
window.chrome.webview.hostObjects.sync.ahk.StartSmartFetch(
    "https://complex-react-site.com", 
    scraperJS, 
    "my-scraper-id"
);
```

> [!TIP]
> **Use Case Context:** `SmartFetch` executes precisely like an automated Puppeteer script, seamlessly passing browser authentication challenges.

### Hidden Window & Visibility Control (Debugging & Timeouts)

By default, the `SmartFetch` browser is completely hidden off-screen physically. However, if your scrape runs into captchas or dead-locks, you can programmatically force it to reveal itself so users/developers can intervene or debug visually.

#### The `UpdateWindow()` Payload
While inside your `actionJs` script context executing inside the hidden browser, you have native access to its bounding container via the Host Object bridge:
```javascript
// Force the invisible window visible (width 1000px, height 800px)
window.chrome.webview.hostObjects["fetchResult_" + callbackId].UpdateWindow(true, "ATTENTION - Captcha Detected", 1000, 800);

// Re-hide the window
window.chrome.webview.hostObjects["fetchResult_" + callbackId].UpdateWindow(false);
```

#### SmartFetch Expirations
Because `SmartFetch` wraps your evaluation inside a `setTimeout`, a broken promise could permanently hang the invisible window out-of-bounds, consuming RAM silently.

To prevent this, BingeKit exposes the **SmartFetch Expiration Timeout** via Advanced Preferences (default: 30 seconds). If your `actionJs` loop fails to naturally resolve before this interval drains, the hidden window will automatically snap to the center of your screen, playing an alert chime, enabling developers to visually identify exactly where the payload snagged!

You can natively configure the default size and zoom CSS multiplier of revealed windows using the `about:config` System panel.

## Extreme Speed: `RawFetchHTML`

If you are just parsing a simple XML feed, basic tags from Wikipedia, or non-SPA applications, `SmartFetch` is too slow because it waits for complete layout painting (~1-2 seconds per cycle).

`RawFetchHTML` leverages native Windows WinHTTP Requests to pull the text array natively instantaneously directly to memory (~30 milliseconds).

```javascript
// Unlike SmartFetch, RawFetch is perfectly synchronous and blazing fast.
const htmlBody = window.chrome.webview.hostObjects.sync.ahk.RawFetchHTML("https://en.wikipedia.org");
```
