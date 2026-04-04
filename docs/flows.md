# Custom Flow Engine & Macros

BingeKit exposes a macro-based Flow Engine allowing Power Users to build sequentially chained automation securely natively resolving without requiring full auto-compilation!

## Variables and The `{prev}` Pipeline
At the core of a Custom Flow is the secure pipeline. Steps map data back and forth by storing string payloads synchronously in the isolated `{prev}` tag safely.

### Example Logic Chain:
Imagine sequentially jumping between natively restricted bounds using Context Scope shifting safely:

```json
// Flow Definition
[
  // 1. Enter the sandboxed Player DOM and scrape natively
  {
    "context": "Player",
    "action": "injectJs",
    "args": "return document.querySelector('.hero-video-url').href;"
  },
  
  // 2. Safely jump completely outside the Player into the Host App interface 
  // and natively drop `{prev}` efficiently!
  {
    "context": "App",
    "action": "injectJs",
    "args": "ahk.ShowToast('Found URL: {prev}', 'info'); ahk.UpdatePlayerUrl('{prev}');"
  }
]
```

## Context Scopes Explained

Actions strictly demand routing cleanly targeting one of the execution boundary variants natively:

- **`[App]` Context:** Fires JS directly onto the primary UI React wrapper globally. Useful for directly interacting with `ahk` native COM variables seamlessly.
- **`[Player]` Context:** Fires explicitly onto the exact primary streaming window dynamically bypassing cross-domain context blocking safely natively.
- **`[Hidden]` Context:** Defers securely the script string array entirely to a background Chromium execution node natively protecting the foreground streaming state cleanly!

## Primary Interaction Macros

BingeKit auto-manages complex DOM bindings dynamically natively for standard interactions preventing frustrating synthetic React event dropping mechanisms cleanly!

Instead of writing manual loops properly invoking JS DOM clickers, configure generic pipeline steps efficiently:

*   **`waitForElement`**: A powerful native staller perfectly checking iteratively natively every 100ms securing the flow pipeline from failing against dynamically late-rendering DOM content.
*   **`interact` (setValue)**: Defeats modern JS Frontends correctly cleanly firing all necessary synthetic React/Vue/Svelte global events inherently triggering `input` and `change` nodes simultaneously naturally. Use `selector;setValue;payload_string`.
