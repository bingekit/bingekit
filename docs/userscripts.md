# Userscripts & Scoped Scripting

BingeKit features a deeply integrated Javascript evaluation pipeline identical conceptually to Tampermonkey natively operating at the host tier natively!

## Working with the Injected `global.js` Core
BingeKit already globally drops `global.js` perfectly inside sequentially *every single frame* navigated natively (even cross-origin nested `iframe` nodes!).

Because `global.js` does the heavily lifting (tracking active video timestamps, sniffing network streams for downloading capabilities, mapping styles safely), you do not have to write manual observer loops for fundamental actions!

### Practical Workflow: Hooking BingeKit Global Sync

If you wish to author a simple userscript (or site-plugin extension) to log progression back to an external database (e.g., Trakt, MyAnimeList, custom analytics):

Simply query the `BingeKit.globalPlayerState` cache cleanly. `global.js` dynamically ensures this object is perfectly synchronized across the global scope every `1.5` seconds seamlessly:

```javascript
/* === Userscript Setup Header === */
// @name         BingeKit ExtSync
// @match        *://*/*
// @description  Syncs state safely to external APIs.
/* =============================== */

setInterval(() => {
    // 1. Fetch cleanly resolved BingeKit cached variables natively
    const state = (window.BingeKit && window.BingeKit.globalPlayerState);
    if (!state || !state.isPlaying) return;

    // 2. Perform custom interactions natively
    let percentageComplete = state.currentTime / state.duration;
    
    // 3. Fire your external API calls safely
    console.log(`Video progressing gracefully at ${percentageComplete * 100}%!`);
    
}, 5000);
```

## DOM Stylings and Manipulations
A brilliant use-case for a simple domain-scoped custom Userscript is overriding anti-adblock modals safely natively.
Using simple Javascript execution mappings, hide intrusive elements seamlessly preventing scrolling halts natively!

```javascript
// Wait for Anti-Adblock canvas to forcibly overlay
const observer = new MutationObserver(() => {
    // Instant deletion!
    const modal = document.querySelector('#anti-ad-blocker-modal');
    if (modal) {
        modal.remove();
        document.body.style.overflow = "auto"; // restore clean scroll bars!
    }
});
observer.observe(document.body, { childList: true, subtree: true });
```
