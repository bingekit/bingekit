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
  Compass, Zap
} from 'lucide-react';

// --- Types ---
interface BookmarkItem {
  id: string;
  title: string;
  url: string;
  icon?: string;
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
  type: 'fetchHtml' | 'parseHtml' | 'pluginAction' | 'navigate' | 'extract' | 'inject';
  params: Record<string, any>;
}

interface CustomFlow {
  id: string;
  name: string;
  description: string;
  steps: FlowStep[];
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
  customFunctions: {
    name: string;
    description: string;
    code: string;
  }[];
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
  customFunctions: []
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

export default function App() {
  const [url, setUrl] = useState('https://example.com/stream');
  const [inputUrl, setInputUrl] = useState(url);
  const [isAdblockEnabled, setIsAdblockEnabled] = useState(true);
  const [isSimpleUrlBar, setIsSimpleUrlBar] = useState(false);
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [followedItems, setFollowedItems] = useState<FollowedItem[]>([]);
  const [isCheckingUpdates, setIsCheckingUpdates] = useState(false);
  const [plugins, setPlugins] = useState<SitePlugin[]>([]);
  const [editingPlugin, setEditingPlugin] = useState<SitePlugin | null>(null);
  const [flows, setFlows] = useState<CustomFlow[]>([]);
  const [editingFlow, setEditingFlow] = useState<CustomFlow | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'player' | 'bookmarks' | 'plugins' | 'activity' | 'settings' | 'flows'>('dashboard');
  const [multiSearchQuery, setMultiSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const playerRef = useRef<HTMLDivElement>(null);
  const lastRectRef = useRef('');

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
      ahk.call('UpdatePlayerUrl', url);
    }
  }, [activeTab, url]);

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
    const savedFlows = ahk.call('LoadData', 'flows.json');
    if (savedFlows) {
      try { setFlows(JSON.parse(savedFlows)); } catch (e) { }
    }

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

  // Save followed items when changed
  useEffect(() => {
    if (followedItems.length > 0) {
      ahk.call('SaveData', 'followed.json', JSON.stringify(followedItems));
    }
  }, [followedItems]);

  const checkForUpdates = async () => {
    setIsCheckingUpdates(true);
    const updatedItems = [...followedItems];

    for (let i = 0; i < updatedItems.length; i++) {
      const item = updatedItems[i];
      const plugin = plugins.find(p => p.id === item.siteId);
      if (!plugin) continue;

      const html = ahk.call('FetchHTML', item.url);
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

  const updateEditingPlugin = (section: keyof SitePlugin, field: string, value: any) => {
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
                    setBookmarks([...bookmarks, { id: Date.now().toString(), title: (() => { try { return new URL(url).hostname; } catch (e) { return url; } })(), url }]);
                  }
                }}
                className="px-2 text-zinc-500 hover:text-indigo-400 transition-colors"
              >
                <Bookmark size={12} className={bookmarks.find(b => b.url === url) ? "fill-indigo-400 text-indigo-400" : ""} />
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

                <div className="w-full max-w-2xl relative mb-8">
                  <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="text"
                    value={multiSearchQuery}
                    onChange={(e) => setMultiSearchQuery(e.target.value)}
                    placeholder="Search across all plugins..."
                    className="w-full bg-zinc-900/80 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-lg text-zinc-200 focus:border-indigo-500 focus:bg-zinc-900 outline-none transition-all shadow-xl"
                    onKeyDown={async (e) => {
                      if (e.key === 'Enter' && multiSearchQuery) {
                        setIsSearching(true);
                        setSearchResults([]);
                        // Multi-search logic
                        const results: any[] = [];
                        for (const plugin of plugins) {
                          if (plugin.search.urlFormat) {
                            const searchUrl = plugin.search.urlFormat.replace('{query}', encodeURIComponent(multiSearchQuery));
                            // In a real app, we'd fetch and parse here
                            // For now, we'll just add a dummy result to show the UI
                            results.push({
                              id: Date.now() + Math.random(),
                              title: `Search ${plugin.name} for "${multiSearchQuery}"`,
                              url: searchUrl,
                              pluginName: plugin.name,
                              type: 'search'
                            });
                          }
                        }
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

                {/* Tags / Custom Search Lists */}
                <div className="flex gap-2 flex-wrap justify-center mb-12">
                  {['Movies', 'TV Shows', 'Anime', 'Live TV', 'Sports'].map(tag => (
                    <button key={tag} className="px-4 py-1.5 rounded-full bg-zinc-900/50 border border-zinc-800 text-sm text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 transition-colors">
                      {tag}
                    </button>
                  ))}
                </div>

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="w-full max-w-4xl space-y-4">
                    <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-4">Search Results</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  </div>
                )}
              </div>
            )}

            {activeTab === 'player' && (
              <div className="w-full h-full bg-zinc-950 flex flex-col relative">
                {/* Quick Options Bar */}
                <div className="h-10 bg-zinc-950 border-b border-zinc-900 flex items-center px-4 gap-4 z-10">
                  <button
                    onClick={() => {
                      // Example: Find mirrors logic
                      setMultiSearchQuery(new URL(url).hostname);
                      setActiveTab('dashboard');
                    }}
                    className="text-xs font-medium text-zinc-400 hover:text-indigo-400 flex items-center gap-1.5 transition-colors"
                  >
                    <Search size={14} /> Find Mirrors
                  </button>
                  <div className="w-px h-4 bg-zinc-800" />
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-600 font-medium">Run Flow:</span>
                    {flows.map(flow => (
                      <button
                        key={flow.id}
                        onClick={() => {
                          // Execute flow logic here
                          console.log('Running flow:', flow.name, 'on url:', url);
                        }}
                        className="text-xs font-medium text-zinc-400 hover:text-emerald-400 flex items-center gap-1 transition-colors bg-zinc-900 px-2 py-1 rounded"
                      >
                        <Zap size={12} /> {flow.name}
                      </button>
                    ))}
                    {flows.length === 0 && (
                      <span className="text-xs text-zinc-600 italic">No flows available</span>
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
                        alert('No matching plugin found or credentials not set.');
                      }
                    }}
                    className="text-xs font-medium text-zinc-400 hover:text-indigo-400 flex items-center gap-1.5 transition-colors"
                  >
                    <KeyRound size={14} /> Auto-Login
                  </button>
                </div>
                <div ref={playerRef} className="w-full flex-1 bg-zinc-900 border-none relative" />
              </div>
            )}

            {activeTab === 'bookmarks' && (
              <div className="p-8 max-w-4xl mx-auto w-full h-full overflow-y-auto no-scrollbar">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-light tracking-tight text-zinc-100">Bookmarks</h2>
                  <button className="flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 px-4 py-2 rounded-full transition-colors">
                    <Plus size={16} /> Add Current
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {bookmarks.map(bookmark => (
                    <div
                      key={bookmark.id}
                      onClick={() => {
                        setUrl(bookmark.url);
                        setInputUrl(bookmark.url);
                        setActiveTab('browser');
                      }}
                      className="group p-4 bg-zinc-900/50 border border-zinc-800/50 hover:border-indigo-500/30 hover:bg-zinc-900 rounded-2xl cursor-pointer transition-all duration-300 flex items-start gap-4"
                    >
                      <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center flex-shrink-0 group-hover:scale-105 group-hover:bg-indigo-500/20 group-hover:text-indigo-400 transition-all">
                        <Tv size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-zinc-200 truncate">{bookmark.title}</h3>
                        <p className="text-xs text-zinc-500 truncate mt-1">{bookmark.url}</p>
                      </div>
                    </div>
                  ))}
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
                        setActiveTab('browser');
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
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs text-zinc-500 mb-1.5">Username Value (to inject)</label>
                              <input
                                type="text" value={editingPlugin.auth.usernameValue} placeholder="user@email.com"
                                onChange={(e) => updateEditingPlugin('auth', 'usernameValue', e.target.value)}
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-zinc-500 mb-1.5">Password Value (to inject)</label>
                              <input
                                type="password" value={editingPlugin.auth.passwordValue} placeholder="••••••••"
                                onChange={(e) => updateEditingPlugin('auth', 'passwordValue', e.target.value)}
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 outline-none"
                              />
                            </div>
                          </div>
                          <label className="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer">
                            <input
                              type="checkbox" checked={editingPlugin.auth.encryptCreds}
                              onChange={(e) => updateEditingPlugin('auth', 'encryptCreds', e.target.checked)}
                              className="rounded border-zinc-700 bg-zinc-900 text-indigo-500 focus:ring-indigo-500"
                            />
                            Encrypt credentials locally (AHK Crypt)
                          </label>
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
                        ahk.call('SaveData', 'flows.json', JSON.stringify(newFlows));
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
                              ahk.call('SaveData', 'flows.json', JSON.stringify(newFlows));
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
                              // Execute flow logic
                              console.log('Executing flow:', editingFlow.name);
                              for (const step of editingFlow.steps) {
                                console.log('Executing step:', step.type, step.params);
                                if (step.type === 'navigate') {
                                  setUrl(step.params.url);
                                  setInputUrl(step.params.url);
                                  setActiveTab('browser');
                                } else if (step.type === 'inject') {
                                  ahk.call('InjectJS', step.params.code);
                                } else if (step.type === 'fetchHtml') {
                                  const html = await ahk.call('FetchHTML', step.params.url);
                                  console.log('Fetched HTML length:', html?.length);
                                }
                                // Add more step executions as needed
                              }
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-sm font-medium transition-colors"
                          >
                            <Play size={16} /> Run Flow
                          </button>
                          <button
                            onClick={() => {
                              const updatedFlows = flows.map(f => f.id === editingFlow.id ? editingFlow : f);
                              setFlows(updatedFlows);
                              ahk.call('SaveData', 'flows.json', JSON.stringify(updatedFlows));
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
                                const newStep: FlowStep = { id: Date.now().toString(), type: 'fetchHtml', params: { url: '' } };
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
                                    <option value="fetchHtml">Fetch HTML</option>
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
                                {step.type === 'fetchHtml' && (
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
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

