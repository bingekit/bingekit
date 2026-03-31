global PlayerGui := ""
global PlayerWV := ""
global PlayerCurrentUrl := ""
global PendingPlayerUrl := ""
global PlayerRectX := 0
global PlayerRectY := 0
global PlayerRectW := 0
global PlayerRectH := 0

global NetworkFilters := Map()
global NetworkAdblockEnabled := true
global SiteBlockersMap := "{}"

AHK_UpdateSiteBlockers(jsonStr) {
    global SiteBlockersMap
    SiteBlockersMap := jsonStr
}

AHK_GetSiteBlockers() {
    global SiteBlockersMap
    return SiteBlockersMap
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

AHK_UpdatePlayerUrl(url) {
    DoUpdateUrl() {
        global PlayerWV, PlayerCurrentUrl, PendingPlayerUrl
        if (!PlayerWV) {
            PendingPlayerUrl := url
        } else if (url != "") {
            PlayerCurrentUrl := url
            PlayerWV.Navigate(url)
        }
    }
    SetTimer(DoUpdateUrl, -1)
}

AHK_UpdatePlayerRect(x, y, w, h, visible) {
    DoUpdateRect() {
        global PlayerGui, PlayerWV, PlayerCurrentUrl, MainGui, WebViewSettings, PendingPlayerUrl
        global PlayerRectX, PlayerRectY, PlayerRectW, PlayerRectH
        global GlobalScript, AdblockScript, IsPiPMode

        if (IsPiPMode ?? false) {
            return
        }

        w := w - 3
        h := h - 3

        PlayerRectX := x
        PlayerRectY := y
        PlayerRectW := w
        PlayerRectH := h

        if (visible) {
            if (!PlayerGui) {
                PlayerGui := Gui("-Caption +ToolWindow +Owner" MainGui.Hwnd)
                PlayerGui.OnEvent("Size", AHK_PlayerGuiResized)
                PlayerWV := WebViewCtrl(PlayerGui, "w" w " h" h, WebViewSettings)

                PlayerWV.Settings.IsGeneralAutofillEnabled := 0
                PlayerWV.Settings.IsSwipeNavigationEnabled := 0
                PlayerWV.AddHostObjectToScript("ahk", {
                    UpdateURL: AHK_UpdateURL,
                    GetUserscriptPayload: AHK_GetUserscriptPayload,
                    CacheSet: AHK_CacheSet,
                    CacheGet: AHK_CacheGet,
                    CacheClear: AHK_CacheClear,
                    AddNetworkFilter: AHK_AddNetworkFilter,
                    GetSiteBlockers: AHK_GetSiteBlockers,
                    TogglePiP: AHK_TogglePiP,
                    ResizePiP: AHK_ResizePiP,
                    DragMove: AHK_DragMove,
                    ResizeEdge: AHK_ResizeEdge,
                    ReportPlayState: AHK_ReportPlayState,
                    ToggleMedia: AHK_ToggleMedia,
                    ReportPlayerStatus: AHK_ReportPlayerStatus
                })
                PlayerWV.AddScriptToExecuteOnDocumentCreatedAsync(GlobalScript)
                PlayerWV.AddScriptToExecuteOnDocumentCreatedAsync(AdblockScript)
                PlayerWV.AddScriptToExecuteOnDocumentCreatedAsync("try { var _usJs = window.chrome.webview.hostObjects.sync.ahk.GetUserscriptPayload(); if(_usJs) { (function(){eval(_usJs)})(); } } catch(e) { console.error('Userscript bootstrap error:', e); }")
                PlayerWV.wv.add_ContainsFullScreenElementChanged(AHK_PlayerFullscreenChanged)
                try {
                    PlayerWV.wv.AddWebResourceRequestedFilter("*", 0)
                    PlayerWV.wv.add_WebResourceRequested(AHK_PlayerResourceRequested)
                } catch as e {
                    OutputDebug(e.Message)
                }
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

AHK_PlayerFullscreenChanged(ICoreWebView2, *) {
    global PlayerGui, PlayerWV, MainGui
    global PlayerRectX, PlayerRectY, PlayerRectW, PlayerRectH
    try {
        if (ICoreWebView2.ContainsFullScreenElement) {
            mon := DllCall("MonitorFromWindow", "Ptr", PlayerGui.Hwnd, "UInt", 2, "Ptr")
            NumPut("UInt", 40, mInfo := Buffer(40))
            DllCall("GetMonitorInfo", "Ptr", mon, "Ptr", mInfo)
            mX := NumGet(mInfo, 4, "Int")
            mY := NumGet(mInfo, 8, "Int")
            mW := NumGet(mInfo, 12, "Int") - mX
            mH := NumGet(mInfo, 16, "Int") - mY
            PlayerGui.Opt("+AlwaysOnTop")
            PlayerGui.Move(mX, mY, mW, mH)
            PlayerWV.Move(0, 0, mW, mH)
            PlayerWV.wvc.Fill()
        } else {
            PlayerGui.Opt("-AlwaysOnTop")
            WinGetClientPos(&CX, &CY, , , MainGui.Hwnd)
            PlayerGui.Move(CX + PlayerRectX, CY + PlayerRectY, PlayerRectW, PlayerRectH)
            PlayerWV.Move(0, 0, PlayerRectW, PlayerRectH)
            PlayerWV.wvc.Fill()
        }
    } catch {
    }
}

AHK_PlayerGoBack(*) {
    global PlayerWV
    if (PlayerWV) {
        try {
            PlayerWV.wv.GoBack()
        } catch {
            PlayerWV.wv.ExecuteScriptAsync("window.history.back()")
        }
    }
}

AHK_PlayerGoForward(*) {
    global PlayerWV
    if (PlayerWV) {
        try {
            PlayerWV.wv.GoForward()
        } catch {
            PlayerWV.wv.ExecuteScriptAsync("window.history.forward()")
        }
    }
}

AHK_PlayerReload(*) {
    global PlayerWV
    if (PlayerWV) {
        try {
            PlayerWV.wv.Reload()
        } catch {
            PlayerWV.wv.ExecuteScriptAsync("window.location.reload()")
        }
    }
}

AHK_UpdateNetworkFilters(jsonStr) {
    global NetworkFilters
    NetworkFilters.Clear()
    pos := 1
    while RegExMatch(jsonStr, '"([^"]+)":\s*true', &match, pos) {
        NetworkFilters[match[1]] := true
        pos := match.Pos(1) + StrLen(match[1])
    }
}

AHK_AddNetworkFilter(term) {
    global NetworkFilters, MainGui
    if (!NetworkFilters.Has(term)) {
        NetworkFilters[term] := true
        try {
            MainGui.Control.ExecuteScriptAsync("window.postMessage({ type: 'addNetworkFilter', term: '" term "' }, '*');")
        } catch as e {
            OutputDebug(e.Message)
        }

        json := "{"
        for t, _ in NetworkFilters {
            json .= '"' t '": true,'
        }
        json := RTrim(json, ",")
        json .= "}"
        AHK_SaveData("network_filters.json", json)
    }
}

AHK_UpdateAdblockStatus(status) {
    global NetworkAdblockEnabled
    NetworkAdblockEnabled := (status = "true")
}

AHK_PlayerResourceRequested(sender, args) {
    global NetworkFilters, NetworkAdblockEnabled
    if (!NetworkAdblockEnabled || NetworkFilters.Count = 0) {
        return
    }

    uri := args.Request.Uri
    isBlocked := false
    for term, _ in NetworkFilters {
        if (InStr(uri, term)) {
            isBlocked := true
            break
        }
    }

    if (isBlocked) {
        try {
            ; Return 403 Forbidden to block it seamlessly.
            args.Response := sender.Environment.CreateWebResourceResponse(0, 403, "Blocked", "")
        } catch {
            ; Fallback if Environment isn't directly exposed
        }
    }
}

AHK_PlayerGuiResized(guiObj, minMax, width, height) {
    global PlayerWV
    if (minMax = -1)
        return
    if (PlayerWV) {
        PlayerWV.Move(0, 0, width, height)
        PlayerWV.wvc.Fill()
    }
}
AHK_ReportPlayerStatus(authStatus, hasPlayer) {
    global MainGui
    if (MainGui) {
        js := "try { window.dispatchEvent(new CustomEvent('player-status-update', { detail: { authStatus: '" authStatus "', hasPlayer: " (hasPlayer ? "true" : "false") " } })) } catch(e) {}"
        MainGui.Control.ExecuteScriptAsync(js)
    }
}