; Error handling / Splash loading checks
MainNavigationStartingHandler(sender, args) {
    global SplashStatus, SplashGui
    if (SplashGui && SplashStatus) {
        SplashStatus.Text := "NAVIGATING TO FRONTEND..."
        Sleep(-1)
    }
    UpdateSplashProgress(65)
}
try WVs["main"].add_NavigationStarting(MainNavigationStartingHandler)

MainSourceChangedHandler(sender, args) {
    global SplashStatus, SplashGui
    if (SplashGui && SplashStatus) {
        SplashStatus.Text := "RESOLVING APPLICATION ROUTES..."
        Sleep(-1)
    }
    UpdateSplashProgress(70)
}
try WVs["main"].add_SourceChanged(MainSourceChangedHandler)

MainContentLoadingHandler(sender, args) {
    global SplashStatus, SplashGui
    if (SplashGui && SplashStatus) {
        SplashStatus.Text := "DOWNLOADING BUNDLE AND ASSETS..."
        Sleep(-1)
    }
    UpdateSplashProgress(75)
}
try WVs["main"].add_ContentLoading(MainContentLoadingHandler)

MainDOMContentLoadedHandler(sender, args) {
    global SplashStatus, SplashGui
    if (SplashGui && SplashStatus) {
        SplashStatus.Text := "INITIALIZING REACT COMPONENTS..."
        Sleep(-1)
    }
    UpdateSplashProgress(90)
}
try WVs["main"].add_DOMContentLoaded(MainDOMContentLoadedHandler)

MainNavigationCompletedHandler(sender, args) {
    global SplashGui, SplashStatus
    if (SplashGui && SplashStatus) {
        SplashStatus.Text := "WAITING FOR GUI READY SIGNAL..."
        Sleep(-1)
    }
    UpdateSplashProgress(100)

    if (!args.IsSuccess && SplashGui) {
        errStatus := "Unknown Error: " args.WebErrorStatus
        if (args.WebErrorStatus != 9) {
            SplashGui.Destroy()
            SplashGui := ""
            MsgBox("Critical Error: BingeKit UI failed to load the interface.`n`nError Code: " errStatus "`n`nTroubleshooting:`n- If running from source, ensure the React dev server (" AppStartupUrl ") is active.`n- If compiled, check local bundle integrity.", "BingeKit Navigation Error", 16)
            ExitApp()
        }
    }
}
WVs["main"].add_NavigationCompleted(MainNavigationCompletedHandler)

CheckSplashTimeout() {
    global SplashGui
    if (SplashGui) {
        SplashGui.Destroy()
        SplashGui := ""
        MsgBox("Critical Error: BingeKit UI did not respond within 10 seconds.`n`nThis usually indicates the frontend development server/URL is not available or is taking too long to compile. Please verify the URL or try reloading.", "BingeKit Timeout", 16)
        ExitApp()
    }
}
; Wait 30 seconds for React frontend to reply (Vite cold starts)
SetTimer(CheckSplashTimeout, -10000)

FileMD5(filePath) {
    if !FileExist(filePath)
        return ""

    ; Define a temporary file to capture output
    tempFile := A_Temp "\ahk_md5_capture.txt"

    ; RunWait with the "Hide" parameter ensures no console window flashes
    RunWait(A_ComSpec ' /c certutil -hashfile "' filePath '" MD5 > "' tempFile '"', , "Hide")

    if !FileExist(tempFile)
        return ""

    text := FileRead(tempFile)
    FileDelete(tempFile)

    loop parse text, "`n", "`r"
    {
        line := StrReplace(Trim(A_LoopField), " ", "")
        if (RegExMatch(line, "^[a-fA-F0-9]{32}$"))
            return StrLower(line)
    }
    return ""
}

global guiPath := ""
if (InStr(AppStartupUrl, "gui.localhost")) {
    guiPath := StrReplace(AppStartupUrl, "http://gui.localhost", A_IsCompiled ? WebViewCtrl.TempDir "\gui" : A_ScriptDir "\gui")
    guiPath := StrReplace(guiPath, "/", "\")

    if (AppHash != "") {
        SplashStatus.Text := "VERIFYING APPLICATION INTEGRITY"
        Sleep(-1) ; Yield for repaint
        calculatedHash := FileMD5(guiPath)
        if (calculatedHash != AppHash) {
            if (SplashGui) {
                SplashGui.Destroy()
                SplashGui := ""
            }
            MsgBox("Critical Error:`nCore application files have been modified or corrupted.`n`nPlease reinstall or rebuild the application.", "BingeKit Security Error", 16)
            ExitApp()
        }
    }
}

;UpdateSplashProgress(100)
SplashStatus.Text := A_IsCompiled ? "LOADING COMPILED UI BUNDLE" : "WAITING FOR FRONTEND BUILDER (MAY TAKE 10s)"
Sleep(-1) ; Yield for repaint
;UpdateSplashProgress(95)

WVs["main"].Navigate(AppStartupUrl)
MainGuis["main"].Show("w0 h0 x0 y0") ; Defer showing until Splash is hidden
WinSetTransparent(0, MainGuis["main"].Hwnd)