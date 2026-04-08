;! VERSION
BINGEKIT_Version := "0.0.1"
;@Ahk2Exe-Obey U_V, = "%A_PriorLine~U)^(.+")(.*)".*$~$2%" ? "SetVersion" : "Nop"
;@Ahk2Exe-%U_V%        %A_PriorLine~U)^(.+")(.*)".*$~$2%

;! WEBVIEW RESOURCES
;@Ahk2Exe-AddResource Lib\32bit\WebView2Loader.dll, 32bit\WebView2Loader.dll
;@Ahk2Exe-AddResource Lib\64bit\WebView2Loader.dll, 64bit\WebView2Loader.dll
;@Ahk2Exe-SetMainIcon playlogo.ico

;! RESOURCES
;@Ahk2Exe-AddResource gui\index.html, gui\index.html
;@Ahk2Exe-AddResource js\adblock.js, js\adblock.js
;@Ahk2Exe-AddResource js\global.js, js\global.js
