import React, { useState, useEffect } from 'react';
import { Search, Bookmark, Settings, Minus, Square, X, ChevronLeft, ChevronRight, RotateCw, Film, Tv, Play, LayoutGrid, Shield, ShieldOff, Plus, Puzzle, Save, Trash2, Download, Upload, KeyRound, Code, ListTree, MonitorPlay, Activity, RefreshCw, Bell, Compass, Zap, Clock, Folder, Lock, EyeOff, Eye, Globe } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { ahk } from '../../lib/ahk';
import { TooltipWrapper } from '../ui/TooltipWrapper';
import { CustomCheckbox } from '../ui/CustomCheckbox';
import { CustomSelect } from '../ui/CustomSelect';
import { TagsInput } from '../ui/TagsInput';
import { Modal } from '../ui/Modal';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import { DEFAULT_PLUGIN, SitePlugin, CustomFlow, Userscript, FollowedItem, BookmarkItem, WatchLaterItem, CredentialItem } from '../../types';

export const SettingsView = () => {
  const {
    url, setUrl, inputUrl, setInputUrl, isAdblockEnabled, setIsAdblockEnabled, urlBarMode, setUrlBarMode,
    theme, setTheme, bookmarks, setBookmarks, selectedBookmarks, setSelectedBookmarks, 
    followedItems, setFollowedItems, isCheckingUpdates, setIsCheckingUpdates, plugins, setPlugins,
    editingPlugin, setEditingPlugin, testSearchUrl, setTestSearchUrl, testSearchResults, setTestSearchResults,
    isTestingSearch, setIsTestingSearch, flows, setFlows, editingFlow, setEditingFlow, userscripts, setUserscripts,
    editingUserscriptId, setEditingUserscriptId, activeTab, setActiveTab, multiSearchQuery, setMultiSearchQuery,
    searchResults, setSearchResults, isSearching, setIsSearching, watchLater, setWatchLater, credentials, setCredentials,
    newCred, setNewCred, bookmarkSearchQuery, setBookmarkSearchQuery, editingBookmarkId, setEditingBookmarkId,
    showCredModal, setShowCredModal, searchParamMode, setSearchParamMode, isQuickOptionsHidden, setIsQuickOptionsHidden, defaultSearchEngine, setDefaultSearchEngine,
    playerRef, savePlugin, deletePlugin, updateEditingPlugin, fetchTitleForUrl, runFlow, checkForUpdates, handleNavigate, loadPlugins,
    history, setHistory, isHistoryEnabled, setIsHistoryEnabled, networkFilters, setNetworkFilters
  } = useAppContext();

  const [workspaces, setWorkspaces] = useState<string[]>([]);
  const [currentWs, setCurrentWs] = useState<string>('default');
  const [showWsModal, setShowWsModal] = useState(false);
  const [newWsName, setNewWsName] = useState('');

  useEffect(() => {
    try {
      const wsStr = ahk.call('ListWorkspaces');
      if (wsStr) {
        setWorkspaces(wsStr.split('|').filter(Boolean));
      } else {
        setWorkspaces(['default']);
      }
      const activeWs = ahk.call('GetCurrentWorkspace');
      if (activeWs) {
         setCurrentWs(activeWs);
      }
    } catch {
      setWorkspaces(['default']);
    }
  }, []);
  return (

    <div className="p-8 max-w-2xl mx-auto w-full h-full overflow-y-auto no-scrollbar">
      <h2 className="text-2xl font-light tracking-tight text-zinc-100 mb-8">Settings</h2>

      <div className="space-y-6">
        {/* Theme Configuration */}
        <div className="p-5 bg-zinc-900/50 border border-zinc-800/50 rounded-2xl space-y-4">
          <h3 className="text-sm font-medium text-zinc-200 flex items-center gap-2"><Zap size={16} className="text-indigo-400" /> Theme Configuration</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">Top Titlebar</label>
              <div className="flex bg-zinc-950 border border-zinc-800 rounded overflow-hidden h-8">
                <input type="color" value={theme.titlebarBg} onChange={e => setTheme({ ...theme, titlebarBg: e.target.value })} className="w-8 h-8 cursor-pointer border-none p-0 flex-shrink-0 appearance-none bg-transparent block focus:outline-none" />
                <input type="text" value={theme.titlebarBg} onChange={e => setTheme({ ...theme, titlebarBg: e.target.value })} className="flex-1 min-w-0 bg-transparent border-none text-xs text-zinc-200 px-2 outline-none font-mono uppercase" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">Side Menu</label>
              <div className="flex bg-zinc-950 border border-zinc-800 rounded overflow-hidden h-8">
                <input type="color" value={theme.sidebarBg} onChange={e => setTheme({ ...theme, sidebarBg: e.target.value })} className="w-8 h-8 cursor-pointer border-none p-0 flex-shrink-0 appearance-none bg-transparent block focus:outline-none" />
                <input type="text" value={theme.sidebarBg} onChange={e => setTheme({ ...theme, sidebarBg: e.target.value })} className="flex-1 min-w-0 bg-transparent border-none text-xs text-zinc-200 px-2 outline-none font-mono uppercase" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">Main Content</label>
              <div className="flex bg-zinc-950 border border-zinc-800 rounded overflow-hidden h-8">
                <input type="color" value={theme.mainBg} onChange={e => setTheme({ ...theme, mainBg: e.target.value })} className="w-8 h-8 cursor-pointer border-none p-0 flex-shrink-0 appearance-none bg-transparent block focus:outline-none" />
                <input type="text" value={theme.mainBg} onChange={e => setTheme({ ...theme, mainBg: e.target.value })} className="flex-1 min-w-0 bg-transparent border-none text-xs text-zinc-200 px-2 outline-none font-mono uppercase" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">Borders</label>
              <div className="flex bg-zinc-950 border border-zinc-800 rounded overflow-hidden h-8">
                <input type="color" value={theme.border} onChange={e => setTheme({ ...theme, border: e.target.value })} className="w-8 h-8 cursor-pointer border-none p-0 flex-shrink-0 appearance-none bg-transparent block focus:outline-none" />
                <input type="text" value={theme.border} onChange={e => setTheme({ ...theme, border: e.target.value })} className="flex-1 min-w-0 bg-transparent border-none text-xs text-zinc-200 px-2 outline-none font-mono uppercase" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">Accent Color (Buttons)</label>
              <div className="flex bg-zinc-950 border border-zinc-800 rounded overflow-hidden h-8">
                <input type="color" value={theme.accent} onChange={e => setTheme({ ...theme, accent: e.target.value })} className="w-8 h-8 cursor-pointer border-none p-0 flex-shrink-0 appearance-none bg-transparent block focus:outline-none" />
                <input type="text" value={theme.accent} onChange={e => setTheme({ ...theme, accent: e.target.value })} className="flex-1 min-w-0 bg-transparent border-none text-xs text-zinc-200 px-2 outline-none font-mono uppercase" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">Main Text</label>
              <div className="flex bg-zinc-950 border border-zinc-800 rounded overflow-hidden h-8">
                <input type="color" value={theme.textMain} onChange={e => setTheme({ ...theme, textMain: e.target.value })} className="w-8 h-8 cursor-pointer border-none p-0 flex-shrink-0 appearance-none bg-transparent block focus:outline-none" />
                <input type="text" value={theme.textMain} onChange={e => setTheme({ ...theme, textMain: e.target.value })} className="flex-1 min-w-0 bg-transparent border-none text-xs text-zinc-200 px-2 outline-none font-mono uppercase" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">Secondary Text</label>
              <div className="flex bg-zinc-950 border border-zinc-800 rounded overflow-hidden h-8">
                <input type="color" value={theme.textSec} onChange={e => setTheme({ ...theme, textSec: e.target.value })} className="w-8 h-8 cursor-pointer border-none p-0 flex-shrink-0 appearance-none bg-transparent block focus:outline-none" />
                <input type="text" value={theme.textSec} onChange={e => setTheme({ ...theme, textSec: e.target.value })} className="flex-1 min-w-0 bg-transparent border-none text-xs text-zinc-200 px-2 outline-none font-mono uppercase" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">Titlebar Text</label>
              <div className="flex bg-zinc-950 border border-zinc-800 rounded overflow-hidden h-8">
                <input type="color" value={theme.titlebarText || '#a1a1aa'} onChange={e => setTheme({ ...theme, titlebarText: e.target.value })} className="w-8 h-8 cursor-pointer border-none p-0 flex-shrink-0 appearance-none bg-transparent block focus:outline-none" />
                <input type="text" value={theme.titlebarText || '#a1a1aa'} onChange={e => setTheme({ ...theme, titlebarText: e.target.value })} className="flex-1 min-w-0 bg-transparent border-none text-xs text-zinc-200 px-2 outline-none font-mono uppercase" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">Titlebar Text Hover</label>
              <div className="flex bg-zinc-950 border border-zinc-800 rounded overflow-hidden h-8">
                <input type="color" value={theme.titlebarTextHover || '#fafafa'} onChange={e => setTheme({ ...theme, titlebarTextHover: e.target.value })} className="w-8 h-8 cursor-pointer border-none p-0 flex-shrink-0 appearance-none bg-transparent block focus:outline-none" />
                <input type="text" value={theme.titlebarTextHover || '#fafafa'} onChange={e => setTheme({ ...theme, titlebarTextHover: e.target.value })} className="flex-1 min-w-0 bg-transparent border-none text-xs text-zinc-200 px-2 outline-none font-mono uppercase" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">Titlebar Accent</label>
              <div className="flex bg-zinc-950 border border-zinc-800 rounded overflow-hidden h-8">
                <input type="color" value={theme.titlebarAccent || '#6366f1'} onChange={e => setTheme({ ...theme, titlebarAccent: e.target.value })} className="w-8 h-8 cursor-pointer border-none p-0 flex-shrink-0 appearance-none bg-transparent block focus:outline-none" />
                <input type="text" value={theme.titlebarAccent || '#6366f1'} onChange={e => setTheme({ ...theme, titlebarAccent: e.target.value })} className="flex-1 min-w-0 bg-transparent border-none text-xs text-zinc-200 px-2 outline-none font-mono uppercase" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">Titlebar Base (Alt 1)</label>
              <div className="flex bg-zinc-950 border border-zinc-800 rounded overflow-hidden h-8">
                <input type="color" value={theme.titlebarAlt || '#18181b'} onChange={e => setTheme({ ...theme, titlebarAlt: e.target.value })} className="w-8 h-8 cursor-pointer border-none p-0 flex-shrink-0 appearance-none bg-transparent block focus:outline-none" />
                <input type="text" value={theme.titlebarAlt || '#18181b'} onChange={e => setTheme({ ...theme, titlebarAlt: e.target.value })} className="flex-1 min-w-0 bg-transparent border-none text-xs text-zinc-200 px-2 outline-none font-mono uppercase" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">Titlebar Hover (Alt 2)</label>
              <div className="flex bg-zinc-950 border border-zinc-800 rounded overflow-hidden h-8">
                <input type="color" value={theme.titlebarAlt2 || '#27272a'} onChange={e => setTheme({ ...theme, titlebarAlt2: e.target.value })} className="w-8 h-8 cursor-pointer border-none p-0 flex-shrink-0 appearance-none bg-transparent block focus:outline-none" />
                <input type="text" value={theme.titlebarAlt2 || '#27272a'} onChange={e => setTheme({ ...theme, titlebarAlt2: e.target.value })} className="flex-1 min-w-0 bg-transparent border-none text-xs text-zinc-200 px-2 outline-none font-mono uppercase" />
              </div>
            </div>
            <div className="col-span-1 md:col-span-3">
              <label className="block text-xs text-zinc-500 mb-1.5">1-Click Presets</label>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setTheme({ mode: 'dark', titlebarBg: '#09090b', sidebarBg: '#09090b', mainBg: '#09090b', border: '#27272a', accent: '#6366f1', textMain: '#fafafa', textSec: '#a1a1aa', titlebarText: '#a1a1aa', titlebarTextHover: '#fafafa', titlebarAccent: '#6366f1', titlebarAlt: '#18181b', titlebarAlt2: '#27272a' })} className="flex-1 min-w-0 px-2 py-1 text-xs bg-zinc-800 rounded hover:bg-zinc-700 transition-colors">Dark</button>
                <button onClick={() => setTheme({ mode: 'light', titlebarBg: '#f4f4f5', sidebarBg: '#eaeaea', mainBg: '#f4f4f5', border: '#d4d4d8', accent: '#3b82f6', textMain: '#18181b', textSec: '#52525b', titlebarText: '#52525b', titlebarTextHover: '#18181b', titlebarAccent: '#3b82f6', titlebarAlt: '#ffffff', titlebarAlt2: '#e4e4e7' })} className="flex-1 min-w-0 px-2 py-1 text-xs bg-zinc-800 rounded hover:bg-zinc-700 text-white transition-colors">Light</button>
                <button onClick={() => setTheme({ mode: 'dracula', titlebarBg: '#282a36', sidebarBg: '#21222c', mainBg: '#282a36', border: '#44475a', accent: '#bd93f9', textMain: '#f8f8f2', textSec: '#6272a4', titlebarText: '#6272a4', titlebarTextHover: '#f8f8f2', titlebarAccent: '#bd93f9', titlebarAlt: '#191a21', titlebarAlt2: '#44475a' })} className="flex-1 min-w-0 px-2 py-1 text-xs bg-zinc-800 rounded hover:bg-zinc-700 text-white transition-colors">Drac</button>
              </div>
            </div>
          </div>
        </div>

        <div className="sv-panel p-5 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-medium sv-text">Native Adblocker & Filters</h3>
              <p className="text-xs sv-text opacity-60 mt-1">Filters network requests and injects element blockers.</p>
            </div>
            <button
              onClick={() => setIsAdblockEnabled(!isAdblockEnabled)}
              className={`w-12 h-6 rounded-full transition-colors relative ${isAdblockEnabled ? 'bg-emerald-500' : 'bg-zinc-700'}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${isAdblockEnabled ? 'left-7' : 'left-1'}`} />
            </button>
          </div>
          
          <div className="mt-4 pt-4 border-t border-[color-mix(in_srgb,var(--theme-text)_10%,transparent)]">
            <h4 className="text-[10px] font-medium sv-text opacity-50 mb-3 uppercase tracking-wider">Web Resource Filters</h4>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
              {Object.entries(networkFilters || {}).map(([term, enabled]) => (
                <label key={term} className={`group flex items-center gap-2 p-2 rounded-lg border transition-all cursor-pointer ${enabled ? 'bg-[color-mix(in_srgb,var(--theme-accent)_10%,transparent)] border-[color-mix(in_srgb,var(--theme-accent)_30%,transparent)]' : 'bg-[color-mix(in_srgb,var(--theme-bg)_40%,transparent)] border-[color-mix(in_srgb,var(--theme-text)_10%,transparent)] grayscale opacity-70 hover:opacity-100 hover:grayscale-0'}`}>
                  <div className={`w-4 h-4 rounded flex-shrink-0 flex items-center justify-center border transition-all ${enabled ? 'border-[var(--theme-accent)] bg-[var(--theme-accent)]' : 'border-[color-mix(in_srgb,var(--theme-text)_30%,transparent)] bg-transparent'}`}>
                    {enabled && <div className="w-1.5 h-1.5 bg-white rounded-full scale-100" />}
                  </div>
                  <span className={`text-xs font-mono truncate min-w-0 flex-1 transition-colors ${enabled ? 'text-[var(--theme-accent)]' : 'sv-text'}`}>{term}</span>
                  <input type="checkbox" className="hidden" checked={enabled} onChange={(e) => {
                    setNetworkFilters(prev => ({ ...prev, [term]: e.target.checked }));
                  }} />
                  <button onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const newFilters = { ...networkFilters };
                    delete newFilters[term];
                    setNetworkFilters(newFilters);
                  }} className="opacity-0 group-hover:opacity-100 text-red-400 hover:bg-red-400/20 p-1 rounded transition-all">
                    <Trash2 size={12} />
                  </button>
                </label>
              ))}
              <div className="flex items-center gap-2 p-1 pl-2 rounded-lg border border-dashed border-[color-mix(in_srgb,var(--theme-text)_20%,transparent)] bg-[color-mix(in_srgb,var(--theme-bg)_20%,transparent)] focus-within:border-[var(--theme-accent)] transition-colors">
                <Plus size={14} className="sv-text opacity-40" />
                <input
                  type="text"
                  placeholder="Add network rule..."
                  className="bg-transparent border-none outline-none text-xs font-mono sv-text w-full py-1 placeholder:sv-text placeholder:opacity-30"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const val = e.currentTarget.value.trim();
                      if (val) {
                        setNetworkFilters(prev => ({ ...(prev || {}), [val]: true }));
                        e.currentTarget.value = '';
                      }
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 bg-zinc-900/50 border border-zinc-800/50 rounded-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-zinc-200">Multi-Search Engine</h3>
              <p className="text-xs text-zinc-500 mt-1">Default engine for the floating search bar.</p>
            </div>
            <div className="w-48">
              <CustomSelect
                value={defaultSearchEngine || 'https://duckduckgo.com/?q='}
                onChange={(val) => { if (val) setDefaultSearchEngine(val); }}
                options={[
                  { value: 'https://duckduckgo.com/?q=', label: 'DuckDuckGo' },
                  { value: 'https://www.google.com/search?q=', label: 'Google' },
                  { value: 'https://search.brave.com/search?q=', label: 'Brave' },
                  { value: 'https://www.bing.com/search?q=', label: 'Bing' }
                ]}
              />
            </div>
          </div>
        </div>

        {/*
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
        */}
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
              <label className="block text-xs text-[color-mix(in_srgb,var(--theme-text)_60%,transparent)] mb-1.5">Domain or Plugin</label>
              <div className="flex gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <CustomSelect
                    searchable
                    value=""
                    onChange={(val) => {
                      if (val) {
                        try { setNewCred({ ...newCred, domain: new URL(val).hostname }) } catch { setNewCred({ ...newCred, domain: val }) }
                      }
                    }}
                    options={[
                      { value: '', label: 'Select a known site...' },
                      ...plugins.map(p => ({ value: p.baseUrl, label: `${p.name} (${p.baseUrl})` }))
                    ]}
                  />
                </div>
              </div>
              <input
                type="text" placeholder="Or type domain (e.g. netflix.com)"
                value={newCred.domain} onChange={e => setNewCred({ ...newCred, domain: e.target.value })}
                className="w-full bg-[color-mix(in_srgb,var(--theme-bg)_50%,transparent)] border border-[color-mix(in_srgb,var(--theme-text)_15%,transparent)] rounded-lg px-3 py-2 text-sm text-[var(--theme-text)] focus:border-[var(--theme-accent)] outline-none placeholder:text-[color-mix(in_srgb,var(--theme-text)_30%,transparent)]"
              />
            </div>
            <div>
              <label className="block text-xs text-[color-mix(in_srgb,var(--theme-text)_60%,transparent)] mb-1.5">Username / Email</label>
              <input
                type="text" placeholder="user@gmail.com"
                value={newCred.username} onChange={e => setNewCred({ ...newCred, username: e.target.value })}
                className="w-full bg-[color-mix(in_srgb,var(--theme-bg)_50%,transparent)] border border-[color-mix(in_srgb,var(--theme-text)_15%,transparent)] rounded-lg px-3 py-2 text-sm text-[var(--theme-text)] focus:border-[var(--theme-accent)] outline-none placeholder:text-[color-mix(in_srgb,var(--theme-text)_30%,transparent)]"
              />
            </div>
            <div>
              <label className="block text-xs text-[color-mix(in_srgb,var(--theme-text)_60%,transparent)] mb-1.5">Password</label>
              <input
                type="password" placeholder="••••••••"
                value={newCred.password} onChange={e => setNewCred({ ...newCred, password: e.target.value })}
                className="w-full bg-[color-mix(in_srgb,var(--theme-bg)_50%,transparent)] border border-[color-mix(in_srgb,var(--theme-text)_15%,transparent)] rounded-lg px-3 py-2 text-sm text-[var(--theme-text)] focus:border-[var(--theme-accent)] outline-none placeholder:text-[color-mix(in_srgb,var(--theme-text)_30%,transparent)]"
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

      {/* System Cache Map */}
      <div className="space-y-4 pt-4">
        <h3 className="text-sm font-medium text-theme-accent flex items-center gap-2 uppercase tracking-wider"><Save size={16} /> System Cache & History</h3>
        
        <div className="p-5 bg-zinc-900/30 border border-zinc-800/50 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-medium text-zinc-200">History Tracking</h3>
              <p className="text-xs text-zinc-500 mt-1">Record sites visited and your activity locally.</p>
            </div>
            <button
              onClick={() => setIsHistoryEnabled(!isHistoryEnabled)}
              className={`w-12 h-6 rounded-full transition-colors relative ${isHistoryEnabled ? 'bg-emerald-500' : 'bg-zinc-700'}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${isHistoryEnabled ? 'left-7' : 'left-1'}`} />
            </button>
          </div>
          <div className="flex justify-between items-center pt-4 border-t border-zinc-800/50 mt-4">
            <div>
              <h3 className="text-sm font-medium text-zinc-200">Clear History</h3>
              <p className="text-xs text-zinc-500 mt-1">Deletes all recorded URLs.</p>
            </div>
            <button onClick={() => { if(confirm('Clear browsing history?')) { setHistory([]); } }} className="px-3 py-1.5 bg-red-500/10 text-red-500 rounded hover:bg-red-500/20 text-xs transition-colors border border-red-500/20">Clear History</button>
          </div>
        </div>

        <div className="p-5 bg-zinc-900/30 border border-zinc-800/50 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-medium text-zinc-200">Active Workspace</h3>
              <p className="text-xs text-zinc-500 mt-1">You are currently using an isolated workspace save folder.</p>
            </div>
            <div className="flex gap-2 items-center">
              <div className="w-[180px]">
                <CustomSelect
                  options={workspaces.map(w => ({value: w, label: w}))}
                  value={currentWs}
                  onChange={(val) => {
                     if (val) ahk.call('RestartWorkspace', val);
                  }}
                  searchable
                />
              </div>
              <button onClick={() => setShowWsModal(true)} className="px-3 py-1.5 bg-indigo-500/20 text-indigo-400 rounded hover:bg-indigo-500/30 text-xs transition-colors flex items-center gap-1">
                 <Plus size={14} /> New
              </button>
            </div>
          </div>
          
          <Modal
            isOpen={showWsModal}
            onClose={() => { setShowWsModal(false); setNewWsName(''); }}
            title="Create New Workspace"
          >
            <div className="space-y-4">
               <p className="text-xs text-zinc-400">A workspace perfectly isolates all your plugins, flows, bookmarks, and settings locally into a new directory.</p>
               <div>
                 <label className="block text-xs text-zinc-500 mb-1.5">Workspace Name</label>
                 <input
                   type="text" value={newWsName} onChange={e => setNewWsName(e.target.value)}
                   placeholder="e.g. testing-env, dev, clean-slate" autoFocus
                   className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 outline-none"
                   onKeyDown={e => {
                     if (e.key === 'Enter' && newWsName.trim()) {
                        ahk.call('CreateWorkspace', newWsName.trim());
                        ahk.call('RestartWorkspace', newWsName.trim());
                     }
                   }}
                 />
               </div>
               <div className="flex gap-3 justify-end pt-4 border-t border-zinc-800/50 mt-4">
                  <button onClick={() => { setShowWsModal(false); setNewWsName(''); }} className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-zinc-200 transition-colors">Cancel</button>
                  <button onClick={() => {
                     if (newWsName.trim()) {
                        ahk.call('CreateWorkspace', newWsName.trim());
                        ahk.call('RestartWorkspace', newWsName.trim());
                     }
                  }} className="px-4 py-2 text-sm font-medium bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 shadow-[0_0_15px_rgba(99,102,241,0.2)] transition-colors">Create & Switch</button>
               </div>
            </div>
          </Modal>
        </div>

        <div className="p-5 bg-zinc-900/30 border border-zinc-800/50 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-zinc-200">Clear Runtime Data</h3>
              <p className="text-xs text-zinc-500 mt-1">Deletes all system cached objects created by plugins or scripts.</p>
            </div>
            <button
              onClick={() => {
                if (confirm('Are you sure you want to clear all system cache?')) {
                  ahk.call('CacheClear');
                }
              }}
              className="px-4 py-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 text-sm font-medium rounded-lg transition-colors border border-red-500/20"
            >
              Clear Cache
            </button>
          </div>
        </div>
      </div>

    </div>

  );
};
