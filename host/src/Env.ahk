global SplashGui := ""
global MainGui := ""
global WV := ""
global WebViewSettings := {}

InitEnvironment() {
    global SplashGui, MainGui, WV, WebViewSettings

    EnvSet("WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS",
        "--edge-webview-no-dpi-workaround " .
        "--disable-gpu " .
        "--edge-webview-is-background " .
        "--msWebView2CodeCache " .
        "--no-first-run " .
        "--msWebView2CancelInitialNavigation " .
        "--disable-web-security " .
        "--disable-features=OverscrollHistoryNavigation"
        "--autoplay-policy=no-user-gesture-required"
        "--force-dark-mode"
        "--disable-features=TranslateUI"
        "--kiosk"
        "--disable-notifications"
        "--deny-permission-prompts"
        "--disable-domain-reliability"
        "--disable-sync"
        "--IsSwipeNavigationEnabled=0"
    )

    if (A_IsCompiled) {
        WebViewCtrl.CreateFileFromResource((A_PtrSize * 8) "bit\WebView2Loader.dll", WebViewCtrl.TempDir)
        WebViewSettings := { DllPath: WebViewCtrl.TempDir "\" (A_PtrSize * 8) "bit\WebView2Loader.dll" }
    } else {
        WebViewSettings := {}
    }

    SplashGui := Gui("-Caption +AlwaysOnTop +ToolWindow", "StreamView Loading")
    SplashGui.BackColor := "09090b"
    SplashGui.MarginX := 0
    SplashGui.MarginY := 0
    SplashGui.SetFont("s32 c818cf8 bold", "Segoe UI")
    SplashGui.Add("Text", "x0 y55 w400 center BackgroundTrans", "StreamView")
    SplashGui.SetFont("s9 ca1a1aa norm", "Segoe UI")
    SplashGui.Add("Text", "x0 y120 w400 center BackgroundTrans", "INITIALIZING ENGINE COMPONENTS")
    SplashGui.Add("Progress", "x0 y195 w400 h5 c818cf8 Background27272a", 100)
    SplashGui.Show("w400 h200 Center NoActivate")
    Try {
        WinSetRegion("0-0 w400 h200 r16-16", "ahk_id " SplashGui.Hwnd)
    }

    try {
        MainGui := WebViewGui("+Resize -Caption", "StreamView", , WebViewSettings)
    } catch as err {
        if (SplashGui) {
            SplashGui.Destroy()
            SplashGui := ""
        }
        MsgBox("Critical Error: Failed to initialize WebView2 component.`n`nError details:`n" err.Message "`n`nPlease ensure Microsoft Edge WebView2 Runtime is installed.", "StreamView Initialization Error", 16)
        ExitApp()
    }

    MainGui.BackColor := "09090b" ; Match the React app's zinc-950 background

    ; Initialize WebViewToo
    WV := MainGui.Control.wv
    WV.Settings.IsSwipeNavigationEnabled := 0
    WV.Settings.IsZoomControlEnabled := 0
    WV.Settings.IsPinchZoomEnabled := 0
    WV.Settings.IsBuiltInErrorPageEnabled := 0
    WV.Settings.IsGeneralAutofillEnabled := 0
}