import { ahk } from './ahk';

// --- Smart Fetch Promise Bridge ---
declare global {
  interface Window {
    _fetchPromises: Record<string, { resolve: Function, reject: Function }>;
    resolveSmartFetch: (id: string, result: any) => void;
    resolveSmartFetchError: (id: string, error: any) => void;
    SmartFetch: (url: string, jsSelectors: string, botCheckJs?: string, timeoutMs?: number) => Promise<any>;
    RawParseFetch: (url: string, jsSelectors: string) => Promise<any>;
    RunPluginFunction: (pluginId: string, functionName: string, ...args: any[]) => Promise<any>;
  }
}

window._fetchPromises = window._fetchPromises || {};

window.resolveSmartFetch = (id: string, result: any) => {
  if (window._fetchPromises[id]) {
    window._fetchPromises[id].resolve(result);
    delete window._fetchPromises[id];
  }
};

window.resolveSmartFetchError = (id: string, error: any) => {
  if (window._fetchPromises[id]) {
    window._fetchPromises[id].reject(error);
    delete window._fetchPromises[id];
  }
};

window.SmartFetch = (url: string, jsSelectors: string, botCheckJs: string = "", timeoutMs: number = 60000) => {
  return new Promise((resolve, reject) => {
    const id = Date.now().toString() + Math.random().toString().slice(2);
    
    const timeout = setTimeout(() => {
        if (window._fetchPromises[id]) {
            console.error(`[SmartFetch] Master Timeout (${timeoutMs}ms) Exceeded: ${url}`);
            window._fetchPromises[id].reject(new Error(`SmartFetch Timeout (${timeoutMs}ms) Exceeded`));
            delete window._fetchPromises[id];
        }
    }, timeoutMs);

    window._fetchPromises[id] = { 
        resolve: (v: any) => { clearTimeout(timeout); resolve(v); }, 
        reject: (e: any) => { clearTimeout(timeout); reject(e); }
    };
    ahk.asyncCall('StartSmartFetch', url, jsSelectors, id, botCheckJs);
  });
};

window.RawParseFetch = (url: string, jsSelectors: string) => {
  return new Promise((resolve, reject) => {
    const id = Date.now().toString() + Math.random().toString().slice(2);
    
    const timeout = setTimeout(() => {
        if (window._fetchPromises[id]) {
            console.error(`[RawParseFetch] Master Timeout (60s) Exceeded: ${url}`);
            window._fetchPromises[id].reject(new Error("RawParseFetch Timeout (60s) Exceeded"));
            delete window._fetchPromises[id];
        }
    }, 60000);

    window._fetchPromises[id] = { 
        resolve: (v: any) => { clearTimeout(timeout); resolve(v); }, 
        reject: (e: any) => { clearTimeout(timeout); reject(e); } 
    };
    ahk.asyncCall('StartRawFetchParse', url, jsSelectors, id);
  });
};
