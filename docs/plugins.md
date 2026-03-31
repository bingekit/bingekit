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
