#Requires AutoHotkey v2.0
#Include Lib\WebViewToo.ahk
#Include Lib\Promise.ahk
#SingleInstance Force


EnvSet("WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS",
    "--edge-webview-no-dpi-workaround " .
    "--disable-gpu " .
    "--edge-webview-is-background " .
    "--msWebView2CodeCache " .
    "--no-first-run " .
    "--msWebView2CancelInitialNavigation " .
    "--disable-web-security " .
    "")

if (A_IsCompiled) {
    WebViewCtrl.CreateFileFromResource((A_PtrSize * 8) "bit\WebView2Loader.dll", WebViewCtrl.TempDir)
    WebViewSettings := { DllPath: WebViewCtrl.TempDir "\" (A_PtrSize * 8) "bit\WebView2Loader.dll" }
} else {
    WebViewSettings := {}
}


MainGui := WebViewGui("+Resize -Caption", , , WebViewSettings)

MainGui.BackColor := "09090b" ; Match the React app's zinc-950 background

MainGui.Show("w800 h600")
; Initialize WebViewToo
WV := MainGui.Control.wv

;MainGui.Control.CreateCoreWebView2ControllerOptions()

; Define global functions for WebView2 Interop

AHK_Minimize(*) {
    global MainGui
    MainGui.Minimize()
}

AHK_Maximize(*) {
    global MainGui
    if (WinGetMinMax(MainGui.Hwnd) = 1)
        WinRestore(MainGui.Hwnd)
    else
        WinMaximize(MainGui.Hwnd)
}

AHK_Close(*) {
    ExitApp()
}

AHK_SaveData(filename, data) {
    filepath := A_ScriptDir "\settings\" filename
    if FileExist(filepath)
        FileDelete(filepath)
    FileAppend(data, filepath, "UTF-8")
}

AHK_LoadData(filename) {
    filepath := A_ScriptDir "\settings\" filename
    return FileExist(filepath) ? FileRead(filepath, "UTF-8") : ""
}

AHK_ListSites(*) {
    if !DirExist(A_ScriptDir "\settings\sites")
        DirCreate(A_ScriptDir "\settings\sites")
    fileList := ""
    Loop Files, A_ScriptDir "\settings\sites\*.json"
        fileList .= A_LoopFileName "|"
    return RTrim(fileList, "|")
}

AHK_SaveSite(filename, data) {
    if !DirExist(A_ScriptDir "\settings\sites")
        DirCreate(A_ScriptDir "\settings\sites")
    filepath := A_ScriptDir "\settings\sites\" filename
    if FileExist(filepath)
        FileDelete(filepath)
    FileAppend(data, filepath, "UTF-8")
    return true
}

AHK_LoadSite(filename) {
    filepath := A_ScriptDir "\settings\sites\" filename
    return FileExist(filepath) ? FileRead(filepath, "UTF-8") : ""
}

AHK_DeleteSite(filename) {
    filepath := A_ScriptDir "\settings\sites\" filename
    if FileExist(filepath)
        FileDelete(filepath)
    return true
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

fetcherScript() {
    MsgBox "Hello from fetcher script"
}


AHK_ExecuteSearch(query, engine) {
    Run(engine . query)
}

AHK_InjectJS(js) {
    global WV, PlayerWV, PlayerGui
    WV.ExecuteScript(js, 0)
    if (PlayerGui && PlayerWV) {
        PlayerWV.wv.ExecuteScript(js, 0)
    }
}

global PlayerGui := ""
global PlayerWV := ""
global PlayerCurrentUrl := ""
global PendingPlayerUrl := ""
global PlayerRectX := 0
global PlayerRectY := 0
global PlayerRectW := 0
global PlayerRectH := 0
global AdblockScript := FileRead("js/adblock.js", "UTF-8")
global GlobalScript := FileRead("js/global.js", "UTF-8")
global UserscriptsScript := ""

AHK_UpdateUserscriptPayload(js) {
    global UserscriptsScript, PlayerWV, PlayerGui
    UserscriptsScript := js
    if (PlayerGui && PlayerWV) {
        PlayerWV.wv.ExecuteScript(js, 0)
    }
}

AHK_GetUserscriptPayload() {
    global UserscriptsScript
    return UserscriptsScript
}

AHK_UpdateURL(url) {
    global WV, PlayerCurrentUrl
    try {
        PlayerCurrentUrl := url
        js := 'window.dispatchEvent(new CustomEvent("player-url-changed", { detail: { url: "' url '" } }))'
        WV.ExecuteScriptAsync(js)
    } catch {
    }
}

AHK_UpdatePlayerRect(x, y, w, h, visible) {
    DoUpdateRect() {
        global PlayerGui, PlayerWV, PlayerCurrentUrl, MainGui, WebViewSettings, PendingPlayerUrl
        global PlayerRectX, PlayerRectY, PlayerRectW, PlayerRectH

        PlayerRectX := x
        PlayerRectY := y
        PlayerRectW := w
        PlayerRectH := h

        if (visible) {
            if (!PlayerGui) {
                PlayerGui := Gui("-Caption +ToolWindow +Owner" MainGui.Hwnd)
                PlayerWV := WebViewCtrl(PlayerGui, "w" w " h" h, WebViewSettings)

                PlayerWV.AddHostObjectToScript("ahk", {
                    UpdateURL: AHK_UpdateURL
                })
                PlayerWV.AddScriptToExecuteOnDocumentCreatedAsync(GlobalScript)
                PlayerWV.AddScriptToExecuteOnDocumentCreatedAsync(AdblockScript)
                PlayerWV.AddScriptToExecuteOnDocumentCreatedAsync("try { var _usJs = window.chrome.webview.hostObjects.sync.ahk.GetUserscriptPayload(); if(_usJs) { (function(){eval(_usJs)})(); } } catch(e) { console.error('Userscript bootstrap error:', e); }")
                ;PlayerWV.SourceChanged(xWebView2.Handler(AHK_PlayerUrlChanged))
                if (PendingPlayerUrl != "") {
                    PlayerCurrentUrl := PendingPlayerUrl
                    PlayerWV.Navigate(PendingPlayerUrl)
                    PendingPlayerUrl := ""
                }
            }

            WinGetClientPos(&CX, &CY, , , MainGui.Hwnd)
            ScreenX := CX + x
            ScreenY := CY + y

            PlayerWV.wvc.IsVisible := 1
            PlayerWV.Move(0, 0, w, h)
            PlayerWV.wvc.Fill()

            PlayerGui.Show("x" ScreenX " y" ScreenY " w" w " h" h " NA")
        } else {
            if (PlayerGui) {
                PlayerWV.wvc.IsVisible := 0
                PlayerGui.Hide()
            }
        }
    }
    SetTimer(DoUpdateRect, -1)
}

global FetchTasks := Map()

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
        WinSetTransparent(0, hiddenGui)

        hiddenGui.Show("w10 h10 x0 y0")

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

        wrapperJs := "window.addEventListener('DOMContentLoaded', function() {`n"
        wrapperJs .= "    console.log('[SmartFetch Debug] DOMContentLoaded triggered. Waiting 1000ms for idle...');`n"
        wrapperJs .= "    setTimeout(function() {`n"
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
        wrapperJs .= "    }, 1000);`n"
        wrapperJs .= "});`n"

        hiddenWV.AddScriptToExecuteOnDocumentCreatedAsync(wrapperJs)

        local NavigationCompletedHandler := (sender, args) => (!args.IsSuccess ? (MainGui.Control.ExecuteScriptAsync("console.log('[SmartFetch Debug] Navigation Failed (Aborted or Invalid)'); if(window.resolveSmartFetchError) window.resolveSmartFetchError('" callbackId "', '{`"error`": `"Navigation Failed`"}');"), SetTimer(() => (hiddenGui.Destroy(), FetchTasks.Delete(callbackId)), -10)) : "")
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

global PendingPlayerUrl := ""

AHK_UpdatePlayerUrl(url) {
    DoUpdateUrl() {
        global PlayerWV, PlayerCurrentUrl, PendingPlayerUrl
        if (!PlayerWV) {
            PendingPlayerUrl := url
        } else if (url != "" && PlayerCurrentUrl != url) {
            PlayerCurrentUrl := url
            PlayerWV.Navigate(url)
        }
        ;SetTimer(InjectAdblocker, -2000)
    }
    SetTimer(DoUpdateUrl, -1)
}

; Expose AHK functions to the WebView (JavaScript) using a plain object
WV.AddHostObjectToScript("ahk", {
    Minimize: AHK_Minimize,
    Maximize: AHK_Maximize,
    Close: AHK_Close,
    SaveData: AHK_SaveData,
    LoadData: AHK_LoadData,
    ListSites: AHK_ListSites,
    SaveSite: AHK_SaveSite,
    LoadSite: AHK_LoadSite,
    DeleteSite: AHK_DeleteSite,
    RawFetchHTML: AHK_RawFetchHTML,
    ExecuteSearch: AHK_ExecuteSearch,
    InjectJS: AHK_InjectJS,
    UpdatePlayerRect: AHK_UpdatePlayerRect,
    UpdatePlayerUrl: AHK_UpdatePlayerUrl,
    UpdateURL: AHK_UpdateURL,
    UpdateUserscriptPayload: AHK_UpdateUserscriptPayload,
    GetUserscriptPayload: AHK_GetUserscriptPayload,
    StartSmartFetch: AHK_StartSmartFetch,
    StartRawFetchParse: AHK_StartRawFetchParse
})
;WV.AddHostObjectToScript("UpdateURL", AHK_UpdateURL)

; Inject Adblocker and Preloads on document creation
try {
    ;AdblockScript := FileRead("adblock.js", "UTF-8")
    ;if (AdblockScript) {
    ;    WV.CoreWebView2.AddScriptToExecuteOnDocumentCreated(AdblockScript, 0)
    ;}
}

; Load the local React build (or dev server if testing)
WV.Navigate("http://localhost:3000") ; For development
;WV.Load("file:///" A_ScriptDir "\settings\dist\index.html") ; For production

; Show the GUI
MainGui.Show("w1280 h800")

OnMessage(0x0003, AHK_OnMove) ; WM_MOVE
OnMessage(0x0005, AHK_OnMove) ; WM_SIZE

AHK_OnMove(wParam, lParam, msg, hwnd) {
    global MainGui, PlayerGui, PlayerWV, PlayerRectX, PlayerRectY, PlayerRectW, PlayerRectH
    if (IsSet(MainGui) && hwnd == MainGui.Hwnd && IsSet(PlayerGui) && PlayerGui) {
        if (PlayerWV.wvc.IsVisible) {
            WinGetClientPos(&CX, &CY, , , MainGui.Hwnd)
            PlayerGui.Move(CX + PlayerRectX, CY + PlayerRectY, PlayerRectW, PlayerRectH)
        }
    }
}

; Allow dragging the window by clicking the custom titlebar
OnMessage(0x0084, WM_NCHITTEST)
WM_NCHITTEST(wParam, lParam, msg, hwnd) {
    ; Basic drag implementation if needed
}