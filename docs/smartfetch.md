# Remote Parsing: SmartFetch & RawFetch

BingeKit utilizes an orchestrated asynchronous scraping pipeline to harvest values without dropping frame rates or freezing the primary user interface.

## 1. SmartFetch Engine

If your target URL requires DOM execution (e.g., React SPA, NextJS rendering, protected Cloudflare challenges resolving visually), you must utilize `SmartFetch`.

`SmartFetch` loads the URL in a hidden, fully-rendered layout, and evaluates your custom Javascript logic asynchronously. 

```javascript
// Example: Executing inside [Hidden] Custom SmartFetch
return new Promise(async (resolve) => {
    // Wait for the dynamic React DOM to render the list
    await new Promise(r => setTimeout(r, 1000));
    
    // Harvest elements
    const epNodes = document.querySelectorAll('.episode-item');
    const result = Array.from(epNodes).map(ep => ({
       title: ep.innerText,
       url: ep.getAttribute('href')
    }));
    
    // Resolve back to BingeKit's Flow Engine securely
    resolve(result); 
});
```

### AutoHotkey Bridge
When `AHK_StartSmartFetch` triggers, BingeKit invokes a non-visible GUI Window, navigates to the target URL, appends the JavaScript query wrapper, hooks `AddScriptToExecuteOnDocumentCreatedAsync`, and resolves a `COM` Promise bridging the payload.

## 2. RawFetchHTML

If the site purely delivers structured HTML (e.g., Wikipedia), `<meta>` tags, or static SSR bodies, absolute peak performance is achieved utilizing `RawFetchHTML`.

It utilizes `WinHttpRequest` inside AHK to bypass the Chromium rendering engine entirely.
- **Execution Speed**: ~30ms (compared to ~1.2s for traditional `SmartFetch`).
- **Use Case**: Parsing JSON script blocks embedded in the HTML body `(\<script type="application\/json"\>)`, or evaluating Regex maps on static markup.
- **Limitation**: Cannot process Javascript frameworks. Returns exactly what network curl produces.
