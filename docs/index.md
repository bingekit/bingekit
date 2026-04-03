# BingeKit Documentation Hub

Welcome to the BingeKit documentation. BingeKit is a headless-capable, fully synchronized media automation platform built on an AutoHotkey v2 (AHK) foundation with a React-based frontend. It dynamically spawns persistent edge WebView2 instances and manages seamless bi-directional JS/COM RPC bridges.

## Documentation Index

Below is a map of the different technical areas within the project:

| Documentation Topic | Description |
| ------------------- | ----------- |
| [**Initial Setup and build**](setup_and_build.md) | How to set up and build the project. |
| [**Architecture Overview**](architecture.md) | The core design logic: why we bridge AHK with WebView2, how multi-tiered blocking works, and the project's foundational ethos. |
| [**The API Reference**](api.md) | A comprehensive guide to the massive `window.chrome.webview.hostObjects.sync.ahk` API used to bridge the React frontend and AHK backend. Groups APIs by their usage scope (Main App vs. Player vs. Hidden fetchers). |
| [**Site Plugins Configuration**](plugins.md) | How to build plugins. Explains the configuration structures for domains containing targeted userscripts, block rules, generic element selectors, and metadata trackers. |
| [**Native Types & Tracking**](types_and_tracking.md) | Defines the strict JSON object structures (SearchResult, VideoPayload) expected by the React UI and breaks down cross-site episodic tracking logic. |
| [**Custom Flows Engine**](flows.md) | Details the automated workflows engine meant to script complex browser behaviors (navigation, clicking, parsing) without user interaction. |
| [**Remote Parsing & SmartFetch**](smartfetch.md) | How to execute silent scrapers using background/hidden WebView2 instances. Crucial for asynchronous execution without blocking the UI thread. |
| [**Userscripts & DOM Styling**](userscripts.md) | How BingeKit evaluates and injects dynamic javascript payloads (like Tampermonkey) across targeted domain patterns to rewrite or observe the DOM. |

## Quick Start
If you are modifying the React frontend and need to interact with the system (e.g., download a file, toggle fullscreen, resize a player), start with the [API Reference](api.md).

If you are trying to add a new media site to the platform, begin with [Site Plugins](plugins.md).
