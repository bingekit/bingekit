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

class AHKHost {
    Minimize() {
        global MainGui
        MainGui.Minimize()
    }
    Maximize() {
        global MainGui
        if (WinGetMinMax(MainGui.Hwnd) = 1)
            WinRestore(MainGui.Hwnd)
        else
            WinMaximize(MainGui.Hwnd)
    }
    Close() {
        ExitApp()
    }

    ; Local Save / Portability (General)
    SaveData(filename, data) {
        if FileExist(filename)
            FileDelete(filename)
        FileAppend(data, filename, "UTF-8")
    }
    LoadData(filename) {
        return FileExist(filename) ? FileRead(filename, "UTF-8") : ""
    }

    ; Site Plugins Management
    ListSites() {
        if !DirExist(A_ScriptDir "\sites")
            DirCreate(A_ScriptDir "\sites")
        fileList := ""
        Loop Files, A_ScriptDir "\sites\*.json"
            fileList .= A_LoopFileName "|"
        return RTrim(fileList, "|")
    }
    SaveSite(filename, data) {
        if !DirExist(A_ScriptDir "\sites")
            DirCreate(A_ScriptDir "\sites")
        filepath := A_ScriptDir "\sites\" filename
        if FileExist(filepath)
            FileDelete(filepath)
        FileAppend(data, filepath, "UTF-8")
        return true
    }
    LoadSite(filename) {
        filepath := A_ScriptDir "\sites\" filename
        return FileExist(filepath) ? FileRead(filepath, "UTF-8") : ""
    }
    DeleteSite(filename) {
        filepath := A_ScriptDir "\sites\" filename
        if FileExist(filepath)
            FileDelete(filepath)
        return true
    }

    ; Background HTML Fetching (Bypasses CORS for checking updates)
    FetchHTML(url) {
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

    ; Multi-search execution
    ExecuteSearch(query, engine) {
        Run(engine . query)
    }

    ; Inject JavaScript
    InjectJS(js) {
        global WV
        WV.CoreWebView2.ExecuteScript(js, 0)
    }
}

; Expose AHK functions to the WebView (JavaScript)
WV.AddHostObjectToScript("ahk", AHKHost())

; Inject Adblocker and Preloads on document creation
try {
    AdblockScript := FileRead("adblock.ahk.html", "UTF-8")
    if (AdblockScript) {
        WV.CoreWebView2.AddScriptToExecuteOnDocumentCreated(AdblockScript, 0)
    }
}

; Load the local React build (or dev server if testing)
WV.Navigate("http://localhost:3000") ; For development
;WV.Load("file:///" A_ScriptDir "\dist\index.html") ; For production

; Show the GUI
MainGui.Show("w1280 h800")

; Allow dragging the window by clicking the custom titlebar
OnMessage(0x0084, WM_NCHITTEST)
WM_NCHITTEST(wParam, lParam, msg, hwnd) {
    ; Basic drag implementation if needed
}