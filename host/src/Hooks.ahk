OnMessage(0x0003, AHK_OnMove) ; WM_MOVE
OnMessage(0x0005, AHK_OnMove) ; WM_SIZE
OnMessage(0x0083, WM_NCCALCSIZE) ; WM_NCCALCSIZE
OnMessage(0x0084, WM_NCHITTEST) ; WM_NCHITTEST

ScreenSize := FN_MonitorGetWorking(FN_MonitorGetPrimary())

AHK_OnMove(wParam, lParam, msg, hwnd) {
    global MainGui, PlayerGuis, PlayerWVs, PlayerRects
    if (IsSet(MainGui) && hwnd == MainGui.Hwnd && IsSet(PlayerGuis)) {
        WinGetClientPos(&CX, &CY, , , MainGui.Hwnd)
        for id, pGui in PlayerGuis {
            if (PlayerWVs.Has(id) && PlayerWVs[id].wvc.IsVisible && PlayerRects.Has(id)) {
                rect := PlayerRects[id]
                pGui.Move(CX + rect.x, CY + rect.y, rect.w, rect.h)
            }
        }
    }
}

WM_NCHITTEST(wParam, lParam, msg, hwnd) {
    ; Empty
}

WM_NCCALCSIZE(wParam, lParam, msg, hwnd) {
    global PlayerGuis
    if (IsSet(PlayerGuis)) {
        for id, pGui in PlayerGuis {
            if (pGui && hwnd == pGui.Hwnd) {
                return 0
            }
        }
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