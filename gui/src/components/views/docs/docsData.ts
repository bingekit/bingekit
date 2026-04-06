export const DOCS_DATA = [
  {
    id: 'getting_started',
    content: `# Getting Started with BingeKit

Welcome to **BingeKit**, a headless-capable, fully synchronized media automation platform. 

This guide will walk you through starting from an absolute blank slate (no plugins installed) to automating your first video stream.

## The Blank Slate
When you first run BingeKit, it knows absolutely nothing about the websites you want to visit. There are no built-in scrapers for Netflix, Hulu, or any other site. Instead, BingeKit provides a powerful **engine** that physically orchestrates hidden Microsoft Edge (\`WebView2\`) instances to do your bidding.

To make BingeKit do anything useful, you need to configure [Plugins](#making_plugins), write [Userscripts](#logic_flows), or design [Logic Flows](#logic_flows).

## 1. Workspaces & Portable Mode
BingeKit operates on the concept of **Workspaces**. All your data—configurations, downloaded plugins, bookmarks, and encrypted credentials—are isolated entirely within your configured workspace folder. 
- **Portable Mode**: If you enable portable mode, BingeKit stores everything in its own root directory. You can copy the entire folder to a USB drive and run it on any Windows machine—no installation required.
- **Why this matters**: You can have a "Work" workspace and a "Personal" workspace, completely isolating your plugins, browsing data, and watch history.

## 2. Navigating the Interface
- **Dashboard**: Your home base. You can initiate [Search Commands](#protips) here.
- **Player**: The actual browser view where media plays natively.
- **Extensions**: Where you manage, create, and update your Site Plugins.

## 3. Your First Step
If you have no plugins, your first step is to either:
1. Connect to a Plugin Repository in **Settings -> Advanced**.
2. Or, build your own [Site Plugin](#making_plugins) from scratch.

Once a plugin is loaded, BingeKit will automatically intercept navigations to that site, trigger [Adblocking](#adblocking), manage automated logins, and hook into its central video player.`
  },
  {
    id: 'principles',
    content: `# Principles and Concepts

Understanding the core philosophy of BingeKit is essential for debugging and mastering the platform.

## 1. Native Windows Host (AHKv2)
BingeKit is **not** an Electron app. 
It uses a highly privileged AutoHotkey v2 (AHK) host process. This gives BingeKit terrifying native power: it can manipulate OS-level windows, spoof hardware, bypass standard browser sandboxes, and natively intercept HTTP streams before they even resolve.

## 2. The React Frontend is just a Remote Control
The beautiful UI you are looking at right now is effectively just a "remote control" communicating via IPC (Inter-Process Communication) to the AHK Host. The UI does not play the video. The UI does not scrape the site. The AHK Host spins up hidden native \`WebView2\` instances to do the heavy lifting, and pipes the results back to the interface.

## 3. Storage & DPAPI Credential Security
When you instruct BingeKit to automate logins for a site, it **does not** store your passwords in plain text. 
Credentials are natively encrypted using the Windows **Data Protection API (DPAPI)**. This means the encryption key is derived directly from your Windows user login profile. Even if someone steals your Portable Workspace folder and copies it to another machine, your \`credentials.json\` or IndexedDB passwords cannot be decrypted.

## 4. SmartFetch and Invisible Browsers
Unlike standard HTTP web scrapers (like Python's BeautifulSoup or standard \`fetch()\`), BingeKit utilizes **SmartFetch**. 
When you request BingeKit to perform a [Deep Search](#protips) or execute a flow, it spins up a completely invisible Edge browser, executes real JavaScript, defeats Cloudflare, waits for the DOM to settle, and then extracts what you need. This means SPAs (Single Page Applications) and heavily obfuscated sites are scraped just as easily as static HTML.

## 5. The Unified Playback State
When a video plays in BingeKit's \`PlayerView\`, the AHK host injects tracking scripts directly into the page. These scripts listen for video events (\`play\`, \`pause\`, \`timeupdate\`, \`ended\`) and report them back. This allows BingeKit to maintain a globally synchronized watch history, even across deeply nested iframes.`
  },
  {
    id: 'making_plugins',
    content: `# How to Make Your Own Plugin

This is the most important skill in BingeKit. A **Site Plugin** defines exactly how BingeKit should behave when visiting a domain. You can see the full type expectation in [Types & Formats](#types).

Plugins are managed in the **Extensions** tab. 

## The Plugin Structure
A Site Plugin is essentially a JSON-like object containing configuration settings and Javascript string injects.

### 1. Identify the Domain
You must define the \`domain\` (e.g., \`netflix.com\`). BingeKit will activate this plugin anytime a URL matches this domain or its subdomains.
Use \`matchUrls\` (an array of regex strings) if you need granular control, like only triggering on specific paths.

### 2. Video Extraction (The most critical part)
To track watch history, BingeKit needs to know exactly where the \`<video>\` tag lives physically in the DOM.
- **\`videoSelector\`**: A standard CSS selector pointing to the \`<video>\` element on the page (e.g., \`div.player-container video\`). If you omit this, BingeKit guesses, but explicitly setting it prevents false-positives on sites with background videos.
- **Iframes**: If the video is inside a cross-origin iframe, BingeKit handles this automatically by recursively injecting the tracker into *all* physical frames. You just need to make sure the selector matches the video tag *inside* the child iframe.

### 3. Automated Authentication & Encryption
BingeKit can manage native logins so you never have to type passwords. 
1. The user inputs their credentials in the UI via the "Manage Auth" modal (these are instantly [DPAPI Encrypted](#principles)).
2. In your plugin, configure the \`auth\` object. Set \`auth.encryptCreds = true\`.
3. Provide the CSS selectors so BingeKit knows what to automatically fill:
   - \`userSel\` and \`passSel\` (e.g., \`#email\`, \`#password\`).
   - \`submitSel\` (The login button).
4. **\`checkAuthJs\`**: The host runs this snippet randomly to determine if the user is logged out. Return \`true\` if authenticated, \`false\` if the user is unauthenticated. If \`false\`, BingeKit natively routes to \`auth.loginUrl\` and injects your credentials into the selectors.

#### \`botCheckJs\` & \`SmartFetch\` Timeouts (Captcha Resilience)
Sometimes, automated scraping hits Cloudflare captchas or stalled SPAs. 
By default, BingeKit will **automatically reveal** the hidden \`SmartFetch\` window if your script fails to return data before the *SmartFetch Expiration Timeout* (configurable globally in \`about:config\`).

You can also programmatically trigger this by accessing the native payload container. If your custom \`botCheckJs\` script evaluates to \`true\`, BingeKit forces the hidden window to become visible and centered so you can manually solve it:

\`\`\`javascript
// Example checking for Cloudflare Turnstile inside botCheckJs
if (document.body.innerHTML.includes('cf-turnstile') || document.querySelector('.cf-browser-verification')) {
  return true; // Auto-exposes the internal WebView!
}
return false;

// Example inside actionJs of a SmartFetch hook directly:
// window.chrome.webview.hostObjects["fetchResult_" + payloadId].UpdateWindow(true, "Debug View", 1000, 800);
\`\`\`

### 4. Basic Automation Snippets
These are raw JavaScript strings injected into the page globally when it loads. They execute in the secure context of the page wrapper.

#### \`autoPlayJs\`
Code designed to automatically hit the "play" button. Many sites block native autoplay until physical interaction. BingeKit simulates clicks via headless drivers, but this script tells it *what* DOM node to click.
\`\`\`javascript
const btn = document.querySelector('.vjs-big-play-button');
if (btn) btn.click();
\`\`\`

#### \`nextEpisodeJs\`
Code that returns the URL of the next episode, or actively clicks a "Next" button. Evaluated heavily when the video tracking engine broadcasts an \`ended\` event.
\`\`\`javascript
const nextLink = document.querySelector('a.next-ep-btn');
if (nextLink) return nextLink.href;
return null;
\`\`\`

### 5. Customizing the Viewport
You can inject CSS directly via the \`cssInject\` field. This is incredible for hiding annoying site banners, static navigation bars, or forcing the video player to fill the BingeKit viewport dynamically.
\`\`\`css
/* Force fullscreen player */
header, footer, .sidebar { display: none !important; }
.player-wrapper { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: 9999; }
\`\`\`

## Testing Your Plugin
Always test your plugin iteratively:
1. Open the **Extensions** tab and create a new plugin from scratch.
2. Fill out the domain and CSS.
3. Open the **Player** and navigate to the site.
4. Use the custom Developer Tools (F12) in the Player to test your selectors using standard \`document.querySelector()\` tests before pasting them into the plugin configuration.`
  },
  {
    id: 'adblocking',
    content: `# Adblocking & Network Filtering

BingeKit features a robust, multi-layered native adblocker managed entirely by the isolated AHK Host. Because BingeKit sits directly between the webview and the network via the \`ICoreWebView2WebResourceRequested\` event, it intercepts HTTP traffic *at the socket level* before it even reaches the renderer.

## How it Works

1. **Network Filters (Domain/Path Blocking):** 
   Network requests are checked against a highly optimized map of blocked domains (e.g., \`ads.google.com\`). If a match occurs, BingeKit instantly aborts the request, returning a 403 Forbidden. This completely prevents the bandwidth from being used, massively speeding up site hydration.
2. **Cosmetic Filtering (CSS Selectors):** 
   Ads that server-side render directly into the HTML payload cannot be blocked natively via network filtering without breaking the site. Instead, these are hidden dynamically using global injected styles based on known ad-container selectors.

## Managing the Filters

You can toggle the global Adblock state instantaneously from **Settings -> Adblock**.

### The Keyword Dictionaries
Adblock logic is heavily segmented and customizable:

- **Network Filters**: Full or partial string matches on raw URLs. If an image or script request URL includes a blocked string, it dies.
- **Ad Keywords**: specific generic terms commonly found in ad-delivery paths (e.g., \`/popunder/\`, \`?banner=\`).
- **Redirect Keywords**: Blocks tracking redirects that maliciously bounce you through 5 domains before hitting the main target.
- **Inline Keywords**: Specific to scripts attempting to maliciously execute inline \`window.open\` popups.
- **CSS Selectors**: A massive dictionary of DOM elements to universally \`display: none\` (e.g., \`.taboola-widget\`).

### Site-Specific Filtering
You do not need to rely solely on the global dictionary!
When creating a **[Site Plugin](#making_plugins)**, you can pass explicit override rules explicitly for that domain using \`networkBlockers\`, \`inlineBlockers\`, or \`elementBlockers\`. This is critical for sites that use heavy anti-adblock obfuscation where generic blocked terms break their proprietary video player scripts.

If a site's video player breaks entirely when Adblock is enabled, it means your global dictionary triggered a false-positive on a core player CDN. You can whitelist the required API domains by adding them to your global **Whitelist** in Settings.`
  },
  {
    id: 'logic_flows',
    content: `# Logic Flows & Userscripts

If Site Plugins define *how* to interact natively with a site, **[Custom Flows](#types)** define *architectural chains of actions* across systems.

A Custom Flow is a strict JSON array definition of sequential actions.

## Anatomy of a Flow
Think of a Flow as a macro. It consists of an array of \`FlowStep\` objects.

### Supported Flow Actions (\`type\`):
The AHK host is capable of running intense multi-step sequences.
- \`navigate\`: Commands the hidden browser to load a URL physically.
- \`wait\`: Pauses execution thread for a specific number of milliseconds.
- \`waitForElement\`: Blocks sequence execution until a specific DOM element appears synchronously on the page.
- \`interact\`: Simulates a native mouse click on a selector or types directly.
- \`extract\`: Pulls text or attributes from the DOM and securely stores it in a flow variable array.
- \`RawFetchHTML\`: Bypasses headless layers completely and just issues a fast generic HTTP request.
- \`smartFetch\` / \`smartSearch\`: Orchestrates an invisible \`WebView2\` instance to perform scraping while defeating Cloudflare.
- \`callPlugin\`: Bridges into your [Site Plugin](#making_plugins) to invoke pre-defined logic.

## Example Use-Case: Deep Search Delegation
Some plugins cannot construct a clean search purely via URL (e.g., \`example.com/search?q=query\`). They require you to physically load their site, type into a React-controlled search bar, wait for a dropdown, and extract results.
1. You bind \`delegateFlowId\` inside your \`SitePlugin.search\` to a custom flow you build.
2. The user types a query in the dashboard.
3. BingeKit spins up the Flow: It uses \`navigate\` to go to the site, \`interact\` to type the tracked query into the search box, \`waitForElement\` for the ajax results, and then \`jsExtract\` to return the DOM chunks directly back to the BingeKit React UI.
This entire complex sequence happens entirely unseen by the user, returning results instantly!

## Userscripts (Tampermonkey Equivalent)
Sometimes you don't need a headless scraper, you just want to modify the UI/UX of a page you actively browse the web with natively.
BingeKit supports full **Userscripts**. You map raw ES6 Javascript to a regex URL pattern array (\`domains\`), and BingeKit injects it into the global window execution context immediately on navigation load. Manage them safely via the **Userscripts** panel.`
  },
  {
    id: 'types',
    content: `# Types & Expected Formats

When editing JSON locally or extending the API, strict understanding of BingeKit's core architecture types is mandatory.

## The SitePlugin Schema
The core pillar holding domain logic together.
\`\`\`typescript
export interface SitePlugin extends BaseMetadata {
  id: string;
  name: string;
  baseUrl: string;
  
  // Authentication Block (DPAPI Supported)
  auth: {
    loginUrl: string;
    loginUrlJs?: string;
    captchaSel?: string;
    userSel: string;
    passSel: string;
    submitSel: string;
    encryptCreds: boolean;      // Enable DPAPI encryption
    checkAuthJs?: string;       // Is user logged in? Return true/false
    customLoginJs?: string;
  };
  
  // Search Parameters
  search: {
    urlFormat: string;          // e.g. "https://example.com/search?q={query}"
    itemSel: string;
    titleSel: string;
    linkSel: string;
    imgSel: string;
    delegateFlowId?: string;    // Override URL search with a raw Custom Flow execution
  };
  
  // DOM Interactions
  player: {
    playerSel: string;
    focusCss: string;
  };
  
  trackingFlows?: TrackingConfig[]; // Flow structures for extracting series IDs/Episodes
  
  // Custom Overrides
  botCheckJs?: string;
  customCss?: string;
  customJs?: string;
}
\`\`\`

## FlowStep Schema
Used by CustomFlow execution.
\`\`\`typescript
export interface FlowStep {
  id: string;
  type: 
    | 'RawFetchHTML' 
    | 'parseHtml' 
    | 'navigate' 
    | 'extract' 
    | 'callFlow' 
    | 'smartFetch' 
    | 'jsExtract' 
    | 'wait' 
    | 'waitForElement' 
    | 'interact';
  params: Record<string, any>;
}
\`\`\`

## JS Extraction Payloads
When writing custom Javascript injection logic for Site Plugins (such as \`searchJs\`, or extraction routines), BingeKit requires your Javascript to definitively return these specifically typed objects so the React UI can parse them correctly. 

### A. Search / Discovery Results
When a Search flow evaluates Javascript, it expects an array of these objects (\`BK_SEARCH_RESULT\`):
\`\`\`typescript
type SearchResult = {
  title: string;        // The display name of the Movie/Show (e.g. "Arcane")
  url: string;          // The absolute HTTP URL to the media on the host site
  image?: string;       // (Optional) Background poster or cover thumbnail URL
  subtitle?: string;    // (Optional) Used to display "Ep. 5" or "1080p WebRip"
  isFolder?: boolean;   // (Optional) Set 'true' if the URL leads to a series page, 'false' if direct video
};
\`\`\`

### B. Tracked Episodes (Activity View)
When a Tracking Flow executes periodically, your extraction logic must resolve to an array of these objects:
\`\`\`typescript
type TrackedEpisode = {
  id: string;         // STRICT FORMATTING REQUIRED! e.g., 's01e05' or 'ep10'
  title: string;      // "Episode 5 - The Boy Savior"
  url: string;        // Absolute HTTP link to the episode
  status: "released" | "unreleased"; // Crucial! Unreleased episodes stay faded out in the Dashboard
};
\`\`\`

### C. Deep Scan Video Nodes (Player Execution)
If you utilize a \`Deep Scan JS Ripper\`, it executes when the user clicks an Episode. Your script MUST hand back this exact object to successfully initialize the \`PlayerVW\`:
\`\`\`typescript
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
\`\`\``
  },
  {
    id: 'protips',
    content: `# Protips, Use-Cases, and Examples

## Usecase: The Cloudflare Verification Wall
**Problem**: You want to scrape structured data, but Cloudflare hits you with an "Are you human?" checkbox. Standard headless Node tools (Puppeteer) eventually get permanently flagged.
**Solution**: Set \`botCheckJs\` in your Plugin to detect \`.cf-browser-verification\`. When this script triggers locally, BingeKit pauses automation logic and physically reveals the isolated SmartFetch window on your desktop. Because BingeKit uses an authentic WebView2 footprint tied to your real Windows hardware, completing it manually works instantly. Once solved, it hides and continues invisibly!

## Usecase: Managing Aggressive Cross-Frame Trackers
**Problem**: A site embeds their video inside three layers of proprietary iframes originating from totally different domains.
**Solution**: BingeKit ignores cross-origin barriers internally! Do not attempt complex JavaScript mapping. Ensure the \`SitePlugin\` matching the *parent* domain is active. BingeKit natively cascades the video event listeners down into all DOM children asynchronously until it hooks the raw \`<video>\` element.

## Search Modifiers & Advanced Commands
The master dashboard search bar is physically tied to several powerful regex patterns that modify your query before hitting the Plugins. Append these to any search string:

1. **Deep Scan Engine (\`sXXeXX\` / \`- Subtitle\`)**
   Appending standard episode tracking formats like \`s01e05\` or \`s1 e5\` triggers BingeKit's **Deep Scan Match**. Instead of returning normal search results, the engine resolves the target, opens a background SmartFetch instance, and aggressively hunts for matching DOM nodes using your Plugin's \`tvConfig.epSel\` configurations.
   - Example: \`Arcane s02e03\` — Will return the direct video nodes for Episode 3, entirely bypassing the show's landing page!

2. **Price Thresholds (\`$<amount>\`)**
   If you have Plugins configured with \`costSel\`, you can enforce strict numerical filtering right from the bar!
   - Example: \`Interstellar $5.99\` — BingeKit evaluates all search results, parses the scraped strings into floats, and trims out any plugin offering it for over five dollars.

3. **Rental & Purchase Strictness (\`--rent\` / \`--buy\`)**
   Filters your results by the explicitly parsed \`rentBuySel\` returned from your web scrapers.
   - Example: \`Dune --rent\` — Hides all storefront purchase links, leaving only the cheaper rental objects.

> [!TIP]
> **Domain Overrides & Raw Links:** If you paste a raw \`https://\` URL or domain directly into the Dashboard search, BingeKit bypasses all Plugins and opens it natively inside your Web Navigation instance!
## Example: Absolute CSS Takeover
Sometimes merely hiding adverts using \`display: none\` leaves an ugly, misaligned DOM. 
Use \`customCss\` to physically detach and expand the video player:
\`\`\`css
body { overflow: hidden !important; }
.video-wrapper {
   position: fixed !important;
   top: 0 !important; left: 0 !important;
   width: 100vw !important; height: 100vh !important;
   z-index: 2147483647 !important;
}
\`\`\`
This achieves a native cinematic application experience for deeply bloated legacy websites.`
  },
  {
    id: 'limitations',
    content: `# Limitations & Debugging Architecture

As uniquely powerful as BingeKit's AHK+React IPC bridge is, it faces physical engine constraints you should understand.

## 1. Web API DRM (Widevine) Encryption
BingeKit CANNOT download, save, or easily stream extract DRM protected content natively (e.g., Widevine L1/L3, PlayReady). It is fundamentally a Chromium browser, not a decryption environment. 
If you simply watch the stream natively inside BingeKit, it works effortlessly because your host Windows Edge modules decrypt it. However, you cannot directly orchestrate a \`.m3u8\` raw bypass because the chunks mathematically fail absent the encrypted manifest keys.

## 2. Resource Exhaustion & Zombie Scrapers
If the parent application closes catastrophically (Kernel crash or forced kill via task manager), the background isolated \`WebView2\` processes responsible for your SmartFetches may orphan themselves, continuously chewing RAM. BingeKit has logic to systematically kill unlinked webviews during normal exit operations, but a "hard kill" bypasses this listener entirely. Open your Task Manager occasionally and prune old Edge instances if your machine feels sluggish.

## 3. High Capacity IndexedDB Persistence
Because BingeKit runs real Chromium profiles, sites construct and persist local data. Over 6 months of use, your local \`WorkspaceDir\\\\EBWebView\` cache will grow enormously natively as sites aggressively buffer 4k video chunks.

## How to Debug the Bridge

### "The UI infinitely hangs on 'LOADING COMPILED UI'"
This suggests the COM AHK Host failed to resolve the local \`index.html\` frontend payload from the simulated HTTP server, or it deadlocked awaiting the \`HideSplash\` initialization signal from your React AppContext. Verify no synchronous exceptions broke your hydration cycle in \`AppContext.tsx\`.

### "My Scripts are silently failing!"
1. **Domain Overlaps**: Validate your Plugin \`domain\`. Providing \`example.com\` when the site uses \`app.example.com\` will ignore hooks, unless you appropriately manage \`matchUrls\` with proper regular expressions.
2. **The F12 Console Pivot**: Open the developer console natively on active players. BingeKit safely outputs isolated, prefix console logs (\`[BK-INJECT]\`) during phase executions. Syntax errors thrown during string evaluations are instantly caught here.
3. **Invalid Selectors**: React apps actively mutate DOM class IDs dynamically. If your \`<video>\` selector was \`.player-xyz\`, it might now be \`.player-abc\`. Always map structural locators or stable IDs like \`[data-testid="player-window"]\` instead.`
  }
];
