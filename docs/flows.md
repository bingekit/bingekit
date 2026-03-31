# Custom Flows Engine

Custom flows allow chainable macro functionality without compiling AHK scripts. Flows are stored locally and iterate step-by-step asynchronously. When evaluating a Custom Flow step, the returned output is piped through `.currentVar` and is available sequentially as `{prev}`.

## Variables & Context

Variables dynamically update during execution. You can insert them as `{varName}` into any step parameter.
- `{url}`: Resolves to the current Player URL.
- `{prev}`: Resolves to the exact output/return string of the immediately preceding step.
- `{input}`: Generic user input (sometimes used as the trigger argument).

## Execution Contexts

Flows categorize actions into distinct scopes to prevent DOM collisions:

- **`[App]`**: Executes on the React Frontend (e.g., Navigate internally, update URL bar).
- **`[Player]`**: Targets physical interactions mapped directly into the UI's primary `WebView2` window.
- **`[Hidden]`**: Spawns a dedicated instance strictly for resolving an action independently without disturbing the user's video playback.
- **`[Flow]`**: Metaprogramming (e.g., calling another sub-flow or awaiting timers).

## Action Steps

### 1. Wait For Element (`waitForElement`)
Halts execution until the specific element selector appears in the DOM.
- **Context**: `[Player]`
- **Timeout**: Hardcoded limit (e.g., 100 loops of 100ms = 10s timeout).

### 2. Interact Object (`interact`)
Issues synthetic DOM events precisely targeted at a selected element.
- **Context**: `[Player]`
- **Modes**: `click` | `setValue`
- **Under the Hood**: When `setValue` is used, StreamView automatically simulates user bubbling inputs:
  ```javascript
  el.dispatchEvent(new Event('input', {bubbles: true}));
  el.dispatchEvent(new Event('change', {bubbles: true}));
  ```
  This is required because modern Javascript frameworks (React, Vue) utilize synthetic event pools and deeply ignore direct `el.value = "x"` assignments.

### 3. JavaScript Execution (`injectJs` / `customSmartFetch`)
- **[Player] Inject JS**: Maps script over the visible player. Useful for overriding scroll constraints.
- **[Hidden] Exec Custom SmartFetch**: Bypasses the active window and loads a hidden headless Edge layer to harvest specific API endpoints, wait for canvas renders, and pass values securely into `{prev}`.
