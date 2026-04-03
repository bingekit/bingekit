#Requires AutoHotkey v2.0
#SingleInstance Force

DllCall("SetThreadDpiAwarenessContext", "ptr", -3, "ptr")

MinWidth := 850
MinHeight := 500