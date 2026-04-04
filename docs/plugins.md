# Site Plugins & Workflows

A Site Plugin encapsulates domain-specific logic defining exactly how BingeKit operates dynamically on that specific URL target. It overrides styles, blocks specific trackers, extracts metadata, and translates third-party site patterns natively into the BingeKit ecosystem.

## The Plugin Workflow

Rather than just raw JSON, BingeKit reads a plugin dynamically whenever the user navigates. 
Here is a comprehensive breakdown of the step-by-step lifecycle flow:

### 1. Interception Phase (`siteBlockers` & Network)
Before any pixels hit the screen, BingeKit binds the domain network rules. If `customCss` or `siteBlockers` are defined:
- **Blockers:** Malicious HTTP requests matching arrays (e.g. `example-ads.com`) are instantly severed securely.
- **Styling:** Custom CSS injections (like `body { background: black }`) apply seamlessly directly into Chromium's default injection pipeline avoiding any visual light mode flashing!

### 2. Deep Scanning Phase (`deepScan`)
If you define parameterized scraping logic, BingeKit's `Search View` natively aggregates it. When a user queries a string natively on the BingeKit Dashboard, BingeKit instantiates a `SmartFetch` implicitly.
It grabs your parameters natively via globally registered keys and allows secure custom Javascript mapping:
```javascript
// Access parameters safely from user input directly injected by host environment!
const searchTerm = window.BK_BASE_QUERY; 
const seasonNum = window.BK_TARGET_SEASON;

// Scrape dynamic payload returning parsed arrays implicitly.
```

### 3. Syncing & Tracking Automation (`trackingFlows`)
This is the core magic! A huge use case for plugins is native cross-platform synchronization!
If you bind tracking selectors natively into the plugin, BingeKit monitors the user's active Player loop continually.

> [!IMPORTANT]
> If multiple site plugins (e.g., `Netflix Plugin` and `Hulu Plugin` and an `Anime Ripper Plugin`) share the exact same logical `Group Label` tracking tag provided by the User, marking progression on *one* domain seamlessly updates progression metrics natively on all other participating linked sites!

## Practical Example Use Case
Imagine a site heavily wraps their videos in multiple layered iframes. You want a site plugin to safely "peel" the player layer securely:

By defining `customJs` in the plugin configuration JSON:
```javascript
// Wait for DOM load heavily...
window.addEventListener('DOMContentLoaded', () => {
    // Only engage if the primary wrapper iframe exists natively
    const adFrame = document.querySelector('.intrusive-player-wrap iframe');
    
    // Safely force navigation of Top window avoiding cross-origin limits natively
    if (adFrame && adFrame.src) {
       window.location.href = adFrame.src;
    }
});
```
This forces BingeKit instantly unwrap the URL stack to the base stream level before the page ever fully stabilizes natively protecting the user.
