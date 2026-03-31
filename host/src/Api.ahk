global GlobalScript := FileRead("js/global.js", "UTF-8")
global AdblockScript := FileRead("js/adblock.js", "UTF-8")
global UserscriptsScript := ""

AHK_Minimize(*) {
    global MainGui
    MainGui.Minimize()
}

AHK_Maximize(*) {
    global MainGui
    if (WinGetMinMax(MainGui.Hwnd) = 1)
        WinRestore(MainGui.Hwnd)
    else
        WinMaximize(MainGui.Hwnd)
}

AHK_Close(*) {
    ExitApp()
}

AHK_HideSplash(*) {
    global SplashGui, MainGui
    if (SplashGui) {
        SplashGui.Destroy()
        SplashGui := ""
        MainGui.Show("w1280 h800 center")
        MainGui.Opt("+MinSize850x450")
        WinSetTransparent(255, MainGui.Hwnd)
    }
}

AHK_ExecuteSearch(query, engine) {
    Run(engine . query)
}

AHK_InjectJS(js) {
    global WV, PlayerWV, PlayerGui
    WV.ExecuteScript(js, 0)
    if (PlayerGui && PlayerWV) {
        PlayerWV.wv.ExecuteScript(js, 0)
    }
}

AHK_EvalPlayerJS(js) {
    global PlayerWV, PlayerGui
    if (PlayerGui && PlayerWV) {
        return PlayerWV.ExecuteScript(js)
    }
    return ""
}

AHK_UpdateUserscriptPayload(js) {
    global UserscriptsScript, PlayerWV, PlayerGui
    UserscriptsScript := js
    if (PlayerGui && PlayerWV) {
        PlayerWV.wv.ExecuteScript(js, 0)
    }
}

AHK_GetUserscriptPayload() {
    global UserscriptsScript
    return UserscriptsScript
}

AHK_ShowTooltip(text) {
    if (text) {
        ToolTip(text)
    }
}

AHK_HideTooltip(*) {
    ToolTip()
}
