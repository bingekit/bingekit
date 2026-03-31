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


global SplashGui := Gui("-Caption +AlwaysOnTop +ToolWindow", "StreamView Loading")
SplashGui.BackColor := "09090b"
SplashGui.MarginX := 0
SplashGui.MarginY := 0
SplashGui.SetFont("s32 c818cf8 bold", "Segoe UI")
SplashGui.Add("Text", "x0 y55 w400 center BackgroundTrans", "StreamView")
SplashGui.SetFont("s9 ca1a1aa norm", "Segoe UI")
SplashGui.Add("Text", "x0 y120 w400 center BackgroundTrans", "INITIALIZING ENGINE COMPONENTS")
SplashGui.Add("Progress", "x0 y195 w400 h5 c818cf8 Background27272a", 100)
SplashGui.Show("w400 h200 Center NoActivate")
Try {
    WinSetRegion("0-0 w400 h200 r16-16", "ahk_id " SplashGui.Hwnd)
}

try {
    MainGui := WebViewGui("+Resize -Caption", "StreamView", , WebViewSettings)
} catch as err {
    if (SplashGui) {
        SplashGui.Destroy()
        SplashGui := ""
    }
    MsgBox("Critical Error: Failed to initialize WebView2 component.`n`nError details:`n" err.Message "`n`nPlease ensure Microsoft Edge WebView2 Runtime is installed.", "StreamView Initialization Error", 16)
    ExitApp()
}

MainGui.BackColor := "09090b" ; Match the React app's zinc-950 background


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

global CurrentWorkspace := "default"
Loop A_Args.Length {
    if (A_Args[A_Index] = "--workspace" && A_Index < A_Args.Length) {
        CurrentWorkspace := A_Args[A_Index + 1]
    }
}
global WorkspaceBaseDir := A_ScriptDir "\settings\workspaces"
global WorkspaceDir := WorkspaceBaseDir "\" CurrentWorkspace

if (!DirExist(WorkspaceBaseDir))
    DirCreate(WorkspaceBaseDir)

if (CurrentWorkspace = "default" && !DirExist(WorkspaceDir)) {
    DirCreate(WorkspaceDir)
    if (FileExist(A_ScriptDir "\settings\theme.json")) {
        try {
            Loop Files, A_ScriptDir "\settings\*.json", "F"
                FileMove(A_LoopFileFullPath, WorkspaceDir "\" A_LoopFileName)
            if DirExist(A_ScriptDir "\settings\cache")
                DirMove(A_ScriptDir "\settings\cache", WorkspaceDir "\cache")
            if DirExist(A_ScriptDir "\settings\sites")
                DirMove(A_ScriptDir "\settings\sites", WorkspaceDir "\sites")
            if DirExist(A_ScriptDir "\settings\scripts")
                DirMove(A_ScriptDir "\settings\scripts", WorkspaceDir "\scripts")
            if DirExist(A_ScriptDir "\settings\flows")
                DirMove(A_ScriptDir "\settings\flows", WorkspaceDir "\flows")
        }
    }
}
if (!DirExist(WorkspaceDir))
    DirCreate(WorkspaceDir)

AHK_GetCurrentWorkspace(*) {
    global CurrentWorkspace
    return CurrentWorkspace
}

AHK_ListWorkspaces(*) {
    global WorkspaceBaseDir
    fileList := ""
    Loop Files, WorkspaceBaseDir "\*", "D"
        fileList .= A_LoopFileName "|"
    return RTrim(fileList, "|")
}

AHK_CreateWorkspace(name) {
    global WorkspaceBaseDir
    if (!DirExist(WorkspaceBaseDir "\" name))
        DirCreate(WorkspaceBaseDir "\" name)
    return true
}

AHK_CloneWorkspace(src, dest) {
    global WorkspaceBaseDir
    if (DirExist(WorkspaceBaseDir "\" src) && !DirExist(WorkspaceBaseDir "\" dest)) {
        DirCopy(WorkspaceBaseDir "\" src, WorkspaceBaseDir "\" dest)
        return true
    }
    return false
}

AHK_DeleteWorkspace(name) {
    global WorkspaceBaseDir
    if (name != "default" && DirExist(WorkspaceBaseDir "\" name)) {
        try DirDelete(WorkspaceBaseDir "\" name, 1)
        return true
    }
    return false
}

AHK_RestartWorkspace(name) {
    Run(A_ScriptFullPath " --workspace " name)
    ExitApp()
}

AHK_SaveData(filename, data) {
    global WorkspaceDir
    filepath := WorkspaceDir "\" filename
    if FileExist(filepath)
        FileDelete(filepath)
    FileAppend(data, filepath, "UTF-8")
}

AHK_LoadData(filename) {
    global WorkspaceDir
    filepath := WorkspaceDir "\" filename
    return FileExist(filepath) ? FileRead(filepath, "UTF-8") : ""
}

AHK_CacheSet(key, data) {
    global WorkspaceDir
    if !DirExist(WorkspaceDir "\cache")
        DirCreate(WorkspaceDir "\cache")
    filepath := WorkspaceDir "\cache\" key ".txt"
    if FileExist(filepath)
        FileDelete(filepath)
    try FileAppend(data, filepath, "UTF-8")
    return true
}

AHK_CacheGet(key) {
    global WorkspaceDir
    filepath := WorkspaceDir "\cache\" key ".txt"
    return FileExist(filepath) ? FileRead(filepath, "UTF-8") : ""
}

AHK_CacheClear(*) {
    global WorkspaceDir
    if !DirExist(WorkspaceDir "\cache")
        return true
    try DirDelete(WorkspaceDir "\cache", true)
    return true
}

AHK_ListSites(*) {
    global WorkspaceDir
    if !DirExist(WorkspaceDir "\sites")
        DirCreate(WorkspaceDir "\sites")
    fileList := ""
    Loop Files, WorkspaceDir "\sites\*.json"
        fileList .= A_LoopFileName "|"
    return RTrim(fileList, "|")
}

AHK_SaveSite(filename, data) {
    global WorkspaceDir
    if !DirExist(WorkspaceDir "\sites")
        DirCreate(WorkspaceDir "\sites")
    filepath := WorkspaceDir "\sites\" filename
    if FileExist(filepath)
        FileDelete(filepath)
    FileAppend(data, filepath, "UTF-8")
    return true
}

AHK_LoadSite(filename) {
    global WorkspaceDir
    filepath := WorkspaceDir "\sites\" filename
    return FileExist(filepath) ? FileRead(filepath, "UTF-8") : ""
}

AHK_DeleteSite(filename) {
    global WorkspaceDir
    filepath := WorkspaceDir "\sites\" filename
    if FileExist(filepath)
        FileDelete(filepath)
    return true
}

AHK_ListScripts(*) {
    global WorkspaceDir
    if !DirExist(WorkspaceDir "\scripts")
        DirCreate(WorkspaceDir "\scripts")
    fileList := ""
    Loop Files, WorkspaceDir "\scripts\*.json"
        fileList .= A_LoopFileName "|"
    return RTrim(fileList, "|")
}

AHK_SaveScript(filename, data) {
    global WorkspaceDir
    if !DirExist(WorkspaceDir "\scripts")
        DirCreate(WorkspaceDir "\scripts")
    filepath := WorkspaceDir "\scripts\" filename
    if FileExist(filepath)
        FileDelete(filepath)
    FileAppend(data, filepath, "UTF-8")
    return true
}

AHK_LoadScript(filename) {
    global WorkspaceDir
    filepath := WorkspaceDir "\scripts\" filename
    return FileExist(filepath) ? FileRead(filepath, "UTF-8") : ""
}

AHK_DeleteScript(filename) {
    global WorkspaceDir
    filepath := WorkspaceDir "\scripts\" filename
    if FileExist(filepath)
        FileDelete(filepath)
    return true
}

AHK_ListFlows(*) {
    global WorkspaceDir
    if !DirExist(WorkspaceDir "\flows")
        DirCreate(WorkspaceDir "\flows")
    fileList := ""
    Loop Files, WorkspaceDir "\flows\*.json"
        fileList .= A_LoopFileName "|"
    return RTrim(fileList, "|")
}

AHK_SaveFlow(filename, data) {
    global WorkspaceDir
    if !DirExist(WorkspaceDir "\flows")
        DirCreate(WorkspaceDir "\flows")
    filepath := WorkspaceDir "\flows\" filename
    if FileExist(filepath)
        FileDelete(filepath)
    FileAppend(data, filepath, "UTF-8")
    return true
}

AHK_LoadFlow(filename) {
    global WorkspaceDir
    filepath := WorkspaceDir "\flows\" filename
    return FileExist(filepath) ? FileRead(filepath, "UTF-8") : ""
}

AHK_DeleteFlow(filename) {
    global WorkspaceDir
    filepath := WorkspaceDir "\flows\" filename
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

        w := w - 3
        h := h - 3
        ;x := x + 8
        ;y := y + 8

        PlayerRectX := x
        PlayerRectY := y
        PlayerRectW := w
        PlayerRectH := h

        if (visible) {
            if (!PlayerGui) {
                PlayerGui := Gui("-Caption +ToolWindow +Owner" MainGui.Hwnd)
                PlayerWV := WebViewCtrl(PlayerGui, "w" w " h" h, WebViewSettings)

                PlayerWV.AddHostObjectToScript("ahk", {
                    UpdateURL: AHK_UpdateURL,
                    GetUserscriptPayload: AHK_GetUserscriptPayload,
                    CacheSet: AHK_CacheSet,
                    CacheGet: AHK_CacheGet,
                    CacheClear: AHK_CacheClear
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

AHK_HideSplash(*) {
    global SplashGui, MainGui
    if (SplashGui) {
        SplashGui.Destroy()
        SplashGui := ""
        MainGui.Show("w1280 h800 center")
        MainGui.Opt("+MinSize850x450")
        WinSetTransparent(255, MainGui.Hwnd)
    }
}

AHK_PlayerGoBack(*) {
    global PlayerWV
    if (PlayerWV) {
        try {
            PlayerWV.wv.GoBack()
        } catch {
            PlayerWV.wv.ExecuteScript("window.history.back()", 0)
        }
    }
}

AHK_PlayerGoForward(*) {
    global PlayerWV
    if (PlayerWV) {
        try {
            PlayerWV.wv.GoForward()
        } catch {
            PlayerWV.wv.ExecuteScript("window.history.forward()", 0)
        }
    }
}

AHK_PlayerReload(*) {
    global PlayerWV
    if (PlayerWV) {
        try {
            PlayerWV.wv.Reload()
        } catch {
            PlayerWV.wv.ExecuteScript("window.location.reload()", 0)
        }
    }
}

AHK_ShowTooltip(text) {
    if (text) {
        ToolTip(text)
    }
}

AHK_HideTooltip(*) {
    ToolTip()
}

; Expose AHK functions to the WebView (JavaScript) using a plain object
WV.AddHostObjectToScript("ahk", {
    HideSplash: AHK_HideSplash,
    PlayerGoBack: AHK_PlayerGoBack,
    PlayerGoForward: AHK_PlayerGoForward,
    PlayerReload: AHK_PlayerReload,
    ShowTooltip: AHK_ShowTooltip,
    HideTooltip: AHK_HideTooltip,
    Minimize: AHK_Minimize,
    Maximize: AHK_Maximize,
    Close: AHK_Close,
    SaveData: AHK_SaveData,
    LoadData: AHK_LoadData,
    CacheSet: AHK_CacheSet,
    CacheGet: AHK_CacheGet,
    CacheClear: AHK_CacheClear,
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
    ListScripts: AHK_ListScripts,
    SaveScript: AHK_SaveScript,
    LoadScript: AHK_LoadScript,
    DeleteScript: AHK_DeleteScript,
    ListFlows: AHK_ListFlows,
    SaveFlow: AHK_SaveFlow,
    LoadFlow: AHK_LoadFlow,
    DeleteFlow: AHK_DeleteFlow,
    StartSmartFetch: AHK_StartSmartFetch,
    StartRawFetchParse: AHK_StartRawFetchParse,
    ListWorkspaces: AHK_ListWorkspaces,
    CreateWorkspace: AHK_CreateWorkspace,
    CloneWorkspace: AHK_CloneWorkspace,
    DeleteWorkspace: AHK_DeleteWorkspace,
    RestartWorkspace: AHK_RestartWorkspace,
    GetCurrentWorkspace: AHK_GetCurrentWorkspace
})
;WV.AddHostObjectToScript("UpdateURL", AHK_UpdateURL)

; Inject Adblocker and Preloads on document creation
try {
    ;AdblockScript := FileRead("adblock.js", "UTF-8")
    ;if (AdblockScript) {
    ;    WV.CoreWebView2.AddScriptToExecuteOnDocumentCreated(AdblockScript, 0)
    ;}
}

MainNavigationCompletedHandler(sender, args) {
    global SplashGui
    if (!args.IsSuccess && SplashGui) {
        errStatus := "Unknown Error: " args.WebErrorStatus
        if (args.WebErrorStatus != 9) {
            SplashGui.Destroy()
            SplashGui := ""
            MsgBox("Critical Error: StreamView UI failed to load the interface.`n`nError Code: " errStatus "`n`nTroubleshooting:`n- If running from source, ensure the React dev server (http://localhost:3000) is active.`n- If compiled, check local bundle integrity.", "StreamView Navigation Error", 16)
            ExitApp()
        }
    }
}
WV.add_NavigationCompleted(MainNavigationCompletedHandler)

CheckSplashTimeout() {
    global SplashGui
    if (SplashGui) {
        SplashGui.Destroy()
        SplashGui := ""
        MsgBox("Critical Error: StreamView UI did not respond within 15 seconds.`n`nThis usually indicates the frontend React development server is not running or has crashed. Please start it using 'npm run dev'.", "StreamView Timeout", 16)
        ExitApp()
    }
}
SetTimer(CheckSplashTimeout, -165000)

; Load the local React build (or dev server if testing)
WV.Navigate("http://localhost:3000") ; For development

MainGui.Show("w0 h0 x0 y0") ; Defer showing until Splash is hidden
WinSetTransparent(0, MainGui.Hwnd)
;MainGui.Hide()
;WV.Load("file:///" A_ScriptDir "\settings\dist\index.html") ; For production

; Show the GUI
; MainGui.Show("w1280 h800") ; Deferred to SplashHide

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

#Down::
{
    global MainGui, PlayerGui, PlayerWV
    activeWindow := WinGetID("A")
    if (IsSet(MainGui) && activeWindow == MainGui.Hwnd) {
        WinMinimize("ahk_id " MainGui.Hwnd)
    } else if (IsSet(PlayerGui) && activeWindow == PlayerGui.Hwnd) {
        ; PiP mode
        WinSetAlwaysOnTop(1, "ahk_id " PlayerGui.Hwnd)
        w := 400
        h := 225
        x := A_ScreenWidth - w - 20
        y := A_ScreenHeight - h - 60
        PlayerGui.Move(x, y, w, h)
        if (PlayerWV.wvc.IsVisible) {
            PlayerWV.Move(0, 0, w, h)
        }
    }
}