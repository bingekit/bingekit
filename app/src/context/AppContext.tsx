import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { ahk } from '../lib/ahk';
import { ensureAuthForPlugin } from '../lib/authHelper';
import { resolvePluginUrl } from '../lib/urlHelper';
import {
  BookmarkItem, WatchLaterItem, CredentialItem,
  FollowedItem, CustomFlow, Userscript, SitePlugin, HistoryItem, DiscoveryItem, ActiveDownload
} from '../types';
export type NavButtonsConfig = { home: boolean; back: boolean; forward: boolean; reload: boolean };

interface AppContextType {
  url: string; setUrl: React.Dispatch<React.SetStateAction<string>>;
  inputUrl: string; setInputUrl: React.Dispatch<React.SetStateAction<string>>;
  isAdblockEnabled: boolean; setIsAdblockEnabled: React.Dispatch<React.SetStateAction<boolean>>;
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
  testSearchQuery: string; setTestSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  testSearchResults: any; setTestSearchResults: React.Dispatch<React.SetStateAction<any>>;
  isTestingSearch: boolean; setIsTestingSearch: React.Dispatch<React.SetStateAction<boolean>>;
  flows: CustomFlow[]; setFlows: React.Dispatch<React.SetStateAction<CustomFlow[]>>;
  editingFlow: CustomFlow | null; setEditingFlow: React.Dispatch<React.SetStateAction<CustomFlow | null>>;
  userscripts: Userscript[]; setUserscripts: React.Dispatch<React.SetStateAction<Userscript[]>>;
  editingUserscriptId: string | null; setEditingUserscriptId: React.Dispatch<React.SetStateAction<string | null>>;
  activeTab: 'dashboard' | 'player' | 'bookmarks' | 'watchlater' | 'plugins' | 'activity' | 'settings' | 'flows' | 'userscripts' | 'history' | 'discovery' | 'workspaces' | 'downloads' | 'config';
  setActiveTab: React.Dispatch<React.SetStateAction<any>>;
  activeSettingsTab: 'general' | 'appearance' | 'downloads' | 'privacy' | 'advanced';
  setActiveSettingsTab: React.Dispatch<React.SetStateAction<'general' | 'appearance' | 'downloads' | 'privacy' | 'advanced'>>;
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

  savePlugin: () => void;
  deletePlugin: (plugin: SitePlugin) => void;
  updateEditingPlugin: (section: keyof SitePlugin | 'root', field: string, value: any) => void;
  fetchTitleForUrl: (targetUrl: string) => string;
  networkFilters: Record<string, boolean>;
  setNetworkFilters: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  runFlow: (flow: CustomFlow, initialUrl?: string) => Promise<void>;
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
  checkPluginUpdates: () => Promise<void>;
  isMultiTabEnabled: boolean; setIsMultiTabEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  browserTabs: { id: string, url: string, inputUrl: string, title?: string }[]; setBrowserTabs: React.Dispatch<React.SetStateAction<{ id: string, url: string, inputUrl: string, title?: string }[]>>;
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
  const [navButtons, setNavButtons] = useState<NavButtonsConfig>({ home: true, back: true, forward: true, reload: true });
  const [installedInterfaces, setInstalledInterfaces] = useState<string[]>([]);
  const [homePage, setHomePage] = useState('https://bingekit.app/start/');
  const [url, setUrl] = useState('https://bingekit.app/start/');
  const [inputUrl, setInputUrl] = useState(url);
  const [isAdblockEnabled, setIsAdblockEnabled] = useState(true);
  const [downloadsLoc, setDownloadsLoc] = useState('');
  const [downloadsTemp, setDownloadsTemp] = useState('');
  const [blockedExts, setBlockedExts] = useState<string[]>(['.exe', '.msi', '.bat', '.cmd', '.scr', '.vbs']);
  const [activeDownloads, setActiveDownloads] = useState<Record<string, ActiveDownload>>({});
  const [networkFilters, setNetworkFilters] = useState<Record<string, boolean>>({});
  const [urlBarMode, setUrlBarMode] = useState<'full' | 'title' | 'hidden'>('full');
  const [isCompiledApp, setIsCompiledApp] = useState(true);
  const [isPortableApp, setIsPortableApp] = useState(false);
  const [ffmpegStatusApp, setFfmpegStatusApp] = useState('checking...');
  const [pluginRepoUrl, setPluginRepoUrl] = useState('https://raw.githubusercontent.com/owhs/bingekit/main/repo_example/repo.json');
  const [pluginUpdateCount, setPluginUpdateCount] = useState(0);
  const [autoCheckPluginUpdates, setAutoCheckPluginUpdates] = useState(true);
  const [autoUpdatePlugins, setAutoUpdatePlugins] = useState(false);
  const [autoFocusPlayerOnTabChange, setAutoFocusPlayerOnTabChange] = useState(true);
  const [ctrlClickBackgroundTab, setCtrlClickBackgroundTab] = useState(true);
  const [isMultiTabEnabled, setIsMultiTabEnabled] = useState(false);
  const [browserTabs, setBrowserTabs] = useState<{ id: string, url: string, inputUrl: string, title?: string }[]>([{ id: 'main', url: 'https://bingekit.app/start/', inputUrl: 'https://bingekit.app/start/' }]);
  const [activeBrowserTabId, setActiveBrowserTabId] = useState('main');
  const [tilingMode, setTilingMode] = useState<'none' | 'split-hz' | 'split-vt' | 'grid'>('none');
  const activeBrowserTabIdRef = useRef('main');
  useEffect(() => { activeBrowserTabIdRef.current = activeBrowserTabId; }, [activeBrowserTabId]);

  const isInitialThemeMount = useRef(true);
  const isInitialHistoryMount = useRef(true);
  const isInitialDiscoveryMount = useRef(true);
  const isInitialHistoryEnabledMount = useRef(true);
  const isInitialHomePageMount = useRef(true);
  const isInitialMultiTabMount = useRef(true);

  useEffect(() => {
    activeBrowserTabIdRef.current = activeBrowserTabId;
    try { ahk.call('SetActiveTabId', activeBrowserTabId); } catch (e) { }

    // Sync the global URL states to the active tab's preserved URL
    const activeTabObj = browserTabs.find(t => t.id === activeBrowserTabId);
    if (activeTabObj) {
      if (activeTabObj.url !== url) {
        lastSyncUrls.current[activeBrowserTabId] = activeTabObj.url;
        setUrl(activeTabObj.url);
        setInputUrl(activeTabObj.inputUrl || activeTabObj.url);
        document.title = activeTabObj.title || 'BingeKit';
      }
    }
  }, [activeBrowserTabId, browserTabs]);
  const [theme, setTheme] = useState({
    mode: 'dark',
    titlebarBg: '#09090b',
    sidebarBg: '#09090b',
    mainBg: '#09090b',
    border: '#27272a',
    accent: '#6366f1',
    textMain: '#fafafa',
    textSec: '#a1a1aa',
    titlebarText: '#a1a1aa',
    titlebarTextHover: '#fafafa',
    titlebarAccent: '#6366f1',
    titlebarAlt: '#18181b',
    titlebarAlt2: '#27272a',
    sidebarText: '#a1a1aa',
    urlbarBg: ''
  });
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isHistoryEnabled, setIsHistoryEnabled] = useState(true);
  const [discoveryItems, setDiscoveryItems] = useState<DiscoveryItem[]>([]);
  const isHistoryEnabledRef = useRef(true);
  useEffect(() => { isHistoryEnabledRef.current = isHistoryEnabled; }, [isHistoryEnabled]);

  const [selectedBookmarks, setSelectedBookmarks] = useState<string[]>([]);
  const [followedItems, setFollowedItems] = useState<FollowedItem[]>([]);
  const [isCheckingUpdates, setIsCheckingUpdates] = useState(false);
  const [plugins, setPlugins] = useState<SitePlugin[]>([]);
  const [editingPlugin, setEditingPlugin] = useState<SitePlugin | null>(null);
  const [testSearchQuery, setTestSearchQuery] = useState('matrix');
  const [testSearchResults, setTestSearchResults] = useState<{ status: string, nodesCount: number, results: any[] }>({ status: 'idle', nodesCount: 0, results: [] });
  const [isTestingSearch, setIsTestingSearch] = useState(false);
  const [flows, setFlows] = useState<CustomFlow[]>([]);
  const [editingFlow, setEditingFlow] = useState<CustomFlow | null>(null);
  const [userscripts, setUserscripts] = useState<Userscript[]>([]);
  const [editingUserscriptId, setEditingUserscriptId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'player' | 'bookmarks' | 'watchlater' | 'plugins' | 'activity' | 'settings' | 'flows' | 'userscripts' | 'history' | 'discovery' | 'workspaces' | 'downloads' | 'config'>('dashboard');
  const [activeSettingsTab, setActiveSettingsTab] = useState<'general' | 'appearance' | 'downloads' | 'privacy' | 'advanced'>('general');
  const [multiSearchQuery, setMultiSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [watchLater, setWatchLater] = useState<WatchLaterItem[]>([]);
  const [credentials, setCredentials] = useState<CredentialItem[]>([]);
  const [newCred, setNewCred] = useState({ domain: '', username: '', password: '' });
  const [bookmarkSearchQuery, setBookmarkSearchQuery] = useState('');
  const [editingBookmarkId, setEditingBookmarkId] = useState<string | null>(null);
  const [showCredModal, setShowCredModal] = useState(false);
  const [searchParamMode, setSearchParamMode] = useState<'fetch' | 'navigate'>('fetch');
  const [searchThreadLimit, setSearchThreadLimit] = useState(5);
  const [isQuickOptionsHidden, setIsQuickOptionsHidden] = useState(true);
  const [defaultSearchEngine, setDefaultSearchEngine] = useState('https://duckduckgo.com/?q=');
  const playerRef = useRef<HTMLDivElement>(null);
  const lastRectRef = useRef('');
  const lastSyncUrls = useRef<Record<string, string>>({});

  const [isFocusedMode, setIsFocusedMode] = useState<boolean>(false);
  const [authStatus, setAuthStatus] = useState<'unknown' | 'loggedIn' | 'loggedOut'>('unknown');
  const [playerStatus, setPlayerStatus] = useState<'notFound' | 'found'>('notFound');
  const [pageTitle, setPageTitle] = useState<string>('');
  const pageTitleRef = useRef<string>('');



  const computeNavUrl = (target: string) => {
    let navUrl = target;
    if (target === 'about:blank') {
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
    }
    return navUrl;
  };

  const previousTabIdRef = useRef(activeBrowserTabId);

  useEffect(() => {
    if (previousTabIdRef.current !== activeBrowserTabId) {
      previousTabIdRef.current = activeBrowserTabId;
      return;
    }

    if (activeTab === 'player') {
      const currentLast = lastSyncUrls.current[activeBrowserTabId];
      if (currentLast !== url) {
        lastSyncUrls.current[activeBrowserTabId] = url;
        const navUrl = computeNavUrl(url);
        ahk.call('UpdatePlayerUrl', navUrl, activeBrowserTabId);
        ahk.call('UpdateURL', url, activeBrowserTabId);
      }
    }
  }, [activeTab, url, activeBrowserTabId]);

  useEffect(() => {
    const handleEvent = (e: any) => {
      if (e.detail && e.detail.url) {
        console.log("player-url-changed", e.detail.url);
        const eventTabId = e.detail.tabId || 'main';
        const eventLastSync = lastSyncUrls.current[eventTabId];
        if ((e.detail.url === 'about:blank' || e.detail.url === 'err://' || e.detail.url.startsWith('data:text/html')) && (eventLastSync?.startsWith('custom:') || eventLastSync === 'about:blank')) {
          return;
        }
        let reportedUrl = e.detail.url;
        if (reportedUrl.startsWith('http://interface.localhost/')) {
          reportedUrl = reportedUrl.replace('http://interface.localhost/', 'interface:');
          reportedUrl = reportedUrl.replace(/\/index\.html?$/i, '');
          reportedUrl = reportedUrl.replace(/index\.html?$/i, '');
          reportedUrl = reportedUrl.replace(/\/$/, '');
        }
        setBrowserTabs(prev => {
          const newTabs = [...prev];
          const tabIdx = newTabs.findIndex(t => t.id === eventTabId);
          if (tabIdx >= 0) {
            newTabs[tabIdx] = { ...newTabs[tabIdx], url: reportedUrl, inputUrl: reportedUrl };
          } else {
            newTabs.push({ id: eventTabId, url: reportedUrl, inputUrl: reportedUrl });
          }
          return newTabs;
        });
        lastSyncUrls.current[eventTabId] = reportedUrl;
        if (eventTabId === activeBrowserTabIdRef.current) {
          setUrl(reportedUrl);
          setInputUrl(reportedUrl);
          setPageTitle('');
          pageTitleRef.current = '';
        }
      }
    };
    window.addEventListener('player-url-changed', handleEvent);

    const handleMsg = (e: MessageEvent) => {
      if (e.data?.type === 'addNetworkFilter' && e.data?.term) {
        setNetworkFilters(prev => ({ ...(prev || {}), [e.data.term]: true }));
      }
    };
    window.addEventListener('message', handleMsg);

    const handleStatusUpdate = (e: any) => {
      if (e.detail) {
        const eventTabId = e.detail.tabId || 'main';

        let safeTitle = e.detail.title;
        if (!safeTitle || safeTitle.trim() === '') {
          safeTitle = '';
        } else {
          if (safeTitle.startsWith('blank.localhost/#')) {
            safeTitle = safeTitle.substring('blank.localhost/#'.length);
          } else if (safeTitle.startsWith('http://blank.localhost/#')) {
            safeTitle = safeTitle.substring('http://blank.localhost/#'.length);
          }
          if (safeTitle.startsWith('interface.localhost/')) {
            safeTitle = safeTitle.substring('interface.localhost/'.length).replace(/\/index\.html?$/i, '').replace(/\/$/, '');
          }
          if (safeTitle === 'blank.localhost' || safeTitle.startsWith('blank.localhost/')) {
            //safeTitle = 'New Tab';
          }
          if (safeTitle === 'about:blank' || safeTitle === 'err://' || safeTitle.startsWith('data:')) {
            //safeTitle = 'New Tab';
          }
        }

        setBrowserTabs(prev => {
          const newTabs = [...prev];
          const tabIdx = newTabs.findIndex(t => t.id === eventTabId);
          if (tabIdx >= 0) {
            newTabs[tabIdx] = { ...newTabs[tabIdx], title: safeTitle };
          }
          return newTabs;
        });

        if (eventTabId === activeBrowserTabIdRef.current) {
          if (e.detail.authStatus !== undefined) setAuthStatus(e.detail.authStatus);
          if (e.detail.hasPlayer !== undefined) setPlayerStatus(e.detail.hasPlayer ? 'found' : 'notFound');
          setPageTitle(safeTitle);
          pageTitleRef.current = safeTitle;
        }
      }
    };
    window.addEventListener('player-status-update', handleStatusUpdate);

    const handleFaviconUpdate = (e: any) => {
      if (e.detail && e.detail.favicon !== undefined) {
        setBrowserTabs(prev => {
          const newTabs = [...prev];
          const tabIdx = newTabs.findIndex(t => t.id === (e.detail.tabId || 'main'));
          if (tabIdx >= 0) {
            newTabs[tabIdx] = { ...newTabs[tabIdx], favicon: e.detail.favicon };
          }
          return newTabs;
        });
      }
    };
    window.addEventListener('player-favicon-update', handleFaviconUpdate);

    return () => {
      window.removeEventListener('player-url-changed', handleEvent);
      window.removeEventListener('message', handleMsg);
      window.removeEventListener('player-status-update', handleStatusUpdate);
      window.removeEventListener('player-favicon-update', handleFaviconUpdate);
    };
  }, []);

  // History tracking: Browse
  useEffect(() => {
    if (!isHistoryEnabled) return;
    if (activeTab === 'player' && url && !url.startsWith('about:blank') && !url.startsWith('data:')) {
      const timer = setTimeout(() => {
        setHistory(prev => {
          if (prev.length > 0 && prev[0].url === url && prev[0].type === 'browse' && (Date.now() - prev[0].timestamp < 5 * 60 * 1000)) {
            return prev;
          }
          const host = (() => { try { return new URL(url).hostname } catch { return url } })();
          const rawTitle = pageTitleRef.current || fetchTitleForUrl(url) || host;
          const cleanTitle = rawTitle.replace(/[^\x20-\x7E]/g, "").trim();
          const newItem: HistoryItem = {
            id: Date.now().toString(),
            url,
            title: cleanTitle,
            timestamp: Date.now(),
            domain: host,
            type: 'browse'
          };
          return [newItem, ...prev].slice(0, 1000);
        });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [url, activeTab, isHistoryEnabled]);

  // History tracking: Watch
  useEffect(() => {
    if (!isHistoryEnabled || activeTab !== 'player') return;

    let totalWatchMs = 0;
    let lastPlayTime = Date.now();
    let isCurrentlyPlaying = false;
    let saveTimer: any;

    let latestTime = 0;
    let latestDur = 0;

    const recordWatchSegment = () => {
      const now = Date.now();
      if (isCurrentlyPlaying) {
        totalWatchMs += (now - lastPlayTime);
        lastPlayTime = now;
      }

      if (totalWatchMs < 2000) return; // Ignore < 2 seconds of play

      const timeToSave = totalWatchMs;
      totalWatchMs = 0; // Immediately clear so subsequent intervals don't double count
      const currentUrl = url;

      setHistory(prev => {
        const host = (() => { try { return new URL(currentUrl).hostname } catch { return currentUrl } })();
        let newHistory = [...prev];
        const existingIdx = newHistory.findIndex(h => h.url === currentUrl && h.type === 'watch' && (Date.now() - h.timestamp < 12 * 60 * 60 * 1000));

        let tags: string[] = [];
        const plugin = plugins.find(p => currentUrl.includes(p.baseUrl) || (() => { try { return p.baseUrl.includes(new URL(currentUrl).hostname); } catch { return false; } })());
        if (plugin?.tags) tags = plugin.tags;

        if (existingIdx >= 0) {
          const item = { ...newHistory[existingIdx] };
          item.watchDuration = (item.watchDuration || 0) + timeToSave;
          item.timestamp = Date.now();
          if (latestTime > 0) item.currentTime = latestTime;
          if (latestDur > 0) item.duration = latestDur;
          if (tags.length > 0) item.tags = tags;
          newHistory[existingIdx] = item;
        } else {
          const rawTitle = pageTitleRef.current || fetchTitleForUrl(currentUrl) || host;
          const cleanTitle = rawTitle.replace(/[^\x20-\x7E]/g, "").trim();
          newHistory.unshift({
            id: Date.now().toString() + 'w',
            url: currentUrl,
            title: cleanTitle,
            timestamp: Date.now(),
            domain: host,
            type: 'watch',
            watchDuration: timeToSave,
            currentTime: latestTime > 0 ? latestTime : undefined,
            duration: latestDur > 0 ? latestDur : undefined,
            tags
          });
        }
        return newHistory.slice(0, 1000);
      });
    };

    const handlePlayState = (e: any) => {
      if (e.detail && e.detail.isPlaying !== undefined) {
        const now = Date.now();
        if (!(window as any)._svGlobalPipMode) {
          setIsFocusedMode(e.detail.isPlaying); // Update global UI focus context
        }
        if (e.detail.currentTime !== undefined) latestTime = e.detail.currentTime;
        if (e.detail.duration !== undefined) latestDur = e.detail.duration;

        if (e.detail.isPlaying && !isCurrentlyPlaying) {
          isCurrentlyPlaying = true;
          lastPlayTime = now;
        } else if (!e.detail.isPlaying && isCurrentlyPlaying) {
          isCurrentlyPlaying = false;
          recordWatchSegment();
        }
      }
    };

    const handlePipState = (e: any) => {
      (window as any)._svGlobalPipMode = e.detail?.isPip === true;
      if ((window as any)._svGlobalPipMode) {
        setIsFocusedMode(true);
      }
    };
    window.addEventListener('pip-mode-change', handlePipState);
    window.addEventListener('player-play-state', handlePlayState);
    saveTimer = setInterval(() => {
      if (isCurrentlyPlaying) {
        recordWatchSegment();
      }
    }, 2000); // Commit to history every 2 seconds of playing

    return () => {
      window.removeEventListener('pip-mode-change', handlePipState);
      window.removeEventListener('player-play-state', handlePlayState);
      clearInterval(saveTimer);
      if (isCurrentlyPlaying) {
        isCurrentlyPlaying = false;
        recordWatchSegment();
      }
    };
  }, [url, activeTab, isHistoryEnabled, plugins]);

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

    const savedHistory = ahk.call('LoadData', 'history.json');
    if (savedHistory) { try { setHistory(JSON.parse(savedHistory)); } catch (e) { } }

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

    const savedFilters = ahk.call('LoadData', 'network_filters.json');
    if (savedFilters) {
      try {
        const parsed = JSON.parse(savedFilters);
        if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
          setNetworkFilters(parsed);
        } else {
          setNetworkFilters({ "api/stats/qoe": true, "googleads": true, "gtag": true, "doubleclick": true, "disable-devtool.min.js": true, "histats": true });
        }
      } catch (e) { }
    } else {
      setNetworkFilters({ "api/stats/qoe": true, "googleads": true, "gtag": true, "doubleclick": true, "disable-devtool.min.js": true, "histats": true });
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
          textSec: parsed.textSec || '#a1a1aa',
          titlebarText: parsed.titlebarText || parsed.textSec || '#a1a1aa',
          titlebarTextHover: parsed.titlebarTextHover || parsed.textMain || '#fafafa',
          titlebarAccent: parsed.titlebarAccent || parsed.accent || '#6366f1',
          titlebarAlt: parsed.titlebarAlt || '#18181b',
          titlebarAlt2: parsed.titlebarAlt2 || '#27272a',
          sidebarText: parsed.sidebarText || parsed.textSec || '#a1a1aa',
          urlbarBg: parsed.urlbarBg || ''
        });
      } catch (e) { }
    }

    const savedSearchEngine = ahk.call('LoadData', 'search_engine.txt');
    if (savedSearchEngine) { setDefaultSearchEngine(savedSearchEngine); }

    const savedThreadLimit = ahk.call('LoadData', 'search_thread_limit.txt');
    if (savedThreadLimit) { try { setSearchThreadLimit(parseInt(savedThreadLimit) || 5); } catch (e) { } }

    const savedHomePage = ahk.call('LoadData', 'home_page.txt');
    const computedHomeUrl = savedHomePage || 'https://bingekit.app/start/';
    if (savedHomePage) {
      setHomePage(savedHomePage);
      setUrl(savedHomePage);
      setInputUrl(savedHomePage);
    }
    setBrowserTabs(prev => [{ ...prev[0], url: computedHomeUrl, inputUrl: computedHomeUrl }]);
    ahk.call('UpdatePlayerUrl', computeNavUrl(computedHomeUrl), 'main');
    lastSyncUrls.current['main'] = computedHomeUrl;

    const savedNavButtons = ahk.call('LoadData', 'nav_buttons.json');
    if (savedNavButtons) {
      try { setNavButtons(JSON.parse(savedNavButtons)); } catch (e) { }
    }
    const interfacesStr = ahk.call('ListInterfaces');
    if (interfacesStr) {
      setInstalledInterfaces(interfacesStr.split('|').filter(Boolean));
    }

    const savedDlLoc = ahk.call('LoadData', 'downloads_loc.txt');
    if (savedDlLoc) setDownloadsLoc(savedDlLoc);

    const savedDlTemp = ahk.call('LoadData', 'downloads_temp.txt');
    if (savedDlTemp) setDownloadsTemp(savedDlTemp);

    const savedMultiTab = ahk.call('LoadData', 'multi_tab_enabled.txt');
    if (savedMultiTab) setIsMultiTabEnabled(savedMultiTab === 'true');

    const savedBlockedExts = ahk.call('LoadData', 'blocked_exts.json');
    if (savedBlockedExts) {
      try { setBlockedExts(JSON.parse(savedBlockedExts)); } catch (e) { }
    }

    try {
      const mode = ahk.call('GetStorageMode');
      setIsPortableApp(mode === '1' || mode === 1 || mode === true);
      const comp = ahk.call('IsCompiled');
      setIsCompiledApp(comp === '1' || comp === 1 || comp === true);
      setFfmpegStatusApp(ahk.call('CheckFFmpegStatus') || 'missing');

      const configStr = ahk.call('GetAboutConfig');
      if (configStr) {
        const parsed = JSON.parse(configStr);
        if (parsed.PluginRepoUrl !== undefined) setPluginRepoUrl(parsed.PluginRepoUrl);
        if (parsed.AutoCheckPluginUpdates !== undefined) setAutoCheckPluginUpdates(parsed.AutoCheckPluginUpdates);
        if (parsed.AutoUpdatePlugins !== undefined) setAutoUpdatePlugins(parsed.AutoUpdatePlugins);
        if (parsed.AutoFocusPlayerOnTabChange !== undefined) setAutoFocusPlayerOnTabChange(parsed.AutoFocusPlayerOnTabChange);
        if (parsed.CtrlClickBackgroundTab !== undefined) setCtrlClickBackgroundTab(parsed.CtrlClickBackgroundTab);
      }
    } catch (e) { }

    setTimeout(() => ahk.call('HideSplash'), 500);

    const handleSVDlStarted = (e: any) => {
      setActiveDownloads(prev => ({
        ...prev,
        [e.detail.path]: { file: e.detail.file, path: e.detail.path, total: 0, rcv: 0, state: 0, isFFmpeg: !!e.detail.isFFmpeg }
      }));
    };
    const handleSVDlProgress = (e: any) => {
      setActiveDownloads(prev => {
        if (!prev[e.detail.path]) return prev;
        return {
          ...prev,
          [e.detail.path]: {
            ...prev[e.detail.path],
            total: e.detail.total,
            rcv: e.detail.rcv,
            speed: e.detail.speed !== undefined ? e.detail.speed : prev[e.detail.path].speed,
            ffmpegTime: e.detail.ffmpegTime !== undefined ? e.detail.ffmpegTime : prev[e.detail.path].ffmpegTime
          }
        };
      });
    };
    const handleSVDlState = (e: any) => {
      setActiveDownloads(prev => {
        if (!prev[e.detail.path]) return prev;
        return { ...prev, [e.detail.path]: { ...prev[e.detail.path], state: e.detail.state } };
      });
    };
    const handleSVBlocked = (e: any) => {
      try { ahk.call('ShowTooltip', `Blocked download: ${e.detail.file}`); setTimeout(() => ahk.call('HideTooltip'), 3000); } catch (e) { }
    }

    window.addEventListener('bk-download-started', handleSVDlStarted);
    window.addEventListener('bk-download-progress', handleSVDlProgress);
    window.addEventListener('bk-download-state', handleSVDlState);
    window.addEventListener('bk-download-blocked', handleSVBlocked);

    return () => {
      window.removeEventListener('bk-download-started', handleSVDlStarted);
      window.removeEventListener('bk-download-progress', handleSVDlProgress);
      window.removeEventListener('bk-download-state', handleSVDlState);
      window.removeEventListener('bk-download-blocked', handleSVBlocked);
    };
  }, []);

  useEffect(() => { if (bookmarks.length > 0) ahk.call('SaveData', 'bookmarks.json', JSON.stringify(bookmarks)); }, [bookmarks]);

  useEffect(() => {
    if (isInitialHistoryMount.current) { isInitialHistoryMount.current = false; return; }
    ahk.call('SaveData', 'history.json', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    if (isInitialDiscoveryMount.current) { isInitialDiscoveryMount.current = false; return; }
    ahk.call('SaveData', 'discovery_cache.json', JSON.stringify(discoveryItems));
  }, [discoveryItems]);

  useEffect(() => {
    if (isInitialHistoryEnabledMount.current) { isInitialHistoryEnabledMount.current = false; return; }
    ahk.call('SaveData', 'history_enabled.txt', isHistoryEnabled ? 'true' : 'false');
  }, [isHistoryEnabled]);
  useEffect(() => { ahk.call('SaveData', 'search_engine.txt', defaultSearchEngine); }, [defaultSearchEngine]);
  useEffect(() => { ahk.call('SaveData', 'search_thread_limit.txt', searchThreadLimit.toString()); }, [searchThreadLimit]);
  useEffect(() => {
    if (isInitialHomePageMount.current) { isInitialHomePageMount.current = false; return; }
    const saveTimer = setTimeout(() => {
      ahk.call('SaveData', 'home_page.txt', homePage);
    }, 500);
    return () => clearTimeout(saveTimer);
  }, [homePage]);
  useEffect(() => { ahk.call('SaveData', 'nav_buttons.json', JSON.stringify(navButtons)); }, [navButtons]);
  useEffect(() => { if (watchLater.length > 0) ahk.call('SaveData', 'watchlater.json', JSON.stringify(watchLater)); }, [watchLater]);
  useEffect(() => { if (credentials.length > 0) ahk.call('SaveData', 'credentials.json', JSON.stringify(credentials)); }, [credentials]);
  useEffect(() => { if (followedItems.length > 0) ahk.call('SaveData', 'followed.json', JSON.stringify(followedItems)); }, [followedItems]);
  useEffect(() => {
    ahk.call('SaveData', 'network_filters.json', JSON.stringify(networkFilters));
    try { ahk.call('UpdateNetworkFilters', JSON.stringify(networkFilters)); } catch (e) { }
  }, [networkFilters]);
  useEffect(() => {
    try { ahk.call('UpdateAdblockStatus', isAdblockEnabled ? 'true' : 'false'); } catch (e) { }
  }, [isAdblockEnabled]);

  useEffect(() => {
    if (isInitialMultiTabMount.current) { isInitialMultiTabMount.current = false; return; }
    ahk.call('SaveData', 'multi_tab_enabled.txt', isMultiTabEnabled ? 'true' : 'false');
  }, [isMultiTabEnabled]);

  const isInitialDlLocMount = useRef(true);
  useEffect(() => {
    if (isInitialDlLocMount.current) { isInitialDlLocMount.current = false; return; }
    ahk.call('SaveData', 'downloads_loc.txt', downloadsLoc);
  }, [downloadsLoc]);

  const isInitialDlTempMount = useRef(true);
  useEffect(() => {
    if (isInitialDlTempMount.current) { isInitialDlTempMount.current = false; return; }
    ahk.call('SaveData', 'downloads_temp.txt', downloadsTemp);
  }, [downloadsTemp]);

  const isInitialBlockedExtsMount = useRef(true);
  useEffect(() => {
    if (isInitialBlockedExtsMount.current) { isInitialBlockedExtsMount.current = false; return; }
    ahk.call('SaveData', 'blocked_exts.json', JSON.stringify(blockedExts));
  }, [blockedExts]);

  useEffect(() => {
    if (isInitialThemeMount.current) { isInitialThemeMount.current = false; return; }
    ahk.call('SaveData', 'theme.json', JSON.stringify(theme));
  }, [theme]);

  // Aggregate Plugin Blockers into Network Filters
  useEffect(() => {
    if (plugins.length === 0) return;
    setNetworkFilters(prev => {
      const merged = { ...prev };
      let changed = false;
      plugins.filter(p => p.enabled && p.networkBlockers && p.networkBlockers.length > 0).forEach(p => {
        p.networkBlockers!.forEach(term => {
          if (!merged[term]) {
            merged[term] = true;
            changed = true;
          }
        });
      });
      return changed ? merged : prev;
    });

    const siteBlockers: Record<string, { inline: string[], redirect: string[] }> = {};
    let hasBlockers = false;
    plugins.filter(p => p.enabled).forEach(p => {
      try {
        const host = new URL(p.baseUrl).hostname || p.baseUrl;
        if (p.inlineBlockers?.length || p.redirectBlockers?.length) {
          siteBlockers[host] = {
            inline: p.inlineBlockers || [],
            redirect: p.redirectBlockers || []
          };
          hasBlockers = true;
        }
      } catch (e) { }
    });
    if (hasBlockers) {
      try { ahk.call('UpdateSiteBlockers', JSON.stringify(siteBlockers)); } catch (e) { }
    }
  }, [plugins]);

  // Sync payload to AHK (Runs on script/plugin changes or URL changes)
  useEffect(() => {
    const activeScripts = userscripts.filter(s => s.enabled);
    let payload = '';

    if (activeScripts.length > 0 || plugins.some(p => p.customCss || p.customJs) || Object.keys(theme).length > 0) {
      payload = `
        (function() {
          window._svPluginStyles = ${JSON.stringify(plugins.map(p => ({ baseUrl: p.baseUrl, css: p.customCss })).filter(p => p.css))};

          function getInjectTarget() {
            return document.head || document.documentElement || document.body;
          }

          function ensureStyles() {
            var target = getInjectTarget();
            if (!target) return;
            
            var currentUrl = window.location.href;
            var currentHost = window.location.hostname;
            if (!currentHost && currentUrl.startsWith('custom:')) currentHost = currentUrl;
            
            window._svPluginStyles.forEach(p => {
              try {
                var pHost = '';
                try { pHost = new URL(p.baseUrl).hostname; } catch(e) { pHost = p.baseUrl; }
                
                var matchP = false;
                if (pHost.startsWith('custom:')) {
                  matchP = pHost.endsWith('*') ? currentUrl.startsWith(pHost.slice(0, -1)) : currentUrl === pHost;
                } else {
                  matchP = currentHost.includes(pHost) || pHost.includes(currentHost) || currentUrl.includes(pHost);
                }
                
                if (matchP && p.css) {
                  var styleId = 'bk-plugin-style-' + pHost;
                  var existingStyle = document.getElementById(styleId);
                  if (!existingStyle) {
                    var style = document.createElement('style');
                    style.id = styleId;
                    style.innerHTML = p.css;
                    target.appendChild(style);
                  } else if (existingStyle.innerHTML !== p.css) {
                    existingStyle.innerHTML = p.css;
                  }
                }
              } catch(e) {}
            });

            var themeVars = \`${Object.entries(theme).filter(([k]) => k !== 'mode').map(([k, v]) => `--theme-${k}: ${v};`).join(' ')}\`;
            var tStyle = document.getElementById('bk-theme-injection');
            if (!tStyle) {
              tStyle = document.createElement('style');
              tStyle.id = 'bk-theme-injection';
              target.appendChild(tStyle);
            }
            if (tStyle.innerHTML !== \`:root { \${themeVars} }\`) {
              tStyle.innerHTML = \`:root { \${themeVars} }\`;
            }
          }

          function applyBingeKitPayload() {
            var currentUrl = window.location.href;
            if (currentUrl.includes('#custom:')) {
              currentUrl = currentUrl.substring(currentUrl.indexOf('#custom:') + 1);
            }
            if (currentUrl === 'about:blank' || currentUrl.startsWith('data:text/html')) {
              currentUrl = 'about:blank';
            }
            var currentHost = window.location.hostname;
            if (!currentHost && currentUrl.startsWith('custom:')) currentHost = currentUrl;
            
            var scripts = ${JSON.stringify(activeScripts)};
            scripts.forEach(s => {
              var matches = s.domains.includes('*') || s.domains.some(d => {
                if (d.startsWith('custom:')) return d.endsWith('*') ? currentUrl.startsWith(d.slice(0, -1)) : currentUrl === d;
                return currentHost.includes(d) || currentUrl.includes(d);
              });
              if (matches) { try { eval(s.code); } catch(e) { console.error('[Userscript Error]', s.name, e); } }
            });
            
            var siteJs = ${JSON.stringify(plugins.map(p => ({ baseUrl: p.baseUrl, js: p.customJs })).filter(p => p.js))};
            siteJs.forEach(p => {
              try {
                var pHost = '';
                try { pHost = new URL(p.baseUrl).hostname; } catch(e) { pHost = p.baseUrl; }
                var matchP = false;
                if (pHost.startsWith('custom:')) {
                  matchP = pHost.endsWith('*') ? currentUrl.startsWith(pHost.slice(0, -1)) : currentUrl === pHost;
                } else {
                  matchP = currentHost.includes(pHost) || pHost.includes(currentHost) || currentUrl.includes(pHost);
                }
                if (matchP && p.js) {
                  try { eval(p.js); } catch(e) { console.error('[Plugin JS Error]', p.baseUrl, e); }
                }
              } catch(e) {}
            });
            
            ensureStyles();
          }

          window._svApplyPayload = applyBingeKitPayload;
          window._svEnsureStyles = ensureStyles;

          // Delay execution until target DOM node is available, preventing bootstrap errors
          function tryInit() {
            if (!getInjectTarget()) {
              setTimeout(tryInit, 50);
              return;
            }
            window._svApplyPayload();
          }
          tryInit();

          // Continuous style enforcement
          if (!window._svStyleEnforcer) {
            window._svStyleEnforcer = setInterval(() => {
              if (window._svEnsureStyles) window._svEnsureStyles();
            }, 2000);
          }

          var playerPlugins = ${JSON.stringify(plugins.filter(p => p.player?.playerSel || p.auth?.checkAuthJs || p.details?.titleSel).map(p => ({
        baseUrl: p.baseUrl,
        playerSel: p.player?.playerSel || '',
        checkAuthJs: p.auth?.checkAuthJs || '',
        titleSel: p.details?.titleSel || ''
      })))};

          if (!window._svPlayerStatusPoller) {
            window._svPlayerStatusPoller = setInterval(() => {
              var currentUrl = window.location.href;
              var currentHost = window.location.hostname;
              if (!currentHost && currentUrl.startsWith('custom:')) currentHost = currentUrl;
              
              var matched = playerPlugins.find(p => {
                  var pHost = '';
                  try { pHost = new URL(p.baseUrl).hostname; } catch(e) { pHost = p.baseUrl; }
                  if (pHost.startsWith('custom:')) {
                    return pHost.endsWith('*') ? currentUrl.startsWith(pHost.slice(0, -1)) : currentUrl === pHost;
                  } else {
                    return currentHost.includes(pHost) || pHost.includes(currentHost) || currentUrl.includes(pHost);
                  }
              });

              var authStr = 'unknown';
              var hasPlayer = false;
              var titleStr = '';
              try { titleStr = document.title; } catch(e) {}

              if (matched) {
                  if (matched.checkAuthJs) {
                      authStr = (function() { try { const res = eval('(function(){' + matched.checkAuthJs + '})()'); return !!res ? 'loggedIn' : 'loggedOut'; } catch(e) { return 'unknown'; } })();
                  }
                  if (matched.playerSel) {
                      try { hasPlayer = !!document.querySelector(matched.playerSel); } catch(e) {}
                  }
                  if (matched.titleSel) {
                      try { 
                           const titleEl = document.querySelector(matched.titleSel);
                           if (titleEl) titleStr = titleEl.textContent.trim();
                      } catch(e) {}
                  }
              }
              
              try {
                if (window.chrome && window.chrome.webview && window.chrome.webview.hostObjects && window.chrome.webview.hostObjects.ahk) {
                    window.chrome.webview.hostObjects.ahk.ReportPlayerStatus(authStr, hasPlayer, titleStr);
                }
              } catch(e) {}
            }, 2000);
          }

          // Apply on AJAX navigations safely if not already hooked
          if (!window._svAjaxHooked) {
             window._svAjaxHooked = true;
             const origPush = window.history.pushState;
             window.history.pushState = function() {
                var res = origPush.apply(this, arguments);
                if (window._svApplyPayload) {
                    setTimeout(window._svApplyPayload, 50);
                    setTimeout(window._svEnsureStyles, 500);
                }
                return res;
             };
             const origReplace = window.history.replaceState;
             window.history.replaceState = function() {
                var res = origReplace.apply(this, arguments);
                if (window._svApplyPayload) {
                    setTimeout(window._svApplyPayload, 50);
                    setTimeout(window._svEnsureStyles, 500);
                }
                return res;
             };
             window.addEventListener('popstate', () => { 
                if (window._svApplyPayload) {
                    setTimeout(window._svApplyPayload, 50);
                    setTimeout(window._svEnsureStyles, 500);
                }
             });
          }
        })();
      `;
    }
    ahk.call('UpdateUserscriptPayload', payload);
  }, [userscripts, plugins, url, theme]);

  // Save userscripts to disk
  useEffect(() => {
    const saveTimer = setTimeout(() => {
      userscripts.forEach(s => ahk.call('SaveScript', `script_${s.id}.json`, JSON.stringify(s, null, 2)));
    }, 500);
    return () => clearTimeout(saveTimer);
  }, [userscripts]);

  const checkForUpdates = async () => {
    setIsCheckingUpdates(true);
    const updatedItems = [...followedItems];

    for (let i = 0; i < updatedItems.length; i++) {
      const item = updatedItems[i];
      const plugin = plugins.find(p => p.id === item.siteId);
      if (!plugin) continue;

      let trackingConf = item.trackingFlowId && plugin.trackingFlows ? plugin.trackingFlows.find(t => t.id === item.trackingFlowId) : null;
      if (!trackingConf && plugin.trackingFlows && plugin.trackingFlows.length > 0) {
        // Find best match by URL regex if any
        trackingConf = plugin.trackingFlows.find(t => t.urlRegex && new RegExp(t.urlRegex).test(item.url)) || plugin.trackingFlows[0];
      }
      if (!trackingConf) trackingConf = plugin.tracking; // Fallback

      if (trackingConf && trackingConf.listSel && trackingConf.itemSel && window.SmartFetch) {
        try {
          // Pre-flight check for authentication
          const authValid = await ensureAuthForPlugin(plugin, credentials);
          if (!authValid && plugin.auth?.loginUrl) {
            console.warn("Auto-login failed for", plugin.name, "skipping updates");
            continue;
          }

          const js = `
            const items = Array.from(document.querySelectorAll('${trackingConf.itemSel.replace(/'/g, "\\\\'")}'));
            return items.map(el => {
               try {
                 return {
                   id: (function(){ ${trackingConf.idExtractJs || "return '';"} })(),
                   title: (function(){ ${trackingConf.titleExtractJs || "return '';"} })(),
                   url: (function(){ ${trackingConf.urlExtractJs || "return '';"} })(),
                   status: (function(){ ${trackingConf.statusExtractJs || "return 'released';"} })()
                 };
               } catch(e) { return null; }
            }).filter(i => i && i.id);
          `;
          const results = await window.SmartFetch(item.url, js);
          if (Array.isArray(results) && results.length > 0) {
            const newLatest = results[0]?.id || ''; // assuming chronologically sorted list
            if (item.latestAvailable !== newLatest) {
              item.hasUpdate = true;
              item.latestAvailable = newLatest;
            }
            if (!item.watchedEpisodes) item.watchedEpisodes = [];
            const unwatched = results.filter(r => !item.watchedEpisodes?.includes(r.id));
            if (unwatched.length > 0) item.hasUpdate = true;
            item.knownCount = results.length;
          }
        } catch (e) {
          console.error("Tracking update failed for", item.title, e);
        }
      } else {
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
    }

    setFollowedItems(updatedItems);
    setIsCheckingUpdates(false);
  };

  const checkPluginUpdates = async () => {
    if (!pluginRepoUrl) return;
    try {
      const result = ahk.call("RawFetchHTML", pluginRepoUrl);
      if (result) {
        const repoData = JSON.parse(result);
        const updates: { id: string, zipUrl: string }[] = [];

        repoData.plugins?.forEach((rp: any) => {
          const local = plugins.find(lp => lp.id === rp.id);
          if (local && local.version && rp.version && local.version !== rp.version && rp.zipUrl) {
            updates.push({ id: rp.id, zipUrl: rp.zipUrl });
          }
        });

        setPluginUpdateCount(updates.length);

        if (updates.length > 0 && autoUpdatePlugins) {
          setTimeout(() => {
            let installedAny = false;
            updates.forEach(u => {
              const success = ahk.call("InstallExtensionZip", u.zipUrl, "sites");
              if (success === "true" || success === true || success === 1) installedAny = true;
            });
            if (installedAny) {
              loadPlugins();
              setPluginUpdateCount(0);
            }
          }, 100);
        }
      }
    } catch (e) { }
  };

  const navigateUrl = (targetUrl: string, inNewTab: boolean = false, isBackground: boolean = false) => {
    let finalUrl = targetUrl.trim();
    if (finalUrl === 'about:config') {
      setActiveTab('config');
      return;
    }
    if (finalUrl.startsWith('about:') || finalUrl.startsWith('err://') || finalUrl.startsWith('custom:') || finalUrl.startsWith('interface:') || finalUrl.startsWith('file:') || finalUrl.startsWith('data:')) {
      // Leave as is
    } else if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      if (!finalUrl.includes('.') || finalUrl.includes(' ')) {
        finalUrl = `${defaultSearchEngine}${encodeURIComponent(finalUrl)}`;
      } else {
        finalUrl = `https://${finalUrl}`;
      }
    }

    if (inNewTab) {
      const newId = Date.now().toString();
      setBrowserTabs(prev => [...prev, { id: newId, url: finalUrl, inputUrl: finalUrl }]);
      lastSyncUrls.current[newId] = finalUrl;
      ahk.call('UpdatePlayerUrl', computeNavUrl(finalUrl), newId);
      if (!isBackground) {
        setActiveBrowserTabId(newId);
        if (autoFocusPlayerOnTabChange) setActiveTab('player');
      }
    } else {
      setUrl(finalUrl);
      setInputUrl(finalUrl);
      setActiveTab('player');
    }
  };

  const handleNavigate = (e: React.FormEvent) => {
    e.preventDefault();
    navigateUrl(inputUrl);
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
    setEditingPlugin((prev) => {
      if (!prev) return prev;
      if (section === 'root') {
        return { ...prev, [field]: value };
      } else {
        return {
          ...prev,
          [section]: { ...(prev[section as keyof SitePlugin] as any), [field]: value }
        };
      }
    });
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

  const runFlow = async (flow: CustomFlow, initialUrl: string = url, customVars: Record<string, string> = {}) => {
    console.log('Running flow:', flow.name, 'with inputs:', customVars);
    let currentVar = initialUrl;

    const resolveVars = async (str: string) => {
      if (!str) return str;
      let res = str.replace(/\{\{CURRENT_URL\}\}/g, url)
        .replace(/\{\{PREV\}\}/g, currentVar)
        .replace(/\{\{SEARCH\}\}/g, multiSearchQuery);

      Object.entries(customVars).forEach(([key, val]) => {
        res = res.replace(new RegExp(`\\{${key}\\}`, 'g'), val);
      });

      const promptRegex = /\{\{prompt:([^}]+)\}\}/g;
      let match;
      while ((match = promptRegex.exec(res)) !== null) {
        const promptTitle = match[1];
        const userInput = window.prompt(`Flow Input Required:\n${promptTitle}`, "");
        res = res.replace(match[0], userInput || "");
      }
      return res;
    };

    for (const step of flow.steps) {
      console.log("Executing Step:", step.type, step.params);

      if (step.type === 'navigate') {
        const dest = await resolveVars(step.params.url || '');
        let navUrl = dest;
        if (dest === 'about:blank') {
          navUrl = 'data:text/html,%3Chtml%3E%3Cbody%3E%3C%2Fbody%3E%3C%2Fhtml%3E';
        } else if (dest.startsWith('custom:')) {
          navUrl = `data:text/html,%3Chtml%3E%3Cbody%3E%3C%2Fbody%3E%3C%2Fhtml%3E#${dest}`;
        } else if (dest.startsWith('interface:')) {
          let path = dest.replace('interface:', '');
          if (!path.includes('.')) {
            if (path && !path.endsWith('/')) { path += '/'; }
            path += 'index.html';
          }
          navUrl = `http://interface.localhost/${path}`;
        }
        ahk.call('UpdatePlayerUrl', navUrl);
        currentVar = dest;
        await new Promise(r => setTimeout(r, 1500));
      } else if (step.type === 'inject') {
        const code = await resolveVars(step.params.code || '');
        ahk.call('InjectJS', code);
      } else if (step.type === 'waitForElement') {
        const selector = await resolveVars(step.params.selector || '');
        console.log('[Flow] Waiting for element:', selector);
        let found = false;
        let attempts = 0;
        while (!found && attempts < 100) {
          const js = `!!document.querySelector('${selector.replace(/'/g, "\\'")}')`;
          try {
            const res = await ahk.call('EvalPlayerJS', js);
            if (res === 'true') {
              found = true;
              console.log('[Flow] Element found!');
              break;
            }
          } catch (e) { }
          await new Promise(r => setTimeout(r, 100));
          attempts++;
        }
        if (!found) console.warn('[Flow] Timed out waiting for element:', selector);
      } else if (step.type === 'interact') {
        const selector = await resolveVars(step.params.selector || '');
        const actionType = step.params.actionType || 'click';
        const value = await resolveVars(step.params.value || '');
        console.log('[Flow] Interacting with:', selector, actionType);

        const jsCode = `
          (function() {
            var el = document.querySelector('${selector.replace(/'/g, "\\'")}');
            if (el) {
              ${actionType === 'setValue' ? `
                 el.value = '${value.replace(/'/g, "\\'")}';
                 el.dispatchEvent(new Event('input', {bubbles: true}));
                 el.dispatchEvent(new Event('change', {bubbles: true}));
                 if (el.tagName === 'FORM') el.submit();
              ` : `el.click();`}
              return true;
            }
            return false;
          })();
        `;
        ahk.call('InjectJS', jsCode);
        await new Promise(r => setTimeout(r, 200));
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
          const resolvedFormat = resolvePluginUrl(targetPlugin.baseUrl, targetPlugin.search.urlFormat);
          const pUrl = resolvedFormat.replace('{query}', encodeURIComponent(sq));
          setMultiSearchQuery(sq);
          setSearchParamMode('fetch');
          setActiveTab('dashboard');
          setTimeout(() => {
            const input = document.getElementById('search-input');
            if (input) input.focus();
          }, 100);
        }
      } else if (step.type === 'smartFetch') {
        const targetUrl = await resolveVars(step.params.url || '');
        const targetPluginId = await resolveVars(step.params.pluginId || '');
        const targetPlugin = plugins.find(p => p.id === targetPluginId);

        if (targetPlugin && targetUrl && window.SmartFetch) {
          const jsQuery = `
              const items = Array.from(document.querySelectorAll('${targetPlugin.search.itemSel.replace(/'/g, "\\'") || 'body'}'));
              return items.slice(0, 10).map(item => {
                 let el = item.querySelector('${targetPlugin.search.titleSel.replace(/'/g, "\\'")}');
                 const title = el ? el.textContent.trim() : '';
                 el = item.querySelector('${targetPlugin.search.linkSel.replace(/'/g, "\\'")}');
                 const href = el ? el.getAttribute('href') : '';
                 return { title, href };
              });
           `;
          const res = await window.SmartFetch(targetUrl, jsQuery);
          if (res) currentVar = res;
        }
      } else if (step.type === 'customSmartFetch') {
        const targetUrl = await resolveVars(step.params.url || '');
        const jsCode = await resolveVars(step.params.code || 'return [];');

        if (targetUrl && window.SmartFetch) {
          const jsQuery = `
             return new Promise(async (resolve) => {
               try {
                 const res = await (async () => {
                   ${jsCode}
                 })();
                 resolve(res);
               } catch(e) {
                 resolve({ error: e.message || String(e) });
               }
             });
           `;
          console.log('[Flow] Executing Custom SmartFetch on:', targetUrl);
          const res = await window.SmartFetch(targetUrl, jsQuery);
          currentVar = typeof res === 'object' ? JSON.stringify(res) : String(res);
          console.log('[Flow] Custom SmartFetch Result:', currentVar);
        }
      } else if (step.type === 'wait') {
        const msStr = await resolveVars(step.params.ms || '1000');
        const ms = parseInt(msStr) || 1000;
        console.log(`[Flow] Waiting for ${ms}ms...`);
        await new Promise(r => setTimeout(r, ms));
      }
    }
    return currentVar;
  };

  const isInitialPluginCheck = useRef(false);
  useEffect(() => {
    if (autoCheckPluginUpdates && plugins.length > 0 && !isInitialPluginCheck.current) {
      isInitialPluginCheck.current = true;
      checkPluginUpdates();
    }
  }, [plugins.length, autoCheckPluginUpdates, pluginRepoUrl]);

  const value = {
    url, setUrl, inputUrl, setInputUrl, isAdblockEnabled, setIsAdblockEnabled, urlBarMode, setUrlBarMode,
    theme, setTheme, bookmarks, setBookmarks, selectedBookmarks, setSelectedBookmarks, history, setHistory, isHistoryEnabled, setIsHistoryEnabled, discoveryItems, setDiscoveryItems,
    followedItems, setFollowedItems, isCheckingUpdates, setIsCheckingUpdates, plugins, setPlugins, activeSettingsTab, setActiveSettingsTab,
    editingPlugin, setEditingPlugin, testSearchQuery, setTestSearchQuery, testSearchResults, setTestSearchResults,
    isTestingSearch, setIsTestingSearch, flows, setFlows, editingFlow, setEditingFlow, userscripts, setUserscripts,
    editingUserscriptId, setEditingUserscriptId, activeTab, setActiveTab, multiSearchQuery, setMultiSearchQuery,
    searchResults, setSearchResults, isSearching, setIsSearching, watchLater, setWatchLater, credentials, setCredentials,
    newCred, setNewCred, bookmarkSearchQuery, setBookmarkSearchQuery, editingBookmarkId, setEditingBookmarkId,
    showCredModal, setShowCredModal, searchParamMode, setSearchParamMode, isQuickOptionsHidden, setIsQuickOptionsHidden,
    defaultSearchEngine, setDefaultSearchEngine, homePage, setHomePage, playerRef, savePlugin, deletePlugin, updateEditingPlugin, fetchTitleForUrl, runFlow, checkForUpdates, handleNavigate, navigateUrl, loadPlugins, navButtons, setNavButtons, installedInterfaces,
    networkFilters, setNetworkFilters, isFocusedMode, setIsFocusedMode, authStatus, setAuthStatus, playerStatus, setPlayerStatus, pageTitle,
    downloadsLoc, setDownloadsLoc, downloadsTemp, setDownloadsTemp, blockedExts, setBlockedExts, activeDownloads, setActiveDownloads,
    searchThreadLimit, setSearchThreadLimit, isCompiledApp, isPortableApp, ffmpegStatusApp, setFfmpegStatusApp, pluginRepoUrl, setPluginRepoUrl,
    pluginUpdateCount, setPluginUpdateCount, autoCheckPluginUpdates, setAutoCheckPluginUpdates, autoUpdatePlugins, setAutoUpdatePlugins, checkPluginUpdates,
    autoFocusPlayerOnTabChange, setAutoFocusPlayerOnTabChange, ctrlClickBackgroundTab, setCtrlClickBackgroundTab,
    isMultiTabEnabled, setIsMultiTabEnabled, browserTabs, setBrowserTabs, activeBrowserTabId, setActiveBrowserTabId, tilingMode, setTilingMode
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
