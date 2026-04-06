global PlayerGuis := Map()
global PlayerWVs := Map()
global PlayerCurrentUrls := Map()
global PendingPlayerUrls := Map()
global PlayerRects := Map()
global PlayerOwners := Map()

global NetworkFilters := Map()
global NetworkAdblockEnabled := true
global AdblockWhitelist := []
global AdKeywords := '[]'
global RedirectKeywords := '[]'
global InlineKeywords := '[]'
global CssAdblockSelectors := '[]'
global SiteBlockersMap := "{}"

global ActiveTabId := "main"
global ActiveMediaStreams := Map()
global ActiveMediaSubtitles := Map()

AHK_SetActiveTabId(windowId, id) {
    global ActiveTabId
    ActiveTabId := id
}

AHK_UpdateSiteBlockers(jsonStr) {
    global SiteBlockersMap
    SiteBlockersMap := jsonStr
}

AHK_GetSiteBlockers() {
    global SiteBlockersMap
    return SiteBlockersMap
}

AHK_UpdateURL(windowId, url, id := "") {
    global PlayerCurrentUrls, ActiveTabId, MainGuis
    id := id ? id : ActiveTabId
    try {
        PlayerCurrentUrls[id] := url
        js := 'window.dispatchEvent(new CustomEvent("player-url-changed", { detail: { url: "' url '", tabId: "' id '" } }))'
        if (MainGuis.Has(windowId))
            MainGuis[windowId].Control.ExecuteScriptAsync(js)
    } catch {
    }
}

AHK_UpdatePlayerUrl(windowId, url, id := "main") {
    DoUpdateUrl() {
        global PlayerWVs, PlayerCurrentUrls, PendingPlayerUrls
        if (!PlayerWVs.Has(id)) {
            PendingPlayerUrls[id] := url
        } else if (url != "") {
            PlayerCurrentUrls[id] := url
            PlayerWVs[id].Navigate(url)
        }
    }
    SetTimer(DoUpdateUrl, -1)
}

AHK_UpdatePlayerRect(windowId, x, y, w, h, visible, id := "main") {
    DoUpdateRect() {
        global PlayerGuis, PlayerWVs, PlayerCurrentUrls, MainGuis, WebViewSettings, PendingPlayerUrls
        global PlayerRects, PlayerOwners
        PlayerOwners[id] := windowId
        global GlobalScript, AdblockScript, IsPiPMode

        if (IsPiPMode ?? false) {
            return
        }

        w := w - 3
        h := h - 3
        if (w < 50)
            w := 50
        if (h < 50)
            h := 50

        if (!PlayerRects.Has(id)) {
            PlayerRects[id] := { x: x, y: y, w: w, h: h, visible: visible }
        } else {
            PlayerRects[id].x := x
            PlayerRects[id].y := y
            PlayerRects[id].w := w
            PlayerRects[id].h := h
            PlayerRects[id].visible := visible
        }

        if (!PlayerGuis.Has(id)) {
            PlayerGuis[id] := Gui("-Caption +ToolWindow +Owner" MainGuis[windowId].Hwnd)
            PlayerGuis[id].BackColor := "09090b"
            PlayerGuis[id].OnEvent("Size", AHK_PlayerGuiResized)
            PlayerWVs[id] := WebViewCtrl(PlayerGuis[id], "w" w " h" h, WebViewSettings)

            PlayerWVs[id].Settings.IsGeneralAutofillEnabled := 0
            PlayerWVs[id].Settings.IsSwipeNavigationEnabled := 0
            PlayerWVs[id].Settings.IsBuiltInErrorPageEnabled := 0
            if (!DirExist(WorkspaceDir "\interfaces")) {
                DirCreate(WorkspaceDir "\interfaces")
            }
            PlayerWVs[id].BrowseFolder(WorkspaceDir "\interfaces", "interface.localhost")
            PlayerWVs[id].AddHostObjectToScript("ahk", {
                UpdateURL: (url) => AHK_UpdateURL(windowId, url, id),
                GetUserscriptPayload: AHK_GetUserscriptPayload,
                GetAdblockStatus: AHK_GetAdblockStatus,
                GetAdblockWhitelist: AHK_GetAdblockWhitelist,
                GetAdKeywords: AHK_GetAdKeywords,
                GetRedirectKeywords: AHK_GetRedirectKeywords,
                GetInlineKeywords: AHK_GetInlineKeywords,
                GetCssAdblockSelectors: AHK_GetCssAdblockSelectors,
                CacheSet: AHK_CacheSet,
                CacheGet: AHK_CacheGet,
                CacheClear: AHK_CacheClear,
                RawFetchHTML: AHK_RawFetchHTML,
                AddNetworkFilter: AHK_AddNetworkFilter,
                GetSiteBlockers: AHK_GetSiteBlockers,
                TogglePiP: AHK_TogglePiP.Bind(windowId, id),
                ResizePiP: AHK_ResizePiP.Bind(windowId, id),
                DragMove: AHK_DragMove.Bind(windowId, id),
                ResizeEdge: AHK_ResizeEdge.Bind(windowId, id),
                ReportPlayState: (state, time := 0, dur := 0, src := "") => AHK_ReportPlayState(state, time, dur, src, id),
                ToggleMedia: AHK_ToggleMedia,
                ReportPlayerStatus: (auth, hasP, title := "") => AHK_ReportPlayerStatus(auth, hasP, title, id),
                SetMediaStream: (v, q := "", a := "") => AHK_SetMediaStream(v, q, a, id),
                SetSubtitleStream: (v, a := "") => AHK_SetSubtitleStream(v, a, id),
                ToggleBookmark: AHK_ToggleBookmark.Bind(windowId, id),
                ShowToast: AHK_ShowToast
            })
            PlayerWVs[id].AddScriptToExecuteOnDocumentCreatedAsync(GlobalScript)
            PlayerWVs[id].AddScriptToExecuteOnDocumentCreatedAsync(AdblockScript)
            PlayerWVs[id].AddScriptToExecuteOnDocumentCreatedAsync("try { var _usJs = window.chrome.webview.hostObjects.sync.ahk.GetUserscriptPayload(); if(_usJs) { (function(){eval(_usJs)})(); } } catch(e) { console.error('Userscript bootstrap error:', e); }")
            PlayerWVs[id].wv.add_ContainsFullScreenElementChanged(AHK_PlayerFullscreenChanged)
            try {
                PlayerWVs[id].wv.add_NavigationStarting(AHK_PlayerNavigationStarting)
            } catch {
            }
            try {
                PlayerWVs[id].wv.add_NavigationCompleted(AHK_PlayerNavigationCompleted)
            } catch {
            }
            try {
                PlayerWVs[id].wv.add_NewWindowRequested(AHK_PlayerNewWindowRequested)
            } catch {
            }
            try {
                PlayerWVs[id].wv.add_DocumentTitleChanged(AHK_PlayerTitleChanged)
            } catch {
            }
            try {
                PlayerWVs[id].wv.add_FaviconChanged(AHK_PlayerFaviconChanged)
            } catch {
            }
            try {
                PlayerWVs[id].wv.add_DownloadStarting(AHK_DownloadStarting)
            } catch {
            }
            try {
                PlayerWVs[id].wv.AddWebResourceRequestedFilter("*", 0)
                PlayerWVs[id].wv.add_WebResourceRequested(AHK_PlayerResourceRequested)
            } catch as e {
                OutputDebug(e.Message)
            }
            if (PendingPlayerUrls.Has(id) && PendingPlayerUrls[id] != "") {
                pendingUrl := PendingPlayerUrls[id]
                PendingPlayerUrls.Delete(id)
                PlayerCurrentUrls[id] := pendingUrl
                PlayerWVs[id].Navigate(pendingUrl)
            }
        }

        if (visible) {
            if (PlayerWVs.Has(id) && PlayerGuis.Has(id)) {
                WinGetClientPos(&CX, &CY, , , MainGuis[windowId].Hwnd)
                ScreenX := CX + x
                ScreenY := CY + y

                try {
                    WinGetPos(&currentX, &currentY, &currentW, &currentH, "ahk_id " PlayerGuis[id].Hwnd)
                } catch {
                    currentX := 0, currentY := 0, currentW := 0, currentH := 0
                }
                if (currentX != ScreenX || currentY != ScreenY || currentW != w || currentH != h) {
                    PlayerWVs[id].wvc.IsVisible := 1
                    PlayerWVs[id].Move(0, 0, w, h)
                    PlayerWVs[id].wvc.Fill()
                    PlayerGuis[id].Show("x" ScreenX " y" ScreenY " w" w " h" h " NA")
                }
            }
        } else {
            if (PlayerGuis.Has(id)) {
                try {
                    WinGetPos(&currentX, &currentY, &currentW, &currentH, "ahk_id " PlayerGuis[id].Hwnd)
                } catch {
                    currentX := 0, currentY := 0, currentW := 0, currentH := 0
                }
                if (currentX != -9999 || currentY != -9999 || currentW != w || currentH != h) {
                    if (PlayerWVs.Has(id)) {
                        PlayerWVs[id].wvc.IsVisible := 1
                        PlayerWVs[id].Move(0, 0, w, h)
                        PlayerWVs[id].wvc.Fill()
                    }
                    PlayerGuis[id].Show("x-9999 y-9999 w" w " h" h " NA")
                }
            }
        }
    }
    SetTimer(DoUpdateRect, -1)
}

AHK_ClosePlayer(windowId, id) {
    DoClose() {
        global PlayerGuis, PlayerWVs, PlayerCurrentUrls, PendingPlayerUrls, PlayerRects, ActiveMediaStreams, ActiveMediaSubtitles
        if (PlayerGuis.Has(id)) {
            try PlayerWVs[id].wvc.IsVisible := 0
            try PlayerGuis[id].Destroy()
            PlayerGuis.Delete(id)
            PlayerWVs.Delete(id)
            if (PlayerCurrentUrls.Has(id))
                PlayerCurrentUrls.Delete(id)
            if (PendingPlayerUrls.Has(id))
                PendingPlayerUrls.Delete(id)
            if (PlayerRects.Has(id))
                PlayerRects.Delete(id)
            if (ActiveMediaStreams.Has(id))
                ActiveMediaStreams.Delete(id)
            if (ActiveMediaSubtitles.Has(id))
                ActiveMediaSubtitles.Delete(id)
        }
    }
    SetTimer(DoClose, -1)
}

AHK_SyncPlayers(windowId, keepIdsList) {
    DoSync() {
        global PlayerGuis
        keepArr := StrSplit(keepIdsList, ",")
        keepMap := Map()
        for _, id in keepArr {
            keepMap[id] := true
        }
        
        toClose := []
        for id, _ in PlayerGuis {
            if (!keepMap.Has(id)) {
                toClose.Push(id)
            }
        }
        for _, id in toClose {
            AHK_ClosePlayer(windowId, id)
        }
    }
    SetTimer(DoSync, -1)
}

AHK_PlayerGuiResized(guiObj, minMax, width, height) {
    global PlayerWVs, PlayerGuis
    if (minMax = -1)
        return
    for id, pwv in PlayerWVs {
        if (PlayerGuis.Has(id) && PlayerGuis[id].Hwnd == guiObj.Hwnd) {
            pwv.Move(0, 0, width, height)
            pwv.wvc.Fill()
            break
        }
    }
}

AHK_PlayerFullscreenChanged(ICoreWebView2, *) {
    global PlayerGuis, PlayerWVs, MainGuis, PlayerRects, PlayerOwners
    foundId := ""
    for id, pwv in PlayerWVs {
        if (pwv.wv.ptr == ICoreWebView2.ptr) {
            foundId := id
            break
        }
    }
    if (foundId == "")
        return

    try {
        if (ICoreWebView2.ContainsFullScreenElement) {
            mon := DllCall("MonitorFromWindow", "Ptr", PlayerGuis[foundId].Hwnd, "UInt", 2, "Ptr")
            NumPut("UInt", 40, mInfo := Buffer(40))
            DllCall("GetMonitorInfo", "Ptr", mon, "Ptr", mInfo)
            mX := NumGet(mInfo, 4, "Int")
            mY := NumGet(mInfo, 8, "Int")
            mW := NumGet(mInfo, 12, "Int") - mX
            mH := NumGet(mInfo, 16, "Int") - mY
            PlayerGuis[foundId].Opt("+AlwaysOnTop")
            PlayerGuis[foundId].Move(mX, mY, mW, mH)
            PlayerWVs[foundId].Move(0, 0, mW, mH)
            PlayerWVs[foundId].wvc.Fill()
        } else {
            PlayerGuis[foundId].Opt("-AlwaysOnTop")
            ownerId := PlayerOwners.Has(foundId) ? PlayerOwners[foundId] : "main"
            if (MainGuis.Has(ownerId)) {
                WinGetClientPos(&CX, &CY, , , MainGuis[ownerId].Hwnd)
                PlayerGuis[foundId].Move(CX + PlayerRects[foundId].x, CY + PlayerRects[foundId].y, PlayerRects[foundId].w, PlayerRects[foundId].h)
            }
            PlayerWVs[foundId].Move(0, 0, PlayerRects[foundId].w, PlayerRects[foundId].h)
            PlayerWVs[foundId].wvc.Fill()
        }
    } catch {
    }
}

AHK_PlayerTitleChanged(ICoreWebView2, *) {
    global PlayerWVs
    foundId := ""
    for id, pwv in PlayerWVs {
        if (pwv.wv.ptr == ICoreWebView2.ptr) {
            foundId := id
            break
        }
    }
    if (foundId == "")
        return

    try {
        title := ICoreWebView2.DocumentTitle
        AHK_ReportPlayerStatus("unknown", false, title, foundId)
    } catch {
    }
}

AHK_PlayerFaviconChanged(ICoreWebView2, *) {
    global PlayerWVs
    foundId := ""
    for id, pwv in PlayerWVs {
        if (pwv.wv.ptr == ICoreWebView2.ptr) {
            foundId := id
            break
        }
    }
    if (foundId == "")
        return

    try {
        favUri := ICoreWebView2.FaviconUri
        AHK_ReportPlayerFavicon(favUri, foundId)
    } catch {
    }
}

AHK_ReportPlayerFavicon(favUri, id := "") {
    global MainGuis, ActiveTabId, PlayerOwners
    id := id ? id : ActiveTabId
    ownerId := PlayerOwners.Has(id) ? PlayerOwners[id] : "main"
    if (MainGuis.Has(ownerId)) {
        safeFav := StrReplace(favUri, "'", "\'")
        safeFav := StrReplace(safeFav, "`n", "")
        safeFav := StrReplace(safeFav, "`r", "")
        js := "try { window.dispatchEvent(new CustomEvent('player-favicon-update', { detail: { favicon: '" safeFav "', tabId: '" id "' } })) } catch(e) {}"
        MainGuis[ownerId].Control.ExecuteScriptAsync(js)
    }
}

AHK_PlayerGoBack(windowId, id := "main") {
    global PlayerWVs, ActiveTabId
    id := id ? id : ActiveTabId
    if (PlayerWVs.Has(id)) {
        try {
            PlayerWVs[id].wv.GoBack()
        } catch {
            PlayerWVs[id].wv.ExecuteScriptAsync("window.history.back()")
        }
    }
}

AHK_PlayerGoForward(windowId, id := "main") {
    global PlayerWVs, ActiveTabId
    id := id ? id : ActiveTabId
    if (PlayerWVs.Has(id)) {
        try {
            PlayerWVs[id].wv.GoForward()
        } catch {
            PlayerWVs[id].wv.ExecuteScriptAsync("window.history.forward()")
        }
    }
}

AHK_PlayerReload(windowId, id := "main") {
    global PlayerWVs, ActiveTabId
    id := id ? id : ActiveTabId
    if (PlayerWVs.Has(id)) {
        try {
            PlayerWVs[id].wv.Reload()
        } catch {
            PlayerWVs[id].wv.ExecuteScriptAsync("window.location.reload()")
        }
    }
}

AHK_MutePlayer(windowId, muted, id := "main") {
    global PlayerWVs, ActiveTabId
    id := id ? id : ActiveTabId
    if (PlayerWVs.Has(id)) {
        try {
            PlayerWVs[id].wv.IsMuted := (muted = "true" || muted = 1 || muted = true) ? 1 : 0
        } catch {
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
    global NetworkFilters, MainGuis
    if (!NetworkFilters.Has(term)) {
        NetworkFilters[term] := true
        for wid, g in MainGuis {
            try {
                g.Control.ExecuteScriptAsync("window.postMessage({ type: 'addNetworkFilter', term: '" term "' }, '*');")
            } catch as e {
                OutputDebug(e.Message)
            }
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

AHK_GetAdblockStatus() {
    global NetworkAdblockEnabled
    return NetworkAdblockEnabled ? 1 : 0
}

AHK_UpdateAdblockWhitelist(jsonStr) {
    global AdblockWhitelist
    AdblockWhitelist := []
    try {
        str := Trim(jsonStr, "[]")
        arr := StrSplit(str, ",")
        for item in arr {
            clean := StrReplace(item, '"', '')
            clean := Trim(clean)
            if (clean != "")
                AdblockWhitelist.Push(clean)
        }
    } catch {
    }
}

AHK_GetAdblockWhitelist() {
    global AdblockWhitelist
    res := "["
    for item in AdblockWhitelist {
        res .= '"' item '",'
    }
    res := RTrim(res, ",")
    res .= "]"
    return res
}

AHK_UpdateAdKeywords(jsonStr) {
    global AdKeywords
    AdKeywords := jsonStr
}

AHK_GetAdKeywords() {
    global AdKeywords
    return AdKeywords
}

AHK_UpdateRedirectKeywords(jsonStr) {
    global RedirectKeywords
    RedirectKeywords := jsonStr
}

AHK_GetRedirectKeywords() {
    global RedirectKeywords
    return RedirectKeywords
}

AHK_UpdateInlineKeywords(jsonStr) {
    global InlineKeywords
    InlineKeywords := jsonStr
}

AHK_GetInlineKeywords() {
    global InlineKeywords
    return InlineKeywords
}

AHK_UpdateCssAdblockSelectors(jsonStr) {
    global CssAdblockSelectors
    CssAdblockSelectors := jsonStr
}

AHK_GetCssAdblockSelectors() {
    global CssAdblockSelectors
    return CssAdblockSelectors
}

AHK_GetActiveMedia(windowId := "main") {
    global ActiveTabId, ActiveMediaStreams
    if (ActiveMediaStreams.Has(ActiveTabId))
        return ActiveMediaStreams[ActiveTabId]
    return ""
}

AHK_GetActiveSubtitle(windowId := "main") {
    global ActiveTabId, ActiveMediaSubtitles
    if (ActiveMediaSubtitles.Has(ActiveTabId)) {
        subs := ActiveMediaSubtitles[ActiveTabId]
        if (subs.Length > 0)
            return subs[subs.Length]
    }
    return ""
}

AHK_PlayerResourceRequested(sender, args) {
    global NetworkFilters, NetworkAdblockEnabled, ActiveMediaStreams, ActiveMediaSubtitles, MainGuis, PlayerWVs, PlayerOwners

    foundId := "main"
    for id, pwv in PlayerWVs {
        if (pwv.wv.ptr == sender.ptr) {
            foundId := id
            break
        }
    }

    isWhitelisted := false
    if (PlayerCurrentUrls.Has(foundId)) {
        siteUrl := PlayerCurrentUrls[foundId]
        for w in AdblockWhitelist {
            if (InStr(siteUrl, w)) {
                isWhitelisted := true
                break
            }
        }
    }

    if (!NetworkAdblockEnabled || isWhitelisted || NetworkFilters.Count = 0) {
        ; Still do media checking
    }

    uri := args.Request.Uri

    if (InStr(uri, "http://blank.localhost/")) {
        try {
            args.Response := sender.Environment.CreateWebResourceResponse(0, 200, "OK", "")
            return
        } catch {
        }
    }

    if (RegExMatch(uri, "i)(\.m3u8?|\.mp4|\.flv|\.webm|/playlist|/manifest|type=video|/master(\.txt|\.json|/)|/hls/(index|master))")) {
        ActiveMediaStreams[foundId] := uri
        ownerId := PlayerOwners.Has(foundId) ? PlayerOwners[foundId] : "main"
        if (MainGuis.Has(ownerId)) {
            js := "try { window.dispatchEvent(new CustomEvent('bk-media-detected', { detail: { type: 'video', url: '" StrReplace(uri, "'", "\'") "', tabId: '" foundId "' } })) } catch(e){}"
            MainGuis[ownerId].Control.ExecuteScriptAsync(js)
        }
    } else if (InStr(uri, ".vtt") || InStr(uri, ".srt") || InStr(uri, ".ass")) {
        if (!ActiveMediaSubtitles.Has(foundId))
            ActiveMediaSubtitles[foundId] := []
        ActiveMediaSubtitles[foundId].Push(uri)
        ownerId := PlayerOwners.Has(foundId) ? PlayerOwners[foundId] : "main"
        if (MainGuis.Has(ownerId)) {
            js := "try { window.dispatchEvent(new CustomEvent('bk-media-detected', { detail: { type: 'subtitle', url: '" StrReplace(uri, "'", "\'") "', tabId: '" foundId "' } })) } catch(e){}"
            MainGuis[ownerId].Control.ExecuteScriptAsync(js)
        }
    }

    if (!NetworkAdblockEnabled || isWhitelisted || NetworkFilters.Count = 0) {
        return
    }

    isBlocked := false
    for term, _ in NetworkFilters {
        if (InStr(uri, term)) {
            isBlocked := true
            break
        }
    }

    if (isBlocked) {
        try {
            args.Response := sender.Environment.CreateWebResourceResponse(0, 403, "Blocked", "")
        } catch {
        }
    }
}

AHK_ReportPlayerStatus(authStatus, hasPlayer, titleStr := "", id := "") {
    global MainGuis, ActiveTabId, PlayerOwners
    id := id ? id : ActiveTabId
    ownerId := PlayerOwners.Has(id) ? PlayerOwners[id] : "main"
    if (MainGuis.Has(ownerId)) {
        safeTitle := StrReplace(titleStr, "'", "\'")
        safeTitle := StrReplace(safeTitle, "`n", "")
        safeTitle := StrReplace(safeTitle, "`r", "")
        js := "try { window.dispatchEvent(new CustomEvent('player-status-update', { detail: { authStatus: '" authStatus "', hasPlayer: " (hasPlayer ? "true" : "false") ", title: '" safeTitle "', tabId: '" id "' } })) } catch(e) {}"
        MainGuis[ownerId].Control.ExecuteScriptAsync(js)
    }
}
global internalBlacklist := ["edge://flags"]

AHK_PlayerNavigationStarting(ICoreWebView2, args) {
    try {
        uri := args.Uri

        for _, blockedPrefix in internalBlacklist {
            ; Check if the URI starts with the blocked string
            if (InStr(uri, blockedPrefix) == 1) {
                args.Cancel := True
                ;AHK_ShowToast("Access to browser flags and settings is disabled.", "error")
                return ; Exit the function immediately once a match is found
            }
        }
    } catch {
        ; Silently handle errors
    }
}

global LastNavErrorState := Map()

AHK_PlayerNavigationCompleted(ICoreWebView2, args) {
    global PlayerWVs, MainGuis, PlayerOwners, LastNavErrorState, PlayerCurrentUrls
    try {
        if (!args.IsSuccess) {
            foundId := "main"
            for id, pwv in PlayerWVs {
                if (pwv.wv.ptr == ICoreWebView2.ptr) {
                    foundId := id
                    break
                }
            }

            currentUrl := PlayerCurrentUrls.Has(foundId) ? PlayerCurrentUrls[foundId] : "unknown"
            
            if (LastNavErrorState.Has(foundId) && LastNavErrorState[foundId] == currentUrl) {
                return ; Lock-in the very first error captured for this URL attempt
            }
            LastNavErrorState[foundId] := currentUrl

            webError := args.WebErrorStatus
            httpCode := 0
            try httpCode := args.HttpStatusCode

            errStr := "Unknown Communication Error"
            if (webError == 14)
                errStr := "DNS Request Failed (Domain Not Found)"
            else if (webError == 10 || webError == 11)
                errStr := "Connection Terminated (Aborted/Reset)"
            else if (webError == 13)
                errStr := "Cannot Connect (Server Unreachable)"
            else if (webError == 8)
                errStr := "Connection Timeout"
            else if (webError == 5 || webError == 4 || webError == 6 || webError == 1 || webError == 2)
                errStr := "SSL/TLS Certificate Error"
            else if (webError == 9 && httpCode > 0)
                errStr := "HTTP Error " httpCode " " (httpCode == 404 ? "(Not Found)" : httpCode == 500 ? "(Server Error)" : "")
            else if (webError == 9 && httpCode == 0)
                return ; Completely ignore opaque fallback error 9 when it lacks a status code
            else if (webError != 0)
                errStr := "Connection Error (" webError ")"

            safeErr := StrReplace(errStr, "'", "\'")
            
            codeStr := (httpCode > 0) ? String(httpCode) : String(webError)
            
            js := "try { if(window.throwNavigationError) window.throwNavigationError('" codeStr "', '" safeErr "'); } catch(e){}"
            PlayerWVs[foundId].wv.ExecuteScriptAsync(js)
        } else {
            ; Reset tracking if a navigation succeeds, unless it's the internal error page!
            try {
                if (InStr(ICoreWebView2.Source, "chrome-error://")) {
                    return ; Do not reset state for internal error pages!
                }
            } catch {
            }
            
            foundId := "main"
            for id, pwv in PlayerWVs {
                if (pwv.wv.ptr == ICoreWebView2.ptr) {
                    foundId := id
                    break
                }
            }
            if (LastNavErrorState.Has(foundId)) {
                LastNavErrorState.Delete(foundId)
            }
        }
    } catch {
    }
}

AHK_PlayerNewWindowRequested(ICoreWebView2, args) {
    global MainGuis, PlayerOwners, PlayerWVs
    try {
        uri := args.Uri
        args.Handled := True ; Block the default new window from spawning

        foundId := "main"
        for id, pwv in PlayerWVs {
            if (pwv.wv.ptr == ICoreWebView2.ptr) {
                foundId := id
                break
            }
        }

        ownerId := PlayerOwners.Has(foundId) ? PlayerOwners[foundId] : "main"
        if (MainGuis.Has(ownerId)) {
            safeUri := StrReplace(uri, "'", "\'")
            safeUri := StrReplace(safeUri, "`n", "")
            safeUri := StrReplace(safeUri, "`r", "")
            js := "try { window.dispatchEvent(new CustomEvent('bk-remote-navigate', { detail: { url: '" safeUri "', newTab: true, background: false } })) } catch(e) {}"
            MainGuis[ownerId].Control.ExecuteScriptAsync(js)
        }
    } catch {
        try args.Handled := True
    }
}

AHK_ToggleBookmark(windowId, id := "main") {
    global MainGuis, PlayerOwners
    ownerId := PlayerOwners.Has(id) ? PlayerOwners[id] : "main"
    if (MainGuis.Has(ownerId)) {
        js := "try { window.dispatchEvent(new CustomEvent('bk-toggle-bookmark', { detail: { tabId: '" id "' } })) } catch(e) {}"
        MainGuis[ownerId].Control.ExecuteScriptAsync(js)
    }
}