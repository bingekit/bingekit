#HotIf IsSet(MainGui) && (WinActive("ahk_id " MainGui.Hwnd) || WinActive("ahk_id " PlayerGui.Hwnd))
#Up::
{
    global MainGui, PlayerGui, PlayerWV
    WinMaximize("ahk_id " MainGui.Hwnd)
}
#Down::
{
    global MainGui, PlayerGui, PlayerWV
    WinMinimize("ahk_id " MainGui.Hwnd)
}
#HotIf

#HotIf MainGui != "" && WinActive("ahk_id " MainGui.Hwnd)
F5::
{
    global MainGui, PlayerGui, PlayerWV
    AHK_EvalPlayerJS("window.location.reload()")
}
#HotIf

#HotIf IsSet(IsPiPMode) && IsPiPMode && PlayerGui != "" && WinActive("ahk_id " PlayerGui.Hwnd)
Escape:: AHK_TogglePiP()
!F4:: AHK_TogglePiP()
#HotIf