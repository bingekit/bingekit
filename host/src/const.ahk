#Requires AutoHotkey v2.0


#SingleInstance Off

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
MinHeight := 500