# Authentication & Live Setup Architecture

BingeKit handles automated site logins using two completely distinct pipelines: **Silent Background Authentication** (via `SmartFetch`) and **Foreground "Live Setup"**. This document explains the necessity of the persistent file-system cache constraint utilized specifically in the Foreground flow.

## 1. Silent Background Authentication (`SmartFetch`)
This is the standard auto-login protocol triggered from the UI. It spawns a hidden Chromium Webview via `SmartFetch`, instantly runs the domain-specific Javascript payload against the target URL, parses the login state invisibly, and closes the process. It never interacts with the physical cache, because it perfectly controls its own isolated process lifecycle.

## 2. Foreground "Live Setup" (The Persistent Cache Constraint)
Sometimes, users need to manually intervene in a login flow (e.g., to solve captchas, or click physical 2FA prompts). BingeKit's "Live Setup" tool initiates the automation script dynamically inside your *foreground* browser tab so you can monitor the DOM scan and intervene if necessary.

### The Interstitial Redirect Problem
Authentication flows almost always require the browser to survive multiple full URL changes and redirects (e.g., clicking "Login" -> rapidly redirecting to an `oauth` portal -> submitting a form -> navigating back to the site stream).

Whenever a browser natively reloads or redirects, the current Javascript context is completely annihilated. Traditional in-memory scripts injected into the browser tab are instantly destroyed the second the page redirects.

### Persistent Injection via Physical File Isolation (`bkLiveLogin_domain`)
To make a JavaScript automation sequence organically survive multi-page auth redirects natively on your foreground window, BingeKit permanently writes the payload to a physical file on your hard drive via the `CacheSet` engine. 

To support concurrent authentication flows across entirely different streaming platforms (and avoid a single Global Mutex file), BingeKit scopes each login task natively by its intended domain boundary constraint:

```javascript
// Writes to: \settings\workspaces\default\cache\bkLiveLogin_netflix.com.txt
ahk.asyncCall('CacheSet', 'bkLiveLogin_' + tgtDomainStr, wrappedJs);
```

Because `global.js` evaluates dynamically on **every** new page load globally across the entire Chromium session, it continuously queries these physical files via `CacheList("bkLiveLogin_")`. If it detects active scripts sitting in the cache directory, it evaluates them on that new page context. This creates a "Persistent Injection Loop" that survives cross-origin transitions until the user successfully completes the entire authentication flow context.

### Parallel Tab Execution Control (Web Locks API)
What happens if BingeKit opens two simultaneous tabs of the *exact same domain* during a Live Setup loop? Left unchecked, both tabs would query their local `global.js` script, evaluate the physical disk file simultaneously, and attempt to rapidly fill the login fields and perform button submissions in a chaotic parallel race.

To enforce Chromium process sanity, BingeKit dynamically wraps every Live Setup payload utilizing the natively integrated Web Locks API (`window.navigator.locks`):
```javascript
window.navigator.locks.request("bk-live-setup-" + tgtDomain, { mode: "exclusive", ifAvailable: true }, async (lock) => {
    if (!lock) { 
        console.log("Another tab holds the setup lock for " + tgtDomain + ". Yielding."); 
        return; 
    }
    // Execution payload...
});
```
Because Web Locks natively restrict cross-tab mutex validation implicitly over the identical origin space, only *one* parallel window successfully evaluates. All other overlapping tabs cleanly yield and gracefully silence themselves while the lock remains actively claimed.

Because `CacheSet` physically commits to the disk, **the task script persists even across full BingeKit reboots** unless it explicitly terminates safely.

## Modern Task Scoping & Self-Destruction
Previously, a core bug allowed "Live Setup" payloads to become "zombies"—permanent infinite loops embedded in a user's local disk cache. If an authentication test failed to finish, the script sat passively waiting in the cache forever. Whenever the user eventually navigated to unrelated sites (e.g., `Google.com`), the `global.js` crawler would indiscriminately load and resume the cached DOM-scanner routine. 

To prevent Ghost Scans, all new "Live Setup" routines are dynamically compiled with strict mathematical boundary validation natively enforcing organic **automatic self-deletion**:

1. **Successful Authentication:** If the script successfully resolves the DOM structure and injects the credentials seamlessly, it instantly fires a `bk-live-login-success` signal. The React UI orchestrator listens for this and permanently purges the script from the cache block.
2. **Scanner Timeout Grace Exhaustion:** If it scans the DOM sequentially on its internal tick interval and exhausts its `maxLimit` limit (usually ~40 seconds), it fires a fail State. The React UI purges the cache block gracefully.
3. **Leaving the Credential Scope:** Most critically, the foreground payload parses its current Hostname against the `cred.domain` constraint dynamically on every evaluation frame. If the user wanders outside of the target domain boundary (e.g., abandoning the Netflix setup and opening `blank.localhost`), the script automatically recognizes the constraint failure. It instantly forces an abort signal, commanding the React UI to aggressively sanitize the cache, perfectly neutralizing the task before it attempts to scan irrelevant domains. 

## Advanced Authentication & OAuth Mapping
Some sites (like Fadr) use third-party OAuth providers (like Google or Facebook) hosted on completely different domains (`accounts.google.com`). BingeKit supports aggressively matching credentials across these domain bridges natively.

### 1. Custom OAuth Login Domains
If you add an OAuth Match pattern in the plugin's Authentication config (e.g., Name: `Google Auth`, Pattern: `https://accounts.google.com/*redirect_uri=*fadr.com*`), the BingeKit Credential Manager will detect this.
When adding a credential, you can specifically assign your Google details to this "Fadr (Google Auth)" wildcard pattern. BingeKit will then successfully inject your credential even when navigating completely away from `fadr.com` into the Google Auth portal.

### 2. Clicking OAuth Accounts natively via Custom Login JS 
If you are already logged into Google natively in the background, you might encounter a "Choose an account" screen instead of a raw email/password box.
You can use **Custom Login JS Override** to seamlessly parse the DOM and click the exact account list item matching your assigned generic `{username}` directly instead of waiting for inputs:

`javascript
// Example: Google "Choose an account" auto-clicker
const email = '{username}'.toLowerCase();
const accounts = document.querySelectorAll('div[data-identifier]'); // Google's account nodes

let found = false;
for (const acc of accounts) {
    if (acc.getAttribute('data-identifier').toLowerCase() === email) {
        acc.click(); // Click our specific user profile natively!
        found = true;
        break;
    }
}
// Fallback: If we aren't in the list, tell Google to let us type our password
if (!found) {
    const useAnother = Array.from(document.querySelectorAll('div')).find(el => el.textContent === 'Use another account');
    if (useAnother) useAnother.click();
}
``n
### 3. Error Selector (Abort Loops)
If an authentication flow reaches a site-specific error prompt (e.g. "Problem signing in" or a specific "Captcha Required" popup), BingeKit will by default attempt to loop indefinitely until the max timeout. To prevent this, define an `errorSel`.
For dynamic SPAs where simple CSS isn't enough, use the `js:` prefix:
`js:var a=document.querySelector(".notification"); return !!a ? a.textContent.includes("Problem") : false;`
If this returns true, the Flow safely aborts and wipes its RAM credential footprint immediately.
