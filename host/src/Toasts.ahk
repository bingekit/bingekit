global ActiveToasts := Map()
global ToastGridSlots := Map()


GetNextToastSlot() {
    global ToastGridSlots
    slotIndex := 1
    Loop {
        if (!ToastGridSlots.Has(slotIndex) || ToastGridSlots[slotIndex] == false) {
            ToastGridSlots[slotIndex] := true ; Will upgrade to height later
            return slotIndex
        }
        slotIndex++
    }
}

DestroyToast(id) {
    global ActiveToasts, ToastGridSlots
    if (ActiveToasts.Has(id)) {
        t := ActiveToasts[id]
        if (t.HasOwnProp("slotIndex") && t.slotIndex > 0) {
            ToastGridSlots[t.slotIndex] := false
        }
        try t.gui.Destroy()
        ActiveToasts.Delete(id)
    }
}

AHK_ShowToast(windowId, msg, arg1 := "info", arg2 := "", arg3 := "") {
    global MainGuis, ToastWidth, ToastHeight

    id := "toast_" . A_TickCount . "_" . Random(1000, 9999)
    slotIndex := GetNextToastSlot()

    bgC := "18181b" ; zinc-900
    textC := "e4e4e7" ; zinc-200
    ringC := "3f3f46" ; zinc-700
    brandC := "6366f1"
    bandC := ""

    global WorkspaceDir
    Try {
        if (IsSet(WorkspaceDir) && WorkspaceDir != "" && FileExist(WorkspaceDir "\theme.json")) {
            tJson := FileRead(WorkspaceDir "\theme.json", "UTF-8")
            theme := JSON.parse(tJson)
            if (theme.Has("mainBg") && theme["mainBg"] != "")
                bgC := StrReplace(theme["mainBg"], "#", "")
            if (theme.Has("textMain") && theme["textMain"] != "")
                textC := StrReplace(theme["textMain"], "#", "")
            if (theme.Has("border") && theme["border"] != "")
                ringC := StrReplace(theme["border"], "#", "")
            if (theme.Has("accent") && theme["accent"] != "")
                brandC := StrReplace(theme["accent"], "#", "")
        }
    } catch {
    }

    bandC := brandC

    if (SubStr(LTrim(arg1), 1, 1) = "{") {
        try {
            cfg := JSON.parse(arg1)
            if (cfg.Has("bgC") && cfg["bgC"] != "")
                bgC := StrReplace(cfg["bgC"], "#", "")
            if (cfg.Has("textC") && cfg["textC"] != "")
                textC := StrReplace(cfg["textC"], "#", "")
            if (cfg.Has("borderC") && cfg["borderC"] != "")
                bandC := StrReplace(cfg["borderC"], "#", "")
        }
    } else if (arg1 = "error") {
        bandC := "ef4444"
    } else if (arg1 = "success") {
        bandC := "10b981"
    } else if (arg1 = "info" || arg1 = "theme") {
        bandC := brandC

    } else if (arg1 != "") {
        bgC := StrReplace(arg1, "#", "")
        if (arg2 != "")
            textC := StrReplace(arg2, "#", "")
        if (arg3 != "")
            bandC := StrReplace(arg3, "#", "")
    }

    ownerHwnd := MainGuis.Has(windowId) ? MainGuis[windowId].Hwnd : ""
    tGui := Gui("-Caption +ToolWindow +AlwaysOnTop +Owner" ownerHwnd)
    tGui.BackColor := ringC
    tGui.MarginX := 0
    tGui.MarginY := 0
    tGui.SetFont("s9", "Segoe UI")

    hCalc := tGui.Add("Text", "x16 y12 w" (ToastWidth - 24) " +0x2000 +Wrap", msg)

    rect := Buffer(16, 0)
    NumPut("Int", ToastWidth - 24, rect, 8)

    hdc := DllCall("GetDC", "Ptr", hCalc.Hwnd, "Ptr")
    hFont := SendMessage(0x31, 0, 0, hCalc.Hwnd)
    oldF := DllCall("SelectObject", "Ptr", hdc, "Ptr", hFont, "Ptr")

    DllCall("DrawText", "Ptr", hdc, "Str", msg, "Int", -1, "Ptr", rect, "UInt", 0x400 | 0x10 | 0x2000 | 0x40)
    th := NumGet(rect, 12, "Int")

    DllCall("SelectObject", "Ptr", hdc, "Ptr", oldF)
    DllCall("ReleaseDC", "Ptr", hCalc.Hwnd, "Ptr", hdc)

    dynHeight := th + 24
    if (dynHeight < ToastHeight)
        dynHeight := ToastHeight
    hCalc.Visible := false

    ToastGridSlots[slotIndex] := dynHeight

    tGui.Add("Text", "x1 y1 w" (ToastWidth - 2) " h" (dynHeight - 2) " Background" bgC, "")
    tGui.Add("Progress", "x1 y1 w4 h" (dynHeight - 2) " Background" bandC, 0)

    hText := tGui.Add("Text", "x16 y12 w" (ToastWidth - 24) " h" th " c" textC " Background" bgC " +0x2000 +Wrap", msg)

    hCover := tGui.Add("Text", "x0 y0 w" ToastWidth " h" dynHeight " BackgroundTrans", "")
    hCover.OnEvent("Click", (*) => DestroyToast(id))

    MonitorGetWorkArea(1, &WL, &WT, &WR, &WB)

    padding := 20
    gap := 10

    xPos := WR - ToastWidth - padding
    yPos := WB - gap
    Loop slotIndex - 1 {
        idx := A_Index
        if (ToastGridSlots.Has(idx) && ToastGridSlots[idx]) {
            yPos -= (ToastGridSlots[idx] + gap)
        } else {
            yPos -= (ToastHeight + gap)
        }
    }
    yPos -= dynHeight

    tGui.Show("w" ToastWidth " h" dynHeight " x" xPos " y" yPos " NoActivate")

    try {
        DllCall("dwmapi\DwmSetWindowAttribute", "Ptr", tGui.Hwnd, "UInt", 33, "Int*", 2, "UInt", 4)
    }

    ActiveToasts[id] := { gui: tGui, slotIndex: slotIndex }

    cb := () => DestroyToast(id)
    SetTimer(cb, -3500)
}