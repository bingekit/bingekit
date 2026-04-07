#Requires AutoHotkey v2.0

#Include src\setup_env.ahk
#Include src\const.ahk

#Include src\Splash.ahk

#Include Lib\WebViewToo.ahk
#Include Lib\Promise.ahk
#Include Lib\JSON.ahk

; 1. Settings Loading/Saving/Parsing
#Include src\Config.ahk
#Include src\appHash.ahk
LoadAppConfig()
InitWorkspaces()
InitSplashGui()

; 2. Environment (WebView2 Settings, Splash/Main UI Init)
#Include src\Env.ahk
InitEnvironment()

#Include src\App.ahk
CreateAppWindow("main")

#Include src\Crypto.ahk

#Include src\FNS.ahk
#Include src\Toasts.ahk

; 3. Core App Sections
#Include src\Api.ahk
#Include src\Fetcher.ahk
#Include src\Player.ahk
#Include src\Downloads.ahk
#Include src\Updater.ahk

; Enable Window Message hooks for custom titlebar dragging & PiP
#Include src\MoveSize.ahk

; 4. Interop Setup: Expose AHK functions to the WebView (JavaScript)
#Include src\api_expose.ahk
BindApiToWindow(WVs["main"], "main")

#Include src\Startup.ahk

#Include src\Hotkeys.ahk

#Include src\build_exe.ahk