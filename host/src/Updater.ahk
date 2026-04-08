global UpdateObj := ""

AHK_GetAppVersion() {
    global BINGEKIT_Version
    return BINGEKIT_Version
}

AHK_IsCompiled(*) {
    return A_IsCompiled ? 1 : 0
}

AHK_CheckForUpdates(windowId := "main", *) {
    global UpdateObj, updateUrl

    if (!A_IsCompiled) {
        UpdateObj := "{ `"error`": true, `"unsupported`": true }"
        return UpdateObj
    }
    try {
        configStr := AHK_GetAboutConfig()
        if (configStr != "" && configStr != "{}") {
            parsedConfig := JSON.parse(configStr)
            if (parsedConfig.Has("UpdateUrl") && parsedConfig["UpdateUrl"] != "") {
                updateUrl := parsedConfig["UpdateUrl"]
            }
        }
    } catch {
    }
    if (updateUrl != "") {
        AHK_ShowToast(windowId, "Checking via '" . updateUrl . "'", "info")
        try {
            whr := ComObject("WinHttp.WinHttpRequest.5.1")
            whr.Open("GET", updateUrl, true)
            whr.SetRequestHeader("User-Agent", "BingeKit-Updater")
            whr.Send()
            whr.WaitForResponse()

            if (whr.Status == 200) {
                response := whr.ResponseText
                parsed := JSON.parse(response)

                if (parsed.Has("tag_name") && parsed.Has("body") && parsed.Has("assets")) {
                    version := parsed["tag_name"]
                    body := parsed["body"]
                    downloadUrl := ""

                    ; Remove 'v' from version if it exists
                    versionStr := StrReplace(version, "v", "")

                    for index, asset in parsed["assets"] {
                        if (InStr(asset["name"], ".exe")) {
                            downloadUrl := asset["browser_download_url"]
                            break
                        }
                    }

                    if (downloadUrl != "") {
                        if (VerCompare(versionStr, BINGEKIT_Version) > 0) {
                            obj := Map("version", versionStr, "body", body, "url", downloadUrl)
                            UpdateObj := JSON.stringify(obj)
                            return UpdateObj
                        } else {
                            UpdateObj := ""
                            return UpdateObj
                        }
                    }
                }
            }
        } catch Error as e {
            ; Ignore errors, just return empty
        }
    }
    UpdateObj := "{ `"error`": true }"
    return UpdateObj
}

AHK_InstallUpdate(windowId := "main", downloadUrl := "", *) {
    if (downloadUrl == "") {
        return false
    }

    try {
        tempExe := A_Temp "\BingeKit_Update.exe"
        if FileExist(tempExe) {
            FileDelete(tempExe)
        }

        Download(downloadUrl, tempExe)

        if FileExist(tempExe) {
            batFile := A_Temp "\BingeKit_Updater.bat"
            if FileExist(batFile) {
                FileDelete(batFile)
            }

            ; Create a batch script to wait for the app to close, replace it
            currentExe := A_ScriptFullPath
            global WorkspaceBaseDir
            fallbackExe := WorkspaceBaseDir "\BingeKit.exe"

            batContent := ""
            batContent .= "@echo off`n"
            batContent .= "ping 127.0.0.1 -n 3 > nul`n" ; Wait ~2 seconds

            ; Try standard overwrite
            batContent .= "copy /y `"" tempExe "`" `"" currentExe "`" > nul 2>&1`n"
            batContent .= "if %ERRORLEVEL% EQU 0 (`n"
            batContent .= "    start `"`" `"" currentExe "`"`n"
            batContent .= ") else (`n"
            ; Fallback to InstalledDataPath wrapper execution
            batContent .= "    copy /y `"" tempExe "`" `"" fallbackExe "`" > nul 2>&1`n"
            batContent .= "    start `"`" `"" fallbackExe "`"`n"
            batContent .= ")`n"
            batContent .= "del `"%~f0`"`n" ; Delete self

            FileAppend(batContent, batFile)

            Run(batFile, , "Hide")
            ExitApp()
            return true
        }
    } catch Error as e {
        return false
    }
    return false
}