#Requires AutoHotkey v2.0

Ahk2ExePath := "C:\Apps\AHK\Ahk2Exe.exe"
AutoHotkeyExePath := "C:\Program Files\AutoHotkey\v2\AutoHotkey64.exe"
SourceFile := A_ScriptDir "\host\src\main.ahk"
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

; Find current version
PackageJson := A_ScriptDir "\gui\package.json"
CurrentVersion := "0.0.0"
if FileExist(PackageJson) {
    txt := FileRead(PackageJson, "UTF-8")
    if (RegExMatch(txt, "`"version`"\s*:\s*`"([0-9]+\.[0-9]+\.[0-9]+)`"", &match)) {
        CurrentVersion := match[1]
    }
}
oVer := StrSplit(CurrentVersion, ".")
if (oVer.Length >= 3) {
    NextParts := [oVer[1], oVer[2], Integer(oVer[3]) + 1]
    NextVersion := NextParts[1] "." NextParts[2] "." NextParts[3]
} else {
    NextVersion := CurrentVersion
}

; Build GUI
BuildGui := Gui("-MinimizeBox -MaximizeBox", "BingeKit Build Manager")
BuildGui.Add("Text", "w400", "Current Version: " CurrentVersion)

BuildGui.Add("Text", "w400 y+15", "New Version String (e.g. 0.0.10):")
EditVersion := BuildGui.Add("Edit", "w400 vNewVersion", NextVersion)

BuildGui.Add("Text", "w400 y+15", "Release Changelog:")
EditChangelog := BuildGui.Add("Edit", "w400 h100 Multi vChangelog", "Fixed minor bugs.")

ChkGithub := BuildGui.Add("Checkbox", "w400 y+15 vPushGithub Checked", "Auto-Push Release to GitHub (Push BingeKit.exe + update.json)")
GithubUrl := BuildGui.Add("Edit", "w400 vGithubUrl Hidden", "https://github.com/owhs/bingekit/raw/main/app/build/BingeKit.exe")

BtnBuild := BuildGui.Add("Button", "w100 y+20 Default", "Start Build")
BtnBuild.OnEvent("Click", StartBuild)

BuildGui.Add("Button", "w100 x+10", "Cancel").OnEvent("Click", (*) => ExitApp())
BuildGui.Show("AutoSize Center")

StartBuild(*) {
    saved := BuildGui.Submit()

    newVer := saved.NewVersion
    changelog := saved.Changelog
    pushGithub := saved.PushGithub

    ; Step 1: Run version.ts script
    TrayTip("Updating version across files...", "BingeKit Build")
    RunWait("bun run version.ts " newVer, A_ScriptDir "\scripts", "Hide")

    ; Step 2: Ensure build dir exists
    if !DirExist(BuildDir) {
        DirCreate(BuildDir)
    }

    ; Step 3: Run frontend build
    AppDir := A_ScriptDir "\gui"
    if DirExist(AppDir) {
        TrayTip("Running Vite Frontend Build...", "BingeKit Build")
        RunWait("bun run build", AppDir, "Hide")
    }

    ; Step 4: Execute Ahk2Exe
    TrayTip("Compiling Executable with Ahk2Exe...", "BingeKit Build")
    ; Original path had \host\main.ahk, but usually it's \host\src\main.ahk
    actualSource := FileExist(A_ScriptDir "\host\src\main.ahk") ? A_ScriptDir "\host\src\main.ahk" : A_ScriptDir "\host\main.ahk"

    Command := '"' Ahk2ExePath '" /in "' actualSource '" /out "' OutputFile '" /base "' AutoHotkeyExePath '" /compress 0'
    Result := RunWait(Command)

    if (Result != 0 || !FileExist(OutputFile)) {
        MsgBox("Build Failed! Ahk2Exe returned code: " Result, "Build Error", 16)
        ExitApp()
    }

    ; Step 5: Update JSON object for the updater
    UpdateJSONPath := A_ScriptDir "\build\update.json"

    ; Create the JSON format
    jsonStr := "{`n"
    jsonStr .= "  `"tag_name`": `"v" newVer "`",`n"

    ; Escape newlines in changelog
    safeChangelog := StrReplace(changelog, "\", "\\")
    safeChangelog := StrReplace(safeChangelog, "`n", "\n")
    safeChangelog := StrReplace(safeChangelog, "`r", "")
    safeChangelog := StrReplace(safeChangelog, "`"", "\`"")

    jsonStr .= "  `"body`": `"" safeChangelog "`",`n"
    jsonStr .= "  `"assets`": [`n"
    jsonStr .= "    {`n"
    jsonStr .= "      `"name`": `"BingeKit.exe`",`n"
    ; Replace the raw URL carefully. For Github raw links it follows github.com/user/repo/raw/branch/path
    ; We can default to the user's origin URL if possible. We'll use a standard path assuming repository: owhs/bingekit
    jsonStr .= "      `"browser_download_url`": `"https://github.com/owhs/bingekit/raw/main/app/build/BingeKit.exe`"`n"
    jsonStr .= "    }`n"
    jsonStr .= "  ]`n"
    jsonStr .= "}"

    if FileExist(UpdateJSONPath)
        FileDelete(UpdateJSONPath)
    FileAppend(jsonStr, UpdateJSONPath, "UTF-8")

    TrayTip("Build Successful!", "BingeKit Build")

    if (pushGithub) {
        TrayTip("Pushing Release to GitHub...", "BingeKit Build")
        RepoDir := A_ScriptDir

        ; Git commands
        msgPath := A_Temp "\git_msg.txt"
        if FileExist(msgPath)
            FileDelete(msgPath)
        FileAppend("🔖 Release v" newVer "`n`n" changelog, msgPath, "UTF-8")

        RunWait('git add .github/workflows/release.yml build/BingeKit.exe build/update.json gui/package.json host/src/build_exe.ahk', RepoDir)
        RunWait('git commit -F "' msgPath '"', RepoDir)
        RunWait('git tag -a v' newVer ' -F "' msgPath '"', RepoDir)
        RunWait('git push origin main --tags', RepoDir)

        MsgBox("Build & Push Complete!`n`nVersion: " newVer "`nNew executable and update.json pushed to GitHub.", "Release Complete", 64)
    } else {
        MsgBox("Build Complete!`n`nVersion: " newVer "`nOutput: " OutputFile "`n`nGithub push was bypassed.", "Build Complete", 64)
    }

    ExitApp()
}