; Error handling / Splash loading checks
MainNavigationCompletedHandler(sender, args) {
    global SplashGui
    if (!args.IsSuccess && SplashGui) {
        errStatus := "Unknown Error: " args.WebErrorStatus
        if (args.WebErrorStatus != 9) {
            SplashGui.Destroy()
            SplashGui := ""
            MsgBox("Critical Error: StreamView UI failed to load the interface.`n`nError Code: " errStatus "`n`nTroubleshooting:`n- If running from source, ensure the React dev server (" AppStartupUrl ") is active.`n- If compiled, check local bundle integrity.", "StreamView Navigation Error", 16)
            ExitApp()
        }
    }
}
WV.add_NavigationCompleted(MainNavigationCompletedHandler)

CheckSplashTimeout() {
    global SplashGui
    if (SplashGui) {
        SplashGui.Destroy()
        SplashGui := ""
        MsgBox("Critical Error: StreamView UI did not respond within 10 seconds.`n`nThis usually indicates the frontend development server/URL is not available. Please verify the URL.", "StreamView Timeout", 16)
        ExitApp()
    }
}
SetTimer(CheckSplashTimeout, -10000)


WV.Navigate(AppStartupUrl)
MainGui.Show("w0 h0 x0 y0") ; Defer showing until Splash is hidden
WinSetTransparent(0, MainGui.Hwnd)