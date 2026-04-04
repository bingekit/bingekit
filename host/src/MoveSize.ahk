OnMessage(0x0003, AHK_OnMove) ; WM_MOVE
OnMessage(0x0005, AHK_OnMove) ; WM_SIZE
OnMessage(0x0083, WM_NCCALCSIZE) ; WM_NCCALCSIZE
OnMessage(0x0084, WM_NCHITTEST) ; WM_NCHITTEST

AHK_OnMove(wParam, lParam, msg, hwnd) {
    global MainGuis, PlayerGuis, PlayerWVs, PlayerRects, PlayerOwners
    if (IsSet(MainGuis) && IsSet(PlayerGuis)) {
        isMainGui := false
        currentWindowId := ""
        for wid, g in MainGuis {
            if (g.Hwnd == hwnd) {
                isMainGui := true
                currentWindowId := wid
                break
            }
        }
        
        if (isMainGui) {
            WinGetClientPos(&CX, &CY, , , hwnd)
            for id, pGui in PlayerGuis {
                ownerId := PlayerOwners.Has(id) ? PlayerOwners[id] : "main"
                if (ownerId != currentWindowId)
                    continue

                if (PlayerWVs.Has(id) && PlayerWVs[id].wvc.IsVisible && PlayerRects.Has(id)) {
                    rect := PlayerRects[id]
                    if (rect.HasOwnProp("visible") && !rect.visible)
                        continue
                    pGui.Move(CX + rect.x, CY + rect.y, rect.w, rect.h)
                }
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
            try {
                if (hwnd == pGui.Hwnd) {
                    return 0
                }
            }
        }
    }
}

;MainGui.OnEvent("Size", MainGui_OnSize)
OnMessage(0x0003, MainGui_OnSize)
OnMessage(0x0232, MainGui_OnSize)
OnMessage(0x0005, HandleSize)

global ScreenSize := FN_MonitorGetWorking(FN_MonitorGetPrimary())

global latest := {}

UpdateLatest(hwnd) {
    try {
        WinGetPos(&wX, &wY, &wW, &wH, "ahk_id " hwnd)
        global latest := { x: wX, y: wY, w: wW, h: wH, bottom: wY + wH, ScreenSizeBottom: ScreenSize.bottom }
    }
}

HandleSize(wParam, lParam, msg, hwnd) {
    ; wParam 2 = Maximised, 0 = Restored/Normal
    if (wParam = 2) {
        ; Window is maximised, the OS controls it now
        UpdateLatest(hwnd)
    } else {
        ; Window was restored or snapped
        MainGui_OnSize(wParam, lParam, msg, hwnd)
    }
}

MainGui_OnSize(wParam, lParam, msg, hwnd) {
    global MainGuis
    isMainGui := false
    for wid, g in MainGuis {
        if (g.Hwnd == hwnd) {
            isMainGui := true
            break
        }
    }
    if (!isMainGui)
        return

    UpdateLatest(hwnd)
    if ((latest.bottom > ScreenSize.bottom) && ((ScreenSize.bottom - latest.y) > MinHeight)) {
        WinMove(, , , ScreenSize.bottom - latest.y, "ahk_id " hwnd)
    }
    if ((latest.x + latest.w > ScreenSize.right) && ((ScreenSize.right - latest.x) > MinWidth)) {
        WinMove(, , ScreenSize.right - latest.x, , "ahk_id " hwnd)
    }
}

OnMessage(0x001A, HandleSettingChange)

HandleSettingChange(wParam, lParam, *) {
    global ScreenSize, MainGuis
    ScreenSize := FN_MonitorGetWorking(FN_MonitorGetPrimary())
    Sleep(200)
    for wid, g in MainGuis {
        MainGui_OnSize(0, 0, 0, g.Hwnd)
    }
}

;SetTimer(CheckSize, 5000)
;CheckSize() {
;    global latest
;    MsgBox JSON.stringify(latest)
;}
