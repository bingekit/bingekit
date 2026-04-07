# Live Examples Playground

This section provides interactive, working snippets of BingeKit's core APIs. Because you are viewing this page natively inside BingeKit, you can execute these directly within the application to see how they behave in real-time.

## Native Toast Notification
Test the native OS-level toast system that bypasses the browser UI entirely, making it globally visible even while gaming or playing media!

```runjs
ahk.call('ShowToast', 'Hello from the BingeKit Documentation!', 'info');
```

## Memory Cache (Set & Get)
Very fast volatile memory operations mapped directly into the Host process RAM instead of disk. Useful for passing data without triggering I/O bottlenecks.

```runjs
ahk.call('CacheSet', 'demoSessionKey', 'This string is persisting in the system RAM!');
const result = ahk.call('CacheGet', 'demoSessionKey');
ahk.call('ShowToast', 'Retrieved from Cache: ' + result, 'success');
```

## Synchronous Raw Fetch
A blazing fast native HTTP request bypassing chromium document layout and the DOM.

```runjs
// Fetch an API endpoint natively
const result = ahk.call('RawFetchHTML', 'https://jsonplaceholder.typicode.com/todos/1');
ahk.call('ShowToast', 'Fetched API Data! Check developer console for output.', 'success');
console.log("RawFetchHTML Result:", JSON.parse(result));
```

## Background SmartFetch (DOM Parsing)
Spawns an invisible `WebView2` instance to execute Javascript inside an actual authentic Chromium lifecycle against a target URL. This enables Cloudflare bypassing and Javascript evaluation.

```runjs
const callbackId = "demo_fetch_" + Date.now();

const scraperScript = `
  return new Promise((resolve) => {
    // We are now inside the invisible browser!
    const links = document.querySelectorAll('a');
    resolve(JSON.stringify({
        totalLinks: links.length,
        title: document.title
    }));
  });
`;

// We bind to the global window listener to catch the payload when it returns
const handlePayload = (e) => {
    try {
        const payload = JSON.parse(e.data);
        if (payload.callbackId === callbackId) {
            window.removeEventListener("message", handlePayload);
            const data = JSON.parse(payload.data);
            ahk.call("ShowToast", "Parsed " + data.totalLinks + " links from " + data.title + "!", "success");
        }
    } catch(err) {}
};
window.addEventListener("message", handlePayload);

ahk.call("ShowToast", "Starting SmartFetch in background... waiting for target.", "info");

// Fire the underlying AHK smart fetcher
ahk.asyncCall("StartSmartFetch", "https://news.ycombinator.com/", scraperScript, callbackId);
```

## Open Native App Dialogs
Because BingeKit is a real Windows app, you can seamlessly spawn generic local shell windows and listen to asynchronous events!

```runjs
// Will invoke the Windows Folder Selector and pipe event back
const handleFolder = (e) => {
    if (e.detail && e.detail.id === 'demo-folder') {
        window.removeEventListener('bk-folder-selected', handleFolder);
        ahk.call('ShowToast', 'Selected Path: ' + e.detail.dir, 'success');
    }
};
window.addEventListener('bk-folder-selected', handleFolder);
ahk.call('PromptSelectFolder', 'main', 'demo-folder');
```
