#Requires AutoHotkey v2.0
#Include Lib\WebViewToo.ahk
#Include Lib\Promise.ahk
#SingleInstance Force

; 1. Settings Loading/Saving/Parsing
#Include src\Config.ahk
LoadAppConfig()
InitWorkspaces()

; 2. Environment (WebView2 Settings, Splash/Main UI Init)
#Include src\Env.ahk
InitEnvironment()

; 3. Core App Sections
#Include src\Api.ahk
#Include src\Fetcher.ahk
#Include src\Player.ahk

; Enable Window Message hooks for custom titlebar dragging & PiP
OnMessage(0x0003, AHK_OnMove) ; WM_MOVE
OnMessage(0x0005, AHK_OnMove) ; WM_SIZE
OnMessage(0x0084, WM_NCHITTEST)

AHK_OnMove(wParam, lParam, msg, hwnd) {
    global MainGui, PlayerGui, PlayerWV, PlayerRectX, PlayerRectY, PlayerRectW, PlayerRectH
    if (IsSet(MainGui) && hwnd == MainGui.Hwnd && IsSet(PlayerGui) && PlayerGui) {
        if (PlayerWV.wvc.IsVisible) {
            WinGetClientPos(&CX, &CY, , , MainGui.Hwnd)
            PlayerGui.Move(CX + PlayerRectX, CY + PlayerRectY, PlayerRectW, PlayerRectH)
        }
    }
}

WM_NCHITTEST(wParam, lParam, msg, hwnd) {
    ; Basic drag implementation if needed
}

; 4. Interop Setup: Expose AHK functions to the WebView (JavaScript)
WV.AddHostObjectToScript("ahk", {
    HideSplash: AHK_HideSplash,
    PlayerGoBack: AHK_PlayerGoBack,
    PlayerGoForward: AHK_PlayerGoForward,
    PlayerReload: AHK_PlayerReload,
    ShowTooltip: AHK_ShowTooltip,
    HideTooltip: AHK_HideTooltip,
    Minimize: AHK_Minimize,
    Maximize: AHK_Maximize,
    Close: AHK_Close,
    SaveData: AHK_SaveData,
    LoadData: AHK_LoadData,
    CacheSet: AHK_CacheSet,
    CacheGet: AHK_CacheGet,
    CacheClear: AHK_CacheClear,
    ListSites: AHK_ListSites,
    SaveSite: AHK_SaveSite,
    LoadSite: AHK_LoadSite,
    DeleteSite: AHK_DeleteSite,
    RawFetchHTML: AHK_RawFetchHTML,
    ExecuteSearch: AHK_ExecuteSearch,
    InjectJS: AHK_InjectJS,
    EvalPlayerJS: AHK_EvalPlayerJS,
    UpdatePlayerRect: AHK_UpdatePlayerRect,
    UpdatePlayerUrl: AHK_UpdatePlayerUrl,
    UpdateURL: AHK_UpdateURL,
    UpdateUserscriptPayload: AHK_UpdateUserscriptPayload,
    GetUserscriptPayload: AHK_GetUserscriptPayload,
    UpdateNetworkFilters: AHK_UpdateNetworkFilters,
    AddNetworkFilter: AHK_AddNetworkFilter,
    UpdateAdblockStatus: AHK_UpdateAdblockStatus,
    UpdateSiteBlockers: AHK_UpdateSiteBlockers,
    ListScripts: AHK_ListScripts,
    SaveScript: AHK_SaveScript,
    LoadScript: AHK_LoadScript,
    DeleteScript: AHK_DeleteScript,
    ListFlows: AHK_ListFlows,
    SaveFlow: AHK_SaveFlow,
    LoadFlow: AHK_LoadFlow,
    DeleteFlow: AHK_DeleteFlow,
    StartSmartFetch: AHK_StartSmartFetch,
    StartRawFetchParse: AHK_StartRawFetchParse,
    ListWorkspaces: AHK_ListWorkspaces,
    CreateWorkspace: AHK_CreateWorkspace,
    CloneWorkspace: AHK_CloneWorkspace,
    DeleteWorkspace: AHK_DeleteWorkspace,
    RestartWorkspace: AHK_RestartWorkspace,
    GetCurrentWorkspace: AHK_GetCurrentWorkspace
})

; Error handling / Splash loading checks
MainNavigationCompletedHandler(sender, args) {
    global SplashGui
    if (!args.IsSuccess && SplashGui) {
        errStatus := "Unknown Error: " args.WebErrorStatus
        if (args.WebErrorStatus != 9) {
            SplashGui.Destroy()
            SplashGui := ""
            MsgBox("Critical Error: StreamView UI failed to load the interface.`n`nError Code: " errStatus "`n`nTroubleshooting:`n- If running from source, ensure the React dev server (" AppStartupUrl ") is active.`n- If compiled, check local bundle integrity.", "StreamView Navigation Error", 16)
            ExitApp()
        }
    }
}
WV.add_NavigationCompleted(MainNavigationCompletedHandler)

CheckSplashTimeout() {
    global SplashGui
    if (SplashGui) {
        SplashGui.Destroy()
        SplashGui := ""
        MsgBox("Critical Error: StreamView UI did not respond within 15 seconds.`n`nThis usually indicates the frontend development server/URL is not available. Please verify the URL.", "StreamView Timeout", 16)
        ExitApp()
    }
}
SetTimer(CheckSplashTimeout, -15000)

; Display logic
WV.Navigate(AppStartupUrl)

MainGui.Show("w0 h0 x0 y0") ; Defer showing until Splash is hidden
WinSetTransparent(0, MainGui.Hwnd)

; PiP mode hotkey handler
#Up::
{
    global MainGui, PlayerGui, PlayerWV
    WinMaximize("ahk_id " MainGui.Hwnd)
    ;activeWindow := WinGetID("A")
    ;if (IsSet(PlayerGui) && (activeWindow == PlayerGui.Hwnd || activeWindow == MainGui.Hwnd)) {
    ;    WinMaximize("ahk_id " MainGui.Hwnd)
    ;}
}
#Down::
{
    global MainGui, PlayerGui, PlayerWV
    WinMinimize("ahk_id " MainGui.Hwnd)
    ;activeWindow := WinGetID("A")
    ;if (IsSet(PlayerGui) && (activeWindow == PlayerGui.Hwnd || activeWindow == MainGui.Hwnd)) {
    ;    WinMinimize("ahk_id " MainGui.Hwnd)
    ;}
}
; #Down::
; {
;     global MainGui, PlayerGui, PlayerWV
;     activeWindow := WinGetID("A")
;     if (IsSet(MainGui) && activeWindow == MainGui.Hwnd) {
;         WinMinimize("ahk_id " MainGui.Hwnd)
;     } else if (IsSet(PlayerGui) && activeWindow == PlayerGui.Hwnd) {
;         ; PiP mode
;         WinSetAlwaysOnTop(1, "ahk_id " PlayerGui.Hwnd)
;         w := 400
;         h := 225
;         x := A_ScreenWidth - w - 20
;         y := A_ScreenHeight - h - 60
;         PlayerGui.Move(x, y, w, h)
;         if (PlayerWV.wvc.IsVisible) {
;             PlayerWV.Move(0, 0, w, h)
;         }
;     }
; }
