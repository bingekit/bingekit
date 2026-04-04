global AppStartupUrl := "http://gui.localhost/index.html"
global CurrentWorkspace := "default"
global WorkspaceBaseDir := ""
global WorkspaceDir := ""

LoadAppConfig() {
    global AppStartupUrl
    iniPath := A_ScriptDir "\config.ini"
    if FileExist(iniPath) {
        url := IniRead(iniPath, "Navigation", "StartupUrl", "http://gui.localhost/index.html")
        AppStartupUrl := StrReplace(url, "${A_ScriptDir}", A_ScriptDir)
    }
}

InitWorkspaces() {
    global CurrentWorkspace, WorkspaceBaseDir, WorkspaceDir
    
    iniPath := A_ScriptDir "\config.ini"
    isPortable := 1
    customPath := ""
    if FileExist(iniPath) {
        try isPortable := IniRead(iniPath, "Storage", "PortableMode", 1)
        try customPath := IniRead(iniPath, "Storage", "InstalledDataPath", "")
    }

    if (isPortable) {
        if (!DirExist(A_ScriptDir "\settings")) {
            try {
                DirCreate(A_ScriptDir "\settings")
            } catch {
                isPortable := 0
                IniWrite(0, iniPath, "Storage", "PortableMode")
            }
        } else {
            testFile := A_ScriptDir "\settings\.test_write"
            try {
                FileAppend("", testFile, "UTF-8")
                FileDelete(testFile)
            } catch {
                isPortable := 0
                IniWrite(0, iniPath, "Storage", "PortableMode")
            }
        }
    }
    
    if (isPortable) {
        WorkspaceBaseDir := A_ScriptDir "\settings\workspaces"
    } else {
        if (customPath != "") {
            WorkspaceBaseDir := customPath
        } else {
            WorkspaceBaseDir := EnvGet("LOCALAPPDATA") "\BingeKit\workspaces"
        }
    }

    Loop A_Args.Length {
        if (A_Args[A_Index] = "--workspace" && A_Index < A_Args.Length) {
            CurrentWorkspace := A_Args[A_Index + 1]
        }
    }
    
    WorkspaceDir := WorkspaceBaseDir "\" CurrentWorkspace

    if (!DirExist(WorkspaceBaseDir))
        DirCreate(WorkspaceBaseDir)

    if (CurrentWorkspace = "default" && !DirExist(WorkspaceDir)) {
        DirCreate(WorkspaceDir)
        if (FileExist(A_ScriptDir "\settings\theme.json")) {
            try {
                Loop Files, A_ScriptDir "\settings\*.json", "F"
                    FileMove(A_LoopFileFullPath, WorkspaceDir "\" A_LoopFileName)
                if DirExist(A_ScriptDir "\settings\cache")
                    DirMove(A_ScriptDir "\settings\cache", WorkspaceDir "\cache")
                if DirExist(A_ScriptDir "\settings\sites")
                    DirMove(A_ScriptDir "\settings\sites", WorkspaceDir "\sites")
                if DirExist(A_ScriptDir "\settings\scripts")
                    DirMove(A_ScriptDir "\settings\scripts", WorkspaceDir "\scripts")
                if DirExist(A_ScriptDir "\settings\flows")
                    DirMove(A_ScriptDir "\settings\flows", WorkspaceDir "\flows")
            }
        }
    }
    if (!DirExist(WorkspaceDir))
        DirCreate(WorkspaceDir)

    ; Boot Shim Logic: Intercept elevated environments by forwarding execution if a newer fallback exists
    fallbackExe := WorkspaceBaseDir "\BingeKit.exe"
    if (FileExist(fallbackExe) && fallbackExe != A_ScriptFullPath) {
        try {
            fallbackVer := FileGetVersion(fallbackExe)
            currentVer := FileGetVersion(A_ScriptFullPath)
            
            if (VerCompare(fallbackVer, currentVer) > 0) {
                cmdLine := "`"" fallbackExe "`""
                Loop A_Args.Length {
                    cmdLine .= " " A_Args[A_Index]
                }
                Run(cmdLine)
                ExitApp()
            }
        }
    }
}

AHK_GetCurrentWorkspace(*) {
    global CurrentWorkspace
    return CurrentWorkspace
}

AHK_ListWorkspaces(*) {
    global WorkspaceBaseDir
    fileList := ""
    Loop Files, WorkspaceBaseDir "\*", "D"
        fileList .= A_LoopFileName "|"
    return RTrim(fileList, "|")
}

AHK_CreateWorkspace(name) {
    global WorkspaceBaseDir
    if (!DirExist(WorkspaceBaseDir "\" name))
        DirCreate(WorkspaceBaseDir "\" name)
    return true
}

AHK_CloneWorkspace(src, dest) {
    global WorkspaceBaseDir
    if (DirExist(WorkspaceBaseDir "\" src) && !DirExist(WorkspaceBaseDir "\" dest)) {
        DirCopy(WorkspaceBaseDir "\" src, WorkspaceBaseDir "\" dest)
        return true
    }
    return false
}

AHK_DeleteWorkspace(name) {
    global WorkspaceBaseDir
    if (name != "default" && DirExist(WorkspaceBaseDir "\" name)) {
        try DirDelete(WorkspaceBaseDir "\" name, 1)
        return true
    }
    return false
}

AHK_RestartWorkspace(name) {
    Run(A_ScriptFullPath " --workspace " name)
    ExitApp()
}

AHK_SaveData(filename, data) {
    global WorkspaceDir, MainGuis
    filepath := WorkspaceDir "\" filename
    if FileExist(filepath)
        FileDelete(filepath)
    FileAppend(data, filepath, "UTF-8")
    
    if (filename == "downloads_loc.txt" && IsSet(MainGuis) && DirExist(data)) {
        for wid, g in MainGuis {
            try g.Control.BrowseFolder(data, "downloads.localhost")
        }
    }
}

AHK_LoadData(filename) {
    global WorkspaceDir
    filepath := WorkspaceDir "\" filename
    return FileExist(filepath) ? FileRead(filepath, "UTF-8") : ""
}

AHK_DeleteData(filename) {
    global WorkspaceDir
    filepath := WorkspaceDir "\" filename
    if FileExist(filepath) {
        try FileDelete(filepath)
        return true
    }
    return false
}

AHK_GetAboutConfig(*) {
    global WorkspaceDir
    filepath := WorkspaceDir "\about_config.json"
    return FileExist(filepath) ? FileRead(filepath, "UTF-8") : "{}"
}

AHK_SetAboutConfig(jsonStr) {
    global WorkspaceDir
    filepath := WorkspaceDir "\about_config.json"
    if FileExist(filepath)
        FileDelete(filepath)
    FileAppend(jsonStr, filepath, "UTF-8")
    return true
}

AHK_CacheSet(key, data) {
    global WorkspaceDir
    if !DirExist(WorkspaceDir "\cache")
        DirCreate(WorkspaceDir "\cache")
    filepath := WorkspaceDir "\cache\" key ".txt"
    if FileExist(filepath)
        FileDelete(filepath)
    try FileAppend(data, filepath, "UTF-8")
    return true
}

AHK_CacheGet(key) {
    global WorkspaceDir
    filepath := WorkspaceDir "\cache\" key ".txt"
    return FileExist(filepath) ? FileRead(filepath, "UTF-8") : ""
}

AHK_CacheClear(*) {
    global WorkspaceDir
    if !DirExist(WorkspaceDir "\cache")
        return true
    try DirDelete(WorkspaceDir "\cache", true)
    return true
}

AHK_ListSites(*) {
    global WorkspaceDir
    if !DirExist(WorkspaceDir "\sites")
        DirCreate(WorkspaceDir "\sites")
    fileList := ""
    Loop Files, WorkspaceDir "\sites\*.json"
        fileList .= A_LoopFileName "|"
    return RTrim(fileList, "|")
}

AHK_ListInterfaces(*) {
    global WorkspaceDir
    if !DirExist(WorkspaceDir "\interfaces")
        DirCreate(WorkspaceDir "\interfaces")
    folderList := ""
    Loop Files, WorkspaceDir "\interfaces\*", "D"
        folderList .= A_LoopFileName "|"
    return RTrim(folderList, "|")
}

AHK_SaveSite(filename, data) {
    global WorkspaceDir
    if !DirExist(WorkspaceDir "\sites")
        DirCreate(WorkspaceDir "\sites")
    filepath := WorkspaceDir "\sites\" filename
    if FileExist(filepath)
        FileDelete(filepath)
    FileAppend(data, filepath, "UTF-8")
    return true
}

AHK_LoadSite(filename) {
    global WorkspaceDir
    filepath := WorkspaceDir "\sites\" filename
    return FileExist(filepath) ? FileRead(filepath, "UTF-8") : ""
}

AHK_DeleteSite(filename) {
    global WorkspaceDir
    filepath := WorkspaceDir "\sites\" filename
    if FileExist(filepath)
        FileDelete(filepath)
    return true
}

AHK_ListScripts(*) {
    global WorkspaceDir
    if !DirExist(WorkspaceDir "\scripts")
        DirCreate(WorkspaceDir "\scripts")
    fileList := ""
    Loop Files, WorkspaceDir "\scripts\*.json"
        fileList .= A_LoopFileName "|"
    return RTrim(fileList, "|")
}

AHK_SaveScript(filename, data) {
    global WorkspaceDir
    if !DirExist(WorkspaceDir "\scripts")
        DirCreate(WorkspaceDir "\scripts")
    filepath := WorkspaceDir "\scripts\" filename
    if FileExist(filepath)
        FileDelete(filepath)
    FileAppend(data, filepath, "UTF-8")
    return true
}

AHK_LoadScript(filename) {
    global WorkspaceDir
    filepath := WorkspaceDir "\scripts\" filename
    return FileExist(filepath) ? FileRead(filepath, "UTF-8") : ""
}

AHK_DeleteScript(filename) {
    global WorkspaceDir
    filepath := WorkspaceDir "\scripts\" filename
    if FileExist(filepath)
        FileDelete(filepath)
    return true
}

AHK_ListFlows(*) {
    global WorkspaceDir
    if !DirExist(WorkspaceDir "\flows")
        DirCreate(WorkspaceDir "\flows")
    fileList := ""
    Loop Files, WorkspaceDir "\flows\*.json"
        fileList .= A_LoopFileName "|"
    return RTrim(fileList, "|")
}

AHK_SaveFlow(filename, data) {
    global WorkspaceDir
    if !DirExist(WorkspaceDir "\flows")
        DirCreate(WorkspaceDir "\flows")
    filepath := WorkspaceDir "\flows\" filename
    if FileExist(filepath)
        FileDelete(filepath)
    FileAppend(data, filepath, "UTF-8")
    return true
}

AHK_LoadFlow(filename) {
    global WorkspaceDir
    filepath := WorkspaceDir "\flows\" filename
    return FileExist(filepath) ? FileRead(filepath, "UTF-8") : ""
}

AHK_DeleteFlow(filename) {
    global WorkspaceDir
    filepath := WorkspaceDir "\flows\" filename
    if FileExist(filepath)
        FileDelete(filepath)
    return true
}

AHK_GetStorageMode(*) {
    iniPath := A_ScriptDir "\config.ini"
    if FileExist(iniPath) {
        try return IniRead(iniPath, "Storage", "PortableMode", 1)
    }
    return 1
}

AHK_SetStorageMode(isPortable) {
    global CurrentWorkspace
    iniPath := A_ScriptDir "\config.ini"
    IniWrite(isPortable ? 1 : 0, iniPath, "Storage", "PortableMode")
    Run(A_ScriptFullPath " --workspace " CurrentWorkspace)
    ExitApp()
}

AHK_GetStoragePath(*) {
    iniPath := A_ScriptDir "\config.ini"
    if FileExist(iniPath) {
        try return IniRead(iniPath, "Storage", "InstalledDataPath", "")
    }
    return ""
}

AHK_SetStoragePath(path) {
    iniPath := A_ScriptDir "\config.ini"
    IniWrite(path, iniPath, "Storage", "InstalledDataPath")
    return true
}

AHK_MigrateStorage(newPortableMode, newLocationPath) {
    global CurrentWorkspace, WorkspaceBaseDir
    iniPath := A_ScriptDir "\config.ini"
    
    oldBaseDir := WorkspaceBaseDir
    newBaseDir := ""
    
    newPortableMode := (newPortableMode == 1 || newPortableMode == "1" || newPortableMode == true)
    
    if (newPortableMode) {
        newBaseDir := A_ScriptDir "\settings\workspaces"
    } else {
        newBaseDir := newLocationPath != "" ? newLocationPath : EnvGet("LOCALAPPDATA") "\BingeKit\workspaces"
    }
    
    if (oldBaseDir != newBaseDir && DirExist(oldBaseDir)) {
        if (!DirExist(newBaseDir)) {
            try DirCreate(newBaseDir)
        }
        try {
            DirMove(oldBaseDir, newBaseDir, 2)
        } catch {
            try {
                DirCopy(oldBaseDir, newBaseDir, 1)
                DirDelete(oldBaseDir, 1)
            }
        }
    }
    
    IniWrite(newPortableMode ? 1 : 0, iniPath, "Storage", "PortableMode")
    IniWrite(newLocationPath, iniPath, "Storage", "InstalledDataPath")
    Run(A_ScriptFullPath " --workspace " CurrentWorkspace)
    ExitApp()
}
