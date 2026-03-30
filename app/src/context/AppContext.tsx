import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { ahk } from '../lib/ahk';
import { 
  BookmarkItem, WatchLaterItem, CredentialItem, 
  FollowedItem, CustomFlow, Userscript, SitePlugin 
} from '../types';

interface AppContextType {
  url: string; setUrl: React.Dispatch<React.SetStateAction<string>>;
  inputUrl: string; setInputUrl: React.Dispatch<React.SetStateAction<string>>;
  isAdblockEnabled: boolean; setIsAdblockEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  urlBarMode: 'full' | 'title' | 'hidden'; setUrlBarMode: React.Dispatch<React.SetStateAction<'full' | 'title' | 'hidden'>>;
  theme: any; setTheme: React.Dispatch<React.SetStateAction<any>>;
  bookmarks: BookmarkItem[]; setBookmarks: React.Dispatch<React.SetStateAction<BookmarkItem[]>>;
  selectedBookmarks: string[]; setSelectedBookmarks: React.Dispatch<React.SetStateAction<string[]>>;
  followedItems: FollowedItem[]; setFollowedItems: React.Dispatch<React.SetStateAction<FollowedItem[]>>;
  isCheckingUpdates: boolean; setIsCheckingUpdates: React.Dispatch<React.SetStateAction<boolean>>;
  plugins: SitePlugin[]; setPlugins: React.Dispatch<React.SetStateAction<SitePlugin[]>>;
  editingPlugin: SitePlugin | null; setEditingPlugin: React.Dispatch<React.SetStateAction<SitePlugin | null>>;
  testSearchUrl: string; setTestSearchUrl: React.Dispatch<React.SetStateAction<string>>;
  testSearchResults: any; setTestSearchResults: React.Dispatch<React.SetStateAction<any>>;
  isTestingSearch: boolean; setIsTestingSearch: React.Dispatch<React.SetStateAction<boolean>>;
  flows: CustomFlow[]; setFlows: React.Dispatch<React.SetStateAction<CustomFlow[]>>;
  editingFlow: CustomFlow | null; setEditingFlow: React.Dispatch<React.SetStateAction<CustomFlow | null>>;
  userscripts: Userscript[]; setUserscripts: React.Dispatch<React.SetStateAction<Userscript[]>>;
  editingUserscriptId: string | null; setEditingUserscriptId: React.Dispatch<React.SetStateAction<string | null>>;
  activeTab: 'dashboard' | 'player' | 'bookmarks' | 'watchlater' | 'plugins' | 'activity' | 'settings' | 'flows' | 'userscripts';
  setActiveTab: React.Dispatch<React.SetStateAction<any>>;
  multiSearchQuery: string; setMultiSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  searchResults: any[]; setSearchResults: React.Dispatch<React.SetStateAction<any[]>>;
  isSearching: boolean; setIsSearching: React.Dispatch<React.SetStateAction<boolean>>;
  watchLater: WatchLaterItem[]; setWatchLater: React.Dispatch<React.SetStateAction<WatchLaterItem[]>>;
  credentials: CredentialItem[]; setCredentials: React.Dispatch<React.SetStateAction<CredentialItem[]>>;
  newCred: any; setNewCred: React.Dispatch<React.SetStateAction<any>>;
  bookmarkSearchQuery: string; setBookmarkSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  editingBookmarkId: string | null; setEditingBookmarkId: React.Dispatch<React.SetStateAction<string | null>>;
  showCredModal: boolean; setShowCredModal: React.Dispatch<React.SetStateAction<boolean>>;
  searchParamMode: 'navigate' | 'fetch'; setSearchParamMode: React.Dispatch<React.SetStateAction<'navigate' | 'fetch'>>;
  isQuickOptionsHidden: boolean; setIsQuickOptionsHidden: React.Dispatch<React.SetStateAction<boolean>>;
  playerRef: React.RefObject<HTMLDivElement>;

  savePlugin: () => void;
  deletePlugin: (plugin: SitePlugin) => void;
  updateEditingPlugin: (section: keyof SitePlugin | 'root', field: string, value: any) => void;
  fetchTitleForUrl: (targetUrl: string) => string;
  runFlow: (flow: CustomFlow, initialUrl?: string) => Promise<void>;
  checkForUpdates: () => Promise<void>;
  handleNavigate: (e: React.FormEvent) => void;
  loadPlugins: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within an AppProvider');
  return context;
};

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [url, setUrl] = useState('https://example.com/stream');
  const [inputUrl, setInputUrl] = useState(url);
  const [isAdblockEnabled, setIsAdblockEnabled] = useState(true);
  const [urlBarMode, setUrlBarMode] = useState<'full' | 'title' | 'hidden'>('full');
  const isInitialThemeMount = useRef(true);
  const [theme, setTheme] = useState({
    mode: 'dark',
    titlebarBg: '#09090b',
    sidebarBg: '#09090b',
    mainBg: '#09090b',
    border: '#27272a',
    accent: '#6366f1',
    textMain: '#fafafa',
    textSec: '#a1a1aa'
  });
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [selectedBookmarks, setSelectedBookmarks] = useState<string[]>([]);
  const [followedItems, setFollowedItems] = useState<FollowedItem[]>([]);
  const [isCheckingUpdates, setIsCheckingUpdates] = useState(false);
  const [plugins, setPlugins] = useState<SitePlugin[]>([]);
  const [editingPlugin, setEditingPlugin] = useState<SitePlugin | null>(null);
  const [testSearchUrl, setTestSearchUrl] = useState('');
  const [testSearchResults, setTestSearchResults] = useState<{ status: string, nodesCount: number, results: any[] }>({ status: 'idle', nodesCount: 0, results: [] });
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

  useEffect(() => {
    if (activeTab === 'player') {
      if (lastSyncUrl.current !== url) {
        lastSyncUrl.current = url;
        ahk.call('UpdatePlayerUrl', url);
      }
    }
  }, [activeTab, url]);

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

  useEffect(() => {
    window.RunPluginFunction = async (pluginId: string, functionName: string, ...args: any[]) => {
      const plugin = plugins.find(p => p.id === pluginId);
      if (!plugin) throw new Error(`Plugin ${pluginId} not found`);
      const funcDef = plugin.customFunctions?.find(f => f.name === functionName);
      if (!funcDef) throw new Error(`Function ${functionName} not found in plugin ${plugin.name}`);
      const evalCode = `${funcDef.code}\nreturn await ${functionName}(...args);`;
      const AsyncFunction = Object.getPrototypeOf(async function () { }).constructor;
      const executable = new AsyncFunction('...args', evalCode);
      return await executable(...args);
    };
  }, [plugins]);

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

  useEffect(() => {
    const savedBookmarks = ahk.call('LoadData', 'bookmarks.json');
    if (savedBookmarks) {
      try { setBookmarks(JSON.parse(savedBookmarks)); } catch (e) { }
    } else {
      setBookmarks([
        { id: '1', title: 'Netflix', url: 'https://netflix.com' },
        { id: '2', title: 'Hulu', url: 'https://hulu.com' },
      ]);
    }

    const savedFollowed = ahk.call('LoadData', 'followed.json');
    if (savedFollowed) { try { setFollowedItems(JSON.parse(savedFollowed)); } catch (e) { } }

    const loadFlows = () => {
      const filesStr = ahk.call('ListFlows');
      const loadedFlows: CustomFlow[] = [];
      if (filesStr) {
        const files = filesStr.split('|').filter(Boolean);
        for (const file of files) {
          const data = ahk.call('LoadFlow', file);
          if (data) { try { loadedFlows.push(JSON.parse(data)); } catch (e) { } }
        }
      }
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
          } catch (e) { }
        }
      }
      setFlows(loadedFlows);
    };
    loadFlows();

    const savedWatchLater = ahk.call('LoadData', 'watchlater.json');
    if (savedWatchLater) { try { setWatchLater(JSON.parse(savedWatchLater)); } catch (e) { } }

    const savedCreds = ahk.call('LoadData', 'credentials.json');
    if (savedCreds) { try { setCredentials(JSON.parse(savedCreds)); } catch (e) { } }

    const loadUserscripts = () => {
      const filesStr = ahk.call('ListScripts');
      const loadedScripts: Userscript[] = [];
      if (filesStr) {
        const files = filesStr.split('|').filter(Boolean);
        for (const file of files) {
          const data = ahk.call('LoadScript', file);
          if (data) { try { loadedScripts.push(JSON.parse(data)); } catch (e) { } }
        }
      }
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
          } catch (e) { }
        }
      }
      setUserscripts(loadedScripts);
    };
    loadUserscripts();

    loadPlugins();

    const savedTheme = ahk.call('LoadData', 'theme.json');
    if (savedTheme) {
      try {
        const parsed = JSON.parse(savedTheme);
        setTheme({
          mode: parsed.mode || 'dark',
          titlebarBg: parsed.titlebarBg || parsed.bgMain || '#09090b',
          sidebarBg: parsed.sidebarBg || parsed.bgSec || '#09090b',
          mainBg: parsed.mainBg || parsed.bgMain || '#09090b',
          border: parsed.border || '#27272a',
          accent: parsed.accent || '#6366f1',
          textMain: parsed.textMain || '#fafafa',
          textSec: parsed.textSec || '#a1a1aa'
        });
      } catch (e) { }
    }

    setTimeout(() => ahk.call('HideSplash'), 500);
  }, []);

  useEffect(() => { if (bookmarks.length > 0) ahk.call('SaveData', 'bookmarks.json', JSON.stringify(bookmarks)); }, [bookmarks]);
  useEffect(() => { if (watchLater.length > 0) ahk.call('SaveData', 'watchlater.json', JSON.stringify(watchLater)); }, [watchLater]);
  useEffect(() => { if (credentials.length > 0) ahk.call('SaveData', 'credentials.json', JSON.stringify(credentials)); }, [credentials]);
  useEffect(() => { if (followedItems.length > 0) ahk.call('SaveData', 'followed.json', JSON.stringify(followedItems)); }, [followedItems]);

  useEffect(() => {
    if (isInitialThemeMount.current) { isInitialThemeMount.current = false; return; }
    ahk.call('SaveData', 'theme.json', JSON.stringify(theme));
  }, [theme]);

  // Save userscripts and sync payload to AHK
  useEffect(() => {
    const activeScripts = userscripts.filter(s => s.enabled);
    let payload = '';

    if (activeScripts.length > 0 || plugins.some(p => p.customCss || p.customJs)) {
      payload = `
        var currentHost = window.location.hostname;
        var scripts = ${JSON.stringify(activeScripts)};
        scripts.forEach(s => {
          var matches = s.domains.includes('*') || s.domains.some(d => currentHost.includes(d));
          if (matches) { try { eval(s.code); } catch(e) { console.error('[Userscript Error]', s.name, e); } }
        });
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

    const saveTimer = setTimeout(() => {
      userscripts.forEach(s => ahk.call('SaveScript', `script_${s.id}.json`, JSON.stringify(s, null, 2)));
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
        if (eps.length > item.knownCount) { item.knownCount = eps.length; item.hasUpdate = true; }
      } else if (item.type === 'film' && plugin.player.playerSel) {
        const player = doc.querySelector(plugin.player.playerSel);
        if (player && item.knownCount === 0) { item.knownCount = 1; item.hasUpdate = true; }
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
    } catch { return targetUrl; }
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
        if (targetFlow) await runFlow(targetFlow, currentVar);
        else console.error(`Flow ${targetFlowId} not found!`);
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

  const value = {
    url, setUrl, inputUrl, setInputUrl, isAdblockEnabled, setIsAdblockEnabled, urlBarMode, setUrlBarMode,
    theme, setTheme, bookmarks, setBookmarks, selectedBookmarks, setSelectedBookmarks, 
    followedItems, setFollowedItems, isCheckingUpdates, setIsCheckingUpdates, plugins, setPlugins,
    editingPlugin, setEditingPlugin, testSearchUrl, setTestSearchUrl, testSearchResults, setTestSearchResults,
    isTestingSearch, setIsTestingSearch, flows, setFlows, editingFlow, setEditingFlow, userscripts, setUserscripts,
    editingUserscriptId, setEditingUserscriptId, activeTab, setActiveTab, multiSearchQuery, setMultiSearchQuery,
    searchResults, setSearchResults, isSearching, setIsSearching, watchLater, setWatchLater, credentials, setCredentials,
    newCred, setNewCred, bookmarkSearchQuery, setBookmarkSearchQuery, editingBookmarkId, setEditingBookmarkId,
    showCredModal, setShowCredModal, searchParamMode, setSearchParamMode, isQuickOptionsHidden, setIsQuickOptionsHidden,
    playerRef, savePlugin, deletePlugin, updateEditingPlugin, fetchTitleForUrl, runFlow, checkForUpdates, handleNavigate, loadPlugins
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
