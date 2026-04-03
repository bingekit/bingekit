// --- AHK WebView2 Interop Helper ---
export const ahk = {
  call: (method: string, ...args: any[]) => {
    try {
      // @ts-ignore
      const hostObj = window.chrome?.webview?.hostObjects?.sync?.ahk;
      if (hostObj && hostObj[method] !== undefined) {
        return hostObj[method](...args);
      }
    } catch (e) {
      console.warn(`AHK Interop not available for ${method}`, e);
    }
    return null;
  },
  asyncCall: async (method: string, ...args: any[]) => {
    try {
      // @ts-ignore
      const hostObj = window.chrome?.webview?.hostObjects?.ahk;
      if (hostObj && hostObj[method] !== undefined) {
        return await hostObj[method](...args);
      }
    } catch (e) {
      console.warn(`AHK Async Interop not available for ${method}`, e);
    }
    return null;
  }
};
