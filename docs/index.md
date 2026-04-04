# BingeKit Documentation Hub

Welcome to BingeKit! 

BingeKit is a headless-capable, fully synchronized media automation platform. At its core, it is built on a high-privileged **AutoHotkey v2 (AHK)** foundation that physically orchestrates one or more native Microsoft Edge **WebView2** instances. The primary UI is driven by a beautiful **React** frontend, securely communicating over a custom IPC bridge.

> [!NOTE]
> BingeKit is not an Electron app. It is a native Windows application that uses edge rendering purely for presentation and web-scraping. This gives it immense power to manipulate OS-level windows, spawn hidden parsing browsers, natively download files, and intercept network traffic.

## Using this Documentation

This documentation has been structured linearly. Depending on your goals, choose your path:

### Platform Architecture & Foundations
- 🏗️ [**Architecture Overview**](architecture.md) — The fundamental "Why" and "How" of BingeKit. Understand the boundary between the AHK Host and the React Client, IPC messaging, and credential security.
- 🔗 [**The API Reference**](api.md) — A comprehensive guide to the `ahk` COM interface. Clearly separated into **Internal APIs** (building React components) and **User APIs** (automating media).

### Automation & Scraping Systems
- 🕵️ [**The Background Fetcher**](smartfetch.md) — Deep dive into `SmartFetch` and `RawFetchHTML`. Learn how to spin up invisible browsers to scrape dynamic SPAs or defeat Cloudflare without dropping frames.
- 🎬 [**Site Plugins**](plugins.md) — The lifecycle of a domain plugin. How BingeKit intercepts traffic, blocks ads, injects styles, and deeply scans video elements on external streaming sites.

### Scripting & Customization
- ⚡ [**Userscripts & Scripting**](userscripts.md) — A practical guide on writing Tampermonkey-style scripts to interact directly with the BingeKit ecosystem. Includes flows for hooking into the universal video tracker.
- 🤖 [**Custom Macros & Flows**](flows.md) — How to chain powerful multi-context commands. Learn how to sequence clicks, navigations, and extractions natively using JSON piping.
- 🔍 [**Dashboard Search Commands**](search_commands.md) — Advanced syntax for querying specific episodes, identifying rent/buy statuses, and using price limits directly from the search bar.

### Other References
- ⚙️ [**Setup & Build**](setup_and_build.md) — Instructions for cloning and compiling your own BingeKit environment.
- 🏗️ [**Native Types & Tracking**](types_and_tracking.md) — JSON schema structures expected by the ecosystem.

---
**Ready to dig in?** Start by understanding the [Architecture](architecture.md).
