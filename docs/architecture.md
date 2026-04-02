# StreamView Architecture & Technical Foundation

StreamView operates on a specialized hybrid architecture built on top of AutoHotkey v2 (AHK2) and the Microsoft Edge WebView2 runtime. It functions not just as a typical wrapper, but as a customized, highly-privileged browser controller and frontend host.

The framework is designed to empower the traditionally restricted WebView2 environment, achieving Puppeteer-like control semantics without relying on massive Node.js dependencies, external command-line automation tools, or strictly polling-based CDP APIs.

## Technology Stack

The project operates across three distinct contextual layers:

1. **Frontend (App):** A modern SPA built with React, TypeScript, and Vite. It serves as the primary un-restricted graphical interface.
2. **Host (AHK2):** The core AutoHotkey v2 engine. It manages the native Windows GUI, raw WebView2 DOM bindings, IPC bridging, background window management, native system APIs (e.g., WinHTTP downloads), and asynchronous event loops.
3. **Web Context (Extensions/Injections):** Dynamic layers of custom JavaScript, userscripts, and observer scripts injected directly into specific site domains at the WebView level.

## Core Technical Achievements

### 1. The WebView2 Controller ("Puppeteer-Lite")
Rather than simply rendering a web page, StreamView heavily instruments the WebView2 instance:
*   **Hidden Off-Screen Controller:** StreamView utilizes background/hidden WebView2 instances to silently parse, extract, evaluate JS, and manipulate resources without disrupting the main user UI.
*   **Deep Navigation & DOM Control:** Relying on precise COM interfaces and execution contexts, the host can dynamically bypass standard browser safeguards (like enforcing injection on `about:blank` proxies or tightly bound custom protocols) to ensure execution persistence.

### 2. Multi-Tiered Ad & Tracking Blocker
The ad-blocking pipeline acts across multiple scopes to ensure sites remain pristine, regardless of how aggressively they obfuscate their ad payloads:
*   **Network-Level Blocking:** Hooks into the native `WebResourceRequested` event to catch and cancel HTTP requests to ad, telemetry, and tracking networks at the host level before network I/O occurs.
*   **Inline Resource Sanitization:** Capable of sniffing and blocking malicious or intrusive inline `<script>` tags dynamically.
*   **Cosmetic JS Blocking:** Injects early-execution scripts that set up robust `MutationObserver` listeners. Undesirable DOM nodes (popups, overlays, anti-adblock modals) are instantly caught and removed or hidden (`display: none`) the moment they enter the DOM.

### 3. Dynamic Userscript Engine
A resilient userscript execution pipeline that behaves similarly to extensions like Tampermonkey/Greasemonkey:
*   Scripts are evaluated and injected across defined domain patterns.
*   It bypasses limitations on secure execution environments by forcing execution at strategic navigation milestones (`NavigationStarting`, `DOMContentLoaded`), ensuring the payload is ready to process the page before the site's own scripts can interfere.

### 4. Site Plugins Architecture
StreamView abstracts site-specific logic into highly modular **Plugins**:
*   A Plugin defines configuration structures for domains containing targeted userscripts, ad-block allow/block rules, generic element selectors, and video tracking metadata.
*   Instead of hardcoding logic in the engine, integrating a new media source is as simple as defining a single JSON/JS configuration object with its localized userscripts.

### 5. Automated Data Flows
**Flows** provide an automated abstraction meant to script complex, user-like behaviors directly through the active or hidden WebView instances:
*   They string together navigation, searching, pagination, and DOM clicking in a structured format.
*   Flows transform fragmented web data sources into an internal API, efficiently turning messy HTML into parsable JSON natively fetched by the background process.

### 6. Native Interfaces & IPC Bridging
*   **Two-Way Asynchronous API:** A robust `window.chrome.webview.postMessage` bridge interfaces the React frontend with the AHK2 host.
*   **Native Empowerments:** The interface can orchestrate heavy native tasks—such as invoking COM-based binary downloading pipelines (`WinHttpRequest`), triggering ffmpeg media conversions natively, and controlling window behavior—without blocking the main thread or relying on bloated standard libraries.
*   **Persistent UI Contexts:** Sub-interfaces logically wrap themselves over standard application tabs, retaining user histories, scroll positions, and state independently.

## Adaptation & Open Source
While StreamView was initially focused on organizing and controlling media streams seamlessly, the foundation is completely agnostic. The heavy lifting—bridging AHK2 with WebView2, network interception, automated hidden flows, userscript injection, and IPC logic—has effectively created a framework for building highly capable desktop utilities, scrapers, and local-first software. This architecture can easily be adapted into entirely different projects needing granular web automation and a native desktop experience.
