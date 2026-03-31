FN_MonitorGetPrimary() {
    return MonitorGetPrimary()
}
FN_MonitorGetCount() {
    return MonitorGetCount()
}
FN_MonitorGet(i) {
    MonitorGet i, &L, &T, &R, &B
    return JSON.stringify({
        left: L,
        top: T,
        right: R,
        bottom: B,
    })
}
FN_MonitorGetWorkingJSON(i) {
    MonitorGetWorkArea i, &L, &T, &R, &B
    return JSON.stringify({
        left: L,
        top: T,
        right: R,
        bottom: B,
        height: B - T,
        width: R - L,
    })
}
FN_MonitorGetWorking(i) {
    MonitorGetWorkArea i, &L, &T, &R, &B
    return {
        left: L,
        top: T,
        right: R,
        bottom: B,
        height: B - T,
        width: R - L,
    }
}