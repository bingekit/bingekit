DPAPIProtect(plaintext) {
    if (plaintext = "")
        return ""
    
    ; Create a buffer for the plaintext string (UTF-16)
    bufSize := StrPut(plaintext, "UTF-16")
    msgBuffer := Buffer(bufSize, 0)
    StrPut(plaintext, msgBuffer, "UTF-16")
    
    ; Setup DATA_BLOB for input
    dataIn := Buffer(16, 0)
    NumPut("UInt", msgBuffer.Size, dataIn, 0)
    NumPut("Ptr", msgBuffer.Ptr, dataIn, A_PtrSize)
    
    ; Setup DATA_BLOB for output
    dataOut := Buffer(16, 0)
    
    ; CRYPTPROTECT_UI_FORBIDDEN = 0x1
    if !DllCall("Crypt32.dll\CryptProtectData", "Ptr", dataIn, "Ptr", 0, "Ptr", 0, "Ptr", 0, "Ptr", 0, "UInt", 1, "Ptr", dataOut)
        return ""
    
    outPtr := NumGet(dataOut, A_PtrSize, "Ptr")
    outSize := NumGet(dataOut, 0, "UInt")
    
    ; Convert to Base64 using CryptBinaryToString
    ; CRYPT_STRING_BASE64 = 0x00000001
    ; CRYPT_STRING_NOCRLF = 0x40000000
    b64Size := 0
    DllCall("Crypt32.dll\CryptBinaryToStringW", "Ptr", outPtr, "UInt", outSize, "UInt", 0x40000001, "Ptr", 0, "UInt*", &b64Size)
    
    b64Buf := Buffer(b64Size * 2, 0)
    DllCall("Crypt32.dll\CryptBinaryToStringW", "Ptr", outPtr, "UInt", outSize, "UInt", 0x40000001, "Ptr", b64Buf, "UInt*", &b64Size)
    
    DllCall("Kernel32.dll\LocalFree", "Ptr", outPtr)
    
    return StrGet(b64Buf, "UTF-16")
}

DPAPIUnprotect(b64String) {
    if (b64String = "")
        return ""
    
    ; Convert Base64 to binary
    binSize := 0
    DllCall("Crypt32.dll\CryptStringToBinaryW", "Str", b64String, "UInt", StrLen(b64String), "UInt", 0x1, "Ptr", 0, "UInt*", &binSize, "Ptr", 0, "Ptr", 0)
    
    binBuf := Buffer(binSize, 0)
    DllCall("Crypt32.dll\CryptStringToBinaryW", "Str", b64String, "UInt", StrLen(b64String), "UInt", 0x1, "Ptr", binBuf, "UInt*", &binSize, "Ptr", 0, "Ptr", 0)
    
    ; Setup DATA_BLOB for input
    dataIn := Buffer(16, 0)
    NumPut("UInt", binSize, dataIn, 0)
    NumPut("Ptr", binBuf.Ptr, dataIn, A_PtrSize)
    
    ; Setup DATA_BLOB for output
    dataOut := Buffer(16, 0)
    
    if !DllCall("Crypt32.dll\CryptUnprotectData", "Ptr", dataIn, "Ptr", 0, "Ptr", 0, "Ptr", 0, "Ptr", 0, "UInt", 1, "Ptr", dataOut)
        return ""
    
    outPtr := NumGet(dataOut, A_PtrSize, "Ptr")
    
    decryptedStr := StrGet(outPtr, "UTF-16")
    
    DllCall("Kernel32.dll\LocalFree", "Ptr", outPtr)
    
    return decryptedStr
}
