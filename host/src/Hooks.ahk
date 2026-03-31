OnMessage(0x0003, AHK_OnMove) ; WM_MOVE
OnMessage(0x0005, AHK_OnMove) ; WM_SIZE
OnMessage(0x0083, WM_NCCALCSIZE) ; WM_NCCALCSIZE
OnMessage(0x0084, WM_NCHITTEST) ; WM_NCHITTEST

ScreenSize := FN_MonitorGetWorking(FN_MonitorGetPrimary())

AHK_OnMove(wParam, lParam, msg, hwnd) {
    global MainGui, PlayerGui, PlayerWV, PlayerRectX, PlayerRectY, PlayerRectW, PlayerRectH
    if (IsSet(MainGui) && hwnd == MainGui.Hwnd && IsSet(PlayerGui) && PlayerGui) {
        if (PlayerWV.wvc.IsVisible) {
            WinGetClientPos(&CX, &CY, , , MainGui.Hwnd)
            PlayerGui.Move(CX + PlayerRectX, CY + PlayerRectY, PlayerRectW, PlayerRectH)
        }
    }
}

WM_NCHITTEST(wParam, lParam, msg, hwnd) {
    ; Empty
}

WM_NCCALCSIZE(wParam, lParam, msg, hwnd) {
    global PlayerGui
    if (IsSet(PlayerGui) && PlayerGui && hwnd == PlayerGui.Hwnd) {
        return 0
    }
}

MainGui.OnEvent("Size", MainGui_OnSize)

MainGui_OnSize(*) {
    WinGetPos &wX, &wY, &wW, &wH, MainGui.Hwnd
    if (wH >= ScreenSize.height) {
        MainGui.Move(, , , ScreenSize.height)
    }
    if (wW >= ScreenSize.width) {
        MainGui.Move(, , ScreenSize.width,)
    }
}