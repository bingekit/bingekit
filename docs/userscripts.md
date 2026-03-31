# Userscripts

Userscripts natively inject CSS/Javascript logic forcefully into domains to optimize the user experience, reshape external UIs, or bridge custom UI components into StreamView.

## Match Rules & Protocols

Every Userscript defines a `match` URL parameter standardizing execution locations.

### Wildcard Matching
Standard Regex or Partial String Matching formats (e.g., `*youtube.com/watch*`).

### Custom Application Matching
Because StreamView renders React layouts independently alongside the external `WebView2` Player, there are circumstances where you want to execute Userscripts against internal views.

StreamView maps internal dashboards through the `custom:` prefix.
- `custom:dashboard`
- `custom:settings`
- `custom:discover`

**Example:**
If you want to append a Custom RSS feed widget directly onto the main StreamView dashboard, you would create a Userscript matching `custom:dashboard` containing JS that locates the container and injects a formatted widget block!

## Execution Timing

Userscripts are stored locally into `\scripts\script_{id}.json` directly inside the AutoHotkey Workspace profile memory.
They invoke natively via `AddScriptToExecuteOnDocumentCreatedAsync`, meaning they apply synchronously BEFORE the DOM content finishes loading. This ensures Userscript CSS applies instantly, avoiding ugly flashes of unstyled content (FOUC) when removing sidebars or altering themes!

### Debugging
If a script fails to execute, you can check if DevTools are being blocked. StreamView overrides restrictive anti-debugging protections built by streaming sites by manually disabling `disable-devtool.min.js` in the Network Block list. If a site still restricts you, append the specific script URL blocking developer tools to the **Native Adblocker WebResource Filters** grid!
