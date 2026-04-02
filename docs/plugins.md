# Site Plugins

Site Plugins are structured JSON configurations that define scraping protocols, search URLs, custom CSS overrides, and custom JS environments for specific domains. They allow BingeKit to deeply integrate with media websites without requiring hard-coded backend updates.

## 1. The Plugin Blueprint (JSON Skeleton)

For power users managing plugins in `%LOCALAPPDATA%\BingeKit\workspaces\Default\plugins\`, a complete functional JSON schema looks like this:

```json
{
  "id": "example-hd",
  "name": "Example HD Streams",
  "enabled": true,
  "search": {
    "url": "https://example.stream/search?q={q}",
    "collectionSel": ".search-results .item",
    "titleSel": ".title",
    "linkSel": "a.direct-link"
  },
  "customCss": "body { background: #000; } .ad-banner { display: none !important; }",
  "customJs": "console.log('Site Plugin Initialized on Example HD');",
  "details": {
    "similarSel": ".recommendations .item",
    "similarTitleSel": ".title",
    "similarLinkSel": ".link"
  },
  "deepScan": {
    "enabled": true,
    "strategy": "jsExtractor",
    "script": "const data = await window.BK_WAIT_XHR('api/v1/episodes'); return JSON.parse(data);"
  },
  "trackingFlows": [
    {
      "id": "tv-show",
      "name": "Standard Series Tracking",
      "urlRegex": "series/.+-episode-\\d+",
      "listSel": ".episodes-grid",
      "itemSel": ".ep-node",
      "idExtractJs": "return 's01e' + el.dataset.epNum;",
      "titleExtractJs": "return el.querySelector('.title').textContent;",
      "urlExtractJs": "return el.getAttribute('href');",
      "statusExtractJs": "return el.classList.contains('locked') ? 'unreleased' : 'released';" 
    }
  ],
  "siteBlockers": [
    "example.stream/ads",
    "popcash.net"
  ]
}
```

## 2. Advanced Execution Context

### Defeating Cloudflare & DDoS Interstitials
When utilizing an automated `SmartFetch` (like during background Search execution), sites behind a Cloudflare "Checking your browser" page will break a simplistic `fetch` request.

Because BingeKit physically paints a Chromium instance, plugins automatically defeat static Cloudflare walls. However, if the target site takes 15 seconds to pass a check, your `search` arrays will time out early. 
To counteract this, BingeKit exposes **Request Overrides** inside the configuration:
Ensure your `customJs` includes a waiting loop against the DOM *before* attempting extraction:
```javascript
// Wait for Cloudflare to disappear before the internal plugin scraper evaluates
while(document.querySelector('.cf-browser-verification')) {
    await new Promise(r => setTimeout(r, 1000));
}
```

### Advanced Parametrized Scripting (Deep Scan)
Deep Scans are context-aware. If the user searches for a specific episode using common nomenclature (such as `Family Guy - s04e05`), the React Dashboard will automatically deconstruct this into parameters:
1. `baseQuery`: "Family Guy" (The only string actually passed to the site's search engine).
2. `queryTargetSeason`: "04"
3. `queryTargetEpisode`: "05"

If an Exact Match triggers on "Family Guy", these parameters are globally injected into the JS execution environment of the `Deep Scan JS Ripper`. Wait times, XHR/Fetch listeners, and multi-step navigation clicks can all be heavily optimized using these variables inside your script.

You have full programmatic access inside a custom ripper securely using the following variables:
- `window.BK_BASE_QUERY`
- `window.BK_TARGET_SEASON`
- `window.BK_TARGET_EPISODE`
- `window.BK_TARGET_SUBTITLE`

### Network Traffic Interception
Additionally, BingeKit intercepts the fundamental execution pipeline of the Chromium WebView, allowing you to await dynamically generated JSON or specific API responses *after* page load using:
- `await window.BK_WAIT_XHR(urlRegexPattern, timeoutMs = 15000)`

Example Use Case: If your target streaming site uses an obfuscated React payload to render episodes, you can instantly defeat the obfuscation by waiting for the fetch resolution:
```javascript
const responseText = await window.BK_WAIT_XHR("api/v1/episodes");
const data = JSON.parse(responseText);
return data.map(ep => ({ title: ep.name, href: ep.playUrl }));
```

## 3. Discovery Feed & Syncing
### Integration
To integrate a site into BingeKit's Discovery Feed (recommendations on the Explore page), you only need to define the `details.similarSel` property in your Site Plugin. The background engine will passively extract titles and URLs and push them into the user's discovery feed.

### Group Labels
When adding a custom tracker via the BingeKit UI, users define a **Group Label** (e.g. `arcane`). 
If the user tracks the *same show* across multiple Site Plugins using the identical `Group Label` and the identical JS `id` format (e.g. `s01e01`), BingeKit will natively **sync watch progress across all sites**! Marking an episode watched on Site A will instantly mark it watched on Site B.
