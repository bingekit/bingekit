global WebViewSettings := {}
global AboutConfig_ShowFetcher := false
global AboutConfig_DebugMode := false
global AboutConfig_AllowRightClick := true
global AboutConfig_AllowDevtools := false
global AboutConfig_FetcherDefaultSize := 300
global AboutConfig_FetcherDefaultZoom := 1.0
global AboutConfig_FetcherTimeout := 30000

InitEnvironment() {
    global WebViewSettings
    global AboutConfig_ShowFetcher, AboutConfig_DebugMode, AboutConfig_AllowRightClick, AboutConfig_AllowDevtools

    aboutConf := AHK_GetAboutConfig()
    disableWebSec := false
    disableGPU := false
    incognito := false
    showFetcher := false
    allowRightClick := true
    allowDevtools := false
    debugMode := false
    fetcherDefaultSize := 300
    fetcherDefaultZoom := 1.0
    fetcherTimeout := 30000
    try {
        parsedConf := JSON.parse(aboutConf)
        if (parsedConf.Has("DisableWebSecurity"))
            disableWebSec := parsedConf["DisableWebSecurity"]
        if (parsedConf.Has("DisableGPU"))
            disableGPU := parsedConf["DisableGPU"]
        if (parsedConf.Has("Incognito"))
            incognito := parsedConf["Incognito"]
        if (parsedConf.Has("ShowHiddenFetcherWindows"))
            showFetcher := parsedConf["ShowHiddenFetcherWindows"]
        if (parsedConf.Has("AllowRightClick"))
            allowRightClick := parsedConf["AllowRightClick"]
        if (parsedConf.Has("AllowDevtools"))
            allowDevtools := parsedConf["AllowDevtools"]
        if (parsedConf.Has("DebugMode"))
            debugMode := parsedConf["DebugMode"]
        if (parsedConf.Has("FetcherDefaultSize"))
            tempSize := parsedConf["FetcherDefaultSize"]
        if (parsedConf.Has("FetcherDefaultZoom"))
            tempZoom := parsedConf["FetcherDefaultZoom"]
        if (parsedConf.Has("FetcherTimeout"))
            tempTimeout := parsedConf["FetcherTimeout"]

        if (IsSet(tempSize) && Type(tempSize) == "Integer")
            fetcherDefaultSize := tempSize
        if (IsSet(tempZoom))
            fetcherDefaultZoom := tempZoom + 0.0
        if (IsSet(tempTimeout) && Type(tempTimeout) == "Integer")
            fetcherTimeout := tempTimeout
    } catch {
    }

    AboutConfig_ShowFetcher := showFetcher
    AboutConfig_DebugMode := debugMode
    AboutConfig_AllowRightClick := allowRightClick
    AboutConfig_AllowDevtools := allowDevtools
    AboutConfig_FetcherDefaultSize := fetcherDefaultSize
    AboutConfig_FetcherDefaultZoom := fetcherDefaultZoom
    AboutConfig_FetcherTimeout := fetcherTimeout

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
        "--proxy-bypass-list=`"<-loopback>;gui.localhost;interface.localhost;downloads.localhost;localhost`" " .
        "--IsSwipeNavigationEnabled=0 "

    if (disableGPU) {
        browserArgs .= "--disable-gpu "
    }

    if (disableWebSec) {
        browserArgs .= "--disable-web-security "
    }

    if (incognito) {
        browserArgs .= "--incognito "
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