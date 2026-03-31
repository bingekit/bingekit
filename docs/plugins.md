# Site Plugins

Site Plugins are structured JSON configurations that define scraping protocols, search URLs, custom CSS overrides, and custom JS environments for specific domains. They allow StreamView to deeply integrate with media websites without requiring hard-coded backend updates.

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
2. StreamView maps the query string, replacing `{q}` inside the `search.url`.
3. It spawns an invisible `SmartFetch` WebView parser in the background for *each* enabled Site Plugin.
4. The background instance awaits page load, parses `collectionSel` elements, and extracts exact values using `titleSel` and `linkSel`.
5. Extracted lists format into standardized objects and stream directly into the React Dashboard UI in real-time.

## Deep Scan Mode (Optional Plugin Step)

StreamView supports an advanced parsing layer where a site search simply returns a "Show Page". 
If you want the plugin to *automatically click through* the direct match and parse the Seasons/Episodes, you can orchestrate this using **Custom Flows**. 

If the primary `SmartFetch` script returns an object with a direct match URL, the Custom Flow can utilize a `[Hidden] Exec Custom SmartFetch` step to immediately spawn a second invisible window on that URL, scrape the episodes via `document.querySelectorAll`, and pipe them back to the StreamView player without the user ever leaving the Dashboard UI!

## Discovery Feed Integration

To integrate a site into StreamView's Discovery Feed (recommendations on the Explore page), you only need to define the `details.similarSel` property in your Site Plugin. The background engine will passively extract titles and URLs and push them into the user's discovery feed!

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
When adding a custom tracker via the StreamView Dashboard UI, users can define a **Group Label** (e.g. `arcane`). 
- If the user tracks the *same show* across multiple Site Plugins using the identical `Group Label` and the identical JS `id` format (e.g. `s01e01`), StreamView will natively **sync watch progress across all sites**! Marking an episode watched on Site A will instantly mark it watched on Site B.
