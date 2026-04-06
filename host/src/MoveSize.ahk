OnMessage(0x0003, AHK_OnMove) ; WM_MOVE
OnMessage(0x0005, AHK_OnMove) ; WM_SIZE
OnMessage(0x0046, WM_WINDOWPOSCHANGING) ; WM_WINDOWPOSCHANGING
OnMessage(0x0024, WM_GETMINMAXINFO) ; WM_GETMINMAXINFO
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

WM_GETMINMAXINFO(wParam, lParam, msg, hwnd) {
    global MainGuis, MinWidth, MinHeight
    if (IsSet(MainGuis)) {
        for wid, g in MainGuis {
            if (g.Hwnd == hwnd) {
                ; Get monitor working area
                mon := DllCall("MonitorFromWindow", "Ptr", hwnd, "UInt", 2, "Ptr")
                NumPut("UInt", 40, mInfo := Buffer(40))
                if DllCall("GetMonitorInfo", "Ptr", mon, "Ptr", mInfo) {
                    mWorkX := NumGet(mInfo, 20, "Int")
                    mWorkY := NumGet(mInfo, 24, "Int")
                    mWorkR := NumGet(mInfo, 28, "Int")
                    mWorkB := NumGet(mInfo, 32, "Int")
                    mWorkW := mWorkR - mWorkX
                    mWorkH := mWorkB - mWorkY

                    ; ptMaxSize
                    NumPut("Int", mWorkW, lParam, 8)
                    NumPut("Int", mWorkH, lParam, 12)
                    ; ptMaxPosition
                    NumPut("Int", mWorkX, lParam, 16)
                    NumPut("Int", mWorkY, lParam, 20)
                    ; ptMinTrackSize
                    NumPut("Int", MinWidth, lParam, 24)
                    NumPut("Int", MinHeight, lParam, 28)
                    return 0
                }
            }
        }
    }
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

WM_WINDOWPOSCHANGING(wParam, lParam, msg, hwnd) {
    global MainGuis, ScreenSize, MinWidth, MinHeight
    if (IsSet(MainGuis)) {
        isMainGui := false
        for wid, g in MainGuis {
            if (g.Hwnd == hwnd) {
                isMainGui := true
                break
            }
        }
        if (!isMainGui)
            return

        offset := A_PtrSize * 2
        x := NumGet(lParam, offset, "Int")
        y := NumGet(lParam, offset + 4, "Int")
        w := NumGet(lParam, offset + 8, "Int")
        h := NumGet(lParam, offset + 12, "Int")
        flags := NumGet(lParam, offset + 16, "UInt")

        if (flags & 0x0001 && flags & 0x0002) ; SWP_NOSIZE | SWP_NOMOVE
            return

        newW := w
        newH := h

        if (y + h > ScreenSize.bottom && (ScreenSize.bottom - y) >= MinHeight) {
            ;newH := ScreenSize.bottom - y
        }
        if (x + w > ScreenSize.right && (ScreenSize.right - x) >= MinWidth) {
            ;newW := ScreenSize.right - x
        }

        if (newW != w || newH != h) {
            NumPut("Int", newW, lParam, offset + 8)
            NumPut("Int", newH, lParam, offset + 12)
            NumPut("UInt", flags & ~0x0001, lParam, offset + 16)
        }
        return 0
    }
}

global ScreenSize := FN_MonitorGetWorking(FN_MonitorGetPrimary())
OnMessage(0x001A, HandleSettingChange)

HandleSettingChange(wParam, lParam, *) {
    global ScreenSize, MainGuis
    ScreenSize := FN_MonitorGetWorking(FN_MonitorGetPrimary())
}

;SetTimer(CheckSize, 5000)
;CheckSize() {
;    global latest
;    MsgBox JSON.stringify(latest)
;}
