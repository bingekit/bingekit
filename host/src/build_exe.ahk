;! VERSION
BINGEKIT_Version := "0.1.0.A"
;@Ahk2Exe-Obey U_V, = "%A_PriorLine~U)^(.+")(.*)".*$~$2%" ? "SetVersion" : "Nop"
;@Ahk2Exe-%U_V%        %A_PriorLine~U)^(.+")(.*)".*$~$2%

;! WEBVIEW RESOURCES
;@Ahk2Exe-AddResource Lib\wv2.32.dll, wv2.32.dll
;@Ahk2Exe-AddResource Lib\wv2.64.dll, wv2.64.dll
;;@Ahk2Exe-SetMainIcon favicon.ico

;! RESOURCES
;@Ahk2Exe-AddResource gui\index.html, gui\index.html
;@Ahk2Exe-AddResource js\adblock.js, js\adblock.js
;@Ahk2Exe-AddResource js\global.js, js\global.js
