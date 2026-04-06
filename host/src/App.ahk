global MainGuis := Map()
global WVs := Map()

CreateAppWindow(windowId := "main", initialUrl := "") {
    global MainGuis, WVs, WebViewSettings, SplashGui
    global AboutConfig_AllowRightClick, AboutConfig_AllowDevtools

    try {
        newGui := WebViewGui("+Resize -Caption +ToolWindow", "BingeKit", , WebViewSettings)
        MainGuis[windowId] := newGui
    } catch as err {
        if (SplashGui) {
            SplashGui.Destroy()
            SplashGui := ""
        }
        MsgBox("Critical Error: Failed to initialize WebView2 component for window " windowId ".`n`nError details:`n" err.Message, "BingeKit Initialization Error", 16)
        if (windowId == "main")
            ExitApp()
        else
            return
    }

    newGui.BackColor := AHK_GetThemeBgColor() ; Match the React app's background
    newGui.Control.DefaultBackgroundColor := AHK_GetThemeBgColor()
    newGui.OnEvent("Close", (*) => AHK_CloseWindow(windowId))

    ; Initialize WebViewToo
    wvObj := newGui.Control.wv
    WVs[windowId] := wvObj

    wvObj.Settings.IsSwipeNavigationEnabled := 0
    wvObj.Settings.IsZoomControlEnabled := 0
    wvObj.Settings.IsPinchZoomEnabled := 0
    wvObj.Settings.IsBuiltInErrorPageEnabled := 0
    wvObj.Settings.IsGeneralAutofillEnabled := 0
    wvObj.Settings.AreDefaultContextMenusEnabled := AboutConfig_AllowRightClick ? 1 : 0
    wvObj.Settings.AreDevToolsEnabled := AboutConfig_AllowDevtools ? 1 : 0

    try {
        wvObj.add_DownloadStarting(AHK_DownloadStarting)
    } catch {
    }

    if !DirExist(WorkspaceDir "\interfaces")
        DirCreate(WorkspaceDir "\interfaces")
    newGui.Control.BrowseFolder(WorkspaceDir "\interfaces", "interface.localhost")

    if (A_IsCompiled) {
        WebViewCtrl.CreateFileFromResource("gui\index.html", WebViewCtrl.TempDir)
        newGui.Control.BrowseFolder(WebViewCtrl.TempDir "\gui", "gui.localhost")
    } else {
        newGui.Control.BrowseFolder(A_ScriptDir "\gui", "gui.localhost")
    }

    downloadsLoc := AHK_LoadData("downloads_loc.txt")
    if (downloadsLoc == "") {
        downloadsLoc := EnvGet("USERPROFILE") "\Videos\BingeKit"
        if !DirExist(downloadsLoc) {
            try DirCreate(downloadsLoc)
        }
    }
    if DirExist(downloadsLoc) {
        try newGui.Control.BrowseFolder(downloadsLoc, "downloads.localhost")
    }

    return newGui
}

AHK_CloseWindow(windowId) {
    global MainGuis, WVs
    if (MainGuis.Has(windowId)) {
        try MainGuis[windowId].Destroy()
        MainGuis.Delete(windowId)
    }
    if (WVs.Has(windowId)) {
        WVs.Delete(windowId)
    }

    count := 0
    for id, g in MainGuis {
        count++
    }
    if (count == 0) {
        ExitApp()
    }
}

OnExit(AHK_AggressiveCleanup)

AHK_AggressiveCleanup(*) {
    global WVs, PlayerWVs
    pids := Map()

    try {
        if (WVs) {
            for id, w in WVs {
                pid := w.BrowserProcessId
                if (pid) {
                    pids[pid] := true
                }
            }
        }
    } catch {
    }

    try {
        if (PlayerWVs) {
            for id, pwv in PlayerWVs {
                try {
                    if (pwv && pwv.wv) {
                        pid := pwv.wv.BrowserProcessId
                        if (pid) {
                            pids[pid] := true
                        }
                    }
                } catch {
                }
            }
        }
    } catch {
    }

    for pid, _ in pids {
        try {
            ProcessClose(pid)
        } catch {
        }
    }
}