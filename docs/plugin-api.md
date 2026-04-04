# Hooking into BingeKit's Global Play State

BingeKit universally exposes a reliable, cross-frame `BingeKit` object on every frame that natively hooks into the player state. 

This document details how to read the auto-synchronized cache of video playback rather than trying to painfully query DOM nodes and nested iframes manually.

### How it works with Cross-Origin Iframes
Because of browser cross-origin limits, top-level site plugins typically can't peak into `video` elements if they're embedded in cross-origin iframes. 

BingeKit solves this gracefully! The natively injected `global.js` script actively probes all media elements globally. Whenever it finds the active player (even deep inside nested iframes!), it beams the `currentTime` and `duration` up to the top window using secure `postMessage` channels. 

The top-level window then computes the actual active stream and broadcasts the *authoritative* `globalPlayerState` right back down the tree. This cycle happens flawlessly every 1.5s!

So, the top-level site script **can** simply grab the time by referencing `BingeKit.globalPlayerState`!

## 1. Reading the Cached Play State

BingeKit updates the caching objects approximately every ~1.5s inside every context (both the top-level outer frame and embedded cross-origin iframes alike).

You can easily read the state of whichever source is *currently active* in the tab by using:

```javascript
// BingeKit guarantees this exists in all contexts if the app is active 
// (or polyfill it natively if testing externally)
let bkState = (window.BingeKit && window.BingeKit.globalPlayerState) || {};

console.log(bkState.isPlaying);   // boolean
console.log(bkState.currentTime); // float (in seconds)
console.log(bkState.duration);    // float (in seconds)
console.log(bkState.src);         // string (URL)
```

## 2. Using it in a Live Polling Hook

A standard pattern for a userscript plugin (i.e. syncing watch history to external trackers like MAL or Anilist):

```javascript
setInterval(() => {
    // 1. Try to fetch the state
    if (!window.BingeKit || !window.BingeKit.globalPlayerState) return;
    
    let tracker = window.BingeKit.globalPlayerState;

    // 2. Ignore if nothing is playing
    if (!tracker.isPlaying) return;

    // 3. Process the time tracking
    let percentageComplete = tracker.currentTime / tracker.duration;
    
    // Perform plugin actions here!
    console.log(`Watching! Progress: ${(percentageComplete * 100).toFixed(2)}%`);

}, 5000); // Sample every 5 seconds securely and painlessly!
```

## 3. Reading the Local State (Advanced)

If you're writing a plugin specifically embedded *inside* an iframe and solely want the frame's *local* video state (ignoring other players taking priority via the cross-communications channel):

```javascript
let localState = (window.BingeKit && window.BingeKit.localPlayerState) || {};
console.log(localState.isPlaying);
// ... Same shape as globalPlayerState
```
