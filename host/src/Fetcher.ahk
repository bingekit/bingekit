global FetchTasks := Map()

AHK_RawFetchHTML(url) {
    try {
        req := ComObject("WinHttp.WinHttpRequest.5.1")
        req.Open("GET", url, false)
        req.SetRequestHeader("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
        req.Send()
        return req.ResponseText
    } catch {
        return ""
    }
}

AHK_StartSmartFetch(url, actionJs, callbackId) {
    DoSmartFetch() {
        try {
            activeWindow := WinGetID("A")
        } catch {
            activeWindow := 0 ; Fallback in case no window is strictly active
        }

        global MainGui, WebViewSettings, WV
        hiddenGui := Gui("-Caption +ToolWindow +Owner" activeWindow, "SmartFetch Debug Window")
        hiddenWV := WebViewCtrl(hiddenGui, "w800 h600", WebViewSettings)
        ;WinSetTransparent(0, hiddenGui)

        ;hiddenGui.Show("w10 h10 x0 y0")
        hiddenGui.Show("w800 h600 x0 y0")

        if activeWindow {
            WinActivate("ahk_id " activeWindow)
        }

        hostObjName := "fetchResult_" StrReplace(callbackId, "-", "")

        hostObj := {
            ReturnData: (data, _*) => (MainGui.Control.ExecuteScriptAsync("if(window.resolveSmartFetch) window.resolveSmartFetch('" callbackId "', " data ");"), SetTimer(() => (hiddenGui.Destroy(), FetchTasks.Delete(callbackId)), -10)),
            ReturnError: (err, _*) => (MainGui.Control.ExecuteScriptAsync("if(window.resolveSmartFetchError) window.resolveSmartFetchError('" callbackId "', " err ");"), SetTimer(() => (hiddenGui.Destroy(), FetchTasks.Delete(callbackId)), -10))
        }

        FetchTasks[callbackId] := { gui: hiddenGui, wv: hiddenWV, obj: hostObj }

        hiddenWV.wv.AddHostObjectToScript(hostObjName, hostObj)
        hiddenWV.wv.AddHostObjectToScript("ahk", {
            CacheSet: AHK_CacheSet,
            CacheGet: AHK_CacheGet,
            CacheClear: AHK_CacheClear
        })

        wrapperJs := "window.addEventListener('DOMContentLoaded', function() {`n"
        wrapperJs .= "    console.log('[SmartFetch Debug] DOMContentLoaded triggered. Waiting 1000ms for idle...');`n"
        wrapperJs .= "    requestIdleCallback(()=>setTimeout(function() {`n"
        wrapperJs .= "        console.log('[SmartFetch Debug] Executing your actionJs...');`n"
        wrapperJs .= "        try {`n"
        wrapperJs .= "            var result = (function() { " actionJs "`n })();`n"
        wrapperJs .= "            console.log('[SmartFetch Debug] actionJs returned:', result);`n"
        wrapperJs .= "            if (result instanceof Promise) {`n"
        wrapperJs .= "                console.log('[SmartFetch Debug] Awaiting promise result...');`n"
        wrapperJs .= "                result.then(res => {`n"
        wrapperJs .= "                    console.log('[SmartFetch Debug] Promise resolved. Transmitting back to AHK...', res);`n"
        wrapperJs .= "                    window.chrome.webview.hostObjects." hostObjName ".ReturnData(JSON.stringify(res)).catch(e => console.error('[SmartFetch Debug] COM Transit Error:', e));`n"
        wrapperJs .= "                }).catch(e => {`n"
        wrapperJs .= "                    console.error('[SmartFetch Debug] Promise rejected:', e);`n"
        wrapperJs .= "                    window.chrome.webview.hostObjects." hostObjName ".ReturnError(JSON.stringify(e.message||e)).catch(err => console.error('[SmartFetch Debug] COM Error:', err));`n"
        wrapperJs .= "                });`n"
        wrapperJs .= "            } else {`n"
        wrapperJs .= "                var jsonStr = typeof result === 'string' ? result : JSON.stringify(result);`n"
        wrapperJs .= "                console.log('[SmartFetch Debug] Transmitting synchronous result back to AHK...', jsonStr);`n"
        wrapperJs .= "                window.chrome.webview.hostObjects." hostObjName ".ReturnData(jsonStr).catch(e => console.error('[SmartFetch Debug] COM Transit Error:', e));`n"
        wrapperJs .= "            }`n"
        wrapperJs .= "        } catch(e) {`n"
        wrapperJs .= "            console.error('[SmartFetch Debug] Exception execution crashed:', e);`n"
        wrapperJs .= "            window.chrome.webview.hostObjects." hostObjName ".ReturnError(JSON.stringify(e.message||e)).catch(err => console.error('[SmartFetch Debug] COM Error:', err));`n"
        wrapperJs .= "        }`n"
        wrapperJs .= "    }, 1500));`n"
        wrapperJs .= "});`n"

        hiddenWV.AddScriptToExecuteOnDocumentCreatedAsync(wrapperJs)

        local NavigationCompletedHandler := (sender, args) => (!args.IsSuccess ? (MainGui.Control.ExecuteScriptAsync("console.log('[SmartFetch Debug] Navigation Failed (Aborted or Invalid)'); if(window.resolveSmartFetchError) window.resolveSmartFetchError('" callbackId "', '{`"error`": `"Navigation Failed`"}');"), SetTimer(() => (hiddenGui.Destroy(), FetchTasks.Delete(callbackId)), -500)) : "")
        hiddenWV.wv.add_NavigationCompleted(NavigationCompletedHandler)

        hiddenWV.Navigate(url)
    }
    SetTimer(DoSmartFetch, -1)
}

AHK_StartRawFetchParse(url, actionJs, callbackId) {
    DoRawFetch() {
        global MainGui, WebViewSettings, WV
        hostObjName := "fetchResult_" StrReplace(callbackId, "-", "")
        try {
            req := ComObject("WinHttp.WinHttpRequest.5.1")
            req.Open("GET", url, true) ; Async Mode
            req.SetRequestHeader("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
            req.Send()
            req.WaitForResponse()
            rawHtml := req.ResponseText

            hiddenGui := Gui("+Resize +ToolWindow +Owner" MainGui.Hwnd, "RawFetchParse Debug Window")
            hiddenWV := WebViewCtrl(hiddenGui, "w800 h600", WebViewSettings)
            hiddenGui.Show("w800 h600")

            hostObj := {
                ReturnData: (data, _*) => (MainGui.Control.ExecuteScriptAsync("if(window.resolveSmartFetch) window.resolveSmartFetch('" callbackId "', " data ");"), SetTimer(() => (hiddenGui.Destroy(), FetchTasks.Delete(callbackId)), -10)),
                ReturnError: (err, _*) => (MainGui.Control.ExecuteScriptAsync("if(window.resolveSmartFetchError) window.resolveSmartFetchError('" callbackId "', " err ");"), SetTimer(() => (hiddenGui.Destroy(), FetchTasks.Delete(callbackId)), -10))
            }
            FetchTasks[callbackId] := { gui: hiddenGui, wv: hiddenWV, obj: hostObj }

            hiddenWV.wv.AddHostObjectToScript(hostObjName, hostObj)

            wrapperJs := "window.addEventListener('DOMContentLoaded', function() {`n"
            wrapperJs .= "    console.log('[RawParseFetch Debug] DOMContentLoaded. Executing actionJs immediately...');`n"
            wrapperJs .= "    try {`n"
            wrapperJs .= "        var result = (function() { " actionJs "`n })();`n"
            wrapperJs .= "        console.log('[RawParseFetch Debug] actionJs returned:', result);`n"
            wrapperJs .= "        if (result instanceof Promise) {`n"
            wrapperJs .= "            console.log('[RawParseFetch Debug] Awaiting promise...');`n"
            wrapperJs .= "            result.then(res => {`n"
            wrapperJs .= "                window.chrome.webview.hostObjects.ahk." hostObjName ".ReturnData(JSON.stringify(res)).catch(e => console.error('[RawParseFetch Debug] COM Error:', e));`n"
            wrapperJs .= "            }).catch(e => {`n"
            wrapperJs .= "                window.chrome.webview.hostObjects.ahk." hostObjName ".ReturnError(JSON.stringify(e.message||e)).catch(e => console.error('[RawParseFetch Debug] COM Error:', e));`n"
            wrapperJs .= "            });`n"
            wrapperJs .= "        } else {`n"
            wrapperJs .= "            var jsonStr = typeof result === 'string' ? result : JSON.stringify(result);`n"
            wrapperJs .= "            console.log('[RawParseFetch Debug] Transmitting synchronous result...');`n"
            wrapperJs .= "            window.chrome.webview.hostObjects.ahk." hostObjName ".ReturnData(jsonStr).catch(e => console.error('[RawParseFetch Debug] COM Error:', e));`n"
            wrapperJs .= "        }`n"
            wrapperJs .= "    } catch(e) {`n"
            wrapperJs .= "        console.error('[RawParseFetch Debug] Exception executed crashed:', e);`n"
            wrapperJs .= "        window.chrome.webview.hostObjects.ahk." hostObjName ".ReturnError(JSON.stringify(e.message||e)).catch(err => console.error('[RawParseFetch Debug] COM Error:', err));`n"
            wrapperJs .= "    }`n"
            wrapperJs .= "});`n"

            hiddenWV.AddScriptToExecuteOnDocumentCreatedAsync(wrapperJs)
            hiddenWV.NavigateToString(rawHtml)
        } catch as err {
            errJson := '{`"error`": `"' StrReplace(err.Message, '`"', '\"') '`"}'
            MainGui.Control.ExecuteScriptAsync("if(window.resolveSmartFetchError) window.resolveSmartFetchError('" callbackId "', " errJson ");")
        }
    }
    SetTimer(DoRawFetch, -1)
}
