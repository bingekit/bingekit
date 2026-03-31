#HotIf IsSet(MainGui) && (WinActive("ahk_id " MainGui.Hwnd) || WinActive("ahk_id " PlayerGui.Hwnd))
#Up::
{
    global MainGui, PlayerGui, PlayerWV
    WinMaximize("ahk_id " MainGui.Hwnd)
}
#Down::
{
    global MainGui, PlayerGui, PlayerWV
    WinMinimize("ahk_id " MainGui.Hwnd)
}
#HotIf

#HotIf MainGui != "" && WinActive("ahk_id " MainGui.Hwnd)
F5::
{
    global MainGui, PlayerGui, PlayerWV
    AHK_EvalPlayerJS("window.location.reload()")
}
#HotIf

#HotIf IsSet(IsPiPMode) && IsPiPMode && PlayerGui != "" && WinActive("ahk_id " PlayerGui.Hwnd)
Escape:: AHK_TogglePiP()
!F4:: AHK_TogglePiP()
#HotIf

#HotIf (IsSet(MainGui) && MainGui != "" && WinActive("ahk_id " MainGui.Hwnd)) || (IsSet(PlayerGui) && PlayerGui != "" && WinActive("ahk_id " PlayerGui.Hwnd))
F11::
{
    global PlayerWV
    if (IsSet(PlayerWV) && PlayerWV != "") {
        js := "(function() { "
            . "if(document.fullscreenElement) { document.exitFullscreen(); } else { "
            . "const vs = Array.from(document.querySelectorAll('video, iframe[allowfullscreen]')); "
            . "const t = vs.length > 0 ? vs[0] : null; "
            . "if(t && typeof t.requestFullscreen === 'function') { t.requestFullscreen().catch(() => document.documentElement.requestFullscreen()); } "
            . "else { document.documentElement.requestFullscreen(); } } })();"

        try {
            PlayerWV.wv.ExecuteScriptAsync(js)
        } catch {
            ; Failed to execute script
        }
    }
}
Escape::
{
    global PlayerWV
    if (IsSet(PlayerWV) && PlayerWV != "") {
        js := "(function() { "
            . "if(document.fullscreenElement) { document.exitFullscreen(); } "
            . "})();"

        try {
            PlayerWV.wv.ExecuteScriptAsync(js)
        } catch {
            ; Failed to execute script
        }
    }
}
#HotIf