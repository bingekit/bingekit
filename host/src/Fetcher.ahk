global FetchTasks := Map()
global FetcherGridSlots := Map()

WindowSize := 300

GetNextFetcherSlot() {
    global FetcherGridSlots
    slotIndex := 1
    Loop {
        if (!FetcherGridSlots.Has(slotIndex) || FetcherGridSlots[slotIndex] == false) {
            FetcherGridSlots[slotIndex] := true
            return slotIndex
        }
        slotIndex++
    }
}

GetFetcherCoords(slotIndex, &outX, &outY) {
    scrW := SysGet(0)
    scrH := SysGet(1)
    cols := Floor(scrW / WindowSize)
    if (cols < 1)
        cols := 1
    index0 := slotIndex - 1
    col := Mod(index0, cols)
    row := Floor(index0 / cols)
    outX := col * WindowSize
    outY := row * WindowSize
}

DestroyFetcher(callbackId) {
    global FetchTasks, FetcherGridSlots
    if (FetchTasks.Has(callbackId)) {
        task := FetchTasks[callbackId]
        if (task.HasOwnProp("slotIndex") && task.slotIndex > 0) {
            FetcherGridSlots[task.slotIndex] := false
        }
        try task.gui.Destroy()
        FetchTasks.Delete(callbackId)
    }
}

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
OnHiddenNavigationCompleted(windowId, callbackId, hiddenGui, sender, args) {
    global MainGuis
    try {
        if (!args.IsSuccess) {
            ; Execute the async script
            if (MainGuis.Has(windowId))
                MainGuis[windowId].Control.ExecuteScriptAsync("console.log('[SmartFetch Debug] Navigation Failed (Aborted or Invalid)'); if(window.resolveSmartFetchError) window.resolveSmartFetchError('" callbackId "', '{`"error`": `"Navigation Failed`"}');")

            ; Set the timer to call the nested cleanup function
            SetTimer(CleanupTask, -500)
        }
    } catch {
        ; Catch errors in the main handler execution
    }

    CleanupTask() {
        try {
            DestroyFetcher(callbackId)
        } catch {
            ; Catch any remaining GUI destruction or deletion errors
        }
    }
}

AHK_StartSmartFetch(windowId, url, actionJs, callbackId, botCheckJs := "") {
    DoSmartFetch() {
        try {
            activeWindow := WinGetID("A")
        } catch {
            activeWindow := 0 ; Fallback in case no window is strictly active
        }

        global MainGuis, WebViewSettings, WVs
        hiddenGui := Gui("-Caption +ToolWindow -Resize +Owner" activeWindow, "SmartFetch Debug Window")
        hiddenWV := WebViewCtrl(hiddenGui, "w" WindowSize " h" WindowSize, WebViewSettings)

        global AboutConfig_ShowFetcher
        slotIndex := 0
        if (AboutConfig_ShowFetcher) {
            slotIndex := GetNextFetcherSlot()
            GetFetcherCoords(slotIndex, &xpos, &ypos)
            hiddenGui.Show("w" WindowSize " h" WindowSize " x" xpos " y" ypos)
            hiddenWV.Move(0, 0, WindowSize, WindowSize)
        } else {
            WinSetTransparent(0, hiddenGui)
            hiddenGui.Show("w1 h1 x0 y0")
        }

        if activeWindow {
            WinActivate("ahk_id " activeWindow)
        }

        hostObjName := "fetchResult_" StrReplace(callbackId, "-", "")

        hostObj := {
            ReturnData: (data, _*) => (MainGuis.Has(windowId) ? MainGuis[windowId].Control.ExecuteScriptAsync("if(window.resolveSmartFetch) window.resolveSmartFetch('" callbackId "', " data ");") : "", SetTimer(() => DestroyFetcher(callbackId), -10)),
            ReturnError: (err, _*) => (MainGuis.Has(windowId) ? MainGuis[windowId].Control.ExecuteScriptAsync("if(window.resolveSmartFetchError) window.resolveSmartFetchError('" callbackId "', " err ");") : "", SetTimer(() => DestroyFetcher(callbackId), -10)),
            ShowFetcherWindow: (*) => (WinSetTransparent("Off", hiddenGui), hiddenGui.Show("w800 h600 Center"))
        }

        FetchTasks[callbackId] := { gui: hiddenGui, wv: hiddenWV, obj: hostObj, slotIndex: slotIndex }

        hiddenWV.wv.AddHostObjectToScript(hostObjName, hostObj)
        hiddenWV.wv.AddHostObjectToScript("ahk", {
            CacheSet: AHK_CacheSet,
            CacheGet: AHK_CacheGet,
            CacheClear: AHK_CacheClear
        })

        wrapperJs := "if (!window._svXhrHooked) { window._svXhrHooked = true; window._svXhrLog = []; window._svXhrPromises = [];"
        wrapperJs .= " window.BK_WAIT_XHR = function(pattern, timeout = 15000) { "
        wrapperJs .= "  var rx = new RegExp(pattern); var ex = window._svXhrLog.find(function(x){return x.url.match(rx);}); "
        wrapperJs .= "  if(ex) return Promise.resolve(ex.text); "
        wrapperJs .= "  return new Promise(function(resolve, reject) { "
        wrapperJs .= "   var t = setTimeout(function(){reject('timeout');}, timeout); "
        wrapperJs .= "   window._svXhrPromises.push({ rx: rx, resolve: function(text) { clearTimeout(t); resolve(text); } }); "
        wrapperJs .= "  }); "
        wrapperJs .= " };"
        wrapperJs .= " var _origFetch = window.fetch; window.fetch = async function() { "
        wrapperJs .= "  var args = Array.prototype.slice.call(arguments);"
        wrapperJs .= "  try { "
        wrapperJs .= "   var res = await _origFetch.apply(this, args); "
        wrapperJs .= "   var url = (typeof args[0] === 'string') ? args[0] : (args[0] && args[0].url ? args[0].url : '');"
        wrapperJs .= "   var clone = res.clone();"
        wrapperJs .= "   clone.text().then(function(text) { "
        wrapperJs .= "    window._svXhrLog.push({ url: url, text: text }); "
        wrapperJs .= "    var p = window._svXhrPromises.find(function(x){return url.match(x.rx);});"
        wrapperJs .= "    if(p) { window._svXhrPromises = window._svXhrPromises.filter(function(x){return x !== p;}); p.resolve(text); }"
        wrapperJs .= "   }).catch(function(){}); "
        wrapperJs .= "   return res; "
        wrapperJs .= "  } catch(e) { return _origFetch.apply(this, args); }"
        wrapperJs .= " };"
        wrapperJs .= " var _origOpen = window.XMLHttpRequest.prototype.open; var _origSend = window.XMLHttpRequest.prototype.send;"
        wrapperJs .= " window.XMLHttpRequest.prototype.open = function(m, url) { this._svUrl = url; return _origOpen.apply(this, arguments); };"
        wrapperJs .= " window.XMLHttpRequest.prototype.send = function() { "
        wrapperJs .= "  this.addEventListener('load', function() { "
        wrapperJs .= "   if(this._svUrl) { "
        wrapperJs .= "    try { "
        wrapperJs .= "     window._svXhrLog.push({ url: this._svUrl, text: this.responseText });"
        wrapperJs .= "     var p = window._svXhrPromises.find(function(x){return this._svUrl.match(x.rx);}.bind(this));"
        wrapperJs .= "     if(p) { window._svXhrPromises = window._svXhrPromises.filter(function(x){return x !== p;}); p.resolve(this.responseText); }"
        wrapperJs .= "    } catch(e) {}"
        wrapperJs .= "   }"
        wrapperJs .= "  }); "
        wrapperJs .= "  return _origSend.apply(this, arguments); "
        wrapperJs .= " };"
        wrapperJs .= "}`n"
        wrapperJs .= "window.addEventListener('DOMContentLoaded', function() {`n"
        wrapperJs .= "    window._svBotInterval = setInterval(function() {`n"
        wrapperJs .= "        try {`n"
        wrapperJs .= "            var t = document.title || '';`n"
        wrapperJs .= "            if(t.includes('Just a moment') || t.includes('Attention Required') || document.querySelector('.cf-browser-verification, #cf-wrapper, #challenges')) {`n"
        wrapperJs .= "                clearInterval(window._svBotInterval);`n"
        wrapperJs .= "                window.chrome.webview.hostObjects." hostObjName ".ShowFetcherWindow().catch(e => console.error(e));`n"
        wrapperJs .= "            }`n"
        if (botCheckJs != "") {
             wrapperJs .= "            try { var _svBotRes = (function() {" botCheckJs "`n})(); if(_svBotRes) { clearInterval(window._svBotInterval); window.chrome.webview.hostObjects." hostObjName ".ShowFetcherWindow().catch(e => console.error(e)); } } catch(e) {}`n"
        }
        wrapperJs .= "        } catch(e) {}`n"
        wrapperJs .= "    }, 1000);`n"
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

        hiddenWV.wv.add_NavigationCompleted(OnHiddenNavigationCompleted.Bind(windowId, callbackId, hiddenGui))

        hiddenWV.Navigate(url)
    }
    SetTimer(DoSmartFetch, -1)
}

AHK_StartRawFetchParse(windowId, url, actionJs, callbackId) {
    DoRawFetch() {
        global MainGuis, WebViewSettings, WVs
        hostObjName := "fetchResult_" StrReplace(callbackId, "-", "")
        try {
            req := ComObject("WinHttp.WinHttpRequest.5.1")
            req.Open("GET", url, true) ; Async Mode
            req.SetRequestHeader("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
            req.Send()
            req.WaitForResponse()
            rawHtml := req.ResponseText

            hiddenGui := Gui("+Resize +ToolWindow +Owner" (MainGuis.Has(windowId) ? MainGuis[windowId].Hwnd : 0), "RawFetchParse Debug Window")
            hiddenWV := WebViewCtrl(hiddenGui, "w" WindowSize " h" WindowSize, WebViewSettings)
            global AboutConfig_ShowFetcher
            slotIndex := 0
            if (AboutConfig_ShowFetcher) {
                slotIndex := GetNextFetcherSlot()
                GetFetcherCoords(slotIndex, &xpos, &ypos)
                hiddenGui.Show("w" WindowSize " h" WindowSize " x" xpos " y" ypos)
                hiddenWV.Move(0, 0, WindowSize, WindowSize)
            } else {
                WinSetTransparent(0, hiddenGui)
                hiddenGui.Show("w1 h1 x0 y0")
            }

            hostObj := {
                ReturnData: (data, _*) => (MainGuis.Has(windowId) ? MainGuis[windowId].Control.ExecuteScriptAsync("if(window.resolveSmartFetch) window.resolveSmartFetch('" callbackId "', " data ");") : "", SetTimer(() => DestroyFetcher(callbackId), -10)),
                ReturnError: (err, _*) => (MainGuis.Has(windowId) ? MainGuis[windowId].Control.ExecuteScriptAsync("if(window.resolveSmartFetchError) window.resolveSmartFetchError('" callbackId "', " err ");") : "", SetTimer(() => DestroyFetcher(callbackId), -10))
            }
            FetchTasks[callbackId] := { gui: hiddenGui, wv: hiddenWV, obj: hostObj, slotIndex: slotIndex }

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
            if (MainGuis.Has(windowId))
                MainGuis[windowId].Control.ExecuteScriptAsync("if(window.resolveSmartFetchError) window.resolveSmartFetchError('" callbackId "', " errJson ");")
        }
    }
    SetTimer(DoRawFetch, -1)
}