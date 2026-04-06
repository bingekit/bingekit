# Native Object Types & Tracking Engine

BingeKit requires your Plugins and Javascript extractors to return structured, identical shapes so the React Dashboard can properly parse and sync media metadata uniformly.

---

## 1. Expected Object Types

### A. Search / Discovery Results
When the background SmartFetcher evaluates a website search or processes the Discovery feed, the `BK_SEARCH_RESULT` array should consist of these objects:

```typescript
type SearchResult = {
  title: string;        // The display name of the Movie/Show (e.g. "Arcane")
  url: string;          // The absolute HTTP URL to the media on the host site
  image?: string;       // (Optional) Background poster or cover thumbnail URL
  subtitle?: string;    // (Optional) Used to display "Ep. 5" or "1080p WebRip"
  isFolder?: boolean;   // (Optional) Set 'true' if the URL leads to a series page, 'false' if direct video
};
```

### B. Tracked Episodes (Activity View)
When a Tracking Flow executes periodically, the `statusExtractJs` must resolve the exact released condition:

```typescript
type TrackedEpisode = {
  id: string;         // STRICT FORMATTING REQUIRED! e.g., 's01e05' or 'ep10'
  title: string;      // "Episode 5 - The Boy Savior"
  url: string;        // Absolute HTTP link to the episode
  status: "released" | "unreleased"; // Crucial! Unreleased episodes stay faded out in the Dashboard
};
```

### C. Deep Scan Video Nodes (Player Execution)
If you utilize a `Deep Scan JS Ripper`, it executes when the user clicks an Episode. Your script MUST hand back this exact object to successfully initialize the `PlayerVW`:

```typescript
type VideoPayload = {
  videoUrl: string;       // Direct HLS (.m3u8), DASH (.mpd) or mp4 source
  quality?: string;       // Initial quality (e.g., '1080p')
  subtitles?: {           // Array of accessible VTT/SRT files
    language: string;
    url: string;
  }[];
  headers?: {             // Any required headers to bypass 403 Forbidden!
    "Referer"?: string;
    "User-Agent"?: string;
  };
}
```

---

## 2. The Tracking Engine Workflow

The Tracking Engine is what allows BingeKit to passively notify you when new episodes of your favorite shows air, turning standard websites into an automated RSS feed.

### How Plugins Set It Up
Inside a `Site Plugin` JSON configuration, you define an array of `trackingFlows`:
```json
"trackingFlows": [
  {
    "id": "anime-show",
    "name": "Ongoing Anime",
    "urlRegex": "anime/.+-episode-\\d+",
    "listSel": ".episodes-grid",
    "itemSel": ".ep-node",
    "idExtractJs": "return 's01e' + el.dataset.epNum;",
    "titleExtractJs": "return el.querySelector('.title').textContent;",
    "urlExtractJs": "return el.getAttribute('href');",
    "statusExtractJs": "return el.classList.contains('locked') ? 'unreleased' : 'released';" 
  }
]
```

**Step-by-Step Execution:**
1. A user clicks "Track This Page" inside the Player on `https://example.stream/anime/cool-show`.
2. BingeKit iterates all plugins. It matches the URL against the plugin's `urlRegex`.
3. BingeKit spawns a silent background browser, navigating to the saved URL.
4. It awaits the DOM and queries `listSel` -> iterating every `itemSel` child.
5. Inside every `itemSel` component, it locally evaluates the extraction JS strings, assigning `el` as the HTML element reference.
6. The resulting `TrackedEpisode[]` array is stored natively. If an episode exists in the payload but NOT in the user's `watched` database, it jumps to the top of the Activity View!

### Cross-Site Syncing (The "Group Label")

The most powerful feature of Tracking is **Group Syncing**. Streaming sites often go down or lack full series. BingeKit solves this natively.

1. **The Group Label:** When a user clicks "Track", BingeKit prompts them to enter an optional `Group Label`. Think of this as the internal Series ID (e.g., `the-office`).
2. **The Magic String (ID Matching):** Remember `idExtractJs: "return 's01e' + el.dataset.epNum;"`? For cross-site tracking to work, the `id` strings must identically match across *different plugins*.
   *   Site A returns: `s01e05`
   *   Site B returns: `s01e05`

If the user tracks *both* sites and assigns them the *same* `Group Label`, BingeKit merges the history database. Clicking "Mark as Watched" on Site A's `s01e05` object will instantly mark Site B's `s01e05` as watched on the dashboard!
