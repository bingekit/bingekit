# Remote Parsing: SmartFetch & RawFetch

BingeKit utilizes an orchestrated asynchronous scraping pipeline to harvest values without dropping frame rates or freezing the primary user interface.

## 1. SmartFetch Engine

If your target URL requires DOM execution (e.g., React SPA, NextJS rendering, protected Cloudflare challenges resolving visually), you must utilize `SmartFetch`.

`SmartFetch` loads the URL in a hidden, fully-rendered layout, and evaluates your custom Javascript logic asynchronously. 

### The AHK Background Hook
When `AHK_StartSmartFetch` triggers, BingeKit invokes a non-visible GUI Window, navigates to the target URL, appends the JavaScript query wrapper, hooks `AddScriptToExecuteOnDocumentCreatedAsync`, and resolves a `COM` Promise bridging the payload.

### Authoring the JS Extraction Payload
The injected Javascript evaluates globally in the hidden window. It *must* return a `Promise` resolving to either stringified JSON or a primitive to properly jump the COM bridge.

```javascript
// Example Payload: stringified extraction logic
const myJS = `
return new Promise(async (resolve) => {
    // Wait for the dynamic React DOM to render the list
    await window.BK_WAIT_XHR('api/v1/episodes');
    
    // Harvest elements
    const epNodes = document.querySelectorAll('.episode-item');
    const result = Array.from(epNodes).map(ep => ({
       title: ep.innerText,
       url: ep.getAttribute('href')
    }));
    
    // Resolve back to BingeKit's Flow Engine securely
    resolve(JSON.stringify(result)); 
});
`;
```

### Starting SmartFetch from React (IPC)
Because this action takes time, React does not block waiting for the result. Instead, you invoke the call assigning a unique `callbackId`, and catch the return on the global asynchronous message bus.

```javascript
// 1. Establish the Event Listener in your React Component
useEffect(() => {
    const handleHostMessage = (event) => {
        try {
            const payload = JSON.parse(event.data);
            if (payload.type === "SF_RESULT" && payload.callbackId === "my-unique-fetch-1") {
                console.log("Extraction Results:", JSON.parse(payload.data));
            }
        } catch (e) { }
    };
    window.addEventListener("message", handleHostMessage);
    return () => window.removeEventListener("message", handleHostMessage);
}, []);

// 2. Trigger the Fetch securely from the UI
const targetUrl = "https://complex-react-site.com";
const callbackId = "my-unique-fetch-1";
window.chrome.webview.hostObjects.sync.ahk.StartSmartFetch(targetUrl, myJS, callbackId);
```

## 2. RawFetchHTML

If the site purely delivers structured HTML (e.g., Wikipedia), `<meta>` tags, or static SSR bodies, absolute peak performance is achieved utilizing `RawFetchHTML`.

It utilizes `WinHttpRequest` inside AHK to bypass the Chromium rendering engine entirely.
- **Execution Speed**: ~30ms (compared to ~1.2s for traditional `SmartFetch`).
- **Use Case**: Parsing JSON script blocks embedded in the HTML body `(\<script type="application\/json"\>)`, or evaluating Regex maps on static markup.
- **Limitation**: Cannot process Javascript frameworks or defeat Cloudflare. Returns exactly what network curl produces.

Because `RawFetchHTML` is so fast, it is executed *synchronously* through the COM bridge:
```javascript
// Triggers instantly and blocks until returned.
const htmlBody = window.chrome.webview.hostObjects.sync.ahk.RawFetchHTML("https://anidb.net");
const regex = /<meta property="og:title" content="(.*?)"/i;
const title = htmlBody.match(regex)[1];
```
