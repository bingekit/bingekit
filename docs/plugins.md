# Site Plugins

Site Plugins are structured JSON configurations that define scraping protocols, search URLs, custom CSS overrides, and custom JS environments for specific domains. They allow BingeKit to deeply integrate with media websites without requiring hard-coded backend updates.

## Plugin Structure

A Site Plugin consists of several metadata fields and execution blocks:
- `id`: A unique identifier for the plugin.
- `name`: Display name.
- `enabled`: Boolean toggle for execution.
- `search`: The query/parsing layout.
- `customCss`: CSS injected directly into the PlayerWebView when loading the domain.
- `customJs`: JavaScript injected into the PlayerWebView.
- `details`: Selectors to grab advanced metadata, and `similarSel` which populates the **Discovery Feed**!
- `tracking`: Selectors and Javascript extractors to track unwatched/new episodes and release status.

## Search Protocol

The core capability of a Site Plugin is standardizing the search process.

```json
"search": {
  "url": "https://example.stream/search?q={q}",
  "collectionSel": ".search-results .item",
  "titleSel": ".title",
  "linkSel": "a.direct-link"
}
```

### Search Engine Workflow
1. The user inputs a query in the Main UI.
2. BingeKit maps the query string, replacing `{q}` inside the `search.url`.
3. It spawns an invisible `SmartFetch` WebView parser in the background for *each* enabled Site Plugin.
4. The background instance awaits page load, parses `collectionSel` elements, and extracts exact values using `titleSel` and `linkSel`.
5. Extracted lists format into standardized objects and stream directly into the React Dashboard UI in real-time.

## Deep Scan Mode (Optional Plugin Step)

BingeKit supports an advanced parsing layer where a site search returns a single exact-match "Show Page" or Movie. 
If you want the plugin to *automatically click through* the direct match and parse the Seasons/Episodes natively in the UI, you can configure Media Structure selectors (`seasonSel`, `epSel`), or define a `Deep Scan JS Ripper`.

### Advanced Parametrized Scripting
Deep Scans are context-aware. If the user searches for a specific episode using common nomenclature (such as `Family Guy - s04e05`), the React Dashboard will automatically deconstruct this into parameters:
1. `baseQuery`: "Family Guy" (The only string actually passed to the streaming site's search engine, preventing target misses).
2. `queryTargetSeason`: "04"
3. `queryTargetEpisode`: "05"

If an Exact Match triggers on "Family Guy", these parameters are globally injected into the JS execution environment of the `Deep Scan JS Ripper`. Wait times, XHR/Fetch listeners, and multi-step navigation clicks can all be heavily optimized using these variables inside your script.

You have full programmatic access inside a custom ripper securely using the following variables:
- `window.SV_BASE_QUERY`
- `window.SV_TARGET_SEASON`
- `window.SV_TARGET_EPISODE`
- `window.SV_TARGET_SUBTITLE`

### Network Traffic Interception
Additionally, BingeKit intercepts the fundamental execution pipeline of the Chromium WebView, allowing you to await dynamically generated JSON or specific API responses *after* page load using:
- `await window.SV_WAIT_XHR(urlRegexPattern, timeoutMs = 15000)`

Because BingeKit intercepts responses directly at the document's V8 engine creation, you do not suffer from any race conditions. Even if the network request resolved *before* your Javascript executes, calling `SV_WAIT_XHR` will instantly resolve the intercepted response payload synchronously!

*Example Use Case:* If your target streaming site uses a dynamic obfuscated React payload to render episodes, you can instantly defeat the obfuscation:
```javascript
const responseText = await window.SV_WAIT_XHR("api/v1/episodes");
const data = JSON.parse(responseText);
return data.map(ep => ({ title: ep.name, href: ep.playUrl }));
```

## Discovery Feed Integration

To integrate a site into BingeKit's Discovery Feed (recommendations on the Explore page), you only need to define the `details.similarSel` property in your Site Plugin. The background engine will passively extract titles and URLs and push them into the user's discovery feed!

```json
"details": {
  "similarSel": ".recommendations .item",
  "similarTitleSel": ".title",
  "similarLinkSel": ".link"
}
```

## Tracking Workflow Configuration

To allow users to reliably track their show progress, you can define multiple **Tracking Flows** (`trackingFlows` array). This powerful feature lets a single Site Plugin track different types of URLs (e.g. Movies vs. TV Shows) using unique JS logic!

```json
"trackingFlows": [
  {
    "id": "anime-show",
    "name": "Ongoing Anime",
    "urlRegex": "anime/.+-episode-\\d+",
    "listSel": ".episodes-list",
    "itemSel": ".ep-item",
    "idExtractJs": "return 's01e' + el.querySelector('.num').textContent.trim();",
    "titleExtractJs": "return el.querySelector('.title').textContent;",
    "urlExtractJs": "return el.getAttribute('href');",
    "statusExtractJs": "return 'released';" 
  }
]
```
If configured, the Following/Activity view will periodically execute SmartFetch against tracked URLs to determine if there are new items that don't match the user's local `watchedEpisodes` list!

### Custom Tracking & Group Labels
When adding a custom tracker via the BingeKit Dashboard UI, users can define a **Group Label** (e.g. `arcane`). 
- If the user tracks the *same show* across multiple Site Plugins using the identical `Group Label` and the identical JS `id` format (e.g. `s01e01`), BingeKit will natively **sync watch progress across all sites**! Marking an episode watched on Site A will instantly mark it watched on Site B.
