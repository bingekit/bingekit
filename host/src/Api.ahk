global GlobalScript := FileRead("js/global.js", "UTF-8")
global AdblockScript := FileRead("js/adblock.js", "UTF-8")
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

AHK_InjectJS(js) {
    global WV, PlayerWV, PlayerGui
    WV.ExecuteScript(js, 0)
    if (PlayerGui && PlayerWV) {
        PlayerWV.wv.ExecuteScript(js, 0)
    }
}

AHK_EvalPlayerJS(js) {
    global PlayerWV, PlayerGui
    if (PlayerGui && PlayerWV) {
        return PlayerWV.ExecuteScript(js)
    }
    return ""
}

AHK_UpdateUserscriptPayload(js) {
    global UserscriptsScript, PlayerWV, PlayerGui
    UserscriptsScript := js
    if (PlayerGui && PlayerWV) {
        PlayerWV.wv.ExecuteScript(js, 0)
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

AHK_TogglePiP() {
    global IsPiPMode, MainGui, PlayerGui, PlayerWV
    global PlayerRectX, PlayerRectY, PlayerRectW, PlayerRectH
    IsPiPMode := !IsPiPMode
    if (IsPiPMode) {
        if (MainGui) {
            MainGui.Hide()
        }
        if (PlayerGui) {
            PlayerGui.Opt("+AlwaysOnTop +Resize -Caption")
            PlayerGui.BackColor := "000000"
            try {
                DllCall("dwmapi\DwmSetWindowAttribute", "Ptr", PlayerGui.Hwnd, "UInt", 34, "Int*", 0xFFFFFFFE, "UInt", 4)
            }
            w := 400
            h := 225
            ; Place bottom right with 20px padding from the right and 60px from the bottom (taskbar room)
            x := A_ScreenWidth - w - 20
            y := A_ScreenHeight - h - 60
            PlayerGui.Move(x, y, w, h)
            PlayerWV.Move(0, 0, w, h)
            PlayerWV.wvc.Fill()

            ; Inject PiP UI into PlayerWV
            pipJs := "
            (
                (function() {
                    console.log("loading pip js");
                    if (document.getElementById('sv-pip-container')) return;
                    const container = document.createElement('div');
                    container.id = 'sv-pip-container';
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
                        const video = document.querySelector('video');
                        if(video) {
                            if(video.paused) { video.play(); isPlaying = true; playBtn.innerHTML = '<svg width=\`"48\`" height=\`"48\`" viewBox=\`"0 0 24 24\`" fill=\`"none\`" stroke=\`"white\`" stroke-width=\`"2\`" stroke-linecap=\`"round\`" stroke-linejoin=\`"round\`"><rect x=\`"6\`" y=\`"4\`" width=\`"4\`" height=\`"16\`"></rect><rect x=\`"14\`" y=\`"4\`" width=\`"4\`" height=\`"16\`"></rect></svg>'; }
                            else { video.pause(); isPlaying = false; playBtn.innerHTML = '<svg width=\`"48\`" height=\`"48\`" viewBox=\`"0 0 24 24\`" fill=\`"none\`" stroke=\`"white\`" stroke-width=\`"2\`" stroke-linecap=\`"round\`" stroke-linejoin=\`"round\`"><polygon points=\`"5 3 19 12 5 21 5 3\`"></polygon></svg>'; }
                        }
                    });
                
                    container.addEventListener('mouseenter', () => {
                        container.style.background = 'rgba(0,0,0,0.3)';
                        playBtn.style.opacity = '1';
                        playBtn.style.transform = 'scale(1)';
                        const video = document.querySelector('video');
                        if(video) {
                            if(video.paused) { isPlaying = false; playBtn.innerHTML = '<svg width=\`"48\`" height=\`"48\`" viewBox=\`"0 0 24 24\`" fill=\`"none\`" stroke=\`"white\`" stroke-width=\`"2\`" stroke-linecap=\`"round\`" stroke-linejoin=\`"round\`"><polygon points=\`"5 3 19 12 5 21 5 3\`"></polygon></svg>'; }
                            else { isPlaying = true; playBtn.innerHTML = '<svg width=\`"48\`" height=\`"48\`" viewBox=\`"0 0 24 24\`" fill=\`"none\`" stroke=\`"white\`" stroke-width=\`"2\`" stroke-linecap=\`"round\`" stroke-linejoin=\`"round\`"><rect x=\`"6\`" y=\`"4\`" width=\`"4\`" height=\`"16\`"></rect><rect x=\`"14\`" y=\`"4\`" width=\`"4\`" height=\`"16\`"></rect></svg>'; }
                        }
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
                        const video = document.querySelector('video');
                        if(video) {
                            if (video.videoWidth > 0 && video.videoHeight > 0 && video.src !== lastVideoSrc) {
                                lastVideoSrc = video.src;
                                try {
                                    window.chrome.webview.hostObjects.sync.ahk.ResizePiP(video.videoWidth, video.videoHeight);
                                } catch(e) {}
                            }
                
                            if(container.style.background !== 'transparent') {
                                if(video.paused !== !isPlaying) {
                                    isPlaying = !video.paused;
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
            PlayerWV.wv.ExecuteScriptAsync(pipJs)
        }
    } else {
        if (MainGui) {
            MainGui.Show()
        }
        if (PlayerGui) {
            PlayerGui.Opt("-AlwaysOnTop -Resize -Caption")
            try {
                PlayerWV.wv.ExecuteScriptAsync("var pip = document.getElementById('sv-pip-container'); if (pip) pip.remove(); if (window.__svPipEscapeHandler) { window.removeEventListener('keydown', window.__svPipEscapeHandler); window.__svPipEscapeHandler = null; }")
            }
            catch {
                MsgBox("Error removing PiP")
            }

            try {
                WinGetClientPos(&CX, &CY, , , MainGui.Hwnd)
                PlayerGui.Move(CX + PlayerRectX, CY + PlayerRectY, PlayerRectW, PlayerRectH)
                PlayerWV.Move(0, 0, PlayerRectW, PlayerRectH)
                PlayerWV.wvc.Fill()
            } catch {

            }
        }
    }
}

AHK_ResizePiP(vw, vh) {
    global PlayerGui, PlayerWV, IsPiPMode
    if (IsPiPMode && PlayerGui) {
        WinGetPos(&X, &Y, &W, &H, PlayerGui.Hwnd)
        newW := W
        newH := H
        if (vw > 0 && vh > 0) {
            newH := Round(newW * (vh / vw))
        }
        newY := (Y + H) - newH
        PlayerGui.Move(X, newY, newW, newH)
        PlayerWV.Move(0, 0, newW, newH)
        PlayerWV.wvc.Fill()
    }
}

AHK_DragMove() {
    global PlayerGui
    if (PlayerGui && IsPiPMode) {
        DllCall("ReleaseCapture")
        PostMessage(0xA1, 2, 0, , "ahk_id " PlayerGui.Hwnd)
    }
}

AHK_ResizeEdge(dir) {
    global PlayerGui, IsPiPMode
    if (PlayerGui && IsPiPMode) {
        DllCall("ReleaseCapture")
        hit := dir="n" ? 12 : dir="s" ? 15 : dir="e" ? 11 : dir="w" ? 10 : dir="ne" ? 14 : dir="nw" ? 13 : dir="se" ? 17 : dir="sw" ? 16 : 0
        if (hit)
            PostMessage(0xA1, hit, 0, , "ahk_id " PlayerGui.Hwnd)
    }
}