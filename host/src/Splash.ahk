global SplashGui := ""
global SplashStatus := ""

InitSplashGui() {
    global SplashGui, SplashStatus
    SplashGui := Gui("-Caption +AlwaysOnTop -ToolWindow", "BingeKit Loading")
    SplashGui.BackColor := "09090b"
    SplashGui.MarginX := 0
    SplashGui.MarginY := 0
    SplashGui.SetFont("s32 c818cf8 bold", "Segoe UI")
    SplashGui.Add("Text", "x0 y55 w400 center BackgroundTrans", "BingeKit")
    SplashGui.SetFont("s9 ca1a1aa norm", "Segoe UI")
    SplashStatus := SplashGui.Add("Text", "x0 y120 w400 center BackgroundTrans", "INITIALIZING ENGINE COMPONENTS")
    SplashGui.Add("Progress", "x0 y0 w400 h5 c818cf8 Background27272a", 100)
    SplashGui.Show("w400 h200 Center NoActivate")
    Try {
        WinSetRegion("0-0 w400 h200 r16-16", "ahk_id " SplashGui.Hwnd)
    }
}