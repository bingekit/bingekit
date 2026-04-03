global SplashGui := ""
global MainGui := ""
global WV := ""
global WebViewSettings := {}

InitEnvironment() {
    global SplashGui, MainGui, WV, WebViewSettings

    aboutConf := AHK_GetAboutConfig()
    disableWebSec := false
    showFetcher := false
    allowRightClick := true
    allowDevtools := false
    debugMode := false
    try {
        parsedConf := JSON.parse(aboutConf)
        if (parsedConf.Has("DisableWebSecurity"))
            disableWebSec := parsedConf["DisableWebSecurity"]
        if (parsedConf.Has("ShowHiddenFetcherWindows"))
            showFetcher := parsedConf["ShowHiddenFetcherWindows"]
        if (parsedConf.Has("AllowRightClick"))
            allowRightClick := parsedConf["AllowRightClick"]
        if (parsedConf.Has("AllowDevtools"))
            allowDevtools := parsedConf["AllowDevtools"]
        if (parsedConf.Has("DebugMode"))
            debugMode := parsedConf["DebugMode"]
    } catch {
    }
    
    global AboutConfig_ShowFetcher := showFetcher
    global AboutConfig_DebugMode := debugMode

    browserArgs := "--edge-webview-no-dpi-workaround " .
        "--disable-gpu " .
        "--msWebView2CodeCache " .
        "--no-first-run " .
        "--msWebView2CancelInitialNavigation " .
        "--disable-features=OverscrollHistoryNavigation " .
        "--autoplay-policy=no-user-gesture-required " .
        "--force-dark-mode " .
        "--disable-features=TranslateUI " .
        "--deny-permission-prompts " .
        "--disable-domain-reliability " .
        "--disable-sync " .
        "--IsSwipeNavigationEnabled=0 "

    if (disableWebSec) {
        browserArgs .= "--disable-web-security "
    }

    EnvSet("WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS", browserArgs)

    if (A_IsCompiled) {
        WebViewCtrl.CreateFileFromResource((A_PtrSize * 8) "bit\WebView2Loader.dll", WebViewCtrl.TempDir)
        WebViewSettings := { DllPath: WebViewCtrl.TempDir "\" (A_PtrSize * 8) "bit\WebView2Loader.dll" }
    } else {
        WebViewSettings := {}
    }

    SplashGui := Gui("-Caption +AlwaysOnTop +ToolWindow", "BingeKit Loading")
    SplashGui.BackColor := "09090b"
    SplashGui.MarginX := 0
    SplashGui.MarginY := 0
    SplashGui.SetFont("s32 c818cf8 bold", "Segoe UI")
    SplashGui.Add("Text", "x0 y55 w400 center BackgroundTrans", "BingeKit")
    SplashGui.SetFont("s9 ca1a1aa norm", "Segoe UI")
    global SplashStatus := SplashGui.Add("Text", "x0 y120 w400 center BackgroundTrans", "INITIALIZING ENGINE COMPONENTS")
    SplashGui.Add("Progress", "x0 y195 w400 h5 c818cf8 Background27272a", 100)
    SplashGui.Show("w400 h200 Center NoActivate")
    Try {
        WinSetRegion("0-0 w400 h200 r16-16", "ahk_id " SplashGui.Hwnd)
    }

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
    WV.Settings.AreDefaultContextMenusEnabled := allowRightClick ? 1 : 0
    WV.Settings.AreDevToolsEnabled := allowDevtools ? 1 : 0

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