global SplashGui := ""
global SplashStatus := ""

InitSplashGui() {
    global SplashGui, SplashStatus, WorkspaceDir

    bgC := "09090b"
    accentC := "818cf8"
    textC := "a1a1aa"
    borderC := "27272a"

    try {
        if (IsSet(WorkspaceDir) && WorkspaceDir != "" && FileExist(WorkspaceDir "\theme.json")) {
            themeJson := FileRead(WorkspaceDir "\theme.json", "UTF-8")
            theme := JSON.parse(themeJson)
            if (theme.Has("main") && theme["main"] != "")
                bgC := StrReplace(theme["main"], "#", "")
            if (theme.Has("accent") && theme["accent"] != "")
                accentC := StrReplace(theme["accent"], "#", "")
            if (theme.Has("textSec") && theme["textSec"] != "")
                textC := StrReplace(theme["textSec"], "#", "")
            if (theme.Has("border") && theme["border"] != "")
                borderC := StrReplace(theme["border"], "#", "")
        }
    } catch {
    }

    SplashGui := Gui("-Caption +AlwaysOnTop -ToolWindow", "BingeKit Loading")
    SplashGui.BackColor := bgC
    SplashGui.MarginX := 0
    SplashGui.MarginY := 0
    SplashGui.SetFont("s32 c" accentC " bold", "Segoe UI")
    SplashGui.Add("Text", "x0 y55 w400 center BackgroundTrans", "BingeKit")
    SplashGui.SetFont("s9 c" textC " norm", "Segoe UI")
    SplashStatus := SplashGui.Add("Text", "x0 y120 w400 center BackgroundTrans", "INITIALIZING ENGINE COMPONENTS")
    global progressBar := SplashGui.Add("Progress", "x0 y-1 w400 h5 c" accentC " Background" borderC, 0)
    SplashGui.Show("w400 h200 Center NoActivate")
    Try {
        WinSetRegion("0-0 w400 h200 r16-16", "ahk_id " SplashGui.Hwnd)
    }
}

UpdateSplashProgress(progress) {
    global progressBar
    progressBar.Value := progress
}