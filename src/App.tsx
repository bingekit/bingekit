/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Search, Bookmark, Settings, Minus, Square, X,
  ChevronLeft, ChevronRight, RotateCw, Film, Tv,
  Play, LayoutGrid, Shield, ShieldOff, Plus,
  Puzzle, Save, Trash2, Download, Upload, KeyRound,
  Code, ListTree, MonitorPlay, Activity, RefreshCw, Bell,
  Compass, Zap, Clock, Folder, Lock, EyeOff, Eye, Globe
} from 'lucide-react';

import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/themes/prism-tomorrow.css';

// --- Types ---
interface BookmarkItem {
  id: string;
  title: string;
  url: string;
  icon?: string;
  tags?: string[];
  folder?: string;
}

interface WatchLaterItem {
  id: string;
  title: string;
  url: string;
  addedAt: number;
}

interface CredentialItem {
  id: string;
  domain: string;
  username: string;
  passwordBase64: string;
}

interface FollowedItem {
  id: string;
  title: string;
  url: string;
  siteId: string;
  type: 'tv' | 'film';
  knownCount: number;
  hasUpdate: boolean;
  imgUrl?: string;
}

interface FlowStep {
  id: string;
  type: 'RawFetchHTML' | 'parseHtml' | 'pluginAction' | 'navigate' | 'extract' | 'inject' | 'callFlow' | 'callPlugin';
  params: Record<string, any>;
}

interface CustomFlow {
  id: string;
  name: string;
  description: string;
  variables?: string[];
  steps: FlowStep[];
}

interface Userscript {
  id: string;
  name: string;
  domains: string[];
  code: string;
  enabled: boolean;
}

interface SitePlugin {
  id: string;
  name: string;
  baseUrl: string;
  auth: {
    loginUrl: string;
    userSel: string;
    passSel: string;
    submitSel: string;
    usernameValue: string;
    passwordValue: string;
    encryptCreds: boolean;
  };
  search: {
    urlFormat: string;
    itemSel: string;
    titleSel: string;
    linkSel: string;
    imgSel: string;
    yearSel: string;
    typeSel: string;
  };
  details: {
    titleSel: string;
    descSel: string;
    castSel: string;
    ratingSel: string;
    posterSel: string;
    similarSel: string;
  };
  media: {
    seasonSel: string;
    epSel: string;
  };
  player: {
    playerSel: string;
    focusCss: string;
  };
  tags?: string[];
  customFunctions: {
    name: string;
    description: string;
    code: string;
  }[];
  customCss?: string;
  customJs?: string;
}

const DEFAULT_PLUGIN: SitePlugin = {
  id: '',
  name: 'New Site Plugin',
  baseUrl: 'https://',
  auth: { loginUrl: '', userSel: '', passSel: '', submitSel: '', usernameValue: '', passwordValue: '', encryptCreds: true },
  search: { urlFormat: '', itemSel: '', titleSel: '', linkSel: '', imgSel: '', yearSel: '', typeSel: '' },
  details: { titleSel: '', descSel: '', castSel: '', ratingSel: '', posterSel: '', similarSel: '' },
  media: { seasonSel: '', epSel: '' },
  player: { playerSel: '', focusCss: 'position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: 9999; background: #000;' },
  tags: [],
  customFunctions: [],
  customCss: '',
  customJs: ''
};

// --- AHK WebView2 Interop Helper ---
const ahk = {
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
  }
};

// --- Smart Fetch Promise Bridge ---
declare global {
  interface Window {
    _fetchPromises: Record<string, {resolve: Function, reject: Function}>;
    resolveSmartFetch: (id: string, result: any) => void;
    resolveSmartFetchError: (id: string, error: any) => void;
    SmartFetch: (url: string, jsSelectors: string) => Promise<any>;
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

window.SmartFetch = (url: string, jsSelectors: string) => {
  return new Promise((resolve, reject) => {
    const id = Date.now().toString() + Math.random().toString().slice(2);
    window._fetchPromises[id] = { resolve, reject };
    ahk.call('StartSmartFetch', url, jsSelectors, id);
  });
};

window.RawParseFetch = (url: string, jsSelectors: string) => {
  return new Promise((resolve, reject) => {
    const id = Date.now().toString() + Math.random().toString().slice(2);
    window._fetchPromises[id] = { resolve, reject };
    ahk.call('StartRawFetchParse', url, jsSelectors, id);
  });
};

const CustomCheckbox = ({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) => (
  <button
    type="button"
    onClick={(e) => { e.stopPropagation(); onChange(!checked); }}
    className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${checked ? 'bg-indigo-500 border-indigo-500 text-white' : 'bg-zinc-900 border-zinc-700 hover:border-zinc-500'}`}
  >
    {checked && <svg viewBox="0 0 14 14" fill="none" className="w-3 h-3 stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7l3 3 5-5" /></svg>}
  </button>
);

const TagsInput = ({ tags = [], onChange }: { tags: string[], onChange: (tags: string[]) => void }) => {
  const [input, setInput] = useState('');

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = input.trim().replace(/^,|,$/g, '');
      if (val && !tags.includes(val)) {
        onChange([...tags, val]);
      }
      setInput('');
    } else if (e.key === 'Backspace' && !input && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5 w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 focus-within:border-indigo-500 transition-colors cursor-text min-h-[38px]" onClick={(e) => (e.currentTarget.querySelector('input') as HTMLInputElement)?.focus()}>
      {tags.map((tag, i) => (
        <span key={i} className="flex items-center gap-1 bg-zinc-800 text-zinc-300 text-xs px-2 py-0.5 rounded-md">
          {tag}
          <button type="button" onClick={() => onChange(tags.filter((_, idx) => idx !== i))} className="hover:text-red-400">
            <X size={12} />
          </button>
        </span>
      ))}
      <input
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={tags.length === 0 ? "Enter tags..." : ""}
        className="flex-1 min-w-[80px] bg-transparent border-none text-sm text-zinc-200 outline-none p-0 focus:ring-0"
      />
    </div>
  );
};

const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl relative flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-zinc-800/50">
          <h2 className="text-lg font-medium text-zinc-100">{title}</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-200 transition-colors p-1 rounded-lg hover:bg-zinc-800"><X size={18} /></button>
        </div>
        <div className="p-5 overflow-y-auto no-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [url, setUrl] = useState('https://example.com/stream');
  const [inputUrl, setInputUrl] = useState(url);
  const [isAdblockEnabled, setIsAdblockEnabled] = useState(true);
  const [isSimpleUrlBar, setIsSimpleUrlBar] = useState(false);
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [selectedBookmarks, setSelectedBookmarks] = useState<string[]>([]);
  const [followedItems, setFollowedItems] = useState<FollowedItem[]>([]);
  const [isCheckingUpdates, setIsCheckingUpdates] = useState(false);
  const [plugins, setPlugins] = useState<SitePlugin[]>([]);
  const [editingPlugin, setEditingPlugin] = useState<SitePlugin | null>(null);
  const [testSearchUrl, setTestSearchUrl] = useState('');
  const [testSearchResults, setTestSearchResults] = useState<{status: string, nodesCount: number, results: any[]}>({status: 'idle', nodesCount: 0, results: []});
  const [isTestingSearch, setIsTestingSearch] = useState(false);
  const [flows, setFlows] = useState<CustomFlow[]>([]);
  const [editingFlow, setEditingFlow] = useState<CustomFlow | null>(null);
  const [userscripts, setUserscripts] = useState<Userscript[]>([]);
  const [editingUserscriptId, setEditingUserscriptId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'player' | 'bookmarks' | 'watchlater' | 'plugins' | 'activity' | 'settings' | 'flows' | 'userscripts'>('dashboard');
  const [multiSearchQuery, setMultiSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [watchLater, setWatchLater] = useState<WatchLaterItem[]>([]);
  const [credentials, setCredentials] = useState<CredentialItem[]>([]);
  const [newCred, setNewCred] = useState({ domain: '', username: '', password: '' });
  const [bookmarkSearchQuery, setBookmarkSearchQuery] = useState('');
  const [editingBookmarkId, setEditingBookmarkId] = useState<string | null>(null);
  const [showCredModal, setShowCredModal] = useState(false);
  const [searchParamMode, setSearchParamMode] = useState<'navigate' | 'fetch'>('navigate');
  const [isQuickOptionsHidden, setIsQuickOptionsHidden] = useState(true);
  const playerRef = useRef<HTMLDivElement>(null);
  const lastRectRef = useRef('');
  const lastSyncUrl = useRef<string | null>(null);

  // Sync player dimensions with AHK child GUI
  useEffect(() => {
    if (activeTab === 'player' && playerRef.current) {
      const observer = new ResizeObserver(() => {
        if (playerRef.current) {
          const rect = playerRef.current.getBoundingClientRect();
          const rectStr = `${Math.round(rect.left)},${Math.round(rect.top)},${Math.round(rect.width)},${Math.round(rect.height)}`;
          if (lastRectRef.current !== rectStr) {
            lastRectRef.current = rectStr;
            ahk.call('UpdatePlayerRect', Math.round(rect.left), Math.round(rect.top), Math.round(rect.width), Math.round(rect.height), true);
          }
        }
      });
      observer.observe(playerRef.current);

      const rect = playerRef.current.getBoundingClientRect();
      const rectStr = `${Math.round(rect.left)},${Math.round(rect.top)},${Math.round(rect.width)},${Math.round(rect.height)}`;
      lastRectRef.current = rectStr;
      ahk.call('UpdatePlayerRect', Math.round(rect.left), Math.round(rect.top), Math.round(rect.width), Math.round(rect.height), true);

      return () => {
        observer.disconnect();
        lastRectRef.current = '';
        ahk.call('UpdatePlayerRect', 0, 0, 0, 0, false);
      };
    } else if (activeTab !== 'player') {
      lastRectRef.current = '';
      ahk.call('UpdatePlayerRect', 0, 0, 0, 0, false);
    }
  }, [activeTab]);

  // Sync the URL when the user changes it or opens the player tab
  useEffect(() => {
    if (activeTab === 'player') {
      if (lastSyncUrl.current !== url) {
        lastSyncUrl.current = url;
        ahk.call('UpdatePlayerUrl', url);
      }
    }
  }, [activeTab, url]);

  // Listen for url updates from AHK
  useEffect(() => {
    const handleEvent = (e: any) => {
      if (e.detail && e.detail.url) {
        lastSyncUrl.current = e.detail.url;
        setUrl(e.detail.url);
        setInputUrl(e.detail.url);
      }
    };
    window.addEventListener('player-url-changed', handleEvent);
    return () => window.removeEventListener('player-url-changed', handleEvent);
  }, []);

  // Expose RunPluginFunction globally linked to current plugins state
  useEffect(() => {
    window.RunPluginFunction = async (pluginId: string, functionName: string, ...args: any[]) => {
      const plugin = plugins.find(p => p.id === pluginId);
      if (!plugin) throw new Error(`Plugin ${pluginId} not found`);
      const funcDef = plugin.customFunctions?.find(f => f.name === functionName);
      if (!funcDef) throw new Error(`Function ${functionName} not found in plugin ${plugin.name}`);
      
      const evalCode = `${funcDef.code}\nreturn await ${functionName}(...args);`;
      const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
      const executable = new AsyncFunction('...args', evalCode);
      return await executable(...args);
    };
  }, [plugins]);

  // Load data on mount
  useEffect(() => {
    // Load Bookmarks
    const savedBookmarks = ahk.call('LoadData', 'bookmarks.json');
    if (savedBookmarks) {
      try { setBookmarks(JSON.parse(savedBookmarks)); } catch (e) { }
    } else {
      setBookmarks([
        { id: '1', title: 'Netflix', url: 'https://netflix.com' },
        { id: '2', title: 'Hulu', url: 'https://hulu.com' },
      ]);
    }

    // Load Followed Items
    const savedFollowed = ahk.call('LoadData', 'followed.json');
    if (savedFollowed) {
      try { setFollowedItems(JSON.parse(savedFollowed)); } catch (e) { }
    }

    // Load Flows
    const loadFlows = () => {
      const filesStr = ahk.call('ListFlows');
      const loadedFlows: CustomFlow[] = [];
      if (filesStr) {
        const files = filesStr.split('|').filter(Boolean);
        for (const file of files) {
          const data = ahk.call('LoadFlow', file);
          if (data) {
            try { loadedFlows.push(JSON.parse(data)); } catch (e) { }
          }
        }
      }
      
      // Auto-migrate from monolithic to split files if split files don't exist
      if (loadedFlows.length === 0) {
        const oldFlows = ahk.call('LoadData', 'flows.json');
        if (oldFlows) {
          try {
            const parsed = JSON.parse(oldFlows);
            if (Array.isArray(parsed) && parsed.length > 0) {
              parsed.forEach(f => {
                loadedFlows.push(f);
                ahk.call('SaveFlow', `flow_${f.id}.json`, JSON.stringify(f, null, 2));
              });
            }
          } catch(e) {}
        }
      }
      setFlows(loadedFlows);
    };
    loadFlows();

    // Load Watch Later
    const savedWatchLater = ahk.call('LoadData', 'watchlater.json');
    if (savedWatchLater) {
      try { setWatchLater(JSON.parse(savedWatchLater)); } catch (e) { }
    }

    // Load Credentials
    const savedCreds = ahk.call('LoadData', 'credentials.json');
    if (savedCreds) {
      try { setCredentials(JSON.parse(savedCreds)); } catch (e) { }
    }

    // Load Userscripts
    const loadUserscripts = () => {
      const filesStr = ahk.call('ListScripts');
      const loadedScripts: Userscript[] = [];
      if (filesStr) {
        const files = filesStr.split('|').filter(Boolean);
        for (const file of files) {
          const data = ahk.call('LoadScript', file);
          if (data) {
            try { loadedScripts.push(JSON.parse(data)); } catch (e) { }
          }
        }
      }
      
      // Auto-migrate from monolithic to split files if split files don't exist
      if (loadedScripts.length === 0) {
        const oldScripts = ahk.call('LoadData', 'userscripts.json');
        if (oldScripts) {
          try {
            const parsed = JSON.parse(oldScripts);
            if (Array.isArray(parsed) && parsed.length > 0) {
              parsed.forEach(s => {
                loadedScripts.push(s);
                ahk.call('SaveScript', `script_${s.id}.json`, JSON.stringify(s, null, 2));
              });
            }
          } catch(e) {}
        }
      }
      setUserscripts(loadedScripts);
    };
    loadUserscripts();

    // Load Plugins
    loadPlugins();
  }, []);

  const loadPlugins = () => {
    const filesStr = ahk.call('ListSites');
    if (filesStr) {
      const files = filesStr.split('|').filter(Boolean);
      const loadedPlugins: SitePlugin[] = [];
      for (const file of files) {
        const data = ahk.call('LoadSite', file);
        if (data) {
          try { loadedPlugins.push(JSON.parse(data)); } catch (e) { }
        }
      }
      setPlugins(loadedPlugins);
    }
  };

  // Save bookmarks when changed
  useEffect(() => {
    if (bookmarks.length > 0) {
      ahk.call('SaveData', 'bookmarks.json', JSON.stringify(bookmarks));
    }
  }, [bookmarks]);

  // Save watch later when changed
  useEffect(() => {
    if (watchLater.length > 0) {
      ahk.call('SaveData', 'watchlater.json', JSON.stringify(watchLater));
    }
  }, [watchLater]);

  // Save credentials when changed
  useEffect(() => {
    if (credentials.length > 0) {
      ahk.call('SaveData', 'credentials.json', JSON.stringify(credentials));
    }
  }, [credentials]);

  // Save followed items when changed
  useEffect(() => {
    if (followedItems.length > 0) {
      ahk.call('SaveData', 'followed.json', JSON.stringify(followedItems));
    }
  }, [followedItems]);

  // Save userscripts and sync payload to AHK
  useEffect(() => {
    const activeScripts = userscripts.filter(s => s.enabled);
    let payload = '';

    if (activeScripts.length > 0 || plugins.some(p => p.customCss || p.customJs)) {
      payload = `
        var currentHost = window.location.hostname;
        
        // Inject Userscripts
        var scripts = ${JSON.stringify(activeScripts)};
        scripts.forEach(s => {
          var matches = s.domains.includes('*') || s.domains.some(d => currentHost.includes(d));
          if (matches) {
            try { eval(s.code); } catch(e) { console.error('[Userscript Error]', s.name, e); }
          }
        });

        // Inject Plugin Custom CSS and JS
        var sitePlugins = ${JSON.stringify(plugins.map(p => ({ baseUrl: p.baseUrl, css: p.customCss, js: p.customJs })).filter(p => p.css || p.js))};
        sitePlugins.forEach(p => {
          try {
            var pHost = '';
            try { pHost = new URL(p.baseUrl).hostname; } catch(e) { pHost = p.baseUrl; }
            if (currentHost.includes(pHost) || pHost.includes(currentHost)) {
              if (p.css) {
                var style = document.createElement('style');
                style.innerHTML = p.css;
                document.head.appendChild(style);
              }
              if (p.js) {
                try { eval(p.js); } catch(e) { console.error('[Plugin JS Error]', p.baseUrl, e); }
              }
            }
          } catch(e) {}
        });
      `;
    }
    
    ahk.call('UpdateUserscriptPayload', payload);

    // Debounce save execution
    const saveTimer = setTimeout(() => {
      userscripts.forEach(s => {
        ahk.call('SaveScript', `script_${s.id}.json`, JSON.stringify(s, null, 2));
      });
    }, 500);

    return () => clearTimeout(saveTimer);
  }, [userscripts, plugins]);

  const checkForUpdates = async () => {
    setIsCheckingUpdates(true);
    const updatedItems = [...followedItems];

    for (let i = 0; i < updatedItems.length; i++) {
      const item = updatedItems[i];
      const plugin = plugins.find(p => p.id === item.siteId);
      if (!plugin) continue;

      const html = ahk.call('RawFetchHTML', item.url);
      if (!html) continue;

      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      if (item.type === 'tv' && plugin.media.epSel) {
        const eps = doc.querySelectorAll(plugin.media.epSel);
        if (eps.length > item.knownCount) {
          item.knownCount = eps.length;
          item.hasUpdate = true;
        }
      } else if (item.type === 'film' && plugin.player.playerSel) {
        const player = doc.querySelector(plugin.player.playerSel);
        if (player && item.knownCount === 0) {
          item.knownCount = 1;
          item.hasUpdate = true;
        }
      }
    }

    setFollowedItems(updatedItems);
    setIsCheckingUpdates(false);
  };

  const handleNavigate = (e: React.FormEvent) => {
    e.preventDefault();
    let finalUrl = inputUrl;
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      if (!finalUrl.includes('.') || finalUrl.includes(' ')) {
        finalUrl = `https://duckduckgo.com/?q=${encodeURIComponent(finalUrl)}`;
      } else {
        finalUrl = `https://${finalUrl}`;
      }
    }
    setUrl(finalUrl);
    setInputUrl(finalUrl);
    setActiveTab('player');
  };

  const savePlugin = () => {
    if (!editingPlugin) return;
    const pluginToSave = { ...editingPlugin, id: editingPlugin.id || Date.now().toString() };
    const filename = `${pluginToSave.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${pluginToSave.id}.json`;

    ahk.call('SaveSite', filename, JSON.stringify(pluginToSave, null, 2));
    setEditingPlugin(null);
    loadPlugins();
  };

  const deletePlugin = (plugin: SitePlugin) => {
    const filename = `${plugin.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${plugin.id}.json`;
    ahk.call('DeleteSite', filename);
    if (editingPlugin?.id === plugin.id) setEditingPlugin(null);
    loadPlugins();
  };

  const updateEditingPlugin = (section: keyof SitePlugin | 'root', field: string, value: any) => {
    if (!editingPlugin) return;
    if (section === 'root') {
      setEditingPlugin({ ...editingPlugin, [field]: value });
    } else {
      setEditingPlugin({
        ...editingPlugin,
        [section]: { ...(editingPlugin[section as keyof SitePlugin] as any), [field]: value }
      });
    }
  };

  const fetchTitleForUrl = (targetUrl: string): string => {
    try {
      const html = ahk.call('RawFetchHTML', targetUrl);
      if (html) {
        const match = html.match(/<title>(.*?)<\/title>/i);
        if (match && match[1]) return match[1].trim();
      }
      return new URL(targetUrl).hostname;
    } catch {
      return targetUrl;
    }
  };

  const runFlow = async (flow: CustomFlow, initialUrl: string = url) => {
    console.log('Running flow:', flow.name, 'on url:', initialUrl);
    let currentVar = initialUrl;
    
    const resolveVars = async (str: string) => {
      if (!str) return str;
      let res = str.replace(/\{\{CURRENT_URL\}\}/g, url)
                   .replace(/\{\{PREV\}\}/g, currentVar)
                   .replace(/\{\{SEARCH\}\}/g, multiSearchQuery);
      
      const promptRegex = /\{\{prompt:([^}]+)\}\}/g;
      let match;
      while ((match = promptRegex.exec(res)) !== null) {
          const promptTitle = match[1];
          const userInput = window.prompt(`Flow Input Required:\\n${promptTitle}`, "");
          res = res.replace(match[0], userInput || "");
      }
      return res;
    };

    for (const step of flow.steps) {
      console.log("Executing Step:", step.type, step.params);
      
      if (step.type === 'navigate') {
        const dest = await resolveVars(step.params.url || '');
        ahk.call('UpdatePlayerUrl', dest);
        currentVar = dest;
        await new Promise(r => setTimeout(r, 1500)); 
      } else if (step.type === 'inject') {
        const code = await resolveVars(step.params.code || '');
        ahk.call('InjectJS', code);
      } else if (step.type === 'RawFetchHTML') {
        const fetchUrl = await resolveVars(step.params.url || '');
        const html = ahk.call('RawFetchHTML', fetchUrl);
        currentVar = html;
        console.log('Fetched HTML length:', html?.length);
      } else if (step.type === 'callFlow') {
        const targetFlowId = await resolveVars(step.params.flowId || '');
        const targetFlow = flows.find(f => f.id === targetFlowId);
        if (targetFlow) {
          await runFlow(targetFlow, currentVar);
        } else {
          console.error(`Flow ${targetFlowId} not found!`);
        }
      } else if (step.type === 'pluginAction') {
        const targetPluginId = await resolveVars(step.params.pluginId || '');
        const actionName = await resolveVars(step.params.actionName || '');
        try {
          const res = await window.RunPluginFunction(targetPluginId, actionName, currentVar);
          currentVar = (typeof res === 'object') ? JSON.stringify(res) : String(res);
          console.log(`Plugin Action ${actionName} Result:`, currentVar);
        } catch (e: any) {
          console.error('Plugin Action Error:', e);
        }
      } else if (step.type === 'callPlugin') {
        const targetPluginId = await resolveVars(step.params.pluginId || '');
        const targetPlugin = plugins.find(p => p.id === targetPluginId);
        if (targetPlugin && targetPlugin.search.urlFormat) {
           const sq = await resolveVars(step.params.query || currentVar);
           const pUrl = targetPlugin.search.urlFormat.replace('{query}', encodeURIComponent(sq));
           setMultiSearchQuery(sq);
           setSearchParamMode('fetch');
           setActiveTab('dashboard');
           setTimeout(() => {
              const input = document.getElementById('search-input');
              if (input) input.focus();
           }, 100);
        }
      }
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-zinc-950 text-zinc-100 font-sans overflow-hidden border border-zinc-800/50">

      {/* --- Custom Titlebar (Draggable) --- */}
      <div className="h-10 flex items-center justify-between bg-zinc-950 border-b border-zinc-900 drag-region select-none px-3">
        <div className="flex items-center gap-3 no-drag">
          <div className="flex items-center gap-2 text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <Film size={16} className="text-indigo-500" />
            <span className="text-xs font-medium tracking-wider uppercase">StreamView</span>
          </div>
        </div>

        {/* URL Bar */}
        <div className="flex-1 max-w-xl mx-4 no-drag flex items-center justify-center">
          {isSimpleUrlBar ? (
            <div className="flex items-center justify-center text-xs text-zinc-500 font-medium truncate cursor-pointer hover:text-zinc-300 transition-colors" onClick={() => setIsSimpleUrlBar(false)}>
              {(() => {
                try { return new URL(url).hostname; } catch (e) { return url; }
              })()}
            </div>
          ) : (
            <form onSubmit={handleNavigate} className="flex items-center bg-zinc-900/80 backdrop-blur-xl border border-zinc-800/80 rounded-lg overflow-hidden transition-all focus-within:border-indigo-500/50 focus-within:bg-zinc-900 h-7 w-full max-w-lg">
              <div className="flex items-center px-2 gap-1 text-zinc-500">
                <button type="button" className="p-0.5 hover:text-zinc-200 transition-colors"><ChevronLeft size={14} /></button>
                <button type="button" className="p-0.5 hover:text-zinc-200 transition-colors"><ChevronRight size={14} /></button>
                <button type="button" className="p-0.5 hover:text-zinc-200 transition-colors"><RotateCw size={12} /></button>
              </div>

              <div className="w-px h-3 bg-zinc-800 mx-1" />

              <div className="flex-1 flex items-center px-2 gap-2">
                <Search size={12} className="text-zinc-500" />
                <input
                  type="text"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  placeholder="Search streams or enter URL..."
                  className="w-full bg-transparent border-none outline-none text-xs text-zinc-200 placeholder:text-zinc-600 font-medium"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!bookmarks.find(b => b.url === url)) {
                    setBookmarks([...bookmarks, { id: Date.now().toString(), title: fetchTitleForUrl(url), url }]);
                  }
                }}
                className="px-2 text-zinc-500 hover:text-indigo-400 transition-colors"
                title="Bookmark"
              >
                <Bookmark size={12} className={bookmarks.find(b => b.url === url) ? "fill-indigo-400 text-indigo-400" : ""} />
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!watchLater.find(w => w.url === url)) {
                    setWatchLater([...watchLater, { id: Date.now().toString(), title: fetchTitleForUrl(url), url, addedAt: Date.now() }]);
                  }
                }}
                className="px-2 text-zinc-500 hover:text-indigo-400 transition-colors"
                title="Watch Later"
              >
                <Clock size={12} className={watchLater.find(w => w.url === url) ? "text-indigo-400" : ""} />
              </button>
            </form>
          )}
        </div>

        {/* Window Controls */}
        <div className="flex items-center gap-1 no-drag">
          <button onClick={() => ahk.call('Minimize')} className="p-1.5 text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800 rounded transition-colors">
            <Minus size={14} />
          </button>
          <button onClick={() => ahk.call('Maximize')} className="p-1.5 text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800 rounded transition-colors">
            <Square size={12} />
          </button>
          <button onClick={() => ahk.call('Close')} className="p-1.5 text-zinc-500 hover:text-white hover:bg-red-500/90 rounded transition-colors">
            <X size={14} />
          </button>
        </div>
      </div>

      {/* --- Main Content Area --- */}
      <div className="flex flex-1 overflow-hidden">

        {/* Slim Sidebar */}
        <div className="w-14 flex flex-col items-center py-4 bg-zinc-950 border-r border-zinc-900 gap-6 z-10">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`p-2.5 rounded-xl transition-all duration-200 ${activeTab === 'dashboard' ? 'bg-indigo-500/10 text-indigo-400' : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900'}`}
          >
            <Compass size={20} strokeWidth={1.5} />
          </button>
          <button
            onClick={() => setActiveTab('player')}
            className={`p-2.5 rounded-xl transition-all duration-200 ${activeTab === 'player' ? 'bg-indigo-500/10 text-indigo-400' : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900'}`}
          >
            <MonitorPlay size={20} strokeWidth={1.5} />
          </button>
          <button
            onClick={() => setActiveTab('bookmarks')}
            className={`p-2.5 rounded-xl transition-all duration-200 ${activeTab === 'bookmarks' ? 'bg-indigo-500/10 text-indigo-400' : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900'}`}
          >
            <Bookmark size={20} strokeWidth={1.5} />
          </button>
          <button
            onClick={() => setActiveTab('watchlater')}
            className={`p-2.5 rounded-xl transition-all duration-200 ${activeTab === 'watchlater' ? 'bg-indigo-500/10 text-indigo-400' : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900'}`}
          >
            <Clock size={20} strokeWidth={1.5} />
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`relative p-2.5 rounded-xl transition-all duration-200 ${activeTab === 'activity' ? 'bg-indigo-500/10 text-indigo-400' : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900'}`}
          >
            <Activity size={20} strokeWidth={1.5} />
            {followedItems.some(i => i.hasUpdate) && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('plugins')}
            className={`p-2.5 rounded-xl transition-all duration-200 ${activeTab === 'plugins' ? 'bg-indigo-500/10 text-indigo-400' : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900'}`}
          >
            <Puzzle size={20} strokeWidth={1.5} />
          </button>
          <button
            onClick={() => setActiveTab('flows')}
            className={`p-2.5 rounded-xl transition-all duration-200 ${activeTab === 'flows' ? 'bg-indigo-500/10 text-indigo-400' : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900'}`}
          >
            <ListTree size={20} strokeWidth={1.5} />
          </button>
          <button
            onClick={() => setActiveTab('userscripts')}
            className={`p-2.5 rounded-xl transition-all duration-200 ${activeTab === 'userscripts' ? 'bg-indigo-500/10 text-indigo-400' : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900'}`}
          >
            <Code size={20} strokeWidth={1.5} />
          </button>

          <div className="flex-1" />

          <button
            onClick={() => setIsAdblockEnabled(!isAdblockEnabled)}
            className={`p-2.5 rounded-xl transition-all duration-200 ${isAdblockEnabled ? 'text-emerald-400 bg-emerald-400/10' : 'text-zinc-600 hover:text-zinc-400 hover:bg-zinc-900'}`}
            title={isAdblockEnabled ? "Adblock Active" : "Adblock Disabled"}
          >
            {isAdblockEnabled ? <Shield size={20} strokeWidth={1.5} /> : <ShieldOff size={20} strokeWidth={1.5} />}
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`p-2.5 rounded-xl transition-all duration-200 ${activeTab === 'settings' ? 'bg-zinc-800 text-zinc-200' : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900'}`}
          >
            <Settings size={20} strokeWidth={1.5} />
          </button>
        </div>

        {/* Main Viewport */}
        <div className="flex-1 flex flex-col relative bg-zinc-950">

          {/* Content Area */}
          <div className="flex-1 w-full h-full relative">
            {activeTab === 'dashboard' && (
              <div className="w-full h-full bg-zinc-950 flex flex-col items-center justify-center p-8 overflow-y-auto no-scrollbar">
                <div className="flex items-center gap-3 mb-8">
                  <Film size={48} className="text-indigo-500" />
                  <h1 className="text-5xl font-light tracking-tight text-zinc-100">StreamView</h1>
                </div>

                <div className="w-full max-w-2xl relative mb-8 flex flex-col gap-3">
                  <div className="relative w-full">
                    <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input
                      type="text"
                      value={multiSearchQuery}
                      onChange={(e) => setMultiSearchQuery(e.target.value)}
                      placeholder="Search across all plugins or enter URL..."
                      className="w-full bg-zinc-900/80 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-lg text-zinc-200 focus:border-indigo-500 focus:bg-zinc-900 outline-none transition-all shadow-xl"
                      onKeyDown={async (e) => {
                        if (e.key === 'Enter' && multiSearchQuery) {
                          setIsSearching(true);
                          setSearchResults([]);

                          if (searchParamMode === 'navigate') {
                            const navResults = plugins.map(p => ({
                              id: p.id,
                              title: `Search ${p.name}`,
                              url: p.search?.urlFormat ? p.search.urlFormat.replace('{query}', encodeURIComponent(multiSearchQuery)) : p.baseUrl,
                              pluginName: p.name,
                              type: 'search'
                            }));

                            let dest = multiSearchQuery;
                            if (!dest.startsWith('http')) {
                              dest = dest.includes('.') && !dest.includes(' ') ? `https://${dest}` : `https://duckduckgo.com/?q=${encodeURIComponent(dest)}`;
                            }
                            navResults.unshift({
                              id: 'direct-nav',
                              title: `Navigate to ${multiSearchQuery}`,
                              url: dest,
                              pluginName: 'Browser URL',
                              type: 'search'
                            });

                            setSearchResults(navResults);
                            setIsSearching(false);
                            return;
                          }

                          // Multi-search Logic (Fetch mode)
                          const results: any[] = [];
                          for (const plugin of plugins) {
                            if (plugin.search.urlFormat) {
                              console.log(`[Search] Starting fetch for ${plugin.name}...`);
                              const searchUrl = plugin.search.urlFormat.replace('{query}', encodeURIComponent(multiSearchQuery));
                              try {
                                const jsQuery = `
                                  function extractValue(el, selector, defaultAttr) {
                                    if (!el) return '';
                                    if (!selector && !defaultAttr) return el.textContent ? el.textContent.trim() : '';
                                    if (!selector && defaultAttr) return el.getAttribute(defaultAttr) || '';
                                    if (selector.startsWith('()=>')) return eval(selector.slice(4))(el);
                                    
                                    let targetSel = selector;
                                    let attr = defaultAttr;
                                    if (selector.includes('@')) {
                                      const parts = selector.split('@');
                                      targetSel = parts[0];
                                      attr = parts[1];
                                    }
                                    
                                    const targetEl = targetSel ? (el.querySelector(targetSel) || el) : el;
                                    if (attr) {
                                      return targetEl.getAttribute(attr) || '';
                                    }
                                    
                                    let text = targetEl.textContent ? targetEl.textContent.trim() : '';
                                    if (!text && targetEl.hasAttribute('alt')) text = targetEl.getAttribute('alt') || '';
                                    if (!text && targetEl.hasAttribute('title')) text = targetEl.getAttribute('title') || '';
                                    return text;
                                  }
                                  
                                  const itemSelector = '${plugin.search.itemSel ? plugin.search.itemSel.replace(/'/g, "\\'") : 'body'}';
                                  const items = Array.from(document.querySelectorAll(itemSelector));
                                  return items.slice(0, 10).map(item => {
                                    let titleStr = extractValue(item, '${plugin.search.titleSel ? plugin.search.titleSel.replace(/'/g, "\\'") : ''}', null);
                                    let linkStr = extractValue(item, '${plugin.search.linkSel ? plugin.search.linkSel.replace(/'/g, "\\'") : ''}', 'href');
                                    
                                    if (linkStr && !linkStr.startsWith('http')) {
                                      try { linkStr = new URL(linkStr, '${plugin.baseUrl}').href; } catch(e) {}
                                    }
                                    return { title: titleStr, href: linkStr };
                                  });
                                `;
                                
                                const fetchResults: any = await window.SmartFetch(searchUrl, jsQuery);
                                console.log(`[Search] ${plugin.name} returned from SmartFetch:`, fetchResults);

                                if (Array.isArray(fetchResults) && fetchResults.length > 0) {
                                  let validCount = 0;
                                  fetchResults.forEach((res: any, i: number) => {
                                    if (res.title && res.href) {
                                      validCount++;
                                      results.push({
                                        id: plugin.id + '_' + i,
                                        title: res.title,
                                        url: res.href,
                                        pluginName: plugin.name,
                                        type: 'result'
                                      });
                                    }
                                  });
                                  if (validCount === 0) {
                                    console.log(`[Search] ${plugin.name} found 0 valid results.`);
                                    results.push({
                                      id: plugin.id + '_empty',
                                      title: 'No matches found',
                                      url: searchUrl,
                                      pluginName: plugin.name,
                                      type: 'empty'
                                    });
                                  }
                                } else {
                                  console.log(`[Search] ${plugin.name} found 0 results.`);
                                  results.push({
                                    id: plugin.id + '_empty',
                                    title: 'No matches found',
                                    url: searchUrl,
                                    pluginName: plugin.name,
                                    type: 'empty'
                                  });
                                }
                              } catch (e) {
                                console.error(`[Search] Error evaluating ${plugin.name} SmartFetch:`, e);
                                results.push({ id: plugin.id + '_error', title: 'Error executing script', url: searchUrl, pluginName: plugin.name, type: 'empty' });
                              }
                            }
                          }
                          console.log(`[Search] Completed multi-search. Generated ${results.length} total card blocks.`);
                          setSearchResults(results);
                          setIsSearching(false);
                        }
                      }}
                    />
                    {isSearching && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <RefreshCw size={18} className="text-indigo-500 animate-spin" />
                      </div>
                    )}
                  </div>

                  {/* Mode Toggle */}
                  <div className="flex justify-center mt-2">
                    <div className="inline-flex bg-zinc-900/50 p-1 rounded-xl border border-zinc-800/50">
                      <button
                        onClick={() => setSearchParamMode('navigate')}
                        className={`text-xs font-medium px-4 py-1.5 rounded-lg transition-colors ${searchParamMode === 'navigate' ? 'bg-indigo-500/20 text-indigo-400' : 'text-zinc-500 hover:text-zinc-300'}`}
                      >
                        Web Navigate
                      </button>
                      <button
                        onClick={() => setSearchParamMode('fetch')}
                        className={`text-xs font-medium px-4 py-1.5 rounded-lg transition-colors ${searchParamMode === 'fetch' ? 'bg-indigo-500/20 text-indigo-400' : 'text-zinc-500 hover:text-zinc-300'}`}
                      >
                        Deep Fetch HTML
                      </button>
                    </div>
                  </div>
                </div>

                {/* Tags / Custom Search Lists */}
                <div className="w-full">
                  {searchResults.length === 0 && (
                    <div className="w-full max-w-5xl mx-auto space-y-12 pb-20 mt-8">
                      {/* Unique Tags Renderer */}
                      {Array.from(new Set(plugins.flatMap(p => p.tags || []))).sort().map(tag => {
                         const matchedPlugins = plugins.filter(p => p.tags?.includes(tag));
                         if (matchedPlugins.length === 0) return null;
                         return (
                           <div key={tag} className="space-y-4">
                             <h3 className="text-sm font-medium text-emerald-400 uppercase tracking-widest pl-2 flex items-center gap-2">
                               <Puzzle size={14} className="opacity-70" /> {tag}
                             </h3>
                             <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                               {matchedPlugins.map(p => (
                                 <div 
                                   key={p.id}
                                   onClick={() => {
                                     setUrl(p.baseUrl);
                                     setInputUrl(p.baseUrl);
                                     setActiveTab('player');
                                   }}
                                   className="group relative bg-zinc-900/40 hover:bg-zinc-900/80 border border-zinc-800/60 hover:border-emerald-500/30 rounded-2xl p-4 cursor-pointer transition-all duration-300 flex items-center gap-4 overflow-hidden"
                                 >
                                   <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-500 group-hover:text-emerald-400 group-hover:bg-emerald-500/10 transition-colors flex-shrink-0">
                                     <Globe size={18} />
                                   </div>
                                   <div className="flex-1 min-w-0">
                                     <h4 className="text-sm font-medium text-zinc-200 truncate group-hover:text-emerald-300 transition-colors">{p.name}</h4>
                                     <p className="text-xs text-zinc-600 truncate mt-0.5">{p.baseUrl.replace('https://', '').replace(/\/$/, '')}</p>
                                   </div>
                                 </div>
                               ))}
                             </div>
                           </div>
                         )
                      })}

                      {/* Uncategorized Plugins */}
                      {plugins.filter(p => !p.tags || p.tags.length === 0).length > 0 && (
                         <div className="space-y-4">
                           <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-widest pl-2">Uncategorized Sites</h3>
                           <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                               {plugins.filter(p => !p.tags || p.tags.length === 0).map(p => (
                                 <div 
                                   key={p.id}
                                   onClick={() => {
                                     setUrl(p.baseUrl);
                                     setInputUrl(p.baseUrl);
                                     setActiveTab('player');
                                   }}
                                   className="group bg-zinc-900/40 hover:bg-zinc-900/80 border border-zinc-800/60 hover:border-zinc-700 rounded-2xl p-4 cursor-pointer transition-all duration-300 flex items-center gap-4"
                                 >
                                   <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-500 transition-colors flex-shrink-0">
                                     <Globe size={18} />
                                   </div>
                                   <div className="flex-1 min-w-0">
                                     <h4 className="text-sm font-medium text-zinc-300 truncate">{p.name}</h4>
                                     <p className="text-xs text-zinc-600 truncate mt-0.5">{p.baseUrl.replace('https://', '').replace(/\/$/, '')}</p>
                                   </div>
                                 </div>
                               ))}
                           </div>
                         </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="w-full max-w-5xl space-y-6">
                    <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-4">Search Results</h3>

                    {searchParamMode === 'navigate' ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {searchResults.map((result) => (
                          <div
                            key={result.id}
                            onClick={() => {
                              setUrl(result.url);
                              setInputUrl(result.url);
                              setActiveTab('player');
                            }}
                            className="p-4 bg-zinc-900/50 border border-zinc-800/50 hover:border-indigo-500/30 hover:bg-zinc-900 rounded-xl cursor-pointer transition-all flex items-center gap-4 group"
                          >
                            <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-500 group-hover:text-indigo-400 group-hover:bg-indigo-500/10 transition-colors">
                              <Search size={18} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium text-zinc-200 truncate">{result.title}</h4>
                              <p className="text-xs text-zinc-500 truncate mt-1">{result.pluginName}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {Array.from(new Set(searchResults.map(r => r.pluginName))).map(pName => {
                          const grouping = searchResults.filter(r => r.pluginName === pName);
                          return (
                            <div key={pName} className="bg-zinc-900/40 border border-zinc-800/60 rounded-xl p-5">
                              <h4 className="text-sm font-medium text-indigo-400 mb-4 flex items-center gap-2">
                                <Puzzle size={16} /> {pName}
                                <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full ml-auto">{grouping.length} Items</span>
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                                {grouping.map(result => (
                                  <div
                                    key={result.id}
                                    onClick={() => {
                                      setUrl(result.url);
                                      setInputUrl(result.url);
                                      setActiveTab('player');
                                    }}
                                    className={`p-3 bg-zinc-950/50 border border-zinc-800/80 hover:border-indigo-500/40 rounded-xl cursor-pointer transition-all flex items-start gap-4 ${result.type === 'empty' ? 'opacity-50 hover:opacity-100' : ''}`}
                                  >
                                    <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0 text-zinc-500 mt-0.5">
                                      {result.type === 'empty' ? <Minus size={16} /> : <Film size={16} />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <h5 className="text-sm font-medium text-zinc-200 line-clamp-2 leading-tight">{result.title}</h5>
                                      {result.type !== 'empty' && <p className="text-[10px] text-zinc-500 truncate mt-1.5">{result.url}</p>}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'player' && (
              <div className="w-full h-full bg-zinc-950 flex flex-col relative">
                {/* Quick Options Bar & Toggle */}
                {!isQuickOptionsHidden && (
                  <div className="h-10 bg-zinc-950 border-b border-zinc-900 flex items-center px-4 gap-4 z-10 shrink-0">
                    <button
                      onClick={() => {
                        setMultiSearchQuery(new URL(url).hostname);
                        setActiveTab('dashboard');
                      }}
                      className="text-xs font-medium text-zinc-400 hover:text-indigo-400 flex items-center gap-1.5 transition-colors"
                    >
                      <Search size={14} /> Find Mirrors
                    </button>
                    <div className="w-px h-4 bg-zinc-800" />
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                      <span className="text-xs text-zinc-600 font-medium whitespace-nowrap">Run Flow:</span>
                      {flows.map(flow => (
                        <button
                          key={flow.id}
                          onClick={async () => {
                            await runFlow(flow);
                            setActiveTab('player');
                          }}
                          className="text-xs font-medium text-zinc-400 hover:text-emerald-400 flex items-center gap-1 transition-colors bg-zinc-900 px-2 py-1 rounded whitespace-nowrap"
                        >
                          <Zap size={12} /> {flow.name}
                        </button>
                      ))}
                      {flows.length === 0 && (
                        <span className="text-xs text-zinc-600 italic whitespace-nowrap">No flows</span>
                      )}
                    </div>
                    <div className="flex-1" />
                    <button
                      title="Inject Login Credentials"
                      onClick={() => {
                        const plugin = plugins.find(p => url.includes(p.baseUrl));
                        if (plugin && plugin.auth.usernameValue && plugin.auth.passwordValue) {
                          const js = `
                            (function() {
                              const userEl = document.querySelector("${plugin.auth.userSel}");
                              const passEl = document.querySelector("${plugin.auth.passSel}");
                              if (userEl) {
                                userEl.value = "${plugin.auth.usernameValue}";
                                userEl.dispatchEvent(new Event('input', { bubbles: true }));
                              }
                              if (passEl) {
                                passEl.value = "${plugin.auth.passwordValue}";
                                passEl.dispatchEvent(new Event('input', { bubbles: true }));
                              }
                              const submitEl = document.querySelector("${plugin.auth.submitSel}");
                              if (submitEl) submitEl.click();
                            })();
                          `;
                          ahk.call('InjectJS', js);
                        } else {
                          // Try general credentials
                          const hostname = new URL(url).hostname;
                          const cred = credentials.find(c => hostname.includes(c.domain) || c.domain.includes(hostname));
                          if (cred) {
                            // Basic injection for standard forms if no plugin matches
                            const js = `
                              (function() {
                                const pass = atob("${cred.passwordBase64}");
                                const userInputs = document.querySelectorAll('input[type="text"], input[type="email"], input[name*="user"], input[name*="email"]');
                                const passInputs = document.querySelectorAll('input[type="password"]');
                                if (userInputs.length > 0) { userInputs[0].value = "${cred.username}"; userInputs[0].dispatchEvent(new Event('input', { bubbles: true })); }
                                if (passInputs.length > 0) { passInputs[0].value = pass; passInputs[0].dispatchEvent(new Event('input', { bubbles: true })); }
                              })();
                            `;
                            ahk.call('InjectJS', js);
                          } else {
                            alert('No matching plugin or saved credentials found.');
                          }
                        }
                      }}
                      className="text-xs font-medium text-zinc-400 hover:text-indigo-400 flex items-center gap-1.5 transition-colors shrink-0"
                    >
                      <KeyRound size={14} /> Auto-Login
                    </button>
                  </div>
                )}
                {/* Toggle Button for Quick Options */}
                <button
                  onClick={() => setIsQuickOptionsHidden(!isQuickOptionsHidden)}
                  className={`absolute right-4 z-20 p-1.5 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800/50 rounded-lg text-zinc-500 hover:text-zinc-300 transition-all shadow-lg backdrop-blur-sm ${isQuickOptionsHidden ? 'top-4' : 'top-12'}`}
                  title={isQuickOptionsHidden ? "Show Quick Menu" : "Hide Quick Menu"}
                >
                  {isQuickOptionsHidden ? <ChevronLeft size={14} /> : <X size={14} />}
                </button>

                <div ref={playerRef} className="w-full flex-1 bg-zinc-900 border-none relative" />
              </div>
            )}

            {activeTab === 'bookmarks' && (
              <div className="p-8 max-w-5xl mx-auto w-full h-full overflow-y-auto no-scrollbar relative">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-light tracking-tight text-zinc-100">Bookmarks</h2>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                      <input
                        type="text"
                        placeholder="Search bookmarks..."
                        value={bookmarkSearchQuery}
                        onChange={e => setBookmarkSearchQuery(e.target.value)}
                        className="bg-zinc-900 border border-zinc-800 rounded-full py-2 pl-9 pr-4 text-sm text-zinc-200 outline-none focus:border-indigo-500 transition-colors w-64"
                      />
                    </div>
                    {selectedBookmarks.length > 0 && (
                      <button
                        onClick={() => {
                          setBookmarks(bookmarks.filter(b => !selectedBookmarks.includes(b.id)));
                          setSelectedBookmarks([]);
                        }}
                        className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 bg-red-500/10 px-4 py-2 rounded-full transition-colors"
                      >
                        <Trash2 size={16} /> Delete Selected ({selectedBookmarks.length})
                      </button>
                    )}
                    <button
                      onClick={() => {
                        const newId = Date.now().toString();
                        const newUrl = inputUrl && inputUrl !== 'https://example.com/stream' ? inputUrl : 'https://';
                        const urlHostname = (() => { try { return new URL(newUrl).hostname } catch { return 'New Site' } })();
                        setBookmarks([{ id: newId, title: urlHostname, url: newUrl, folder: 'General', tags: [urlHostname.split('.')[0]] }, ...bookmarks]);
                        setEditingBookmarkId(newId);
                      }}
                      className="flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 px-4 py-2 rounded-full transition-colors"
                    >
                      <Plus size={16} /> Add Bookmark
                    </button>
                  </div>
                </div>

                {Array.from(new Set(['All', ...bookmarks.map(b => b.folder).filter(Boolean)])).map(folder => {
                  const itemsInFolder = bookmarks.filter(b => (folder === 'All' && !b.folder) || b.folder === folder)
                    .filter(b => b.title.toLowerCase().includes(bookmarkSearchQuery.toLowerCase()) || b.url.toLowerCase().includes(bookmarkSearchQuery.toLowerCase()) || b.tags?.some(t => t.toLowerCase().includes(bookmarkSearchQuery.toLowerCase())));

                  if (itemsInFolder.length === 0) return null;

                  return (
                    <div key={folder || 'All'} className="mb-8">
                      <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Folder size={16} /> {folder}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {itemsInFolder.map(bookmark => (
                          <div
                            key={bookmark.id}
                            className="group relative p-4 bg-zinc-900/50 border border-zinc-800/50 hover:border-indigo-500/30 hover:bg-zinc-900 rounded-2xl transition-all duration-300 flex items-start gap-4"
                          >
                            <div className="absolute top-3 right-3 z-10 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <CustomCheckbox
                                checked={selectedBookmarks.includes(bookmark.id)}
                                onChange={(checked) => {
                                  if (checked) setSelectedBookmarks([...selectedBookmarks, bookmark.id]);
                                  else setSelectedBookmarks(selectedBookmarks.filter(id => id !== bookmark.id));
                                }}
                              />
                              <button
                                onClick={(e) => { e.stopPropagation(); setEditingBookmarkId(bookmark.id); }}
                                className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors"
                              >
                                <Settings size={14} />
                              </button>
                            </div>
                            <div
                              className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-500/20 group-hover:text-indigo-400 transition-all cursor-pointer"
                              onClick={() => {
                                setUrl(bookmark.url);
                                setInputUrl(bookmark.url);
                                setActiveTab('player');
                              }}
                            >
                              <Tv size={18} />
                            </div>
                            <div className="flex-1 min-w-0 pr-8">
                              <h4 className="text-sm font-medium text-zinc-200 truncate cursor-pointer" onClick={() => { setUrl(bookmark.url); setInputUrl(bookmark.url); setActiveTab('player'); }}>
                                {bookmark.title}
                              </h4>
                              <p className="text-xs text-zinc-500 truncate mt-0.5">{bookmark.url}</p>
                              {(bookmark.folder || (bookmark.tags && bookmark.tags.length > 0)) && (
                                <div className="flex gap-1.5 mt-2 flex-wrap max-h-[44px] overflow-hidden">
                                  {bookmark.folder && (
                                    <span className="bg-zinc-800 text-zinc-400 text-[10px] px-2 py-0.5 rounded flex items-center gap-1"><Folder size={10} /> {bookmark.folder}</span>
                                  )}
                                  {bookmark.tags?.map((t, idx) => (
                                    <span key={idx} className="bg-zinc-800/50 text-zinc-500 text-[10px] px-2 py-0.5 rounded">{t}</span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}

                {bookmarks.filter(b => b.title.toLowerCase().includes(bookmarkSearchQuery.toLowerCase()) || b.url.toLowerCase().includes(bookmarkSearchQuery.toLowerCase()) || b.tags?.some(t => t.toLowerCase().includes(bookmarkSearchQuery.toLowerCase()))).length === 0 && (
                  <div className="text-center py-20 text-zinc-500">
                    <Bookmark size={48} className="mx-auto mb-4 opacity-20" />
                    No bookmarks found matching your search.
                  </div>
                )}

                {/* Edit Bookmark Modal */}
                <Modal
                  isOpen={!!editingBookmarkId}
                  onClose={() => setEditingBookmarkId(null)}
                  title="Edit Bookmark"
                >
                  {editingBookmarkId && (() => {
                    const bm = bookmarks.find(b => b.id === editingBookmarkId);
                    if (!bm) return null;
                    return (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs text-zinc-500 mb-1.5">Title</label>
                          <input
                            value={bm.title}
                            onChange={(e) => setBookmarks(bookmarks.map(b => b.id === bm.id ? { ...b, title: e.target.value } : b))}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 outline-none focus:border-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-zinc-500 mb-1.5">URL</label>
                          <input
                            value={bm.url}
                            onChange={(e) => setBookmarks(bookmarks.map(b => b.id === bm.id ? { ...b, url: e.target.value } : b))}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 outline-none focus:border-indigo-500"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs text-zinc-500 mb-1.5">Folder</label>
                            <input
                              value={bm.folder || ''}
                              onChange={(e) => setBookmarks(bookmarks.map(b => b.id === bm.id ? { ...b, folder: e.target.value } : b))}
                              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 outline-none focus:border-indigo-500"
                              placeholder="General"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-zinc-500 mb-1.5">Tags</label>
                            <TagsInput
                              tags={bm.tags || []}
                              onChange={newTags => setBookmarks(bookmarks.map(b => b.id === bm.id ? { ...b, tags: newTags } : b))}
                            />
                          </div>
                        </div>
                        <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-zinc-800/50">
                          <button
                            onClick={() => {
                              setBookmarks(bookmarks.filter(b => b.id !== bm.id));
                              setEditingBookmarkId(null);
                            }}
                            className="px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                          >
                            Delete
                          </button>
                          <button
                            onClick={() => setEditingBookmarkId(null)}
                            className="px-4 py-2 text-sm font-medium bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors"
                          >
                            Done
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </Modal>
              </div>
            )}

            {activeTab === 'watchlater' && (
              <div className="p-8 max-w-4xl mx-auto w-full h-full overflow-y-auto no-scrollbar">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-light tracking-tight text-zinc-100">Watch Later</h2>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {watchLater.map(item => (
                    <div
                      key={item.id}
                      onClick={() => {
                        setUrl(item.url);
                        setInputUrl(item.url);
                        setActiveTab('player');
                      }}
                      className="group p-4 bg-zinc-900/50 border border-zinc-800/50 hover:border-indigo-500/30 hover:bg-zinc-900 rounded-xl cursor-pointer transition-all duration-300 flex items-center gap-4"
                    >
                      <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-500/20 group-hover:text-indigo-400 transition-all">
                        <Clock size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-zinc-200 truncate">{item.title}</h3>
                        <p className="text-xs text-zinc-500 truncate mt-1">{item.url}</p>
                      </div>
                      <div className="px-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setWatchLater(watchLater.filter(w => w.id !== item.id));
                          }}
                          className="p-2 text-zinc-600 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {watchLater.length === 0 && (
                    <div className="text-center py-12 text-zinc-500 text-sm">
                      <Clock size={32} className="mx-auto mb-4 opacity-20" />
                      Your watch later list is empty.
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'activity' && (
              <div className="p-8 max-w-4xl mx-auto w-full h-full overflow-y-auto no-scrollbar">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-light tracking-tight text-zinc-100">Following & Activity</h2>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        if (plugins.length > 0) {
                          setFollowedItems([...followedItems, {
                            id: Date.now().toString(),
                            title: new URL(url).hostname,
                            url: url,
                            siteId: plugins[0].id,
                            type: 'tv',
                            knownCount: 0,
                            hasUpdate: false
                          }]);
                        } else {
                          alert("Create a plugin first to track items.");
                        }
                      }}
                      className="flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-200 bg-zinc-900 px-4 py-2 rounded-full transition-colors"
                    >
                      <Plus size={16} /> Track Current
                    </button>
                    <button
                      onClick={checkForUpdates}
                      disabled={isCheckingUpdates}
                      className="flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 px-4 py-2 rounded-full transition-colors disabled:opacity-50"
                    >
                      <RefreshCw size={16} className={isCheckingUpdates ? "animate-spin" : ""} />
                      {isCheckingUpdates ? "Checking..." : "Check Updates"}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {followedItems.map(item => (
                    <div
                      key={item.id}
                      onClick={() => {
                        if (item.hasUpdate) {
                          setFollowedItems(followedItems.map(i => i.id === item.id ? { ...i, hasUpdate: false } : i));
                        }
                        setUrl(item.url);
                        setInputUrl(item.url);
                        setActiveTab('player');
                      }}
                      className={`group p-4 bg-zinc-900/50 border ${item.hasUpdate ? 'border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.1)]' : 'border-zinc-800/50 hover:border-zinc-700'} rounded-2xl cursor-pointer transition-all duration-300 flex items-start gap-4 relative overflow-hidden`}
                    >
                      {item.hasUpdate && (
                        <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden">
                          <div className="absolute top-2 -right-6 bg-indigo-500 text-white text-[10px] font-bold py-0.5 px-6 transform rotate-45 shadow-lg">
                            NEW
                          </div>
                        </div>
                      )}
                      <div className={`w-12 h-16 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0 ${item.hasUpdate ? 'text-indigo-400' : 'text-zinc-500'}`}>
                        {item.type === 'tv' ? <Tv size={20} /> : <Film size={20} />}
                      </div>
                      <div className="flex-1 min-w-0 py-1">
                        <h3 className={`text-sm font-medium truncate ${item.hasUpdate ? 'text-indigo-100' : 'text-zinc-200'}`}>{item.title}</h3>
                        <p className="text-xs text-zinc-500 truncate mt-1">
                          {item.type === 'tv' ? `${item.knownCount} Episodes` : (item.knownCount > 0 ? 'Released' : 'Unreleased')}
                        </p>
                        <p className="text-[10px] text-zinc-600 truncate mt-2 font-mono">
                          {plugins.find(p => p.id === item.siteId)?.name || 'Unknown Site'}
                        </p>
                      </div>
                    </div>
                  ))}
                  {followedItems.length === 0 && (
                    <div className="col-span-full text-center py-12 text-zinc-500 text-sm">
                      <Bell size={32} className="mx-auto mb-4 opacity-20" />
                      You aren't tracking any shows or films yet.
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'plugins' && (
              <div className="flex h-full w-full overflow-hidden">
                {/* Plugins List */}
                <div className="w-1/3 min-w-[300px] border-r border-zinc-800/50 bg-zinc-950/50 p-6 overflow-y-auto no-scrollbar">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-light tracking-tight text-zinc-100">Site Plugins</h2>
                    <button
                      onClick={() => setEditingPlugin({ ...DEFAULT_PLUGIN, id: Date.now().toString() })}
                      className="p-2 text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors"
                    >
                      <Plus size={18} />
                    </button>
                  </div>

                  <div className="space-y-3">
                    {plugins.map(plugin => (
                      <div
                        key={plugin.id}
                        onClick={() => setEditingPlugin(plugin)}
                        className={`p-4 rounded-xl border cursor-pointer transition-all ${editingPlugin?.id === plugin.id ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-zinc-900/30 border-zinc-800/50 hover:border-zinc-700'}`}
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-medium text-zinc-200">{plugin.name}</h3>
                          <button
                            onClick={(e) => { e.stopPropagation(); deletePlugin(plugin); }}
                            className="text-zinc-600 hover:text-red-400 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        <p className="text-xs text-zinc-500 mt-1 truncate">{plugin.baseUrl}</p>
                      </div>
                    ))}
                    {plugins.length === 0 && (
                      <div className="text-center py-8 text-sm text-zinc-600">
                        No plugins installed.<br />Create one or import from the sites folder.
                      </div>
                    )}
                  </div>
                </div>

                {/* Plugin Editor */}
                <div className="flex-1 bg-zinc-950 p-6 overflow-y-auto no-scrollbar">
                  {editingPlugin ? (
                    <div className="max-w-3xl mx-auto space-y-8 pb-20">
                      <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-light tracking-tight text-zinc-100">
                          {editingPlugin.id ? 'Edit Plugin' : 'New Plugin'}
                        </h2>
                        <div className="flex gap-3">
                          <button
                            onClick={() => setEditingPlugin(null)}
                            className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={savePlugin}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors shadow-lg shadow-indigo-500/20"
                          >
                            <Save size={16} /> Save Plugin
                          </button>
                        </div>
                      </div>

                      {/* General */}
                      <div className="space-y-4">
                        <h3 className="text-sm font-medium text-indigo-400 flex items-center gap-2 uppercase tracking-wider"><Settings size={16} /> General</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs text-zinc-500 mb-1.5">Site Name</label>
                            <input
                              type="text" value={editingPlugin.name}
                              onChange={(e) => updateEditingPlugin('root', 'name', e.target.value)}
                              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-zinc-500 mb-1.5">Base URL</label>
                            <input
                              type="text" value={editingPlugin.baseUrl}
                              onChange={(e) => updateEditingPlugin('root', 'baseUrl', e.target.value)}
                              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 outline-none"
                            />
                          </div>
                        </div>
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs text-zinc-500 mb-1.5">Tags</label>
                            <TagsInput
                              tags={editingPlugin.tags || []}
                              onChange={newTags => updateEditingPlugin('root', 'tags', newTags)}
                            />
                          </div>
                          <div className="hidden md:block"></div>
                          <div>
                            <label className="block text-xs text-zinc-500 mb-1.5">Custom CSS</label>
                            <textarea
                              value={editingPlugin.customCss || ''}
                              onChange={(e) => updateEditingPlugin('root', 'customCss', e.target.value)}
                              rows={4}
                              placeholder="body { background: #000; }"
                              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 outline-none font-mono resize-y"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-zinc-500 mb-1.5">Custom JS (Runs on load)</label>
                            <textarea
                              value={editingPlugin.customJs || ''}
                              onChange={(e) => updateEditingPlugin('root', 'customJs', e.target.value)}
                              rows={4}
                              placeholder="console.log('Site loaded');"
                              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 outline-none font-mono resize-y"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Authentication Flow */}
                      <div className="space-y-4">
                        <h3 className="text-sm font-medium text-indigo-400 flex items-center gap-2 uppercase tracking-wider"><KeyRound size={16} /> Authentication Flow</h3>
                        <div className="p-5 bg-zinc-900/30 border border-zinc-800/50 rounded-xl space-y-4">
                          <div>
                            <label className="block text-xs text-zinc-500 mb-1.5">Login URL</label>
                            <input
                              type="text" value={editingPlugin.auth.loginUrl} placeholder="https://site.com/login"
                              onChange={(e) => updateEditingPlugin('auth', 'loginUrl', e.target.value)}
                              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 outline-none"
                            />
                          </div>
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <label className="block text-xs text-zinc-500 mb-1.5">Username Selector</label>
                              <input
                                type="text" value={editingPlugin.auth.userSel} placeholder="input[name='user']"
                                onChange={(e) => updateEditingPlugin('auth', 'userSel', e.target.value)}
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 outline-none font-mono"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-zinc-500 mb-1.5">Password Selector</label>
                              <input
                                type="text" value={editingPlugin.auth.passSel} placeholder="input[name='pass']"
                                onChange={(e) => updateEditingPlugin('auth', 'passSel', e.target.value)}
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 outline-none font-mono"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-zinc-500 mb-1.5">Submit Selector</label>
                              <input
                                type="text" value={editingPlugin.auth.submitSel} placeholder="button[type='submit']"
                                onChange={(e) => updateEditingPlugin('auth', 'submitSel', e.target.value)}
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 outline-none font-mono"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Search Parsing */}
                      <div className="space-y-4">
                        <h3 className="text-sm font-medium text-indigo-400 flex items-center gap-2 uppercase tracking-wider"><Search size={16} /> Search Parsing</h3>
                        <div className="p-5 bg-zinc-900/30 border border-zinc-800/50 rounded-xl space-y-4">
                          <div>
                            <label className="block text-xs text-zinc-500 mb-1.5">Search URL Format (use {'{query}'})</label>
                            <input
                              type="text" value={editingPlugin.search.urlFormat} placeholder="https://site.com/search?q={query}"
                              onChange={(e) => updateEditingPlugin('search', 'urlFormat', e.target.value)}
                              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 outline-none font-mono"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs text-zinc-500 mb-1.5">List Item Selector</label>
                              <input
                                type="text" value={editingPlugin.search.itemSel} placeholder=".result-item"
                                onChange={(e) => updateEditingPlugin('search', 'itemSel', e.target.value)}
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 outline-none font-mono"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-zinc-500 mb-1.5">Title Selector</label>
                              <input
                                type="text" value={editingPlugin.search.titleSel} placeholder=".title > a"
                                onChange={(e) => updateEditingPlugin('search', 'titleSel', e.target.value)}
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 outline-none font-mono"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-zinc-500 mb-1.5">Link Selector</label>
                              <input
                                type="text" value={editingPlugin.search.linkSel} placeholder="a.play-btn"
                                onChange={(e) => updateEditingPlugin('search', 'linkSel', e.target.value)}
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 outline-none font-mono"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-zinc-500 mb-1.5">Thumbnail Selector</label>
                              <input
                                type="text" value={editingPlugin.search.imgSel} placeholder="img.poster"
                                onChange={(e) => updateEditingPlugin('search', 'imgSel', e.target.value)}
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 outline-none font-mono"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-zinc-500 mb-1.5">Year Selector</label>
                              <input
                                type="text" value={editingPlugin.search.yearSel} placeholder=".year"
                                onChange={(e) => updateEditingPlugin('search', 'yearSel', e.target.value)}
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 outline-none font-mono"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-zinc-500 mb-1.5">Type Selector</label>
                              <input
                                type="text" value={editingPlugin.search.typeSel} placeholder=".type"
                                onChange={(e) => updateEditingPlugin('search', 'typeSel', e.target.value)}
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 outline-none font-mono"
                              />
                            </div>
                          </div>
                          <div className="mt-6 pt-6 border-t border-zinc-800/50">
                            <h4 className="text-sm font-medium text-zinc-300 mb-3 flex items-center justify-between">
                                SmartFetch Selector Tester
                                {isTestingSearch && <RefreshCw size={14} className="text-indigo-400 animate-spin" />}
                            </h4>
                            <div className="flex gap-2 mb-3">
                              <input
                                type="text"
                                value={testSearchUrl}
                                onChange={(e) => setTestSearchUrl(e.target.value)}
                                placeholder="Paste a full search URL to test (e.g. https://imdb.com/find?q=matrix)"
                                className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 outline-none focus:border-indigo-500"
                              />
                              <button
                                onClick={async () => {
                                  if (!testSearchUrl) return;
                                  setIsTestingSearch(true);
                                  try {
                                    const jsQuery = `
                                      function extractValue(el, selector, defaultAttr) {
                                        if (!el) return '';
                                        if (!selector && !defaultAttr) return el.textContent ? el.textContent.trim() : '';
                                        if (!selector && defaultAttr) return el.getAttribute(defaultAttr) || '';
                                        if (selector.startsWith('()=>')) return eval(selector.slice(4))(el);
                                        let targetSel = selector;
                                        let attr = defaultAttr;
                                        if (selector.includes('@')) {
                                          const parts = selector.split('@');
                                          targetSel = parts[0];
                                          attr = parts[1];
                                        }
                                        const targetEl = targetSel ? (el.querySelector(targetSel) || el) : el;
                                        if (attr) { return targetEl.getAttribute(attr) || ''; }
                                        let text = targetEl.textContent ? targetEl.textContent.trim() : '';
                                        if (!text && targetEl.hasAttribute('alt')) text = targetEl.getAttribute('alt') || '';
                                        if (!text && targetEl.hasAttribute('title')) text = targetEl.getAttribute('title') || '';
                                        return text;
                                      }
                                      const itemSelector = '${editingPlugin.search.itemSel ? editingPlugin.search.itemSel.replace(/'/g, "\\'") : 'body'}';
                                      const items = Array.from(document.querySelectorAll(itemSelector));
                                      const results = items.slice(0, 5).map(item => ({
                                        title: extractValue(item, '${editingPlugin.search.titleSel ? editingPlugin.search.titleSel.replace(/'/g, "\\'") : ''}', null),
                                        href: extractValue(item, '${editingPlugin.search.linkSel ? editingPlugin.search.linkSel.replace(/'/g, "\\'") : ''}', 'href'),
                                        htmlPreview: item.outerHTML.substring(0, 150) + '...'
                                      }));
                                      return { count: items.length, items: results };
                                    `;
                                    const fetchResults: any = await window.SmartFetch(testSearchUrl, jsQuery);
                                    if (fetchResults) {
                                      setTestSearchResults({
                                        status: 'success',
                                        nodesCount: fetchResults.count,
                                        results: fetchResults.items
                                      });
                                    } else {
                                      setTestSearchResults({ status: 'error', nodesCount: 0, results: [{ error: 'Fetch returned null/empty' }] });
                                    }
                                  } catch (e: any) {
                                    setTestSearchResults({ status: 'error', nodesCount: 0, results: [{ error: e.message || 'Unknown error' }] });
                                  }
                                  setIsTestingSearch(false);
                                }}
                                className="px-4 py-2 bg-indigo-500/20 text-indigo-400 font-medium text-sm rounded-lg hover:bg-indigo-500/30 transition-colors whitespace-nowrap"
                              >
                                Test Fetch
                              </button>
                            </div>
                            
                            {testSearchResults.status !== 'idle' && (
                              <div className="bg-zinc-950 rounded-lg border border-zinc-800/80 p-3 overflow-y-auto max-h-64 no-scrollbar">
                                <div className="text-xs font-mono text-zinc-400 mb-2 border-b border-zinc-800/50 pb-2 flex justify-between">
                                  <span>Nodes Scraped By itemSel (<span className="text-white">{editingPlugin.search.itemSel || 'body'}</span>): <span className={testSearchResults.nodesCount > 0 ? "text-emerald-400" : "text-amber-400"}>{testSearchResults.nodesCount}</span></span>
                                </div>
                                <pre className="text-[10px] text-zinc-300 font-mono whitespace-pre-wrap break-all">
                                  {JSON.stringify(testSearchResults.results, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Details Parsing */}
                      <div className="space-y-4">
                        <h3 className="text-sm font-medium text-indigo-400 flex items-center gap-2 uppercase tracking-wider"><ListTree size={16} /> Details Parsing</h3>
                        <div className="p-5 bg-zinc-900/30 border border-zinc-800/50 rounded-xl grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs text-zinc-500 mb-1.5">Title Selector</label>
                            <input
                              type="text" value={editingPlugin.details.titleSel} placeholder="h1.title"
                              onChange={(e) => updateEditingPlugin('details', 'titleSel', e.target.value)}
                              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 outline-none font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-zinc-500 mb-1.5">Description Selector</label>
                            <input
                              type="text" value={editingPlugin.details.descSel} placeholder=".description"
                              onChange={(e) => updateEditingPlugin('details', 'descSel', e.target.value)}
                              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 outline-none font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-zinc-500 mb-1.5">Cast Selector</label>
                            <input
                              type="text" value={editingPlugin.details.castSel} placeholder=".cast-list > li"
                              onChange={(e) => updateEditingPlugin('details', 'castSel', e.target.value)}
                              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 outline-none font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-zinc-500 mb-1.5">Rating Selector</label>
                            <input
                              type="text" value={editingPlugin.details.ratingSel} placeholder=".rating"
                              onChange={(e) => updateEditingPlugin('details', 'ratingSel', e.target.value)}
                              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 outline-none font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-zinc-500 mb-1.5">Poster Selector</label>
                            <input
                              type="text" value={editingPlugin.details.posterSel} placeholder="img.main-poster"
                              onChange={(e) => updateEditingPlugin('details', 'posterSel', e.target.value)}
                              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 outline-none font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-zinc-500 mb-1.5">Similar Shows Selector</label>
                            <input
                              type="text" value={editingPlugin.details.similarSel} placeholder=".similar-items > a"
                              onChange={(e) => updateEditingPlugin('details', 'similarSel', e.target.value)}
                              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 outline-none font-mono"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Media Parsing */}
                      <div className="space-y-4">
                        <h3 className="text-sm font-medium text-indigo-400 flex items-center gap-2 uppercase tracking-wider"><ListTree size={16} /> Media Structure</h3>
                        <div className="p-5 bg-zinc-900/30 border border-zinc-800/50 rounded-xl grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs text-zinc-500 mb-1.5">Season Selector</label>
                            <input
                              type="text" value={editingPlugin.media.seasonSel} placeholder=".season-list > li"
                              onChange={(e) => updateEditingPlugin('media', 'seasonSel', e.target.value)}
                              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 outline-none font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-zinc-500 mb-1.5">Episode Selector</label>
                            <input
                              type="text" value={editingPlugin.media.epSel} placeholder=".episodes > a"
                              onChange={(e) => updateEditingPlugin('media', 'epSel', e.target.value)}
                              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 outline-none font-mono"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Player & Styling */}
                      <div className="space-y-4">
                        <h3 className="text-sm font-medium text-indigo-400 flex items-center gap-2 uppercase tracking-wider"><MonitorPlay size={16} /> Player & Focus</h3>
                        <div className="p-5 bg-zinc-900/30 border border-zinc-800/50 rounded-xl space-y-4">
                          <div>
                            <label className="block text-xs text-zinc-500 mb-1.5">Player Element Selector</label>
                            <input
                              type="text" value={editingPlugin.player.playerSel} placeholder="video#main-player, iframe.video-frame"
                              onChange={(e) => updateEditingPlugin('player', 'playerSel', e.target.value)}
                              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 outline-none font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-zinc-500 mb-1.5">Custom Focus CSS (Injected on load)</label>
                            <textarea
                              value={editingPlugin.player.focusCss}
                              onChange={(e) => updateEditingPlugin('player', 'focusCss', e.target.value)}
                              rows={4}
                              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 outline-none font-mono resize-none"
                            />
                            <p className="text-xs text-zinc-600 mt-2">
                              Use this CSS to force the player to fill the screen and hide site navigation.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Custom Functions */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-medium text-indigo-400 flex items-center gap-2 uppercase tracking-wider"><Code size={16} /> Custom Functions</h3>
                          <button
                            onClick={() => {
                              const newFuncs = [...(editingPlugin.customFunctions || []), { name: 'newFunction', description: '', code: 'function newFunction(html) {\n  return null;\n}' }];
                              setEditingPlugin({ ...editingPlugin, customFunctions: newFuncs });
                            }}
                            className="text-xs bg-indigo-500/20 text-indigo-400 px-2 py-1 rounded hover:bg-indigo-500/30 flex items-center gap-1"
                          >
                            <Plus size={14} /> Add Function
                          </button>
                        </div>
                        <div className="space-y-4">
                          {(editingPlugin.customFunctions || []).map((func, idx) => (
                            <div key={idx} className="p-5 bg-zinc-900/30 border border-zinc-800/50 rounded-xl space-y-4">
                              <div className="flex justify-between items-start gap-4">
                                <div className="flex-1 space-y-4">
                                  <div>
                                    <label className="block text-xs text-zinc-500 mb-1.5">Function Name</label>
                                    <input
                                      type="text" value={func.name} placeholder="e.g. fetchCastDetails"
                                      onChange={(e) => {
                                        const newFuncs = [...editingPlugin.customFunctions];
                                        newFuncs[idx].name = e.target.value;
                                        setEditingPlugin({ ...editingPlugin, customFunctions: newFuncs });
                                      }}
                                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 outline-none font-mono"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs text-zinc-500 mb-1.5">Description</label>
                                    <input
                                      type="text" value={func.description} placeholder="What does this do?"
                                      onChange={(e) => {
                                        const newFuncs = [...editingPlugin.customFunctions];
                                        newFuncs[idx].description = e.target.value;
                                        setEditingPlugin({ ...editingPlugin, customFunctions: newFuncs });
                                      }}
                                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 outline-none"
                                    />
                                  </div>
                                </div>
                                <button
                                  onClick={() => {
                                    const newFuncs = editingPlugin.customFunctions.filter((_, i) => i !== idx);
                                    setEditingPlugin({ ...editingPlugin, customFunctions: newFuncs });
                                  }}
                                  className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                              <div>
                                <label className="block text-xs text-zinc-500 mb-1.5">JavaScript Code</label>
                                <textarea
                                  value={func.code}
                                  onChange={(e) => {
                                    const newFuncs = [...editingPlugin.customFunctions];
                                    newFuncs[idx].code = e.target.value;
                                    setEditingPlugin({ ...editingPlugin, customFunctions: newFuncs });
                                  }}
                                  rows={6}
                                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:border-indigo-500 outline-none font-mono resize-y"
                                />
                              </div>
                            </div>
                          ))}
                          {(!editingPlugin.customFunctions || editingPlugin.customFunctions.length === 0) && (
                            <div className="text-center p-8 border border-dashed border-zinc-800 rounded-xl text-zinc-500 text-sm">
                              No custom functions defined.
                            </div>
                          )}
                        </div>
                      </div>

                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-zinc-500">
                      <Puzzle size={48} className="mb-4 opacity-20" />
                      <p>Select a plugin to edit or create a new one.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'flows' && (
              <div className="flex h-full w-full overflow-hidden">
                {/* Flows List */}
                <div className="w-1/3 min-w-[300px] border-r border-zinc-800/50 bg-zinc-950/50 p-6 overflow-y-auto no-scrollbar">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-light tracking-tight text-zinc-100">Custom Flows</h2>
                    <button
                      onClick={() => {
                        const newFlow = { id: Date.now().toString(), name: 'New Flow', description: '', steps: [] };
                        const newFlows = [...flows, newFlow];
                        setFlows(newFlows);
                        ahk.call('SaveFlow', `flow_${newFlow.id}.json`, JSON.stringify(newFlow, null, 2));
                        setEditingFlow(newFlow);
                      }}
                      className="p-2 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 rounded-lg transition-colors"
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                  <div className="space-y-2">
                    {flows.map(flow => (
                      <div
                        key={flow.id}
                        onClick={() => setEditingFlow(flow)}
                        className={`p-4 rounded-xl cursor-pointer transition-all duration-200 border ${editingFlow?.id === flow.id ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-zinc-900/50 border-zinc-800/50 hover:bg-zinc-900 hover:border-zinc-700'}`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <h3 className={`font-medium ${editingFlow?.id === flow.id ? 'text-indigo-400' : 'text-zinc-200'}`}>{flow.name}</h3>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const newFlows = flows.filter(f => f.id !== flow.id);
                              setFlows(newFlows);
                              ahk.call('DeleteFlow', `flow_${flow.id}.json`);
                              if (editingFlow?.id === flow.id) setEditingFlow(null);
                            }}
                            className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <p className="text-xs text-zinc-500 truncate">{flow.description || 'No description'}</p>
                        <div className="mt-3 flex items-center gap-2">
                          <span className="text-[10px] uppercase tracking-wider font-medium text-zinc-600 bg-zinc-900 px-2 py-0.5 rounded-full border border-zinc-800">
                            {flow.steps.length} Steps
                          </span>
                        </div>
                      </div>
                    ))}
                    {flows.length === 0 && (
                      <div className="text-center p-8 border border-dashed border-zinc-800 rounded-xl text-zinc-500 text-sm">
                        No flows created yet.
                      </div>
                    )}
                  </div>
                </div>

                {/* Flow Editor */}
                <div className="flex-1 bg-zinc-950 p-6 overflow-y-auto no-scrollbar">
                  {editingFlow ? (
                    <div className="max-w-3xl mx-auto space-y-8 pb-20">
                      <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-light tracking-tight text-zinc-100">Edit Flow</h2>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={async () => {
                              await runFlow(editingFlow);
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-sm font-medium transition-colors"
                          >
                            <Play size={16} /> Run Flow
                          </button>
                          <button
                            onClick={() => {
                              const updatedFlows = flows.map(f => f.id === editingFlow.id ? editingFlow : f);
                              setFlows(updatedFlows);
                              ahk.call('SaveFlow', `flow_${editingFlow.id}.json`, JSON.stringify(editingFlow, null, 2));
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm font-medium transition-colors shadow-[0_0_15px_rgba(99,102,241,0.3)]"
                          >
                            <Save size={16} /> Save Flow
                          </button>
                        </div>
                      </div>

                      {/* Basic Info */}
                      <div className="space-y-4">
                        <div className="p-5 bg-zinc-900/30 border border-zinc-800/50 rounded-xl space-y-4">
                          <div>
                            <label className="block text-xs text-zinc-500 mb-1.5">Flow Name</label>
                            <input
                              type="text" value={editingFlow.name}
                              onChange={(e) => setEditingFlow({ ...editingFlow, name: e.target.value })}
                              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-zinc-500 mb-1.5">Description</label>
                            <input
                              type="text" value={editingFlow.description}
                              onChange={(e) => setEditingFlow({ ...editingFlow, description: e.target.value })}
                              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 outline-none"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Steps */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-medium text-indigo-400 flex items-center gap-2 uppercase tracking-wider"><ListTree size={16} /> Flow Steps</h3>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                const newStep: FlowStep = { id: Date.now().toString(), type: 'RawFetchHTML', params: { url: '' } };
                                setEditingFlow({ ...editingFlow, steps: [...editingFlow.steps, newStep] });
                              }}
                              className="text-xs bg-indigo-500/20 text-indigo-400 px-2 py-1 rounded hover:bg-indigo-500/30 flex items-center gap-1"
                            >
                              <Plus size={14} /> Add Step
                            </button>
                          </div>
                        </div>

                        <div className="space-y-4 relative">
                          {editingFlow.steps.map((step, idx) => (
                            <div key={step.id} className="relative z-10 p-5 bg-zinc-900/50 border border-zinc-800/80 rounded-xl shadow-lg">
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-mono text-zinc-400">
                                    {idx + 1}
                                  </div>
                                  <select
                                    value={step.type}
                                    onChange={(e) => {
                                      const newSteps = [...editingFlow.steps];
                                      newSteps[idx].type = e.target.value as any;
                                      newSteps[idx].params = {}; // Reset params on type change
                                      setEditingFlow({ ...editingFlow, steps: newSteps });
                                    }}
                                    className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-sm text-zinc-200 focus:border-indigo-500 outline-none"
                                  >
                                    <option value="RawFetchHTML">Fetch HTML</option>
                                    <option value="parseHtml">Parse HTML</option>
                                    <option value="pluginAction">Run Plugin Action</option>
                                    <option value="navigate">Navigate Browser</option>
                                    <option value="extract">Extract Data</option>
                                    <option value="inject">Inject JS/CSS</option>
                                  </select>
                                </div>
                                <button
                                  onClick={() => {
                                    const newSteps = editingFlow.steps.filter((_, i) => i !== idx);
                                    setEditingFlow({ ...editingFlow, steps: newSteps });
                                  }}
                                  className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>

                              {/* Step Params Editor based on Type */}
                              <div className="pl-9 space-y-3">
                                {step.type === 'RawFetchHTML' && (
                                  <div>
                                    <label className="block text-xs text-zinc-500 mb-1.5">URL</label>
                                    <input
                                      type="text" value={step.params.url || ''} placeholder="https://..."
                                      onChange={(e) => {
                                        const newSteps = [...editingFlow.steps];
                                        newSteps[idx].params.url = e.target.value;
                                        setEditingFlow({ ...editingFlow, steps: newSteps });
                                      }}
                                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 outline-none font-mono"
                                    />
                                  </div>
                                )}
                                {step.type === 'parseHtml' && (
                                  <div>
                                    <label className="block text-xs text-zinc-500 mb-1.5">CSS Selector</label>
                                    <input
                                      type="text" value={step.params.selector || ''} placeholder=".item > a"
                                      onChange={(e) => {
                                        const newSteps = [...editingFlow.steps];
                                        newSteps[idx].params.selector = e.target.value;
                                        setEditingFlow({ ...editingFlow, steps: newSteps });
                                      }}
                                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 outline-none font-mono"
                                    />
                                  </div>
                                )}
                                {step.type === 'pluginAction' && (
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="block text-xs text-zinc-500 mb-1.5">Plugin ID</label>
                                      <select
                                        value={step.params.pluginId || ''}
                                        onChange={(e) => {
                                          const newSteps = [...editingFlow.steps];
                                          newSteps[idx].params.pluginId = e.target.value;
                                          setEditingFlow({ ...editingFlow, steps: newSteps });
                                        }}
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 outline-none"
                                      >
                                        <option value="">Select Plugin...</option>
                                        {plugins.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                      </select>
                                    </div>
                                    <div>
                                      <label className="block text-xs text-zinc-500 mb-1.5">Action Name</label>
                                      <input
                                        type="text" value={step.params.actionName || ''} placeholder="e.g. fetchCastDetails"
                                        onChange={(e) => {
                                          const newSteps = [...editingFlow.steps];
                                          newSteps[idx].params.actionName = e.target.value;
                                          setEditingFlow({ ...editingFlow, steps: newSteps });
                                        }}
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 outline-none font-mono"
                                      />
                                    </div>
                                  </div>
                                )}
                                {step.type === 'navigate' && (
                                  <div>
                                    <label className="block text-xs text-zinc-500 mb-1.5">URL</label>
                                    <input
                                      type="text" value={step.params.url || ''} placeholder="https://..."
                                      onChange={(e) => {
                                        const newSteps = [...editingFlow.steps];
                                        newSteps[idx].params.url = e.target.value;
                                        setEditingFlow({ ...editingFlow, steps: newSteps });
                                      }}
                                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 outline-none font-mono"
                                    />
                                  </div>
                                )}
                                {step.type === 'inject' && (
                                  <div>
                                    <label className="block text-xs text-zinc-500 mb-1.5">JavaScript Code</label>
                                    <textarea
                                      value={step.params.code || ''}
                                      onChange={(e) => {
                                        const newSteps = [...editingFlow.steps];
                                        newSteps[idx].params.code = e.target.value;
                                        setEditingFlow({ ...editingFlow, steps: newSteps });
                                      }}
                                      rows={4}
                                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:border-indigo-500 outline-none font-mono resize-y"
                                    />
                                  </div>
                                )}
                                {step.type === 'extract' && (
                                  <div>
                                    <label className="block text-xs text-zinc-500 mb-1.5">Extraction Rules (JSON)</label>
                                    <textarea
                                      value={step.params.rules || ''} placeholder='{"title": ".title", "link": "a@href"}'
                                      onChange={(e) => {
                                        const newSteps = [...editingFlow.steps];
                                        newSteps[idx].params.rules = e.target.value;
                                        setEditingFlow({ ...editingFlow, steps: newSteps });
                                      }}
                                      rows={4}
                                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:border-indigo-500 outline-none font-mono resize-y"
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}

                          {/* Connecting lines */}
                          {editingFlow.steps.length > 1 && (
                            <div className="absolute left-8 top-8 bottom-8 w-px bg-zinc-800 z-0"></div>
                          )}

                          {editingFlow.steps.length === 0 && (
                            <div className="text-center p-8 border border-dashed border-zinc-800 rounded-xl text-zinc-500 text-sm">
                              No steps added yet. Click "Add Step" to begin.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-zinc-500">
                      <ListTree size={48} className="mb-4 opacity-20" />
                      <p>Select a flow to edit or create a new one.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'userscripts' && (
              <div className="flex w-full h-full bg-zinc-950 overflow-hidden">
                <div className="w-1/3 min-w-[300px] border-r border-zinc-900 flex flex-col h-full bg-zinc-950/50">
                  <div className="p-5 border-b border-zinc-900/50 flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-light tracking-tight text-zinc-100 flex items-center gap-2">
                        <Code size={20} className="text-indigo-400" /> Userscripts
                      </h2>
                      <p className="text-xs text-zinc-500 mt-1">Inject JS dynamically.</p>
                    </div>
                    <button
                      onClick={() => {
                        const newScript: Userscript = {
                          id: Date.now().toString(),
                          name: 'New Script',
                          domains: ['*'],
                          code: '// ==UserScript==\n// @match *\n// ==/UserScript==\n\nconsole.log("Hello from userscript");',
                          enabled: true
                        };
                        setUserscripts([...userscripts, newScript]);
                        setEditingUserscriptId(newScript.id);
                      }}
                      className="p-1.5 bg-indigo-500/10 text-indigo-400 rounded-lg hover:bg-indigo-500/20 transition-colors"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-2">
                    {userscripts.map(s => (
                      <div
                        key={s.id}
                        className={`p-3 rounded-xl border transition-all cursor-pointer group ${editingUserscriptId === s.id ? 'bg-zinc-900 border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.1)]' : 'bg-transparent border-zinc-900/50 hover:bg-zinc-900 hover:border-zinc-800'}`}
                        onClick={() => setEditingUserscriptId(s.id)}
                      >
                        <div className="flex justify-between items-center">
                          <div className="font-medium text-sm text-zinc-200">{s.name}</div>
                          <div className="flex gap-2 items-center">
                            <CustomCheckbox
                              checked={s.enabled}
                              onChange={(enabled) => {
                                setUserscripts(userscripts.map(u => u.id === s.id ? { ...u, enabled } : u));
                              }}
                            />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                ahk.call('DeleteScript', `script_${s.id}.json`);
                                setUserscripts(userscripts.filter(u => u.id !== s.id));
                                if (editingUserscriptId === s.id) setEditingUserscriptId(null);
                              }}
                              className="text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                        <div className="text-xs text-zinc-500 mt-1 truncate">Domains: {s.domains.join(', ')}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex-1 flex flex-col bg-zinc-950 overflow-hidden">
                  {editingUserscriptId && userscripts.find(u => u.id === editingUserscriptId) ? (
                    <div className="flex-1 flex flex-col h-full overflow-hidden">
                      <div className="h-14 border-b border-zinc-900 flex items-center px-4 gap-4 flex-shrink-0">
                        <input
                          type="text"
                          value={userscripts.find(u => u.id === editingUserscriptId)?.name}
                          onChange={(e) => setUserscripts(userscripts.map(u => u.id === editingUserscriptId ? { ...u, name: e.target.value } : u))}
                          className="bg-transparent border-none text-sm font-medium text-zinc-200 outline-none min-w-[150px]"
                        />
                        <div className="w-px h-4 bg-zinc-800" />
                        <div className="flex items-center gap-2 text-xs text-zinc-400 shrink-0">
                          Domains:
                        </div>
                        <div className="flex-1 max-w-sm">
                          <TagsInput
                            tags={userscripts.find(u => u.id === editingUserscriptId)?.domains || []}
                            onChange={(domains) => setUserscripts(userscripts.map(u => u.id === editingUserscriptId ? { ...u, domains } : u))}
                          />
                        </div>
                      </div>
                      <div className="flex-1 overflow-y-auto w-full relative group">
                        <div className="absolute inset-0 pl-12 font-mono text-sm leading-relaxed overflow-hidden">
                          <Editor
                            value={userscripts.find(u => u.id === editingUserscriptId)?.code || ''}
                            onValueChange={(code) => setUserscripts(userscripts.map(u => u.id === editingUserscriptId ? { ...u, code } : u))}
                            highlight={code => Prism.highlight(code, Prism.languages.javascript, 'javascript')}
                            padding={24}
                            style={{
                              fontFamily: '"Fira Code", "JetBrains Mono", Consolas, monospace',
                              fontSize: 14,
                              minHeight: '100%',
                            }}
                            className="bg-transparent text-zinc-300 transition-colors focus-within:bg-zinc-900/30"
                            textareaClassName="focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-zinc-500">
                      <Code size={48} className="mb-4 opacity-20" />
                      <p>Select a userscript to edit or create a new one.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="p-8 max-w-2xl mx-auto w-full h-full overflow-y-auto no-scrollbar">
                <h2 className="text-2xl font-light tracking-tight text-zinc-100 mb-8">Settings</h2>

                <div className="space-y-6">
                  <div className="p-5 bg-zinc-900/50 border border-zinc-800/50 rounded-2xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-zinc-200">Native Adblocker</h3>
                        <p className="text-xs text-zinc-500 mt-1">Injects AHK scripts to block ads and trackers.</p>
                      </div>
                      <button
                        onClick={() => setIsAdblockEnabled(!isAdblockEnabled)}
                        className={`w-12 h-6 rounded-full transition-colors relative ${isAdblockEnabled ? 'bg-emerald-500' : 'bg-zinc-700'}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${isAdblockEnabled ? 'left-7' : 'left-1'}`} />
                      </button>
                    </div>
                  </div>

                  <div className="p-5 bg-zinc-900/50 border border-zinc-800/50 rounded-2xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-zinc-200">Multi-Search Engine</h3>
                        <p className="text-xs text-zinc-500 mt-1">Default engine for the floating search bar.</p>
                      </div>
                      <select className="bg-zinc-800 border border-zinc-700 text-sm rounded-lg px-3 py-1.5 outline-none focus:border-indigo-500 text-zinc-200">
                        <option>DuckDuckGo</option>
                        <option>Google</option>
                        <option>Custom AHK Script</option>
                      </select>
                    </div>
                  </div>

                  <div className="p-5 bg-zinc-900/50 border border-zinc-800/50 rounded-2xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-zinc-200">Local Save File</h3>
                        <p className="text-xs text-zinc-500 mt-1">Data is saved to bookmarks.json via AHK.</p>
                      </div>
                      <button className="text-xs font-medium text-zinc-400 hover:text-zinc-200 px-3 py-1.5 bg-zinc-800 rounded-lg transition-colors">
                        Export Data
                      </button>
                    </div>
                  </div>
                  <div className="p-5 bg-zinc-900/50 border border-zinc-800/50 rounded-2xl">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-sm font-medium text-zinc-200 flex items-center gap-2"><Lock size={16} className="text-indigo-400" /> Credential Manager</h3>
                        <p className="text-xs text-zinc-500 mt-1">Manage logins for external sites (Auto-Login bypass).</p>
                      </div>
                      <button
                        onClick={() => setShowCredModal(true)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/20 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/30 rounded-lg text-xs font-medium transition-colors"
                      >
                        <Plus size={14} /> Add New
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto no-scrollbar">
                        {credentials.map(c => (
                          <div key={c.id} className="group relative flex justify-between items-center p-3.5 bg-zinc-950/50 hover:bg-zinc-900 border border-zinc-800/80 rounded-xl transition-all">
                            <div className="flex items-center gap-3 overflow-hidden">
                              <div className="w-8 h-8 rounded bg-zinc-800/50 flex items-center justify-center flex-shrink-0 text-zinc-500">
                                <KeyRound size={14} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-zinc-200 truncate">{c.domain}</p>
                                <p className="text-xs text-zinc-500 truncate">{c.username}</p>
                              </div>
                            </div>
                            <button
                              onClick={() => setCredentials(credentials.filter(x => x.id !== c.id))}
                              className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 transition-all p-1.5 bg-zinc-900 rounded-lg"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                      {credentials.length === 0 && (
                        <div className="text-xs text-zinc-600 italic py-6 text-center bg-zinc-950/30 rounded-xl border border-zinc-800/30">
                          <Lock size={24} className="mx-auto mb-2 opacity-20" />
                          No credentials saved.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Add Credential Modal */}
                  <Modal
                    isOpen={showCredModal}
                    onClose={() => { setShowCredModal(false); setNewCred({ domain: '', username: '', password: '' }); }}
                    title="Add Credential"
                  >
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs text-zinc-500 mb-1.5">Domain or Plugin</label>
                        <div className="flex gap-2 mb-2">
                          <select
                            onChange={(e) => {
                              if (e.target.value) {
                                try { setNewCred({ ...newCred, domain: new URL(e.target.value).hostname }) } catch { setNewCred({ ...newCred, domain: e.target.value }) }
                              }
                            }}
                            className="bg-zinc-950 border border-zinc-800 text-sm rounded-lg px-3 py-2 outline-none focus:border-indigo-500 text-zinc-200 flex-1"
                          >
                            <option value="">Select a known site...</option>
                            {plugins.map(p => <option key={p.id} value={p.baseUrl}>{p.name} ({p.baseUrl})</option>)}
                          </select>
                        </div>
                        <input
                          type="text" placeholder="Or type domain (e.g. netflix.com)"
                          value={newCred.domain} onChange={e => setNewCred({ ...newCred, domain: e.target.value })}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-zinc-500 mb-1.5">Username / Email</label>
                        <input
                          type="text" placeholder="user@gmail.com"
                          value={newCred.username} onChange={e => setNewCred({ ...newCred, username: e.target.value })}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-zinc-500 mb-1.5">Password</label>
                        <input
                          type="password" placeholder="••••••••"
                          value={newCred.password} onChange={e => setNewCred({ ...newCred, password: e.target.value })}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 outline-none"
                        />
                      </div>

                      <div className="mt-6 flex justify-end pt-4 border-t border-zinc-800/50">
                        <button
                          onClick={() => {
                            if (newCred.domain && newCred.username && newCred.password) {
                              setCredentials([...credentials, {
                                id: Date.now().toString(),
                                domain: newCred.domain,
                                username: newCred.username,
                                passwordBase64: btoa(newCred.password)
                              }]);
                              setNewCred({ domain: '', username: '', password: '' });
                              setShowCredModal(false);
                            }
                          }}
                          className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm font-medium transition-colors w-full"
                        >
                          Save Credential
                        </button>
                      </div>
                    </div>
                  </Modal>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

