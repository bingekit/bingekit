global GlobalScript := ""
global AdblockScript := ""

if (A_IsCompiled) {
    WebViewCtrl.CreateFileFromResource("js\global.js", WebViewCtrl.TempDir)
    WebViewCtrl.CreateFileFromResource("js\adblock.js", WebViewCtrl.TempDir)
    
    if (IsSet(GlobalHash) && GlobalHash != "") {
        if (SplashStatus)
            SplashStatus.Text := "VERIFYING GLOBAL SCRIPT"
        if (FileMD5(WebViewCtrl.TempDir "\js\global.js") != GlobalHash) {
            if (SplashGui)
                SplashGui.Destroy()
            MsgBox("Critical Error:`nCore script 'global.js' has been modified or corrupted.", "BingeKit Security Error", 16)
            ExitApp()
        }
    }
    
    if (IsSet(AdblockHash) && AdblockHash != "") {
        if (SplashStatus)
            SplashStatus.Text := "VERIFYING ADBLOCK SCRIPT"
        if (FileMD5(WebViewCtrl.TempDir "\js\adblock.js") != AdblockHash) {
            if (SplashGui)
                SplashGui.Destroy()
            MsgBox("Critical Error:`nCore script 'adblock.js' has been modified or corrupted.", "BingeKit Security Error", 16)
            ExitApp()
        }
    }

    GlobalScript := FileRead(WebViewCtrl.TempDir "\js\global.js", "UTF-8")
    AdblockScript := FileRead(WebViewCtrl.TempDir "\js\adblock.js", "UTF-8")
} else {
    GlobalScript := FileRead("js\global.js", "UTF-8")
    AdblockScript := FileRead("js/adblock.js", "UTF-8")
}
global UserscriptsScript := ""

; Initialize PlayerRect defaults to satisfy the editor linter (assigned actual values in Player.ahk)
global PlayerRectX := 0, PlayerRectY := 0, PlayerRectW := 0, PlayerRectH := 0

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

AHK_ExecuteSearch(query, engine) {
    Run(engine . query)
}

AHK_RevealPath(path) {
    if FileExist(path)
        Run('explorer.exe /select,"' path '"')
}

AHK_PromptSelectFolder(id) {
    global MainGui
    cb := () => DoSelectFolder(id)
    SetTimer(cb, -10)
}

DoSelectFolder(id) {
    global MainGui, WorkspaceDir
    dir := DirSelect("*" WorkspaceDir, 3, "Select Folder")
    if (dir != "") {
        if (MainGui) {
            js := "try { window.dispatchEvent(new CustomEvent('bk-folder-selected', { detail: { id: '" id "', dir: '" StrReplace(dir, "\", "\\") "' } })) } catch(e){}"
            MainGui.Control.ExecuteScriptAsync(js)
        }
    }
}

AHK_InjectJS(js, tabId:="") {
    global WV, PlayerGuis, PlayerWVs, ActiveTabId
    WV.ExecuteScriptAsync(js)
    if (tabId == "")
        tabId := ActiveTabId
    if (PlayerGuis.Has(tabId) && PlayerWVs.Has(tabId)) {
        PlayerWVs[tabId].wv.ExecuteScriptAsync(js)
    }
}

AHK_EvalPlayerJS(js, tabId:="") {
    global PlayerGuis, PlayerWVs, ActiveTabId
    if (tabId == "")
        tabId := ActiveTabId
    if (PlayerGuis.Has(tabId) && PlayerWVs.Has(tabId)) {
        return PlayerWVs[tabId].ExecuteScript(js)
    }
    return ""
}

AHK_UpdateUserscriptPayload(js) {
    global UserscriptsScript, PlayerGuis, PlayerWVs
    UserscriptsScript := js
    if (IsSet(PlayerGuis)) {
        for id, pGui in PlayerGuis {
            if (PlayerWVs.Has(id)) {
                PlayerWVs[id].wv.ExecuteScriptAsync(js)
            }
        }
    }
}

AHK_GetUserscriptPayload() {
    global UserscriptsScript
    return UserscriptsScript
}

AHK_ShowTooltip(text) {
    if (text) {
        ToolTip(text)
    }
}

AHK_HideTooltip(*) {
    ToolTip()
}

global IsPiPMode := false

AHK_TogglePiP(tabId:="main") {
    global IsPiPMode, MainGui, PlayerGuis, PlayerWVs, ActiveTabId, PlayerRects
    if (tabId == "main")
        tabId := ActiveTabId
    
    if (!PlayerGuis.Has(tabId) || !PlayerWVs.Has(tabId))
        return

    IsPiPMode := !IsPiPMode

    if (MainGui) {
        js := "try { window.dispatchEvent(new CustomEvent('pip-mode-change', { detail: { isPip: " (IsPiPMode ? "true" : "false") " } })) } catch(e) {}"
        MainGui.Control.ExecuteScriptAsync(js)
    }

    pGui := PlayerGuis[tabId]
    pWv := PlayerWVs[tabId]

    if (IsPiPMode) {
        if (MainGui) {
            MainGui.Hide()
        }
        if (pGui) {
            pGui.Opt("+AlwaysOnTop +Resize -Caption")
            pGui.BackColor := "000000"
            try {
                DllCall("dwmapi\DwmSetWindowAttribute", "Ptr", pGui.Hwnd, "UInt", 34, "Int*", 0xFFFFFFFE, "UInt", 4)
            }
            w := 400
            h := 225
            ; Place bottom right with 20px padding from the right and 60px from the bottom (taskbar room)
            x := A_ScreenWidth - w - 20
            y := A_ScreenHeight - h - 60
            pGui.Move(x, y, w, h)
            pWv.Move(0, 0, w, h)
            pWv.wvc.Fill()

            ; Inject PiP UI into PlayerWV
            pipJs := "
            (
                (function() {
                    console.log(""loading pip js"");
                    if (document.getElementById('bk-pip-container')) return;
                    
                    function findLargestPlayingVideo() {
                        const videos = Array.from(document.querySelectorAll('video'))
                            .filter(video => video.readyState != 0)
                            .filter(video => video.disablePictureInPicture == false)
                            .sort((v1, v2) => {
                                const v1Rect = v1.getClientRects()[0] || {width: 0, height: 0};
                                const v2Rect = v2.getClientRects()[0] || {width: 0, height: 0};
                                return (v2Rect.width * v2Rect.height) - (v1Rect.width * v1Rect.height);
                            });
                        return videos.length > 0 ? videos[0] : (document.querySelector('video') || document.querySelector('iframe[allowfullscreen]'));
                    }
                
                    let style = document.createElement('style');
                    style.id = 'bk-pip-style';
                    style.textContent = ""iframe[allowfullscreen], video { position: fixed!important; inset: 0!important; z-index: 0!important; }"";
                    document.body.append(style);
                
                    const container = document.createElement('div');
                    container.id = 'bk-pip-container';
                    container.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:999999999;pointer-events:none;display:flex;align-items:center;justify-content:center;transition:background 0.2s ease;';
                    
                    const dragArea = document.createElement('div');
                    dragArea.style.cssText = 'position:absolute;top:0;left:0;right:0;bottom:0;pointer-events:auto;cursor:move;';
                    dragArea.addEventListener('mousedown', (e) => {
                        if (e.target === dragArea) {
                            try { window.chrome.webview.hostObjects.ahk.DragMove(); } catch(e){}
                        }
                    });
                
                    const playBtn = document.createElement('button');
                    playBtn.innerHTML = '<svg width=\`"48\`" height=\`"48\`" viewBox=\`"0 0 24 24\`" fill=\`"none\`" stroke=\`"white\`" stroke-width=\`"2\`" stroke-linecap=\`"round\`" stroke-linejoin=\`"round\`"><polygon points=\`"5 3 19 12 5 21 5 3\`"></polygon></svg>';
                    playBtn.style.cssText = 'position:relative;width:80px;height:80px;border-radius:50%;background:rgba(0,0,0,0.6);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;opacity:0;transform:scale(0.9);transition:all 0.2s ease;pointer-events:auto;backdrop-filter:blur(4px);';
                    
                    let isPlaying = true;
                    playBtn.addEventListener('click', () => {
                        window.postMessage('bk-toggle-play', '*');
                    });
                
                    container.addEventListener('mouseenter', () => {
                        container.style.background = 'rgba(0,0,0,0.3)';
                        playBtn.style.opacity = '1';
                        playBtn.style.transform = 'scale(1)';
                        isPlaying = window._svIsGloballyPlaying !== undefined ? window._svIsGloballyPlaying : true;
                        if(!isPlaying) playBtn.innerHTML = '<svg width=\`"48\`" height=\`"48\`" viewBox=\`"0 0 24 24\`" fill=\`"none\`" stroke=\`"white\`" stroke-width=\`"2\`" stroke-linecap=\`"round\`" stroke-linejoin=\`"round\`"><polygon points=\`"5 3 19 12 5 21 5 3\`"></polygon></svg>';
                        else playBtn.innerHTML = '<svg width=\`"48\`" height=\`"48\`" viewBox=\`"0 0 24 24\`" fill=\`"none\`" stroke=\`"white\`" stroke-width=\`"2\`" stroke-linecap=\`"round\`" stroke-linejoin=\`"round\`"><rect x=\`"6\`" y=\`"4\`" width=\`"4\`" height=\`"16\`"></rect><rect x=\`"14\`" y=\`"4\`" width=\`"4\`" height=\`"16\`"></rect></svg>';
                    });
                    container.addEventListener('mouseleave', () => {
                        container.style.background = 'transparent';
                        playBtn.style.opacity = '0';
                        playBtn.style.transform = 'scale(0.9)';
                    });
                
                    const closeBtn = document.createElement('button');
                    closeBtn.innerHTML = '<svg width=\`"24\`" height=\`"24\`" viewBox=\`"0 0 24 24\`" fill=\`"none\`" stroke=\`"white\`" stroke-width=\`"2\`" stroke-linecap=\`"round\`" stroke-linejoin=\`"round\`"><line x1=\`"18\`" y1=\`"6\`" x2=\`"6\`" y2=\`"18\`"></line><line x1=\`"6\`" y1=\`"6\`" x2=\`"18\`" y2=\`"18\`"></line></svg>';
                    closeBtn.style.cssText = 'position:absolute;top:15px;right:15px;width:36px;height:36px;border-radius:50%;background:rgba(0,0,0,0.6);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity 0.2s ease;pointer-events:auto;backdrop-filter:blur(4px);z-index:2;';
                    closeBtn.addEventListener('click', () => {
                        try { window.chrome.webview.hostObjects.sync.ahk.TogglePiP(); } catch(e){}
                    });
                
                    container.addEventListener('mouseenter', () => {
                        closeBtn.style.opacity = '1';
                    });
                    container.addEventListener('mouseleave', () => {
                        closeBtn.style.opacity = '0';
                    });
                
                    container.appendChild(dragArea);
                    container.appendChild(closeBtn);
                    container.appendChild(playBtn);
                    
                    ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'].forEach(dir => {
                        let h = document.createElement('div');
                        h.style.cssText = 'position:absolute;z-index:9999999999;pointer-events:auto;cursor:' + dir + '-resize;';
                        if(dir.includes('n')) { h.style.top = '0'; h.style.height = '8px'; }
                        if(dir.includes('s')) { h.style.bottom = '0'; h.style.height = '8px'; }
                        if(dir.includes('e')) { h.style.right = '0'; h.style.width = '8px'; }
                        if(dir.includes('w')) { h.style.left = '0'; h.style.width = '8px'; }
                        if(dir === 'n' || dir === 's') { h.style.left = '8px'; h.style.right = '8px'; }
                        if(dir === 'e' || dir === 'w') { h.style.top = '8px'; h.style.bottom = '8px'; }
                        h.addEventListener('mousedown', (e) => {
                            e.stopPropagation();
                            try { window.chrome.webview.hostObjects.ahk.ResizeEdge(dir); } catch(err){}
                        });
                        container.appendChild(h);
                    });
                    
                    document.body.appendChild(container);
                    
                    let lastVideoSrc = '';
                    setInterval(() => {
                        const video = findLargestPlayingVideo();
                        if(video) {
                            if (video.videoWidth > 0 && video.videoHeight > 0 && video.src !== lastVideoSrc) {
                                lastVideoSrc = video.src;
                                try {
                                    window.chrome.webview.hostObjects.sync.ahk.ResizePiP(video.videoWidth, video.videoHeight);
                                } catch(e) {}
                            }
                
                            if(container.style.background !== 'transparent') {
                                let globPlaying = window._svIsGloballyPlaying !== undefined ? window._svIsGloballyPlaying : !video.paused;
                                if(globPlaying !== isPlaying) {
                                    isPlaying = globPlaying;
                                    if(isPlaying) playBtn.innerHTML = '<svg width=\`"48\`" height=\`"48\`" viewBox=\`"0 0 24 24\`" fill=\`"none\`" stroke=\`"white\`" stroke-width=\`"2\`" stroke-linecap=\`"round\`" stroke-linejoin=\`"round\`"><rect x=\`"6\`" y=\`"4\`" width=\`"4\`" height=\`"16\`"></rect><rect x=\`"14\`" y=\`"4\`" width=\`"4\`" height=\`"16\`"></rect></svg>';
                                    else playBtn.innerHTML = '<svg width=\`"48\`" height=\`"48\`" viewBox=\`"0 0 24 24\`" fill=\`"none\`" stroke=\`"white\`" stroke-width=\`"2\`" stroke-linecap=\`"round\`" stroke-linejoin=\`"round\`"><polygon points=\`"5 3 19 12 5 21 5 3\`"></polygon></svg>';
                                }
                            }
                        }
                    }, 1000);
                
                    const escapeHandler = (e) => {
                        if (e.key === 'Escape') {
                            try { window.chrome.webview.hostObjects.sync.ahk.TogglePiP(); } catch(e){}
                        }
                    };
                    window.addEventListener('keydown', escapeHandler);
                    window.__svPipEscapeHandler = escapeHandler;
                })();
            )"
            pWv.wv.ExecuteScriptAsync(pipJs)
        }
    } else {
        if (MainGui) {
            MainGui.Show()
        }
        if (pGui) {
            pGui.Opt("-AlwaysOnTop -Resize -Caption")
            try {
                pWv.wv.ExecuteScriptAsync("var pip = document.getElementById('bk-pip-container'); if (pip) pip.remove(); var st = document.getElementById('bk-pip-style'); if (st) st.remove(); if (window.__svPipEscapeHandler) { window.removeEventListener('keydown', window.__svPipEscapeHandler); window.__svPipEscapeHandler = null; }")
            }
            catch {
                MsgBox("Error removing PiP")
            }

            try {
                if (PlayerRects.Has(tabId)) {
                    rect := PlayerRects[tabId]
                    WinGetClientPos(&CX, &CY, , , MainGui.Hwnd)
                    pGui.Move(CX + rect.x, CY + rect.y, rect.w, rect.h)
                    pWv.Move(0, 0, rect.w, rect.h)
                    pWv.wvc.Fill()
                }
            } catch {

            }
        }
    }
}

AHK_ResizePiP(vw, vh, tabId:="main") {
    global PlayerGuis, PlayerWVs, ActiveTabId, IsPiPMode
    if (tabId == "main")
        tabId := ActiveTabId
    
    if (!PlayerGuis.Has(tabId) || !PlayerWVs.Has(tabId))
        return

    pGui := PlayerGuis[tabId]
    pWv := PlayerWVs[tabId]

    if (IsPiPMode && pGui) {
        WinGetPos(&X, &Y, &W, &H, pGui.Hwnd)
        newW := W
        newH := H
        if (vw > 0 && vh > 0) {
            newH := Round(newW * (vh / vw))
        }
        newY := (Y + H) - newH
        pGui.Move(X, newY, newW, newH)
        pWv.Move(0, 0, newW, newH)
        pWv.wvc.Fill()
    }
}

AHK_DragMove(tabId:="main") {
    global PlayerGuis, ActiveTabId, IsPiPMode
    if (tabId == "main")
        tabId := ActiveTabId
    if (!PlayerGuis.Has(tabId))
        return
    pGui := PlayerGuis[tabId]
    if (pGui && IsPiPMode) {
        DllCall("ReleaseCapture")
        PostMessage(0xA1, 2, 0, , "ahk_id " pGui.Hwnd)
    }
}

AHK_ResizeEdge(dir, tabId:="main") {
    global PlayerGuis, ActiveTabId, IsPiPMode
    if (tabId == "main")
        tabId := ActiveTabId
    if (!PlayerGuis.Has(tabId))
        return
    pGui := PlayerGuis[tabId]
    if (pGui && IsPiPMode) {
        DllCall("ReleaseCapture")
        hit := dir = "n" ? 12 : dir = "s" ? 15 : dir = "e" ? 11 : dir = "w" ? 10 : dir = "ne" ? 14 : dir = "nw" ? 13 : dir = "se" ? 17 : dir = "sw" ? 16 : 0
        if (hit)
            PostMessage(0xA1, hit, 0, , "ahk_id " pGui.Hwnd)
    }
}

AHK_ReportPlayState(isPlaying, currentTime := 0, duration := 0, activeSrc := "", id := "") {
    global MainGui, ActiveMediaStreams, ActiveTabId
    id := id ? id : ActiveTabId
    if (activeSrc != "") {
        if !IsSet(ActiveMediaStreams)
            ActiveMediaStreams := Map()
        ActiveMediaStreams[id] := activeSrc
    }
    if (MainGui) {
        js := "try { window.dispatchEvent(new CustomEvent('player-play-state', { detail: { isPlaying: " (isPlaying ? "true" : "false") ", currentTime: " currentTime ", duration: " duration ", tabId: '" id "' } })) } catch(e) {}"
        MainGui.Control.ExecuteScriptAsync(js)
    }
}

global ActiveSubtitleStreams := Map()
global ActiveMediaStreamQualitiesMap := Map()
global ActiveMediaAuths := Map()

AHK_SetMediaStream(url, qualities := "", auth := "", id := "") {
    global ActiveTabId, ActiveMediaStreams, ActiveMediaStreamQualitiesMap, ActiveMediaAuths
    id := id ? id : ActiveTabId
    ActiveMediaStreams[id] := url
    ActiveMediaStreamQualitiesMap[id] := qualities
    if (auth != "")
        ActiveMediaAuths[id] := auth
}

AHK_SetSubtitleStream(url, auth := "", id := "") {
    global ActiveTabId, ActiveSubtitleStreams, ActiveMediaAuths
    id := id ? id : ActiveTabId
    ActiveSubtitleStreams[id] := url
    if (auth != "")
        ActiveMediaAuths[id] := auth
}

AHK_GetActiveMediaQualities() {
    global ActiveTabId, ActiveMediaStreamQualitiesMap
    if (ActiveMediaStreamQualitiesMap.Has(ActiveTabId))
        return ActiveMediaStreamQualitiesMap[ActiveTabId]
    return ""
}


AHK_ToggleMedia() {
    global PlayerWVs, ActiveTabId
    if (PlayerWVs.Has(ActiveTabId)) {
        PlayerWVs[ActiveTabId].wv.ExecuteScriptAsync("window.top.postMessage('bk-toggle-play', '*');")
    }
}

global TabMenuGui := ""
global TabMenuHoverColor := ""
global TabMenuBgColor := ""
global TabMenuTextCtrls := []
global TabMenuCallbacks := []


global TabMenuTextColor := ""
global TabMenuTextHoverColor := ""

AHK_ShowTabContextMenu(tabId, x, y, isMuted, bgC, hoverC, borderC, textC, textHoverC, tabCount := 2) {
    global TabMenuGui, MainGui, TabMenuHoverColor, TabMenuBgColor, TabMenuTextCtrls, TabMenuCallbacks, TabMenuTextColor, TabMenuTextHoverColor
    
    if (TabMenuGui) {
        try TabMenuGui.Destroy()
    }
    
    TabMenuBgColor := StrReplace(bgC, "#", "")
    TabMenuHoverColor := StrReplace(hoverC, "#", "")
    borderHex := StrReplace(borderC, "#", "")
    TabMenuTextColor := StrReplace(textC, "#", "")
    TabMenuTextHoverColor := StrReplace(textHoverC, "#", "")
    
    TabMenuGui := Gui("-Caption +ToolWindow +AlwaysOnTop +Owner" MainGui.Hwnd " +Border")
    TabMenuGui.MarginX := 0
    TabMenuGui.MarginY := 4
    TabMenuGui.BackColor := TabMenuBgColor
    
    TabMenuTextCtrls := []
    TabMenuCallbacks := []
    
    if (tabCount > 1) {
        AddTabMenuItem(TabMenuTextColor, "  Close Tab", "close", tabId)
        AddTabMenuItem(TabMenuTextColor, "  Close Tabs to the Right", "closeRight", tabId)
        AddTabMenuItem(TabMenuTextColor, "  Close Other Tabs", "closeOthers", tabId)
        TabMenuGui.Add("Text", "w180 h1 x0 y+4 Background" borderHex, "")
    }
    
    AddTabMenuItem(TabMenuTextColor, (isMuted = "true" || isMuted = 1 || isMuted = true) ? "  Unmute Tab" : "  Mute Tab", "toggleMute", tabId)
    
    OnMessage(0x0200, TabMenuHoverHandler)
    
    ; Adjust Y to not spawn directly under cursor, preventing accidental clicks
    TabMenuGui.Show("x" x " y" y " w180 NoActivate")
    
    SetTimer(CheckTabMenuClickOutside, 50)
}

AddTabMenuItem(textC, txt, action, tabId) {
    global TabMenuGui, TabMenuBgColor, TabMenuTextCtrls, TabMenuCallbacks
    hText := TabMenuGui.Add("Text", "w180 h28 x0 y+0 c" textC " Background" TabMenuBgColor " +0x200", txt)
    hText.SetFont("s9", "Segoe UI")
    TabMenuTextCtrls.Push(hText)
    
    idx := TabMenuCallbacks.Length + 1
    TabMenuCallbacks.Push(() => SendTabContextAction(action, tabId))
    hText.OnEvent("Click", ((i, *) => ExecuteTabMenuAction(i)).Bind(idx))
}

TabMenuHoverHandler(wParam, lParam, msg, hwnd) {
    global TabMenuGui, TabMenuTextCtrls, TabMenuBgColor, TabMenuHoverColor, TabMenuTextColor, TabMenuTextHoverColor
    if (!TabMenuGui)
        return
        
    static lastHoverHwnd := 0
    if (hwnd == lastHoverHwnd)
        return
        
    lastHoverHwnd := hwnd
    
    for ctrl in TabMenuTextCtrls {
        if (ctrl.Hwnd == hwnd) {
            ctrl.Opt("Background" TabMenuHoverColor)
            ctrl.SetFont("c" TabMenuTextHoverColor)
            ctrl.Redraw()
        } else {
            ctrl.Opt("Background" TabMenuBgColor)
            ctrl.SetFont("c" TabMenuTextColor)
            ctrl.Redraw()
        }
    }
}

ExecuteTabMenuAction(idx) {
    global TabMenuCallbacks, TabMenuGui
    try TabMenuCallbacks[idx]()
    
    if (TabMenuGui) {
        try TabMenuGui.Destroy()
        TabMenuGui := ""
    }
    SetTimer(CheckTabMenuClickOutside, 0)
    OnMessage(0x0200, TabMenuHoverHandler, 0)
}

SendTabContextAction(action, tabId) {
    global MainGui
    if (MainGui) {
        js := "try { window.dispatchEvent(new CustomEvent('bk-tab-context-action', { detail: { action: '" action "', tabId: '" tabId "' } })); } catch(e){}"
        MainGui.Control.ExecuteScriptAsync(js)
    }
}

CheckTabMenuClickOutside() {
    global TabMenuGui, MainGui
    if (!TabMenuGui) {
        SetTimer(CheckTabMenuClickOutside, 0)
        OnMessage(0x0200, TabMenuHoverHandler, 0)
        return
    }
    
    ; Check if window lost focus
    if (!WinActive("ahk_id " MainGui.Hwnd) && !WinActive("ahk_id " TabMenuGui.Hwnd)) {
        try TabMenuGui.Destroy()
        TabMenuGui := ""
        SetTimer(CheckTabMenuClickOutside, 0)
        OnMessage(0x0200, TabMenuHoverHandler, 0)
        return
    }

    if (GetKeyState("LButton", "P") || GetKeyState("RButton", "P")) {
        MouseGetPos(,, &hWnd)
        if (hWnd != TabMenuGui.Hwnd) {
            try TabMenuGui.Destroy()
            TabMenuGui := ""
            SetTimer(CheckTabMenuClickOutside, 0)
            OnMessage(0x0200, TabMenuHoverHandler, 0)
        }
    }
}