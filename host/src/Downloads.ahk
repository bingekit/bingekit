global DownloadedMediaCache := Map()
global ActiveFFmpegPIDs := Map()

AHK_DownloadStarting(sender, args) {
    global CurrentWorkspace, MainGui, SiteBlockersMap

    ; args is ICoreWebView2DownloadStartingEventArgs
    download := args.DownloadOperation
    url := download.Uri
    mime := download.MimeType

    ; Parse config
    downloadLoc := AHK_LoadData("downloads_loc.txt")
    if (downloadLoc == "") {
        downloadLoc := EnvGet("USERPROFILE") "\Videos\BingeKit"
        if !DirExist(downloadLoc) {
            try DirCreate(downloadLoc)
        }
    }

    blockedExtsJSON := AHK_LoadData("blocked_exts.json")

    ; Getting blocked array from simple AHK JSON struct parser isn't available, we'll manually grep it or better yet rely on standard types. Let's use simple string searching:
    path := args.ResultFilePath
    SplitPath(path, &outFileName, &outDir, &outExt, &outNameNoExt, &outDrive)

    extToCheck := "." . outExt
    isBlocked := false

    if (InStr(blockedExtsJSON, '"' extToCheck '"') || InStr(blockedExtsJSON, '"' outExt '"')) {
        isBlocked := true
    }

    if (isBlocked) {
        args.Cancel := 1
        args.Handled := 1
        if (MainGui) {
            js := "try { window.dispatchEvent(new CustomEvent('bk-download-blocked', { detail: { file: '" StrReplace(outFileName, "'", "\'") "' } })) } catch(e){}"
            MainGui.Control.ExecuteScriptAsync(js)
        }
        return
    }

    ; Change default path
    args.ResultFilePath := downloadLoc "\" outFileName
    args.Handled := 1

    ; Track progress
    download.add_BytesReceivedChanged(AHK_DownloadProgress)
    download.add_StateChanged(AHK_DownloadState)

    ; Send init to react
    if (MainGui) {
        js := "try { window.dispatchEvent(new CustomEvent('bk-download-started', { detail: { file: '" StrReplace(outFileName, "'", "\'") "', path: '" StrReplace(args.ResultFilePath, "\", "\\") "' } })) } catch(e){}"
        MainGui.Control.ExecuteScriptAsync(js)
    }
}

AHK_DownloadProgress(sender, *) {
    global MainGui
    total := sender.TotalBytesToReceive
    rcv := sender.BytesReceived
    path := sender.ResultFilePath

    if (MainGui) {
        js := "try { window.dispatchEvent(new CustomEvent('bk-download-progress', { detail: { path: '" StrReplace(path, "\", "\\") "', total: " total ", rcv: " rcv " } })) } catch(e){}"
        MainGui.Control.ExecuteScriptAsync(js)
    }
}

AHK_DownloadState(sender, *) {
    global MainGui
    state := sender.State ; 0=InProgress, 1=Interrupted, 2=Completed
    path := sender.ResultFilePath

    if (MainGui) {
        js := "try { window.dispatchEvent(new CustomEvent('bk-download-state', { detail: { path: '" StrReplace(path, "\", "\\") "', state: " state " } })) } catch(e){}"
        MainGui.Control.ExecuteScriptAsync(js)
    }
}

AHK_CheckFFmpegStatus() {
    if (RunWait("cmd.exe /c ffmpeg -version", , "Hide") == 0)
        return "installed"

    ffmpegExe := A_ScriptDir "\bin\ffmpeg.exe"
    if FileExist(ffmpegExe)
        return "installed"
    return "missing"
}

AHK_EnsureFFmpeg(force := false) {
    if (!force && RunWait("cmd.exe /c ffmpeg -version", , "Hide") == 0)
        return "ffmpeg"

    binDir := A_ScriptDir "\bin"
    if !DirExist(binDir)
        DirCreate(binDir)

    ffmpegExe := binDir "\ffmpeg.exe"
    if (force || !FileExist(ffmpegExe)) {
        ToolTip("Downloading FFmpeg natively... This may take a minute.")
        tmpZip := A_Temp "\ffmpeg.zip"
        url := "https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip"

        try {
            AHK_NativeDownloadWinHttp(url, tmpZip)
        } catch as err {
            ToolTip("Failed to download FFmpeg: " err.Message)
            SetTimer(() => ToolTip(), -5000)
            return ""
        }

        try {
            shell := ComObject("Shell.Application")
            zipFile := shell.NameSpace(tmpZip)
            destination := shell.NameSpace(A_Temp)
            destination.CopyHere(zipFile.Items(), 4 | 16)
        } catch {
            ToolTip("Failed to extract FFmpeg.")
            SetTimer(() => ToolTip(), -5000)
            return ""
        }

        try FileMove(A_Temp "\ffmpeg-master-latest-win64-gpl\bin\ffmpeg.exe", ffmpegExe, 1)

        try FileDelete(tmpZip)
        try DirDelete(A_Temp "\ffmpeg-master-latest-win64-gpl", 1)
        ToolTip()
    }
    return ffmpegExe
}

AHK_NativeDownloadWinHttp(url, destPath, extraHeaders := "") {
    req := ComObject("WinHttp.WinHttpRequest.5.1")
    req.Open("GET", url, true)
    req.SetRequestHeader("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")

    ; Parse any simple headers we passed, e.g., 'Cookie: foo=bar'
    if (extraHeaders != "") {
        lines := StrSplit(extraHeaders, "`n", "`r")
        for line in lines {
            if InStr(line, ":") {
                parts := StrSplit(line, ":", " ", 2)
                if (parts.Length == 2)
                    req.SetRequestHeader(parts[1], parts[2])
            }
        }
    }

    req.Send()
    req.WaitForResponse()

    stream := ComObject("ADODB.Stream")
    stream.Type := 1 ; Binary
    stream.Open()
    stream.Write(req.ResponseBody)
    stream.SaveToFile(destPath, 2) ; Overwrite
    stream.Close()
}

AHK_DownloadActiveVideo(url, targetFilename, subUrl := "") {
    global MainGui
    if (url = "")
        return

    downloadLoc := AHK_LoadData("downloads_loc.txt")
    if (downloadLoc == "") {
        downloadLoc := EnvGet("USERPROFILE") "\Videos\BingeKit"
        if !DirExist(downloadLoc) {
            try DirCreate(downloadLoc)
        }
    }

    ffmpegPath := AHK_EnsureFFmpeg()

    finalPath := downloadLoc "\" targetFilename

    if (MainGui) {
        js := "try { window.dispatchEvent(new CustomEvent('bk-download-started', { detail: { file: '" StrReplace(targetFilename, "'", "\'") "', path: '" StrReplace(finalPath, "\", "\\") "', isFFmpeg: true } })) } catch(e){}"
        MainGui.Control.ExecuteScriptAsync(js)
    }

    global ActiveTabId, ActiveMediaAuths
    authOpts := ""
    headerStr := ""
    if (ActiveMediaAuths.Has(ActiveTabId)) {
        ActiveMediaAuth := ActiveMediaAuths[ActiveTabId]
        referer := "", userAgent := "", cookie := ""
        if RegExMatch(ActiveMediaAuth, '"referer"\s*:\s*"([^"]+)"', &m)
            referer := m[1]
        if RegExMatch(ActiveMediaAuth, '"userAgent"\s*:\s*"([^"]+)"', &m)
            userAgent := m[1]
        if RegExMatch(ActiveMediaAuth, '"cookie"\s*:\s*"([^"]+)"', &m)
            cookie := m[1]

        if (userAgent) {
            authOpts .= '-user_agent "' userAgent '" '
            headerStr .= "User-Agent: " userAgent "`n"
        }
        if (cookie) {
            authOpts .= '-headers "Cookie: ' cookie '" '
            headerStr .= "Cookie: " cookie "`n"
        }
        if (referer) {
            authOpts .= '-headers "Referer: ' referer '" '
            headerStr .= "Referer: " referer "`n"
        }
    }

    logFile := A_Temp "\bk_ffmpeg_" A_TickCount ".log"
    cmd := 'cmd.exe /c ""' ffmpegPath '" -y ' authOpts '-i "' url '" -map 0:v? -map 0:a? -c copy -bsf:a aac_adtstoasc "' finalPath '" 2> "' logFile '""'

    Run(cmd, downloadLoc, "Hide", &pid)
    global ActiveFFmpegPIDs
    ActiveFFmpegPIDs[finalPath] := pid

    if (subUrl != "") {
        subPath := downloadLoc "\" RegExReplace(targetFilename, "\.[^\.]+$", ".vtt")
        dlSub() {
            try AHK_NativeDownloadWinHttp(subUrl, subPath, headerStr)
        }
        SetTimer(dlSub, -1)
    }

    checkerObj := {}
    checkerObj.cb := () => CheckFFmpegProcess(pid, finalPath, checkerObj.cb, logFile)
    SetTimer(checkerObj.cb, 2000)
}

CheckFFmpegProcess(pid, finalPath, cb, logFile) {
    global MainGui
    if !ProcessExist(pid) {
        SetTimer(cb, 0)
        if (MainGui) {
            ; 2 = Completed
            js := "try { window.dispatchEvent(new CustomEvent('bk-download-state', { detail: { path: '" StrReplace(finalPath, "\", "\\") "', state: 2 } })) } catch(e){}"
            MainGui.Control.ExecuteScriptAsync(js)
        }
        try FileDelete(logFile)
        global ActiveFFmpegPIDs
        if ActiveFFmpegPIDs.Has(finalPath)
            ActiveFFmpegPIDs.Delete(finalPath)
    } else {
        if (MainGui && FileExist(logFile)) {
            try {
                ; Read tail of log file effectively by reading all and getting last parts
                content := FileRead(logFile)
                if (content != "") {
                    content := StrReplace(content, "`r", "`n")
                    lines := StrSplit(content, "`n")
                    lastProg := ""
                    Loop lines.Length {
                        i := lines.Length - A_Index + 1
                        if InStr(lines[i], "size=") && InStr(lines[i], "time=") {
                            lastProg := lines[i]
                            break
                        }
                    }
                    if (lastProg != "") {
                        ; Output format: size=  1234KiB time=00:01:23.45 bitrate=... speed=1.23x
                        RegExMatch(lastProg, "size=\s*(\d+)[a-zA-Z]+.*?time=(\d{2}:\d{2}:\d{2}).*?speed=\s*([\d\.]+)x", &matches)
                        if (matches && matches.Count >= 3) {
                            sizeKB := matches[1]
                            sizeBytes := sizeKB * 1024
                            timeStr := matches[2]
                            speedStr := matches[3]

                            js := "try { window.dispatchEvent(new CustomEvent('bk-download-progress', { detail: { path: '" StrReplace(finalPath, "\", "\\") "', total: 0, rcv: " sizeBytes ", speed: '" speedStr "', ffmpegTime: '" timeStr "' } })) } catch(e){}"
                            MainGui.Control.ExecuteScriptAsync(js)
                        }
                    }
                }
            }
        }
    }
}

AHK_ListDownloads() {
    downloadLoc := AHK_LoadData("downloads_loc.txt")
    if (downloadLoc == "") {
        downloadLoc := EnvGet("USERPROFILE") "\Videos\BingeKit"
        if !DirExist(downloadLoc) {
            try DirCreate(downloadLoc)
        }
    }

    if !DirExist(downloadLoc) {
        return "[]"
    }

    files := "["
    Loop Files, downloadLoc "\*", "F"
    {
        if (InStr(A_LoopFileExt, "mp4") || InStr(A_LoopFileExt, "mkv") || InStr(A_LoopFileExt, "avi") || InStr(A_LoopFileExt, "webm") || InStr(A_LoopFileExt, "vtt") || InStr(A_LoopFileExt, "srt")) {
            files .= "{ `"name`": `"" A_LoopFileName "`", `"path`": `"" StrReplace(A_LoopFilePath, "\", "\\") "`", `"size`": " A_LoopFileSize ", `"time`": `"" A_LoopFileTimeCreated "`"},"
        }
    }
    files := RTrim(files, ",")
    files .= "]"
    return files
}

AHK_CancelDownload(path) {
    global ActiveFFmpegPIDs
    if ActiveFFmpegPIDs.Has(path) {
        pid := ActiveFFmpegPIDs[path]
        try RunWait("taskkill /F /T /PID " pid, , "Hide")
        ActiveFFmpegPIDs.Delete(path)
        try FileDelete(path)
    }
}

AHK_DeleteDownload(path, deleteSubs := 1) {
    if (InStr(path, ".."))
        return false
    try FileDelete(path)
    if (deleteSubs) {
        try FileDelete(RegExReplace(path, "\.[^\.]+$", ".vtt"))
        try FileDelete(RegExReplace(path, "\.[^\.]+$", ".srt"))
    }
    return true
}

AHK_RenameDownload(oldPath, newName) {
    if (InStr(oldPath, "..") || InStr(newName, "\") || InStr(newName, "/"))
        return false
    SplitPath(oldPath, , &dir)
    newPath := dir "\" newName
    try FileMove(oldPath, newPath, 1)

    ; Also rename subtitles if they exist
    oldSubVtt := RegExReplace(oldPath, "\.[^\.]+$", ".vtt")
    newSubVtt := RegExReplace(newPath, "\.[^\.]+$", ".vtt")
    if FileExist(oldSubVtt)
        try FileMove(oldSubVtt, newSubVtt, 1)

    oldSubSrt := RegExReplace(oldPath, "\.[^\.]+$", ".srt")
    newSubSrt := RegExReplace(newPath, "\.[^\.]+$", ".srt")
    if FileExist(oldSubSrt)
        try FileMove(oldSubSrt, newSubSrt, 1)

    return true
}

AHK_DownloadSubtitle(url, targetFilename) {
    if (url = "")
        return

    downloadLoc := AHK_LoadData("downloads_loc.txt")
    if (downloadLoc == "") {
        downloadLoc := EnvGet("USERPROFILE") "\Videos\BingeKit"
        if !DirExist(downloadLoc) {
            try DirCreate(downloadLoc)
        }
    }

    global ActiveTabId, ActiveMediaAuths
    headerStr := ""
    if (ActiveMediaAuths.Has(ActiveTabId)) {
        ActiveMediaAuth := ActiveMediaAuths[ActiveTabId]
        referer := "", userAgent := "", cookie := ""
        if RegExMatch(ActiveMediaAuth, '"referer"\s*:\s*"([^"]+)"', &m)
            referer := m[1]
        if RegExMatch(ActiveMediaAuth, '"userAgent"\s*:\s*"([^"]+)"', &m)
            userAgent := m[1]
        if RegExMatch(ActiveMediaAuth, '"cookie"\s*:\s*"([^"]+)"', &m)
            cookie := m[1]

        if (userAgent)
            headerStr .= "User-Agent: " userAgent "`n"
        if (cookie)
            headerStr .= "Cookie: " cookie "`n"
        if (referer)
            headerStr .= "Referer: " referer "`n"
    }

    subPath := downloadLoc "\" targetFilename
    dlSub() {
        try AHK_NativeDownloadWinHttp(url, subPath, headerStr)
    }
    SetTimer(dlSub, -1)
}

AHK_InstallExtensionZip(url, targetFolder := "sites") {
    global WorkspaceBaseDir
    if (url == "" || WorkspaceBaseDir == "")
        return false

    validFolders := Map("sites", 1, "flows", 1, "scripts", 1)
    if (!validFolders.Has(targetFolder))
        targetFolder := "sites"

    destDir := WorkspaceBaseDir "\" targetFolder
    if !DirExist(destDir)
        try DirCreate(destDir)

    tmpZip := A_Temp "\bk_ext_" A_TickCount ".zip"
    try {
        AHK_NativeDownloadWinHttp(url, tmpZip)
    } catch {
        return false
    }

    tmpExtract := A_Temp "\bk_ext_extract_" A_TickCount
    if !DirExist(tmpExtract)
        try DirCreate(tmpExtract)

    success := false
    try {
        shell := ComObject("Shell.Application")
        zipFile := shell.NameSpace(tmpZip)
        destination := shell.NameSpace(tmpExtract)
        destination.CopyHere(zipFile.Items(), 4 | 16)
        
        ; Move JSON artifacts to the corresponding folder
        Loop Files, tmpExtract "\*.json", "R"
        {
            try FileMove(A_LoopFileFullPath, destDir "\" A_LoopFileName, 1)
            success := true
        }
    } catch {
        success := false
    }
    
    try FileDelete(tmpZip)
    try DirDelete(tmpExtract, 1)

    return success ? "true" : "false"
}