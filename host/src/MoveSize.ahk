OnMessage(0x0003, AHK_OnMove) ; WM_MOVE
OnMessage(0x0005, AHK_OnMove) ; WM_SIZE
OnMessage(0x0083, WM_NCCALCSIZE) ; WM_NCCALCSIZE
OnMessage(0x0084, WM_NCHITTEST) ; WM_NCHITTEST

AHK_OnMove(wParam, lParam, msg, hwnd) {
    global MainGui, PlayerGuis, PlayerWVs, PlayerRects
    if (IsSet(MainGui) && hwnd == MainGui.Hwnd && IsSet(PlayerGuis)) {
        WinGetClientPos(&CX, &CY, , , MainGui.Hwnd)
        for id, pGui in PlayerGuis {
            if (PlayerWVs.Has(id) && PlayerWVs[id].wvc.IsVisible && PlayerRects.Has(id)) {
                rect := PlayerRects[id]
                if (rect.HasOwnProp("visible") && !rect.visible)
                    continue
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

;MainGui.OnEvent("Size", MainGui_OnSize)
OnMessage(0x0003, (*) => MainGui_OnSize())
OnMessage(0x0232, (*) => MainGui_OnSize())
OnMessage(0x0005, HandleSize)

global ScreenSize := FN_MonitorGetWorking(FN_MonitorGetPrimary())

global latest := {}

UpdateLatest() {
    try {
        MainGui.GetPos(&wX, &wY, &wW, &wH)
        global latest := { x: wX, y: wY, w: wW, h: wH, bottom: wY + wH, ScreenSizeBottom: ScreenSize.bottom }
    }
}

HandleSize(wParam, *) {
    ; wParam 2 = Maximised, 0 = Restored/Normal
    if (wParam = 2) {
        ; Window is maximised, the OS controls it now
        UpdateLatest()
    } else {
        ; Window was restored or snapped
        MainGui_OnSize()
    }
}

MainGui_OnSize(*) {
    UpdateLatest()
    if ((latest.bottom > ScreenSize.bottom) && ((ScreenSize.bottom - latest.y) > MinHeight)) {
        MainGui.Move(, , , ScreenSize.bottom - latest.y)
    }
    if ((latest.x + latest.w > ScreenSize.right) && ((ScreenSize.right - latest.x) > MinWidth)) {
        MainGui.Move(, , ScreenSize.right - latest.x,)
    }

}
OnMessage(0x001A, HandleSettingChange)

HandleSettingChange(wParam, lParam, *) {
    global ScreenSize
    ScreenSize := FN_MonitorGetWorking(FN_MonitorGetPrimary())
    Sleep(200)
    MainGui_OnSize()
}

;SetTimer(CheckSize, 5000)
;CheckSize() {
;    global latest
;    MsgBox JSON.stringify(latest)
;}
