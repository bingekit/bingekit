import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { ahk } from '../lib/ahk';
import {
  BookmarkItem, WatchLaterItem, CredentialItem,
  FollowedItem, CustomFlow, Userscript, SitePlugin, HistoryItem, DiscoveryItem, ActiveDownload
} from '../types';
import { bulkAddHistory, getHistory, getCredentialsDB, addCredentialDB } from '../lib/db';

import { useGeneralState } from '../hooks/useGeneralState';
import { useSettingsState } from '../hooks/useSettingsState';
import { useDownloadsState } from '../hooks/useDownloadsState';
import { useHistoryState } from '../hooks/useHistoryState';
import { useTabsState } from '../hooks/useTabsState';
import { usePluginsState } from '../hooks/usePluginsState';
import adblockDefaults from '../../../conf/adblock_defaults.json';

export type NavButtonsConfig = { home: boolean; back: boolean; forward: boolean; reload: boolean };

interface AppContextType {
  url: string; setUrl: React.Dispatch<React.SetStateAction<string>>;
  inputUrl: string; setInputUrl: React.Dispatch<React.SetStateAction<string>>;
  isAdblockEnabled: boolean; setIsAdblockEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  adblockWhitelist: string[]; setAdblockWhitelist: React.Dispatch<React.SetStateAction<string[]>>;
  urlBarMode: 'full' | 'title' | 'hidden'; setUrlBarMode: React.Dispatch<React.SetStateAction<'full' | 'title' | 'hidden'>>;
  theme: any; setTheme: React.Dispatch<React.SetStateAction<any>>;
  bookmarks: BookmarkItem[]; setBookmarks: React.Dispatch<React.SetStateAction<BookmarkItem[]>>;
  history: HistoryItem[]; setHistory: React.Dispatch<React.SetStateAction<HistoryItem[]>>;
  isHistoryEnabled: boolean; setIsHistoryEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  discoveryItems: DiscoveryItem[]; setDiscoveryItems: React.Dispatch<React.SetStateAction<DiscoveryItem[]>>;
  selectedBookmarks: string[]; setSelectedBookmarks: React.Dispatch<React.SetStateAction<string[]>>;
  followedItems: FollowedItem[]; setFollowedItems: React.Dispatch<React.SetStateAction<FollowedItem[]>>;
  isCheckingUpdates: boolean; setIsCheckingUpdates: React.Dispatch<React.SetStateAction<boolean>>;
  plugins: SitePlugin[]; setPlugins: React.Dispatch<React.SetStateAction<SitePlugin[]>>;
  editingPlugin: SitePlugin | null; setEditingPlugin: React.Dispatch<React.SetStateAction<SitePlugin | null>>;
  pluginBaselineStr: string; setPluginBaselineStr: React.Dispatch<React.SetStateAction<string>>;
  isPluginDirty: boolean;
  testSearchQuery: string; setTestSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  testSearchResults: any; setTestSearchResults: React.Dispatch<React.SetStateAction<any>>;
  isTestingSearch: boolean; setIsTestingSearch: React.Dispatch<React.SetStateAction<boolean>>;
  flows: CustomFlow[]; setFlows: React.Dispatch<React.SetStateAction<CustomFlow[]>>;
  editingFlow: CustomFlow | null; setEditingFlow: React.Dispatch<React.SetStateAction<CustomFlow | null>>;
  userscripts: Userscript[]; setUserscripts: React.Dispatch<React.SetStateAction<Userscript[]>>;
  editingUserscriptId: string | null; setEditingUserscriptId: React.Dispatch<React.SetStateAction<string | null>>;
  activeTab: 'dashboard' | 'player' | 'bookmarks' | 'watchlater' | 'plugins' | 'activity' | 'settings' | 'flows' | 'userscripts' | 'history' | 'discovery' | 'workspaces' | 'downloads' | 'config' | 'docs' | 'explore' | 'library' | 'extensions';
  setActiveTab: React.Dispatch<React.SetStateAction<any>>;
  activeSettingsTab: 'general' | 'appearance' | 'downloads' | 'privacy' | 'adblock' | 'advanced';
  setActiveSettingsTab: React.Dispatch<React.SetStateAction<'general' | 'appearance' | 'downloads' | 'privacy' | 'adblock' | 'advanced'>>;
  multiSearchQuery: string; setMultiSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  searchResults: any[]; setSearchResults: React.Dispatch<React.SetStateAction<any[]>>;
  isSearching: boolean; setIsSearching: React.Dispatch<React.SetStateAction<boolean>>;
  watchLater: WatchLaterItem[]; setWatchLater: React.Dispatch<React.SetStateAction<WatchLaterItem[]>>;
  credentials: CredentialItem[]; setCredentials: React.Dispatch<React.SetStateAction<CredentialItem[]>>;
  newCred: any; setNewCred: React.Dispatch<React.SetStateAction<any>>;
  bookmarkSearchQuery: string; setBookmarkSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  editingBookmarkId: string | null; setEditingBookmarkId: React.Dispatch<React.SetStateAction<string | null>>;
  showCredModal: boolean; setShowCredModal: React.Dispatch<React.SetStateAction<boolean>>;
  searchParamMode: 'fetch' | 'navigate'; setSearchParamMode: React.Dispatch<React.SetStateAction<'fetch' | 'navigate'>>;
  searchThreadLimit: number; setSearchThreadLimit: React.Dispatch<React.SetStateAction<number>>;
  isQuickOptionsHidden: boolean; setIsQuickOptionsHidden: React.Dispatch<React.SetStateAction<boolean>>;
  defaultSearchEngine: string; setDefaultSearchEngine: React.Dispatch<React.SetStateAction<string>>;
  homePage: string; setHomePage: React.Dispatch<React.SetStateAction<string>>;
  playerRef: React.RefObject<HTMLDivElement>;
  isFocusedMode: boolean; setIsFocusedMode: React.Dispatch<React.SetStateAction<boolean>>;
  authStatus: 'unknown' | 'loggedIn' | 'loggedOut'; setAuthStatus: React.Dispatch<React.SetStateAction<'unknown' | 'loggedIn' | 'loggedOut'>>;
  playerStatus: 'notFound' | 'found'; setPlayerStatus: React.Dispatch<React.SetStateAction<'notFound' | 'found'>>;
  pageTitle: string;
  navButtons: NavButtonsConfig; setNavButtons: React.Dispatch<React.SetStateAction<NavButtonsConfig>>;
  installedInterfaces: string[];
  savePlugin: (closeEditor?: boolean) => void;
  deletePlugin: (plugin: SitePlugin) => void;
  updateEditingPlugin: (section: keyof SitePlugin | 'root', field: string, value: any) => void;
  fetchTitleForUrl: (targetUrl: string) => string;
  playerNavSignal: number;
  networkFilters: Record<string, boolean>;
  setNetworkFilters: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  adKeywords: Record<string, boolean>; setAdKeywords: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  redirectKeywords: Record<string, boolean>; setRedirectKeywords: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  inlineKeywords: Record<string, boolean>; setInlineKeywords: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  cssAdblockSelectors: Record<string, boolean>; setCssAdblockSelectors: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  runFlow: (flow: CustomFlow, initialUrl?: string) => Promise<any>;
  checkForUpdates: () => Promise<void>;
  handleNavigate: (e: React.FormEvent) => void;
  loadPlugins: () => void;
  downloadsLoc: string; setDownloadsLoc: React.Dispatch<React.SetStateAction<string>>;
  downloadsTemp: string; setDownloadsTemp: React.Dispatch<React.SetStateAction<string>>;
  blockedExts: string[]; setBlockedExts: React.Dispatch<React.SetStateAction<string[]>>;
  activeDownloads: Record<string, ActiveDownload>; setActiveDownloads: React.Dispatch<React.SetStateAction<Record<string, ActiveDownload>>>;
  isCompiledApp: boolean;
  isPortableApp: boolean;
  ffmpegStatusApp: string; setFfmpegStatusApp: React.Dispatch<React.SetStateAction<string>>;
  pluginRepoUrl: string; setPluginRepoUrl: React.Dispatch<React.SetStateAction<string>>;
  pluginUpdateCount: number; setPluginUpdateCount: React.Dispatch<React.SetStateAction<number>>;
  autoCheckPluginUpdates: boolean; setAutoCheckPluginUpdates: React.Dispatch<React.SetStateAction<boolean>>;
  autoUpdatePlugins: boolean; setAutoUpdatePlugins: React.Dispatch<React.SetStateAction<boolean>>;
  autoFocusPlayerOnTabChange: boolean; setAutoFocusPlayerOnTabChange: React.Dispatch<React.SetStateAction<boolean>>;
  ctrlClickBackgroundTab: boolean; setCtrlClickBackgroundTab: React.Dispatch<React.SetStateAction<boolean>>;
  showTilingOptions: boolean; setShowTilingOptions: React.Dispatch<React.SetStateAction<boolean>>;
  incognito: boolean; setIncognito: React.Dispatch<React.SetStateAction<boolean>>;
  autoFocusVideo: boolean; setAutoFocusVideo: React.Dispatch<React.SetStateAction<boolean>>;
  rememberTabs: boolean; setRememberTabs: React.Dispatch<React.SetStateAction<boolean>>;
  checkPluginUpdates: () => Promise<void>;
  isMultiTabEnabled: boolean; setIsMultiTabEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  browserTabs: { id: string, url: string, inputUrl: string, title?: string, isMuted?: boolean, isPlaying?: boolean, favicon?: string }[]; setBrowserTabs: React.Dispatch<React.SetStateAction<{ id: string, url: string, inputUrl: string, title?: string, isMuted?: boolean, isPlaying?: boolean, favicon?: string }[]>>;
  activeBrowserTabId: string; setActiveBrowserTabId: React.Dispatch<React.SetStateAction<string>>;
  tilingMode: 'none' | 'split-hz' | 'split-vt' | 'grid'; setTilingMode: React.Dispatch<React.SetStateAction<'none' | 'split-hz' | 'split-vt' | 'grid'>>;
  navigateUrl: (targetUrl: string, inNewTab?: boolean, isBackground?: boolean) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within an AppProvider');
  return context;
};

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [url, setUrl] = useState('https://bingekit.app/home/');
  const [inputUrl, setInputUrl] = useState('');
  const [playerNavSignal, setPlayerNavSignal] = useState(0);
  const [authStatus, setAuthStatus] = useState<'unknown' | 'loggedIn' | 'loggedOut'>('unknown');
  const [playerStatus, setPlayerStatus] = useState<'notFound' | 'found'>('notFound');
  const [pageTitle, setPageTitle] = useState<string>('');
  const [multiSearchQuery, setMultiSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const pageTitleRef = useRef<string>('');
  const playerRef = useRef<HTMLDivElement>(null);

  const navigateQueue = useRef<Array<() => void>>([]);
  const isNavigatingQueue = useRef(false);

  const processNavigateQueue = async () => {
    if (isNavigatingQueue.current || navigateQueue.current.length === 0) return;
    isNavigatingQueue.current = true;

    while (navigateQueue.current.length > 0) {
      const task = navigateQueue.current.shift();
      if (task) {
        task();
        // Give host app time to create the COM object and process its event loop
        await new Promise(r => setTimeout(r, 250));
      }
    }
    isNavigatingQueue.current = false;
  };

  const general = useGeneralState();
  const settings = useSettingsState();
  const downloads = useDownloadsState();

  const computeNavUrl = (target: string) => {
    let navUrl = target;
    if (target.startsWith('edge://')) {
      navUrl = target;
    } else if (target === 'about:blank') {
      navUrl = 'http://blank.localhost/';
    } else if (target.startsWith('custom:')) {
      navUrl = `http://blank.localhost/#${target}`;
    } else if (target.startsWith('interface:')) {
      let path = target.replace('interface:', '');
      if (!path.includes('.')) {
        if (path && !path.endsWith('/')) { path += '/'; }
        path += 'index.html';
      }
      navUrl = `http://interface.localhost/${path}`;
    } else if (target.startsWith('view-source:')) {
      navUrl = `http://blank.localhost/#custom:view-source#${target.substring(12)}`;
    }
    return navUrl;
  };

  const tabs = useTabsState(
    general.activeTab,
    general.setActiveTab,
    url,
    setUrl,
    setInputUrl,
    setPageTitle,
    setAuthStatus,
    setPlayerStatus,
    pageTitleRef,
    computeNavUrl,
    setPlayerNavSignal
  );

  const plugins = usePluginsState(
    url,
    general.theme,
    settings.setNetworkFilters,
    [], // credentials temp empty, filled by history
    [], // followed temp empty, filled by history
    () => { }, // setFollowedItems temp empty
    settings.pluginRepoUrl,
    settings.autoCheckPluginUpdates,
    settings.autoUpdatePlugins,
    setMultiSearchQuery,
    general.setSearchParamMode,
    general.setActiveTab,
    computeNavUrl
  );

  const history = useHistoryState(url, general.activeTab, plugins.plugins, pageTitleRef, tabs.setBrowserTabs, playerNavSignal);

  // Patch references
  useEffect(() => {
    plugins.plugins.forEach(() => { }); // trigger re-render if needed
  }, [plugins.plugins]);

  const navigateUrl = (targetUrl: string, inNewTab: boolean = false, isBackground: boolean = false) => {
    let finalUrl = targetUrl.trim();
    if (finalUrl === 'about:config') {
      general.setActiveTab('config');
      return;
    }
    if (finalUrl.startsWith('about:') || finalUrl.startsWith('err://') || finalUrl.startsWith('custom:') || finalUrl.startsWith('interface:') || finalUrl.startsWith('file:') || finalUrl.startsWith('data:') || finalUrl.startsWith('view-source:')) {
      // Leave as is
    } else if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      if (!finalUrl.includes('.') || finalUrl.includes(' ')) {
        finalUrl = `${settings.defaultSearchEngine}${encodeURIComponent(finalUrl)}`;
      } else {
        finalUrl = `https://${finalUrl}`;
      }
    }

    if (inNewTab) {
      navigateQueue.current.push(() => {
        const newId = Date.now().toString() + '_' + Math.random().toString(36).substring(2, 9);
        tabs.setBrowserTabs(prev => [...prev, { id: newId, url: finalUrl, inputUrl: finalUrl }]);
        tabs.lastSyncUrls.current[newId] = finalUrl;
        ahk.asyncCall('UpdatePlayerUrl', computeNavUrl(finalUrl), newId);
        if (!isBackground) {
          tabs.setActiveBrowserTabId(newId);
          if (settings.autoFocusPlayerOnTabChange) general.setActiveTab('player');
          setPlayerNavSignal(s => s + 1);
        }
      });
      processNavigateQueue();
    } else {
      setUrl(finalUrl);
      setInputUrl(finalUrl);
      general.setActiveTab('player');

      tabs.setBrowserTabs(prev => {
        const newTabs = [...prev];
        const idx = newTabs.findIndex(t => t.id === tabs.activeBrowserTabId);
        if (idx >= 0) {
          newTabs[idx] = { ...newTabs[idx], url: finalUrl, inputUrl: finalUrl };
        }
        return newTabs;
      });
      tabs.lastSyncUrls.current[tabs.activeBrowserTabId] = finalUrl;
      ahk.asyncCall('UpdatePlayerUrl', computeNavUrl(finalUrl), tabs.activeBrowserTabId);
      ahk.asyncCall('UpdateURL', finalUrl, tabs.activeBrowserTabId);
      setPlayerNavSignal(s => s + 1);
    }
  };

  const handleNavigate = (e: React.FormEvent) => {
    e.preventDefault();
    navigateUrl(inputUrl);
  };

  useEffect(() => {
    const handleRemoteNavigate = (e: any) => {
      if (e.detail && e.detail.url) {
        navigateUrl(e.detail.url, e.detail.newTab && tabs.isMultiTabEnabled, e.detail.background);
      }
    };
    window.addEventListener('bk-remote-navigate', handleRemoteNavigate);
    return () => window.removeEventListener('bk-remote-navigate', handleRemoteNavigate);
  });

  // Initial loads that need ahk
  useEffect(() => {
    const savedBookmarks = ahk.call('LoadData', 'bookmarks.json');
    if (savedBookmarks) {
      try { history.setBookmarks(JSON.parse(savedBookmarks)); } catch (e) { }
    } else {
      history.setBookmarks([
        { id: '1', title: 'Netflix', url: 'https://netflix.com' },
        { id: '2', title: 'Hulu', url: 'https://hulu.com' },
      ]);
    }

    const initHistorySystem = async () => {
      const savedHistory = ahk.call('LoadData', 'history.json');
      if (savedHistory) {
        try {
          const legacyParsed = JSON.parse(savedHistory);
          if (Array.isArray(legacyParsed) && legacyParsed.length > 0) {
            await bulkAddHistory(legacyParsed);
          }
          ahk.call('DeleteData', 'history.json');
        } catch (e) { }
      }
      try {
        const idbHistory = await getHistory(2000);
        history.setHistory(idbHistory);
      } catch (e) { }
    };
    initHistorySystem();

    const savedFollowed = ahk.call('LoadData', 'followed.json');
    if (savedFollowed) { try { history.setFollowedItems(JSON.parse(savedFollowed)); } catch (e) { } }

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
              parsed.forEach((f: any) => {
                loadedFlows.push(f);
                ahk.call('SaveFlow', `flow_${f.id}.json`, JSON.stringify(f, null, 2));
              });
            }
          } catch (e) { }
        }
      }
      plugins.setFlows(loadedFlows);
    };
    loadFlows();

    const savedWatchLater = ahk.call('LoadData', 'watchlater.json');
    if (savedWatchLater) { try { history.setWatchLater(JSON.parse(savedWatchLater)); } catch (e) { } }

    const initCredentialsSystem = async () => {
      const savedCreds = ahk.call('LoadData', 'credentials.json');
      if (savedCreds) {
        try {
          const legacyParsed = JSON.parse(savedCreds);
          if (Array.isArray(legacyParsed) && legacyParsed.length > 0) {
            for (const cred of legacyParsed) {
              if (cred.passwordBase64) {
                try {
                  const plainPass = atob(cred.passwordBase64);
                  const encPass = await ahk.asyncCall('EncryptCredential', plainPass);
                  cred.passwordBase64 = encPass;
                } catch (e) { }
              }
              await addCredentialDB(cred);
            }
          }
          ahk.call('DeleteData', 'credentials.json');
        } catch (e) { }
      }
      try {
        const idbCreds = await getCredentialsDB();
        history.setCredentials(idbCreds);
      } catch (e) { }
    };
    initCredentialsSystem();

    const savedFilters = ahk.call('LoadData', 'network_filters.json');
    if (savedFilters) {
      try {
        const parsed = JSON.parse(savedFilters);
        if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
          settings.setNetworkFilters(parsed);
        } else {
          settings.setNetworkFilters(adblockDefaults.networkFilters);
        }
      } catch (e) { }
    } else {
      settings.setNetworkFilters(adblockDefaults.networkFilters);
    }

    const savedAdblockWhitelist = ahk.call('LoadData', 'adblock_whitelist.json');
    if (savedAdblockWhitelist) {
      try {
        const parsed = JSON.parse(savedAdblockWhitelist);
        if (Array.isArray(parsed)) settings.setAdblockWhitelist(parsed);
      } catch (e) { }
    }

    const savedAdblockEnabled = ahk.call('LoadData', 'adblock_enabled.txt');
    if (savedAdblockEnabled) {
      settings.setIsAdblockEnabled(savedAdblockEnabled === 'true');
    }

    const savedAdKeywords = ahk.call('LoadData', 'ad_keywords.json');
    if (savedAdKeywords) {
      try { const p = JSON.parse(savedAdKeywords); settings.setAdKeywords(Array.isArray(p) ? Object.fromEntries(p.map(k => [k, true])) : p); } catch (e) { }
    } else {
      settings.setAdKeywords(Object.fromEntries(adblockDefaults.adKeywords.map(k => [k, true])));
    }

    const savedRedirectKeywords = ahk.call('LoadData', 'redirect_keywords.json');
    if (savedRedirectKeywords) {
      try { const p = JSON.parse(savedRedirectKeywords); settings.setRedirectKeywords(Array.isArray(p) ? Object.fromEntries(p.map(k => [k, true])) : p); } catch (e) { }
    } else {
      settings.setRedirectKeywords(Object.fromEntries(adblockDefaults.redirectKeywords.map(k => [k, true])));
    }

    const savedInlineKeywords = ahk.call('LoadData', 'inline_keywords.json');
    if (savedInlineKeywords) {
      try { const p = JSON.parse(savedInlineKeywords); settings.setInlineKeywords(Array.isArray(p) ? Object.fromEntries(p.map(k => [k, true])) : p); } catch (e) { }
    } else {
      settings.setInlineKeywords(Object.fromEntries(adblockDefaults.inlineKeywords.map(k => [k, true])));
    }

    const savedCssAdblockSelectors = ahk.call('LoadData', 'css_adblock_selectors.json');
    if (savedCssAdblockSelectors) {
      try { const p = JSON.parse(savedCssAdblockSelectors); settings.setCssAdblockSelectors(Array.isArray(p) ? Object.fromEntries(p.map(k => [k, true])) : p); } catch (e) { }
    } else {
      settings.setCssAdblockSelectors(Object.fromEntries(adblockDefaults.cssAdblockSelectors.map(k => [k, true])));
    }

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
              parsed.forEach((s: any) => {
                loadedScripts.push(s);
                ahk.call('SaveScript', `script_${s.id}.json`, JSON.stringify(s, null, 2));
              });
            }
          } catch (e) { }
        }
      }
      plugins.setUserscripts(loadedScripts);
    };
    loadUserscripts();
    plugins.loadPlugins();

    const savedTheme = ahk.call('LoadData', 'theme.json');
    if (savedTheme) {
      try {
        const parsed = JSON.parse(savedTheme);
        general.setTheme({
          mode: parsed.mode || 'dark',
          titlebarBg: parsed.titlebarBg || parsed.bgMain || '#09090b',
          sidebarBg: parsed.sidebarBg || parsed.bgSec || '#09090b',
          main: parsed.main || parsed.bgMain || '#09090b',
          border: parsed.border || '#27272a',
          accent: parsed.accent || '#6366f1',
          textMain: parsed.textMain || '#fafafa',
          textSec: parsed.textSec || '#a1a1aa',
          titlebarText: parsed.titlebarText || parsed.textSec || '#a1a1aa',
          titlebarTextHover: parsed.titlebarTextHover || parsed.textMain || '#fafafa',
          titlebarAccent: parsed.titlebarAccent || parsed.accent || '#6366f1',
          titlebarAlt: parsed.titlebarAlt || '#18181b',
          titlebarAlt2: parsed.titlebarAlt2 || '#27272a',
          sidebarText: parsed.sidebarText || parsed.textSec || '#a1a1aa',
          urlbarBg: parsed.urlbarBg || '',
          urlbarText: parsed.urlbarText || '',
          urlbarIcon: parsed.urlbarIcon || ''
        });
      } catch (e) { }
    }

    const savedSearchEngine = ahk.call('LoadData', 'search_engine.txt');
    if (savedSearchEngine) { settings.setDefaultSearchEngine(savedSearchEngine); }

    const savedThreadLimit = ahk.call('LoadData', 'search_thread_limit.txt');
    if (savedThreadLimit) { try { settings.setSearchThreadLimit(parseInt(savedThreadLimit) || 5); } catch (e) { } }

    const savedHomePage = ahk.call('LoadData', 'home_page.txt');
    const computedHomeUrl = savedHomePage || 'https://bingekit.app/home/';
    if (savedHomePage) {
      general.setHomePage(savedHomePage);
    }

    let shouldRemember = true;
    try {
      const configStr = ahk.call('GetAboutConfig');
      if (configStr) {
        const parsed = JSON.parse(configStr);
        if (parsed.RememberTabs !== undefined) shouldRemember = parsed.RememberTabs;
      }
    } catch (e) { }

    let loadedTabs = false;
    if (shouldRemember) {
      const savedTabs = ahk.call('LoadData', 'active_tabs.json');
      const savedTabId = ahk.call('LoadData', 'active_tab_id.txt');
      // Wait for any UI flashes or state unmounts to clear before marking ready to save
      if (savedTabs) {
        try {
          const parsedTabs = JSON.parse(savedTabs);
          if (Array.isArray(parsedTabs) && parsedTabs.length > 0) {
            tabs.setBrowserTabs(parsedTabs);
            const initialTabId = savedTabId || parsedTabs[0].id;
            tabs.setActiveBrowserTabId(initialTabId);
            const activeTabObj = parsedTabs.find(t => t.id === initialTabId);
            const safeUrl = activeTabObj ? activeTabObj.url : computedHomeUrl;
            setUrl(safeUrl);
            setInputUrl(safeUrl);

            parsedTabs.forEach((t: any) => {
              tabs.lastSyncUrls.current[t.id] = t.url;
              ahk.asyncCall('UpdatePlayerUrl', computeNavUrl(t.url), t.id);
            });
            ahk.call('SyncPlayers', parsedTabs.map((t: any) => t.id).join(','));
            loadedTabs = true;
          } else {
            ahk.call('ShowToast', 'Parsed tabs was empty or not array.');
          }
        } catch (e: any) {
          ahk.call('ShowToast', 'Failed to parse active_tabs.json: ' + String(e));
        }
      } else {
        // Graceful fallback internally managed, no toast required
      }
    }

    if (!loadedTabs) {
      setUrl(computedHomeUrl);
      setInputUrl(computedHomeUrl);
      tabs.setBrowserTabs(prev => [{ ...prev[0], id: 'main', url: computedHomeUrl, inputUrl: computedHomeUrl }]);
      tabs.setActiveBrowserTabId('main');
      ahk.call('UpdatePlayerUrl', computeNavUrl(computedHomeUrl), 'main');
      tabs.lastSyncUrls.current['main'] = computedHomeUrl;
      ahk.call('SyncPlayers', 'main');
    }

    tabs.setIsReadyToSave(true);

    const savedNavButtons = ahk.call('LoadData', 'nav_buttons.json');
    if (savedNavButtons) {
      try { settings.setNavButtons(JSON.parse(savedNavButtons)); } catch (e) { }
    }
    const interfacesStr = ahk.call('ListInterfaces');
    if (interfacesStr) {
      settings.setInstalledInterfaces(interfacesStr.split('|').filter(Boolean));
    }

    const savedDlLoc = ahk.call('LoadData', 'downloads_loc.txt');
    if (savedDlLoc) downloads.setDownloadsLoc(savedDlLoc);

    const savedDlTemp = ahk.call('LoadData', 'downloads_temp.txt');
    if (savedDlTemp) downloads.setDownloadsTemp(savedDlTemp);

    const savedMultiTab = ahk.call('LoadData', 'multi_tab_enabled.txt');
    if (savedMultiTab) tabs.setIsMultiTabEnabled(savedMultiTab === 'true');

    const savedBlockedExts = ahk.call('LoadData', 'blocked_exts.json');
    if (savedBlockedExts) {
      try { downloads.setBlockedExts(JSON.parse(savedBlockedExts)); } catch (e) { }
    }

    const savedUrlBarMode = ahk.call('LoadData', 'url_bar_mode.txt');
    if (savedUrlBarMode) general.setUrlBarMode(savedUrlBarMode as any);

    const savedSettingsTab = ahk.call('LoadData', 'active_settings_tab.txt');
    if (savedSettingsTab) general.setActiveSettingsTab(savedSettingsTab as any);

    const savedOptionsHidden = ahk.call('LoadData', 'quick_options_hidden.txt');
    if (savedOptionsHidden) general.setIsQuickOptionsHidden(savedOptionsHidden === 'true');

    const savedFocusedMode = ahk.call('LoadData', 'focused_mode.txt');
    if (savedFocusedMode) general.setIsFocusedMode(savedFocusedMode === 'true');

    const savedSearchParamMode = ahk.call('LoadData', 'search_param_mode.txt');
    if (savedSearchParamMode) general.setSearchParamMode(savedSearchParamMode as any);

    try {
      const mode = ahk.call('GetStorageMode');
      settings.setIsPortableApp(mode === '1' || mode === 1 || mode === true);
      const comp = ahk.call('IsCompiled');
      settings.setIsCompiledApp(comp === '1' || comp === 1 || comp === true);
      settings.setFfmpegStatusApp(ahk.call('CheckFFmpegStatus') || 'missing');

      const configStr = ahk.call('GetAboutConfig');
      if (configStr) {
        const parsed = JSON.parse(configStr);
        if (parsed.PluginRepoUrl !== undefined) settings.setPluginRepoUrl(parsed.PluginRepoUrl);
        if (parsed.AutoCheckPluginUpdates !== undefined) settings.setAutoCheckPluginUpdates(parsed.AutoCheckPluginUpdates);
        if (parsed.AutoUpdatePlugins !== undefined) settings.setAutoUpdatePlugins(parsed.AutoUpdatePlugins);
        if (parsed.AutoFocusPlayerOnTabChange !== undefined) settings.setAutoFocusPlayerOnTabChange(parsed.AutoFocusPlayerOnTabChange);
        if (parsed.CtrlClickBackgroundTab !== undefined) settings.setCtrlClickBackgroundTab(parsed.CtrlClickBackgroundTab);
        if (parsed.AutoFocusVideo !== undefined) settings.setAutoFocusVideo(parsed.AutoFocusVideo);
        if (parsed.RememberTabs !== undefined) settings.setRememberTabs(parsed.RememberTabs);
        if (parsed.ShowTilingOptions !== undefined) settings.setShowTilingOptions(parsed.ShowTilingOptions);
        if (parsed.Incognito !== undefined) settings.setIncognito(parsed.Incognito);
      }
    } catch (e) { }
    // De-bounce the Splash Hide so that components have realistically mounted after the massive synchronous event loop parsing. 150ms is visually seamless.
    setTimeout(() => ahk.call('HideSplash'), 150);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runFlowWithDefaults = (flow: CustomFlow, initialUrl?: string) => plugins.runFlow(flow, multiSearchQuery, initialUrl || url, {});

  const value = {
    url, setUrl, inputUrl, setInputUrl,
    authStatus, setAuthStatus, playerStatus, setPlayerStatus, pageTitle, playerRef,
    multiSearchQuery, setMultiSearchQuery, searchResults, setSearchResults, isSearching, setIsSearching,
    navigateUrl, handleNavigate, fetchTitleForUrl: history.fetchTitleForUrl,
    playerNavSignal,
    runFlow: runFlowWithDefaults,
    ...general,
    ...settings,
    ...downloads,
    ...tabs,
    ...history,
    ...plugins
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
