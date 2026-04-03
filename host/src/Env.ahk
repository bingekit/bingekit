global WebViewSettings := {}
global AboutConfig_ShowFetcher := false
global AboutConfig_DebugMode := false
global AboutConfig_AllowRightClick := true
global AboutConfig_AllowDevtools := false

InitEnvironment() {
    global WebViewSettings
    global AboutConfig_ShowFetcher, AboutConfig_DebugMode, AboutConfig_AllowRightClick, AboutConfig_AllowDevtools

    aboutConf := AHK_GetAboutConfig()
    disableWebSec := false
    disableGPU := false
    showFetcher := false
    allowRightClick := true
    allowDevtools := false
    debugMode := false
    try {
        parsedConf := JSON.parse(aboutConf)
        if (parsedConf.Has("DisableWebSecurity"))
            disableWebSec := parsedConf["DisableWebSecurity"]
        if (parsedConf.Has("DisableGPU"))
            disableGPU := parsedConf["DisableGPU"]
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

    AboutConfig_ShowFetcher := showFetcher
    AboutConfig_DebugMode := debugMode
    AboutConfig_AllowRightClick := allowRightClick
    AboutConfig_AllowDevtools := allowDevtools

    browserArgs := "--msWebView2CodeCache " .
        "--edge-webview-no-dpi-workaround " .
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

    if (disableGPU) {
        browserArgs .= "--disable-gpu "
    }

    if (disableWebSec) {
        browserArgs .= "--disable-web-security "
    }

    EnvSet("WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS", browserArgs)

    if (A_IsCompiled) {
        WebViewCtrl.CreateFileFromResource((A_PtrSize * 8) "bit\WebView2Loader.dll", WebViewCtrl.TempDir)
        WebViewSettings := {
            DllPath: WebViewCtrl.TempDir "\" (A_PtrSize * 8) "bit\WebView2Loader.dll",
            DataDir: WorkspaceDir "\webview"
        }
    } else {
        WebViewSettings := { DataDir: WorkspaceDir "\webview" }
    }
}