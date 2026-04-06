#Requires AutoHotkey v2.0

; Ensure WebView2 is Installed
EnsureWebView2Installed() {
    installed := false
    keys := [
        "HKEY_LOCAL_MACHINE\SOFTWARE\WOW6432Node\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}",
        "HKEY_CURRENT_USER\Software\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}",
        "HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}"
    ]
    for key in keys {
        try {
            pv := RegRead(key, "pv")
            if (pv != "" && pv != "0.0.0.0" && pv != "null") {
                installed := true
                break
            }
        }
    }

    if (!installed) {
        MsgBox("Microsoft Edge WebView2 Runtime (Evergreen) is not installed on this system.`nBingeKit requires it to render its application interface.`n`nPlease click OK to open the official Microsoft download page, install the runtime, and then launch BingeKit again.", "BingeKit - Missing Required Dependency", 16)
        Run("https://developer.microsoft.com/microsoft-edge/webview2/consumer/")
        ExitApp()
    }
}
EnsureWebView2Installed()

#SingleInstance Off

if A_IsCompiled
    A_IconHidden := true

if (!A_IsCompiled) {
    DetectHiddenWindows True
    SetTitleMatchMode 1

    ; Find all running instances of this specific uncompiled script
    for hwnd in WinGetList(A_ScriptFullPath " ahk_class AutoHotkey") {
        ; Close any instance that is not the current one
        if (hwnd != A_ScriptHwnd)
            WinClose hwnd
    }
}

DllCall("SetThreadDpiAwarenessContext", "ptr", -3, "ptr")

MinWidth := 850
MinHeight := 600