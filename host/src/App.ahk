global MainGui := ""
global WV := ""

InitAppGui() {
    global MainGui, WV, WebViewSettings, SplashGui
    global AboutConfig_AllowRightClick, AboutConfig_AllowDevtools

    try {
        MainGui := WebViewGui("+Resize -Caption", "BingeKit", , WebViewSettings)
    } catch as err {
        if (SplashGui) {
            SplashGui.Destroy()
            SplashGui := ""
        }
        MsgBox("Critical Error: Failed to initialize WebView2 component.`n`nError details:`n" err.Message "`n`nPlease ensure Microsoft Edge WebView2 Runtime is installed.", "BingeKit Initialization Error", 16)
        ExitApp()
    }

    MainGui.BackColor := "09090b" ; Match the React app's zinc-950 background
    MainGui.OnEvent("Close", (*) => ExitApp())

    ; Initialize WebViewToo
    WV := MainGui.Control.wv
    WV.Settings.IsSwipeNavigationEnabled := 0
    WV.Settings.IsZoomControlEnabled := 0
    WV.Settings.IsPinchZoomEnabled := 0
    WV.Settings.IsBuiltInErrorPageEnabled := 0
    WV.Settings.IsGeneralAutofillEnabled := 0
    WV.Settings.AreDefaultContextMenusEnabled := AboutConfig_AllowRightClick ? 1 : 0
    WV.Settings.AreDevToolsEnabled := AboutConfig_AllowDevtools ? 1 : 0

    try {
        WV.add_DownloadStarting(AHK_DownloadStarting)
    } catch {
    }

    if !DirExist(WorkspaceDir "\interfaces")
        DirCreate(WorkspaceDir "\interfaces")
    MainGui.Control.BrowseFolder(WorkspaceDir "\interfaces", "interface.localhost")

    if (A_IsCompiled) {
        WebViewCtrl.CreateFileFromResource("gui\index.html", WebViewCtrl.TempDir)
        MainGui.Control.BrowseFolder(WebViewCtrl.TempDir "\gui", "gui.localhost")
    } else {
        MainGui.Control.BrowseFolder(A_ScriptDir "\gui", "gui.localhost")
    }

    downloadsLoc := AHK_LoadData("downloads_loc.txt")
    if (downloadsLoc == "") {
        downloadsLoc := EnvGet("USERPROFILE") "\Videos\BingeKit"
        if !DirExist(downloadsLoc) {
            try DirCreate(downloadsLoc)
        }
    }
    if DirExist(downloadsLoc) {
        try MainGui.Control.BrowseFolder(downloadsLoc, "downloads.localhost")
    }
}

OnExit(AHK_AggressiveCleanup)

AHK_AggressiveCleanup(*) {
    global WV, PlayerWVs
    pids := Map()

    try {
        if (WV) {
            pid := WV.BrowserProcessId
            if (pid) {
                pids[pid] := true
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