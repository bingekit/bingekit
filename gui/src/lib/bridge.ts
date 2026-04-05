import { ahk } from './ahk';

// --- Smart Fetch Promise Bridge ---
declare global {
  interface Window {
    _fetchPromises: Record<string, { resolve: Function, reject: Function }>;
    resolveSmartFetch: (id: string, result: any) => void;
    resolveSmartFetchError: (id: string, error: any) => void;
    SmartFetch: (url: string, jsSelectors: string, botCheckJs?: string) => Promise<any>;
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

window.SmartFetch = (url: string, jsSelectors: string, botCheckJs: string = "") => {
  return new Promise((resolve, reject) => {
    const id = Date.now().toString() + Math.random().toString().slice(2);
    window._fetchPromises[id] = { resolve, reject };
    ahk.call('StartSmartFetch', url, jsSelectors, id, botCheckJs);
  });
};

window.RawParseFetch = (url: string, jsSelectors: string) => {
  return new Promise((resolve, reject) => {
    const id = Date.now().toString() + Math.random().toString().slice(2);
    window._fetchPromises[id] = { resolve, reject };
    ahk.call('StartRawFetchParse', url, jsSelectors, id);
  });
};
