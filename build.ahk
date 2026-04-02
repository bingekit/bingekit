#Requires AutoHotkey v2.0

Ahk2ExePath := "C:\Apps\AHK\Ahk2Exe.exe"
AutoHotkeyExePath := "C:\Program Files\AutoHotkey\v2\AutoHotkey64.exe"
SourceFile := A_ScriptDir "\host\main.ahk"
BuildDir := A_ScriptDir "\build"
OutputFile := BuildDir "\BingeKit.exe"

if !FileExist(Ahk2ExePath) {
    MsgBox("Ahk2Exe not found at " Ahk2ExePath, "Build Error", 16)
    ExitApp()
}

if !FileExist(AutoHotkeyExePath) {
    MsgBox("AutoHotkey not found at " AutoHotkeyExePath, "Build Error", 16)
    ExitApp()
}

if !DirExist(BuildDir) {
    DirCreate(BuildDir)
}

; Run frontend build
TrayTip("Running Vite Build...", "BingeKit Build")
AppDir := A_ScriptDir "\app"
if DirExist(AppDir) {
    RunWait("bun build.js", AppDir, "Hide")
}

; Execute Ahk2Exe
Command := '"' Ahk2ExePath '" /in "' SourceFile '" /out "' OutputFile '" /base "' AutoHotkeyExePath '" /compress 0'

TrayTip("Building BingeKit...", "BingeKit Build")
Result := RunWait(Command)

if FileExist(OutputFile) {
    MsgBox("Build Successful!`n`nOutput: " OutputFile, "Build Complete", 64)
} else {
    MsgBox("Build Failed! Ahk2Exe returned code: " Result, "Build Error", 16)
}
