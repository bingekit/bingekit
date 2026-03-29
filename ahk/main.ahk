#Requires AutoHotkey v2.0
#Include Lib\WebViewToo.ahk

; -----------------------------------------------------------------------------
; StreamView Minimal - Main AHK2 Wrapper
; -----------------------------------------------------------------------------

;Create the WebViewGui
;///////////////////////////////////////////////////////////////////////////////////////////
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

AHK_FetchHTML(url) {
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

AHK_ExecuteSearch(query, engine) {
    Run(engine . query)
}

AHK_InjectJS(js) {
    global WV
    WV.ExecuteScript(js, 0)
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
    FetchHTML: AHK_FetchHTML,
    ExecuteSearch: AHK_ExecuteSearch,
    InjectJS: AHK_InjectJS
})

; Inject Adblocker and Preloads on document creation
try {
    AdblockScript := FileRead("adblock.ahk.html", "UTF-8")
    if (AdblockScript) {
        WV.CoreWebView2.AddScriptToExecuteOnDocumentCreated(AdblockScript, 0)
    }
}

; Load the local React build (or dev server if testing)
WV.Navigate("http://localhost:3000") ; For development
;WV.Load("file:///" A_ScriptDir "\settings\dist\index.html") ; For production

; Show the GUI
MainGui.Show("w1280 h800")

; Allow dragging the window by clicking the custom titlebar
OnMessage(0x0084, WM_NCHITTEST)
WM_NCHITTEST(wParam, lParam, msg, hwnd) {
    ; Basic drag implementation if needed
}