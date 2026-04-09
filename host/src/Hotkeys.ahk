isAppActive() {
    global MainGuis, PlayerGuis
    if (IsSet(MainGuis)) {
        for wid, g in MainGuis {
            if (WinActive("ahk_id " g.Hwnd))
                return true
        }
    }
    if (IsSet(PlayerGuis)) {
        for _, bg in PlayerGuis {
            if (WinActive("ahk_id " bg.Hwnd))
                return true
        }
    }
    return false
}

GetActiveMainGui() {
    global MainGuis, PlayerGuis, PlayerOwners
    if (IsSet(MainGuis)) {
        for wid, g in MainGuis {
            if (WinActive("ahk_id " g.Hwnd))
                return g
        }
    }
    if (IsSet(PlayerGuis)) {
        for id, bg in PlayerGuis {
            if (WinActive("ahk_id " bg.Hwnd)) {
                ownerId := (IsSet(PlayerOwners) && PlayerOwners.Has(id)) ? PlayerOwners[id] : "main"
                if (MainGuis.Has(ownerId))
                    return MainGuis[ownerId]
            }
        }
    }
    
    if (IsSet(MainGuis)) {
        if (MainGuis.Has("main"))
            return MainGuis["main"]
        for wid, g in MainGuis {
            return g
        }
    }
    return ""
}

#HotIf isAppActive() && !(IsSet(IsPiPMode) && IsPiPMode)
#Up::
{
    g := GetActiveMainGui()
    if (g)
        WinMaximize("ahk_id " g.Hwnd)
}
#Down::
{
    g := GetActiveMainGui()
    if (g)
        WinMinimize("ahk_id " g.Hwnd)
}
F5::
{
    g := GetActiveMainGui()
    if (g) {
        try AHK_EvalPlayerJS("", "window.location.reload()")
    }
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
    g := GetActiveMainGui()
    if (g) {
        js := "try { window.dispatchEvent(new CustomEvent('bk-close-active-tab')) } catch(e){}"
        g.Control.ExecuteScriptAsync(js)
    }
}
^t::
{
    g := GetActiveMainGui()
    if (g) {
        js := "try { window.dispatchEvent(new CustomEvent('bk-new-tab')) } catch(e){}"
        g.Control.ExecuteScriptAsync(js)
    }
}
$#Left::
{
    g := GetActiveMainGui()
    if (g && !WinActive("ahk_id " g.Hwnd)) {
        WinActivate("ahk_id " g.Hwnd)
    }
    Send("{LWin down}{Left}{LWin up}")
}
$#Right::
{
    g := GetActiveMainGui()
    if (g && !WinActive("ahk_id " g.Hwnd)) {
        WinActivate("ahk_id " g.Hwnd)
    }
    Send("{LWin down}{Right}{LWin up}")
}
#HotIf

#HotIf IsSet(IsPiPMode) && IsPiPMode && isAppActive()
Escape:: AHK_TogglePiP("")
!F4:: AHK_TogglePiP("")
#HotIf