global ActiveToasts := Map()
global ToastGridSlots := Map()

ToastWidth := 300
ToastHeight := 48

GetNextToastSlot() {
    global ToastGridSlots
    slotIndex := 1
    Loop {
        if (!ToastGridSlots.Has(slotIndex) || ToastGridSlots[slotIndex] == false) {
            ToastGridSlots[slotIndex] := true
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
    borderC := "3f3f46" ; zinc-700
    
    if (SubStr(LTrim(arg1), 1, 1) = "{") {
        try {
            cfg := JSON.parse(arg1)
            if (cfg.Has("bgC") && cfg["bgC"] != "")
                bgC := StrReplace(cfg["bgC"], "#", "")
            if (cfg.Has("textC") && cfg["textC"] != "")
                textC := StrReplace(cfg["textC"], "#", "")
            if (cfg.Has("borderC") && cfg["borderC"] != "")
                borderC := StrReplace(cfg["borderC"], "#", "")
        }
    } else if (arg1 = "error") {
        borderC := "ef4444" 
        bgC := "2D1A1A" ; slight red tint
    } else if (arg1 = "success") {
        borderC := "10b981"
        bgC := "1A2D24" ; slight green tint
    } else if (arg1 = "info") {
        borderC := "6366f1"
    } else if (arg1 != "") {
        bgC := StrReplace(arg1, "#", "")
        if (arg2 != "")
            textC := StrReplace(arg2, "#", "")
        if (arg3 != "")
            borderC := StrReplace(arg3, "#", "")
    }

    ownerHwnd := MainGuis.Has(windowId) ? MainGuis[windowId].Hwnd : ""
    tGui := Gui("-Caption +ToolWindow +AlwaysOnTop +Owner" ownerHwnd " +Border")
    tGui.BackColor := bgC
    tGui.MarginX := 0
    tGui.MarginY := 0

    tGui.Add("Progress", "x0 y0 w4 h" ToastHeight " Background" borderC, 0)
    
    hText := tGui.Add("Text", "x16 y12 w" (ToastWidth - 24) " h" (ToastHeight - 24) " c" textC " Background" bgC, msg)
    hText.SetFont("s9", "Segoe UI")

    hCover := tGui.Add("Text", "x0 y0 w" ToastWidth " h" ToastHeight " BackgroundTrans", "")
    hCover.OnEvent("Click", (*) => DestroyToast(id))

    MonitorGetWorkArea(1, &WL, &WT, &WR, &WB)
    
    padding := 20
    gap := 10
    
    xPos := WR - ToastWidth - padding
    yPos := WB - ((ToastHeight + gap) * slotIndex)

    tGui.Show("w" ToastWidth " h" ToastHeight " x" xPos " y" yPos " NoActivate")
    
    try {
        DllCall("dwmapi\DwmSetWindowAttribute", "Ptr", tGui.Hwnd, "UInt", 33, "Int*", 2, "UInt", 4)
    }

    ActiveToasts[id] := { gui: tGui, slotIndex: slotIndex }

    cb := () => DestroyToast(id)
    SetTimer(cb, -3500)
}
