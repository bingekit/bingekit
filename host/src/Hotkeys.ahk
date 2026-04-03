isAppActive() {
    global MainGui, PlayerGuis
    if (IsSet(MainGui) && MainGui != "" && WinActive("ahk_id " MainGui.Hwnd))
        return true
    if (IsSet(PlayerGuis)) {
        for _, bg in PlayerGuis {
            if (WinActive("ahk_id " bg.Hwnd))
                return true
        }
    }
    return false
}

#HotIf isAppActive() && !(IsSet(IsPiPMode) && IsPiPMode)
#Up::
{
    global MainGui
    WinMaximize("ahk_id " MainGui.Hwnd)
}
#Down::
{
    global MainGui
    WinMinimize("ahk_id " MainGui.Hwnd)
}
F5::
{
    global MainGui
    AHK_EvalPlayerJS("window.location.reload()")
}
F11::
{
    global PlayerWVs, ActiveTabId
    if (PlayerWVs.Has(ActiveTabId)) {
        js := "(function() { "
            . "if(document.fullscreenElement) { document.exitFullscreen(); } else { "
            . "const vs = Array.from(document.querySelectorAll('video, iframe[allowfullscreen]')); "
            . "const t = vs.length > 0 ? vs[0] : null; "
            . "if(t && typeof t.requestFullscreen === 'function') { t.requestFullscreen().catch(() => document.documentElement.requestFullscreen()); } "
            . "else { document.documentElement.requestFullscreen(); } } })();"
        try {
            PlayerWVs[ActiveTabId].wv.ExecuteScriptAsync(js)
        } catch {
        }
    }
}
Escape::
{
    global PlayerWVs, ActiveTabId
    if (PlayerWVs.Has(ActiveTabId)) {
        js := "(function() { "
            . "if(document.fullscreenElement) { document.exitFullscreen(); } "
            . "})();"
        try {
            PlayerWVs[ActiveTabId].wv.ExecuteScriptAsync(js)
        } catch {
        }
    }
}
!F4::
{
    ExitApp()
}
^w::
{
    global MainGui
    if (IsSet(MainGui) && MainGui != "") {
        js := "try { window.dispatchEvent(new CustomEvent('bk-close-active-tab')) } catch(e){}"
        MainGui.Control.ExecuteScriptAsync(js)
    }
}
^t::
{
    global MainGui
    if (IsSet(MainGui) && MainGui != "") {
        js := "try { window.dispatchEvent(new CustomEvent('bk-new-tab')) } catch(e){}"
        MainGui.Control.ExecuteScriptAsync(js)
    }
}
#HotIf

#HotIf IsSet(IsPiPMode) && IsPiPMode && isAppActive()
Escape:: AHK_TogglePiP()
!F4:: AHK_TogglePiP()
#HotIf