# Custom Flows Engine

Custom flows allow chainable macro functionality without compiling AHK scripts. Flows are stored locally and iterate step-by-step asynchronously natively traversing cross-context environments. When evaluating a Custom Flow step, the returned output is piped through `.currentVar` and is available sequentially as `{prev}`.

## 1. Flow Blueprint (JSON Schema)
For a power user manually configuring a flow payload in `%LOCALAPPDATA%\BingeKit\workspaces\Default\flows`, a Flow is defined as a series of steps matching this schema:

```json
{
  "id": "login-to-provider",
  "name": "Auto Login Workflow",
  "steps": [
    {
      "context": "Player",
      "action": "injectJs",
      "args": "document.querySelector('body').style.opacity = '0.5';"
    },
    {
      "context": "Player",
      "action": "waitForElement",
      "args": "input[name='username']",
      "timeout": 5000
    },
    {
      "context": "Player",
      "action": "interact",
      "args": "input[name='username'];setValue;guest_user"
    },
    {
      "context": "Player",
      "action": "interact",
      "args": "button[type='submit'];click"
    }
  ]
}
```

## 2. Variables & Context Pipelining

Variables dynamically update during execution. You can insert them directly into any string parameter (e.g. `args`) utilizing curly braces:
- `{url}`: Resolves to the current Player URL.
- `{prev}`: Resolves to the exact output/return string of the immediately preceding step!
- `{input}`: Generic user input (sometimes dynamically bound when starting the flow).

### The `{prev}` Pipeline
You can chain steps logically using `{prev}`. For example, Step 1 parses a value in the DOM, and Step 2 saves it to disk natively.
```json
// Step 1: Extract string from DOM
{
  "context": "Player",
  "action": "injectJs",
  "args": "return document.querySelector('.auth-token').innerText;"
}
// Step 2: Use Native AHK API via the App context (piping {prev})
{
  "context": "App",
  "action": "injectJs",
  "args": "window.chrome.webview.hostObjects.sync.ahk.SaveData('auth.txt', '{prev}');"
}
```

## 3. Execution Contexts Explained

Flows categorize actions into distinct scopes to prevent DOM collisions and allow for extreme power-user flexibility:

- **`[App]`**: Executes Javascript globally on the protected React Frontend. Has full access to local dashboard states and the overarching BingeKit COM API Bridge.
- **`[Player]`**: Targets physical interactions mapped directly into the UI's primary `WebView2` window instance currently rendering video.
- **`[Hidden]`**: Spawns a dedicated BingeKit instance strictly for resolving an action independently via SmartFetch without visually disturbing the user's video playback.
- **`[Flow]`**: Metaprogramming engine control (e.g., calling another sub-flow or hard-stopping loops).

## 4. Action Steps & Macros

### 1. Wait For Element (`waitForElement`)
Halts execution until the specific element selector appears in the DOM.
- **Context**: `[Player]`
- **Timeout**: Defaults to 10s (e.g., 100 loops of 100ms). If it fails, the Flow aborts throwing an error.

### 2. Interact Object (`interact`)
Issues synthetic DOM events precisely targeted at a selected element.
- **Context**: `[Player]`
- **Format**: `selector;mode;value`
- **Modes**: `click` | `setValue`
- **Under the Hood**: When `setValue` is used, BingeKit automatically simulates user bubbling inputs:
  ```javascript
  el.dispatchEvent(new Event('input', {bubbles: true}));
  el.dispatchEvent(new Event('change', {bubbles: true}));
  ```
  This is required because modern Javascript frameworks (React, Vue) utilize synthetic event pools and deeply ignore direct `el.value = "x"` assignments.

### 3. JavaScript Execution (`injectJs` / `customSmartFetch`)
- **[Player] Inject JS**: Maps script over the visible player. Useful for overriding scroll constraints.
- **[Hidden] Exec Custom SmartFetch**: Bypasses the active window and loads a hidden headless Edge layer to harvest specific API endpoints, wait for canvas renders, and pass values securely into `{prev}`.
