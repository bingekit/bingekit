import React, { useState, useEffect } from 'react';
import { Search, Bookmark, Settings, Minus, ChevronDown, Square, X, ChevronLeft, ChevronRight, RotateCw, Film, Tv, Play, LayoutGrid, Shield, ShieldOff, Plus, Puzzle, Save, Trash2, Download, Upload, KeyRound, Code, ListTree, MonitorPlay, Activity, RefreshCw, Bell, Compass, Zap, Clock, Folder, Lock, EyeOff, Eye, Globe, Palette } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { ahk } from '../../lib/ahk';
import { TooltipWrapper } from '../ui/TooltipWrapper';
import { CustomCheckbox } from '../ui/CustomCheckbox';
import { CustomSelect } from '../ui/CustomSelect';
import { TagsInput } from '../ui/TagsInput';
import { Modal } from '../ui/Modal';
import { ConfigView } from './ConfigView';
import _Editor from 'react-simple-code-editor';
const Editor = (_Editor as any).default || _Editor;
import Prism from 'prismjs';
import { DEFAULT_PLUGIN, SitePlugin, CustomFlow, Userscript, FollowedItem, BookmarkItem, WatchLaterItem, CredentialItem } from '../../types';
import { addCredentialDB, deleteCredentialDB } from '../../lib/db';

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
    showCredModal, setShowCredModal, searchParamMode, setSearchParamMode, isQuickOptionsHidden, setIsQuickOptionsHidden, defaultSearchEngine, setDefaultSearchEngine, homePage, setHomePage,
    history, setHistory, isHistoryEnabled, setIsHistoryEnabled, adblockWhitelist, setAdblockWhitelist, networkFilters, setNetworkFilters, navButtons, setNavButtons,
    downloadsLoc, setDownloadsLoc, downloadsTemp, setDownloadsTemp, blockedExts, setBlockedExts,
    searchThreadLimit, setSearchThreadLimit, isCompiledApp, isPortableApp, ffmpegStatusApp, setFfmpegStatusApp,
    activeSettingsTab, setActiveSettingsTab, isMultiTabEnabled, setIsMultiTabEnabled,
    browserTabs, setBrowserTabs, activeBrowserTabId
  } = useAppContext();

  const [showMultiTabDialog, setShowMultiTabDialog] = useState(false);

  React.useEffect(() => {
    if (activeTab === 'config') {
      setActiveSettingsTab('advanced');
    }
  }, [activeTab, setActiveSettingsTab]);

  React.useEffect(() => {
    if (activeTab === 'config') {
      setActiveSettingsTab('advanced');
    }
  }, [activeTab, setActiveSettingsTab]);

  const [workspaces, setWorkspaces] = useState<string[]>([]);
  const [currentWs, setCurrentWs] = useState<string>('default');
  const [showWsModal, setShowWsModal] = useState(false);
  const [newWsName, setNewWsName] = useState('');

  const [showPortableModal, setShowPortableModal] = useState<boolean>(false);
  const [pendingPortableMode, setPendingPortableMode] = useState<boolean>(false);

  const NavButtonsSelect = ({ navButtons, setNavButtons }: { navButtons: any, setNavButtons: any }) => {
    const [isOpen, setIsOpen] = useState(false);
    const ref = React.useRef<HTMLDivElement>(null);

    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (ref.current && !ref.current.contains(e.target as Node)) {
          setIsOpen(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
      <div ref={ref} className="relative w-48">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between bg-[color-mix(in_srgb,var(--theme-text-main)_3%,transparent)] border border-[color-mix(in_srgb,var(--theme-text-main)_10%,transparent)] rounded-lg px-3 py-2 text-sm text-[var(--theme-text-main)] outline-none transition-colors hover:border-[color-mix(in_srgb,var(--theme-text-main)_20%,transparent)] h-[38px] cursor-pointer"
        >
          <span className="truncate">{Object.values(navButtons).filter(Boolean).length} Active Buttons</span>
          <ChevronDown size={14} className={`text-[color-mix(in_srgb,var(--theme-text-main)_50%,transparent)] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div style={{ backgroundColor: 'var(--theme-sidebar)' }} className="absolute z-10 w-full mt-1 border border-[color-mix(in_srgb,var(--theme-border)_50%,transparent)] rounded-lg shadow-xl overflow-hidden shadow-black/40 py-1">
            {Object.entries({ home: 'Home', back: 'Back', forward: 'Forward', reload: 'Reload' }).map(([key, label]) => (
              <label key={key} className="w-full text-left px-3 py-2.5 text-sm flex items-center gap-3 hover:bg-[color-mix(in_srgb,var(--theme-text-main)_5%,transparent)] transition-colors cursor-pointer text-[var(--theme-text-main)]">
                <input
                  type="checkbox"
                  checked={navButtons[key as keyof typeof navButtons]}
                  onChange={(e) => setNavButtons({ ...navButtons, [key]: e.target.checked })}
                  className="rounded bg-[color-mix(in_srgb,var(--theme-text-main)_10%,transparent)] border-[color-mix(in_srgb,var(--theme-text-main)_20%,transparent)]"
                />
                {label}
              </label>
            ))}
          </div>
        )}
      </div>
    );
  };

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

  const [appVersion, setAppVersion] = useState<string>('0.0.0');
  const [updateObj, setUpdateObj] = useState<any>(null);
  const [isCheckingAppUpdates, setIsCheckingAppUpdates] = useState(false);

  useEffect(() => {
    try {
      const ver = ahk.call('GetAppVersion');
      if (ver) setAppVersion(ver);
    } catch (e) { }
  }, []);

  const checkAppUpdates = async () => {
    setIsCheckingAppUpdates(true);
    try {
      const res = await ahk.call('CheckForUpdates');
      if (res) {
        const parsed = JSON.parse(res);
        setUpdateObj(parsed);
      } else {
        setUpdateObj({ upToDate: true });
      }
    } catch (e) {
      setUpdateObj({ error: true });
    }
    setIsCheckingAppUpdates(false);
  };

  const installUpdate = () => {
    if (updateObj && updateObj.url) {
      ahk.call('InstallUpdate', updateObj.url);
    }
  };

  const renderColorInput = (label: string, field: string) => (
    <div>
      <label className="block text-xs text-[var(--theme-text-sec)] mb-1.5">{label}</label>
      <div className="flex bg-[color-mix(in_srgb,var(--theme-text-main)_2%,transparent)] border border-[color-mix(in_srgb,var(--theme-text-main)_10%,transparent)] rounded overflow-hidden h-8">
        <input type="color" value={theme[field] || '#ffffff'} onChange={e => setTheme({ ...theme, [field]: e.target.value })} className="w-8 h-8 cursor-pointer border-none p-0 flex-shrink-0 appearance-none bg-transparent block focus:outline-none" />
        <input type="text" value={theme[field] || ''} onChange={e => setTheme({ ...theme, [field]: e.target.value })} className="flex-1 min-w-0 bg-transparent border-none text-xs text-[var(--theme-text-main)] px-2 outline-none font-mono uppercase" />
      </div>
    </div>
  );

  return (
    <div className="flex h-full w-full">
      {/* Left Sidebar Menu */}
      <div className="w-64 flex-shrink-0 p-6 pr-4 border-r border-[color-mix(in_srgb,var(--theme-border)_50%,transparent)] overflow-y-auto no-scrollbar">
        <h2 className="text-2xl font-light tracking-tight text-[var(--theme-text-main)] mb-8">Settings</h2>
        <div className="space-y-1.5">
          <button onClick={() => setActiveSettingsTab('general')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${activeSettingsTab === 'general' ? 'bg-[color-mix(in_srgb,var(--theme-accent)_15%,transparent)] text-[var(--theme-accent)] font-medium' : 'text-[var(--theme-text-sec)] hover:text-[var(--theme-text-main)] hover:bg-[color-mix(in_srgb,var(--theme-text-main)_5%,transparent)]'}`}>
            <Settings size={18} /> General
          </button>
          <button onClick={() => setActiveSettingsTab('appearance')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${activeSettingsTab === 'appearance' ? 'bg-[color-mix(in_srgb,var(--theme-accent)_15%,transparent)] text-[var(--theme-accent)] font-medium' : 'text-[var(--theme-text-sec)] hover:text-[var(--theme-text-main)] hover:bg-[color-mix(in_srgb,var(--theme-text-main)_5%,transparent)]'}`}>
            <Palette size={18} /> Appearance
          </button>
          <button onClick={() => setActiveSettingsTab('downloads')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${activeSettingsTab === 'downloads' ? 'bg-[color-mix(in_srgb,var(--theme-accent)_15%,transparent)] text-[var(--theme-accent)] font-medium' : 'text-[var(--theme-text-sec)] hover:text-[var(--theme-text-main)] hover:bg-[color-mix(in_srgb,var(--theme-text-main)_5%,transparent)]'}`}>
            <Download size={18} /> Downloads
          </button>
          <button onClick={() => setActiveSettingsTab('privacy')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${activeSettingsTab === 'privacy' ? 'bg-[color-mix(in_srgb,var(--theme-accent)_15%,transparent)] text-[var(--theme-accent)] font-medium' : 'text-[var(--theme-text-sec)] hover:text-[var(--theme-text-main)] hover:bg-[color-mix(in_srgb,var(--theme-text-main)_5%,transparent)]'}`}>
            <Shield size={18} /> Privacy & Data
          </button>
        </div>
        <div className="mt-8 space-y-1.5">
          <label className="px-3 text-xs font-medium text-[color-mix(in_srgb,var(--theme-text-sec)_70%,transparent)] uppercase tracking-wider mb-2 block">System</label>
          <button onClick={() => setActiveSettingsTab('advanced')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${activeSettingsTab === 'advanced' ? 'bg-[color-mix(in_srgb,var(--theme-accent)_15%,transparent)] text-[var(--theme-accent)] font-medium' : 'text-[var(--theme-text-sec)] hover:text-[var(--theme-text-main)] hover:bg-[color-mix(in_srgb,var(--theme-text-main)_5%,transparent)]'}`}>
            <Code size={18} /> Advanced
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-8 h-full overflow-y-auto no-scrollbar max-w-5xl">

        {/* --- GENERAL TAB --- */}
        {activeSettingsTab === 'general' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <h3 className="text-xl font-medium text-[var(--theme-text-main)] mb-6 hidden md:block">General Preferences</h3>

            <div className="p-5 bg-[color-mix(in_srgb,var(--theme-text-main)_2%,transparent)] border border-[color-mix(in_srgb,var(--theme-border)_50%,transparent)] rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-medium text-[var(--theme-text-main)]">System Updates & Version</h3>
                <p className="text-xs text-[var(--theme-text-sec)] mt-1">Current Version: <span className="font-mono text-[var(--theme-text-main)]">v{appVersion}</span></p>

                {updateObj && (
                  <div className={`mt-3 text-xs ${updateObj.error ? 'text-red-400' : updateObj.upToDate ? 'text-emerald-400' : 'text-indigo-400'}`}>
                    {updateObj.unsupported && <span className="text-[var(--theme-text-sec)]">Auto-updater requires a compiled executable.</span>}
                    {updateObj.error && !updateObj.unsupported && "Failed to check for updates. Check your connection or rate limits."}
                    {updateObj.upToDate && "You are on the latest version."}
                    {updateObj.version && (
                      <div className="flex flex-col gap-2">
                        <span className="font-medium">Version v{updateObj.version} is available!</span>
                        {updateObj.body && (
                          <div className="bg-[color-mix(in_srgb,var(--theme-text-main)_2%,transparent)] p-3 rounded-lg border border-[color-mix(in_srgb,var(--theme-border)_50%,transparent)] max-h-32 overflow-y-auto text-[var(--theme-text-sec)]">
                            {updateObj.body.split('\n').map((line: string, i: number) => (
                              <p key={i}>{line}</p>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                {!isCompiledApp || updateObj?.unsupported ? (
                  <button disabled className="px-4 py-2 bg-[color-mix(in_srgb,var(--theme-text-main)_5%,transparent)] text-[var(--theme-text-sec)] rounded-lg text-sm font-medium transition-colors ml-auto flex items-center gap-2 cursor-not-allowed border border-[color-mix(in_srgb,var(--theme-text-main)_10%,transparent)]">
                    <RefreshCw size={14} /> Disabled (Uncompiled)
                  </button>
                ) : !updateObj?.version ? (
                  <button
                    onClick={checkAppUpdates}
                    disabled={isCheckingAppUpdates}
                    className="px-4 py-2 bg-[color-mix(in_srgb,var(--theme-text-main)_8%,transparent)] hover:bg-[color-mix(in_srgb,var(--theme-text-main)_12%,transparent)] text-[var(--theme-text-main)] rounded-lg text-sm font-medium transition-colors ml-auto flex items-center gap-2 disabled:opacity-50"
                  >
                    <RefreshCw size={14} className={isCheckingAppUpdates ? "animate-spin" : ""} />
                    {isCheckingAppUpdates ? "Checking..." : "Check for Updates"}
                  </button>
                ) : (
                  <button
                    onClick={installUpdate}
                    className="px-4 py-2 bg-[var(--theme-accent)] hover:bg-[color-mix(in_srgb,var(--theme-accent)_90%,white)] text-white rounded-lg text-sm font-medium shadow-[0_0_15px_color-mix(in_srgb,var(--theme-accent)_30%,transparent)] flex items-center gap-2 transition-colors ml-auto"
                  >
                    <Download size={14} /> Update and Restart
                  </button>
                )}
              </div>
            </div>

            <div className="p-5 bg-[color-mix(in_srgb,var(--theme-text-main)_2%,transparent)] border border-[color-mix(in_srgb,var(--theme-border)_50%,transparent)] rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-medium text-[var(--theme-text-main)] flex items-center gap-2">
                  <Globe size={16} className="text-[var(--theme-accent)]" />
                  Global Storage Mode (Portable vs Installed)
                </h3>
                <p className="text-xs text-[var(--theme-text-sec)] mt-1 max-w-xl">
                  Portable Mode isolates all your plugins, scripts, and logs right next to the executable. Installed mode moves it into your Windows `%LOCALAPPDATA%` tree. Toggling this triggers a data-migration sequence.
                </p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-xs font-mono text-[var(--theme-text-sec)] uppercase">{isPortableApp ? 'Portable' : 'Installed'}</span>
                <button
                  onClick={() => {
                    setPendingPortableMode(!isPortableApp);
                    setShowPortableModal(true);
                  }}
                  className={`w-12 h-6 rounded-full transition-colors relative ${isPortableApp ? 'bg-[var(--theme-accent)]' : 'bg-[color-mix(in_srgb,var(--theme-text-main)_15%,transparent)]'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${isPortableApp ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
            </div>

            <div className="p-5 bg-[color-mix(in_srgb,var(--theme-text-main)_2%,transparent)] border border-[color-mix(in_srgb,var(--theme-border)_50%,transparent)] rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-medium text-[var(--theme-text-main)] flex items-center gap-2">
                  <LayoutGrid size={16} className="text-[var(--theme-accent)]" />
                  Enable Multi-Tab Interface (Beta)
                </h3>
                <p className="text-xs text-[var(--theme-text-sec)] mt-1 max-w-xl">
                  Transforms the UI to allow multiple web views, tabs, and dynamic tiling. Enabling this will reorganize the top title bar and change how you manage active sites.
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div
                  onClick={() => {
                    if (isMultiTabEnabled && browserTabs.length > 1) {
                      setShowMultiTabDialog(true);
                    } else {
                      const newMultiTab = !isMultiTabEnabled;
                      setIsMultiTabEnabled(newMultiTab);
                      ahk.call('SaveData', 'multi_tab_enabled.txt', newMultiTab ? 'true' : 'false');
                    }
                  }}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${isMultiTabEnabled ? 'bg-[var(--theme-accent)]' : 'bg-[color-mix(in_srgb,var(--theme-text-main)_15%,transparent)]'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${isMultiTabEnabled ? 'left-7' : 'left-1'}`} />
                </div>
              </div>
            </div>

            <div className="p-5 bg-[color-mix(in_srgb,var(--theme-text-main)_2%,transparent)] border border-[color-mix(in_srgb,var(--theme-border)_50%,transparent)] rounded-2xl space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-[var(--theme-text-main)]">Multi-Search Engine</h3>
                  <p className="text-xs text-[var(--theme-text-sec)] mt-1">Default engine for the floating search bar.</p>
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
              <div className="pt-6 border-t border-[color-mix(in_srgb,var(--theme-border)_50%,transparent)] flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-[var(--theme-text-main)]">Max Simultaneous Searches</h3>
                  <p className="text-xs text-[var(--theme-text-sec)] mt-1">Chunk site searches in batches rather than querying all at once.</p>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="1"
                    max="30"
                    value={searchThreadLimit}
                    onChange={(e) => setSearchThreadLimit(Number(e.target.value))}
                    className="w-32 cursor-pointer"
                    style={{ accentColor: 'var(--theme-accent)' }}
                  />
                  <span className="text-sm font-medium text-[var(--theme-accent)] w-6 text-right whitespace-nowrap">{searchThreadLimit}</span>
                </div>
              </div>
              <div className="pt-6 border-t border-[color-mix(in_srgb,var(--theme-border)_50%,transparent)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-medium text-[var(--theme-text-main)]">Player Home Page</h3>
                  <p className="text-xs text-[var(--theme-text-sec)] mt-1">Default page when opening the application player.</p>
                </div>
                <div className="w-full md:w-96 flex gap-2">
                  <input
                    type="text"
                    value={homePage || ''}
                    onChange={(e) => setHomePage(e.target.value)}
                    placeholder="Custom URL..."
                    className="flex-1 min-w-0 bg-[color-mix(in_srgb,var(--theme-text-main)_3%,transparent)] border border-[color-mix(in_srgb,var(--theme-text-main)_10%,transparent)] rounded-lg px-3 py-2 text-sm text-[var(--theme-text-main)] focus:border-[var(--theme-accent)] outline-none"
                  />
                  <div className="w-32 flex-shrink-0">
                    <CustomSelect
                      value=""
                      onChange={(val) => { if (val) setHomePage(val); }}
                      options={plugins.map(p => ({ value: p.baseUrl, label: p.name }))}
                      placeholder="Set to Plugin"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- APPEARANCE TAB --- */}
        {activeSettingsTab === 'appearance' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <h3 className="text-xl font-medium text-[var(--theme-text-main)] mb-6 hidden md:block">Appearance & Themes</h3>

            <div className="p-5 bg-[color-mix(in_srgb,var(--theme-text-main)_2%,transparent)] border border-[color-mix(in_srgb,var(--theme-border)_50%,transparent)] rounded-2xl space-y-4">
              <h3 className="text-sm font-medium text-[var(--theme-text-main)] flex items-center gap-2"><Zap size={16} className="text-[var(--theme-accent)]" /> Theme Configuration</h3>

              <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-5">
                {renderColorInput('Top Titlebar', 'titlebarBg')}
                {renderColorInput('Side Menu', 'sidebarBg')}
                {renderColorInput('Main Content', 'mainBg')}
                {renderColorInput('Borders', 'border')}
                {renderColorInput('Accent Color (Buttons)', 'accent')}
                {renderColorInput('Main Text', 'textMain')}
                {renderColorInput('Secondary Text', 'textSec')}
                {renderColorInput('URL Bar Background', 'urlbarBg')}
                {renderColorInput('URL Bar Text', 'urlbarText')}
                {renderColorInput('URL Bar Icons', 'urlbarIcon')}
                {renderColorInput('Sidebar Text', 'sidebarText')}
                {renderColorInput('Titlebar Text', 'titlebarText')}
                {renderColorInput('Titlebar Text Hover', 'titlebarTextHover')}
                {renderColorInput('Titlebar Accent', 'titlebarAccent')}
                {renderColorInput('Titlebar Base (Alt 1)', 'titlebarAlt')}
                {renderColorInput('Titlebar Hover (Alt 2)', 'titlebarAlt2')}
              </div>

              <div className="pt-4 mt-6 border-t border-[color-mix(in_srgb,var(--theme-border)_50%,transparent)]">
                <label className="block text-xs font-medium text-[var(--theme-text-main)] mb-3">1-Click Presets</label>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setTheme({ mode: 'dark', titlebarBg: '#09090b', sidebarBg: '#09090b', mainBg: '#09090b', border: '#27272a', accent: '#6366f1', textMain: '#fafafa', textSec: '#a1a1aa', titlebarText: '#a1a1aa', titlebarTextHover: '#fafafa', titlebarAccent: '#6366f1', titlebarAlt: '#18181b', titlebarAlt2: '#27272a', sidebarText: '#a1a1aa', urlbarBg: 'color-mix(in srgb, #fafafa 4%, transparent)' })} className="px-3 py-1.5 text-xs bg-[color-mix(in_srgb,var(--theme-text-main)_8%,transparent)] rounded hover:bg-[color-mix(in_srgb,var(--theme-text-main)_12%,transparent)] transition-colors text-[var(--theme-text-main)]">Dark Mode (Default)</button>
                  <button onClick={() => setTheme({ mode: 'light', titlebarBg: '#f4f4f5', sidebarBg: '#eaeaea', mainBg: '#f4f4f5', border: '#d4d4d8', accent: '#3b82f6', textMain: '#18181b', textSec: '#52525b', titlebarText: '#52525b', titlebarTextHover: '#18181b', titlebarAccent: '#3b82f6', titlebarAlt: '#ffffff', titlebarAlt2: '#e4e4e7', sidebarText: '#52525b', urlbarBg: 'color-mix(in srgb, #18181b 4%, transparent)' })} className="px-3 py-1.5 text-xs bg-[color-mix(in_srgb,var(--theme-text-main)_8%,transparent)] rounded hover:bg-[color-mix(in_srgb,var(--theme-text-main)_12%,transparent)] transition-colors text-[var(--theme-text-main)]">Light Mode</button>
                  <button onClick={() => setTheme({ mode: 'dracula', titlebarBg: '#282a36', sidebarBg: '#21222c', mainBg: '#282a36', border: '#44475a', accent: '#bd93f9', textMain: '#f8f8f2', textSec: '#6272a4', titlebarText: '#6272a4', titlebarTextHover: '#f8f8f2', titlebarAccent: '#bd93f9', titlebarAlt: '#191a21', titlebarAlt2: '#44475a', sidebarText: '#6272a4', urlbarBg: 'color-mix(in srgb, #f8f8f2 5%, transparent)' })} className="px-3 py-1.5 text-xs bg-[color-mix(in_srgb,var(--theme-text-main)_8%,transparent)] rounded hover:bg-[color-mix(in_srgb,var(--theme-text-main)_12%,transparent)] transition-colors text-[var(--theme-text-main)]">Dracula</button>

                  {/* Two-Tone Presets */}
                  <button onClick={() => setTheme({ mode: 'dark', titlebarBg: '#1e1b4b', sidebarBg: '#0b0a1f', mainBg: '#09090b', border: '#312e81', accent: '#818cf8', textMain: '#fafafa', textSec: '#a1a1aa', titlebarText: '#a5b4fc', titlebarTextHover: '#e0e7ff', titlebarAccent: '#818cf8', titlebarAlt: '#312e81', titlebarAlt2: '#3730a3', sidebarText: '#a5b4fc', urlbarBg: 'color-mix(in srgb, #312e81 80%, #1e1b4b)' })} className="px-3 py-1.5 text-xs bg-[color-mix(in_srgb,var(--theme-text-main)_8%,transparent)] rounded hover:bg-[color-mix(in_srgb,var(--theme-text-main)_12%,transparent)] transition-colors text-[var(--theme-text-main)] border border-[color-mix(in_srgb,var(--theme-text-main)_15%,transparent)]">Two-Tone Dark</button>

                  <button onClick={() => setTheme({ mode: 'light', titlebarBg: '#4c73e6', sidebarBg: '#eaeaea', mainBg: '#f4f4f5', border: '#d4d4d8', accent: '#4c57e6', textMain: '#18181b', textSec: '#52525b', titlebarText: '#c7d2fe', titlebarTextHover: '#ffffff', titlebarAccent: '#ffffff', titlebarAlt: '#f2f2f2', titlebarAlt2: '#ffffff33', sidebarText: '#474747', urlbarBg: '#ffffff', urlbarText: '#525252', urlbarIcon: '#4d4d4d' })} className="px-3 py-1.5 text-xs bg-[color-mix(in_srgb,var(--theme-text-main)_8%,transparent)] rounded hover:bg-[color-mix(in_srgb,var(--theme-text-main)_12%,transparent)] transition-colors text-[var(--theme-text-main)] border border-[color-mix(in_srgb,var(--theme-text-main)_15%,transparent)]">Two-Tone Light</button>
                </div>
              </div>
            </div>

            <div className="p-5 bg-[color-mix(in_srgb,var(--theme-text-main)_2%,transparent)] border border-[color-mix(in_srgb,var(--theme-border)_50%,transparent)] rounded-2xl space-y-4">
              <h3 className="text-sm font-medium text-[var(--theme-text-main)] flex items-center gap-2"><LayoutGrid size={16} className="text-[var(--theme-accent)]" /> Interface Layout</h3>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-[var(--theme-text-main)]">URL Bar Visibility</h4>
                  <p className="text-xs text-[var(--theme-text-sec)] mt-1">Choose how the URL bar appears in the player view.</p>
                </div>
                <div className="w-48">
                  <CustomSelect
                    value={urlBarMode}
                    onChange={(val) => { if (val) setUrlBarMode(val as any); }}
                    options={[
                      { value: 'full', label: 'Full Bar' },
                      { value: 'title', label: 'Title Only' },
                      { value: 'hidden', label: 'Hidden entirely' }
                    ]}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-[color-mix(in_srgb,var(--theme-border)_50%,transparent)]">
                <div>
                  <h4 className="text-sm font-medium text-[var(--theme-text-main)]">URL Bar Navigation Buttons</h4>
                  <p className="text-xs text-[var(--theme-text-sec)] mt-1">Select which buttons show up on the URL bar.</p>
                </div>
                <NavButtonsSelect navButtons={navButtons} setNavButtons={setNavButtons} />
              </div>
            </div>
          </div>
        )}

        {/* --- DOWNLOADS TAB --- */}
        {activeSettingsTab === 'downloads' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <h3 className="text-xl font-medium text-[var(--theme-text-main)] mb-6 hidden md:block">Downloads & Media</h3>

            <div className="p-5 bg-[color-mix(in_srgb,var(--theme-text-main)_2%,transparent)] border border-[color-mix(in_srgb,var(--theme-border)_50%,transparent)] rounded-2xl space-y-5">
              <h3 className="text-sm font-medium text-[var(--theme-text-main)] flex items-center gap-2"><Download size={16} className="text-[var(--theme-accent)]" /> Storage Paths</h3>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-[var(--theme-text-main)]">Downloads Folder</h4>
                  <p className="text-xs text-[var(--theme-text-sec)] mt-1 cursor-pointer hover:text-[var(--theme-accent)] transition-colors truncate max-w-[300px] md:max-w-md" onClick={() => { try { ahk.call('PromptSelectFolder', 'downloadsLoc'); } catch (e) { } }}>{downloadsLoc || 'Not Set'}</p>
                </div>
                <button type="button" onClick={() => { try { ahk.call('PromptSelectFolder', 'downloadsLoc'); } catch (e) { } }} className="px-4 py-2 bg-[color-mix(in_srgb,var(--theme-text-main)_8%,transparent)] text-[var(--theme-text-main)] rounded-lg text-xs hover:bg-[color-mix(in_srgb,var(--theme-text-main)_12%,transparent)] transition-colors">Change</button>
              </div>

              <div className="flex items-center justify-between mt-4">
                <div>
                  <h4 className="text-sm font-medium text-[var(--theme-text-main)]">Temporary Muxing Location</h4>
                  <p className="text-xs text-[var(--theme-text-sec)] mt-1 cursor-pointer hover:text-[var(--theme-accent)] transition-colors truncate max-w-[300px] md:max-w-md" onClick={() => { try { ahk.call('PromptSelectFolder', 'downloadsTemp'); } catch (e) { } }}>{downloadsTemp || 'Not Set'}</p>
                </div>
                <button type="button" onClick={() => { try { ahk.call('PromptSelectFolder', 'downloadsTemp'); } catch (e) { } }} className="px-4 py-2 bg-[color-mix(in_srgb,var(--theme-text-main)_8%,transparent)] text-[var(--theme-text-main)] rounded-lg text-xs hover:bg-[color-mix(in_srgb,var(--theme-text-main)_12%,transparent)] transition-colors">Change</button>
              </div>
            </div>

            <div className="p-5 bg-[color-mix(in_srgb,var(--theme-text-main)_2%,transparent)] border border-[color-mix(in_srgb,var(--theme-border)_50%,transparent)] rounded-2xl flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-[var(--theme-text-main)]">FFmpeg Stream Engine</h4>
                <div className="flex items-center gap-2 mt-1">
                  <div className={`w-2 h-2 rounded-full ${ffmpegStatusApp === 'installed' ? 'bg-emerald-500' : (ffmpegStatusApp === 'missing' ? 'bg-red-500' : 'bg-yellow-500 animate-pulse')}`} />
                  <p className="text-xs text-[var(--theme-text-sec)]">{ffmpegStatusApp === 'installed' ? 'Installed and ready' : (ffmpegStatusApp === 'missing' ? 'Not installed' : 'Checking...')}</p>
                </div>
              </div>
              <button type="button" onClick={() => { try { ahk.call('EnsureFFmpeg', true); setTimeout(() => setFfmpegStatusApp(ahk.call('CheckFFmpegStatus') || 'missing'), 3000); } catch (e) { } }} className="px-4 py-2 bg-[color-mix(in_srgb,var(--theme-text-main)_8%,transparent)] text-[var(--theme-text-main)] rounded-lg text-xs hover:bg-[color-mix(in_srgb,var(--theme-text-main)_12%,transparent)] transition-colors">
                {ffmpegStatusApp === 'installed' ? 'Reinstall' : 'Install FFmpeg'}
              </button>
            </div>

            <div className="p-5 bg-[color-mix(in_srgb,var(--theme-text-main)_2%,transparent)] border border-[color-mix(in_srgb,var(--theme-border)_50%,transparent)] rounded-2xl">
              <label className="block text-sm font-medium text-[var(--theme-text-main)] mb-1.5">Global Blocked Extensions</label>
              <p className="text-xs text-[var(--theme-text-sec)] mb-4">These extensions will be blocked regardless of site. (e.g. .exe, .msi, .bat)</p>
              <TagsInput tags={blockedExts} onChange={setBlockedExts} />
            </div>
          </div>
        )}

        {/* --- PRIVACY & DATA TAB --- */}
        {activeSettingsTab === 'privacy' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <h3 className="text-xl font-medium text-[var(--theme-text-main)] mb-6 hidden md:block">Privacy & Data Management</h3>

            <div className="p-5 bg-[color-mix(in_srgb,var(--theme-text-main)_2%,transparent)] border border-[color-mix(in_srgb,var(--theme-border)_50%,transparent)] rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-medium text-[var(--theme-text-main)]">Native Adblocker & Filters</h3>
                  <p className="text-xs text-[var(--theme-text-sec)] mt-1">Filters network requests and injects element blockers.</p>
                </div>
                <button
                  onClick={() => setIsAdblockEnabled(!isAdblockEnabled)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${isAdblockEnabled ? 'bg-emerald-500' : 'bg-[color-mix(in_srgb,var(--theme-text-main)_15%,transparent)]'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${isAdblockEnabled ? 'left-7' : 'left-1'}`} />
                </button>
              </div>

              <div className="pt-4 border-t border-[color-mix(in_srgb,var(--theme-border)_50%,transparent)]">
                <h4 className="text-[10px] font-medium text-[var(--theme-text-sec)] mb-3 uppercase tracking-wider">Web Resource Filters</h4>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                  {Object.entries(networkFilters || {}).map(([term, enabled]) => (
                    <label key={term} className={`group flex items-center gap-2 p-2 rounded-lg border transition-all cursor-pointer ${enabled ? 'bg-[color-mix(in_srgb,var(--theme-accent)_10%,transparent)] border-[color-mix(in_srgb,var(--theme-accent)_30%,transparent)]' : 'bg-[color-mix(in_srgb,var(--theme-text-main)_5%,transparent)] border-[color-mix(in_srgb,var(--theme-border)_50%,transparent)] grayscale opacity-70 hover:opacity-100 hover:grayscale-0'}`}>
                      <div className={`w-4 h-4 rounded flex-shrink-0 flex items-center justify-center border transition-all ${enabled ? 'border-[var(--theme-accent)] bg-[var(--theme-accent)]' : 'border-[color-mix(in_srgb,var(--theme-text-main)_30%,transparent)] bg-transparent'}`}>
                        {enabled && <div className="w-1.5 h-1.5 bg-white rounded-full scale-100" />}
                      </div>
                      <span className={`text-xs font-mono truncate min-w-0 flex-1 transition-colors ${enabled ? 'text-[var(--theme-accent)]' : 'text-[var(--theme-text-main)]'}`}>{term}</span>
                      <input type="checkbox" className="hidden" checked={enabled} onChange={(e) => {
                        setNetworkFilters(prev => ({ ...prev, [term]: e.target.checked }));
                      }} />
                      <button onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const newFilters = { ...networkFilters };
                        delete newFilters[term];
                        setNetworkFilters(newFilters);
                      }} className="opacity-0 group-hover:opacity-100 text-red-500 hover:bg-red-500/20 p-1 rounded transition-all">
                        <Trash2 size={12} />
                      </button>
                    </label>
                  ))}
                  <div className="flex items-center gap-2 p-1 pl-2 rounded-lg border border-dashed border-[color-mix(in_srgb,var(--theme-border)_50%,transparent)] bg-[color-mix(in_srgb,var(--theme-text-main)_3%,transparent)] focus-within:border-[var(--theme-accent)] transition-colors">
                    <Plus size={14} className="text-[var(--theme-text-sec)]" />
                    <input
                      type="text"
                      placeholder="Add network rule..."
                      className="bg-transparent border-none outline-none text-xs font-mono text-[var(--theme-text-main)] w-full py-1 placeholder:text-[var(--theme-text-sec)] placeholder:opacity-50"
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

              <div className="pt-4 mt-4 border-t border-[color-mix(in_srgb,var(--theme-border)_50%,transparent)]">
                <label className="block text-sm font-medium text-[var(--theme-text-main)] mb-1.5">Site Whitelist</label>
                <p className="text-xs text-[var(--theme-text-sec)] mb-4">Adblocker will be disabled entirely on these domains (e.g. google.com)</p>
                <TagsInput tags={adblockWhitelist} onChange={setAdblockWhitelist} />
              </div>
            </div>

            <div className="p-5 bg-[color-mix(in_srgb,var(--theme-text-main)_2%,transparent)] border border-[color-mix(in_srgb,var(--theme-border)_50%,transparent)] rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-medium text-[var(--theme-text-main)] flex items-center gap-2"><Lock size={16} className="text-[var(--theme-accent)]" /> Credential Manager</h3>
                  <p className="text-xs text-[var(--theme-text-sec)] mt-1">Manage logins for external sites (Auto-Login bypass).</p>
                </div>
                <button
                  onClick={() => setShowCredModal(true)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-[color-mix(in_srgb,var(--theme-accent)_20%,transparent)] text-[var(--theme-accent)] hover:bg-[color-mix(in_srgb,var(--theme-accent)_30%,transparent)] rounded-lg text-xs font-medium transition-colors"
                >
                  <Plus size={14} /> Add New
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                  {credentials.map(c => (
                    <div key={c.id} className="group relative flex justify-between items-center p-3.5 bg-[color-mix(in_srgb,var(--theme-text-main)_3%,transparent)] hover:bg-[color-mix(in_srgb,var(--theme-text-main)_6%,transparent)] border border-[color-mix(in_srgb,var(--theme-border)_50%,transparent)] rounded-xl transition-all">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-8 h-8 rounded bg-[color-mix(in_srgb,var(--theme-text-main)_5%,transparent)] flex items-center justify-center flex-shrink-0 text-[var(--theme-text-sec)]">
                          <KeyRound size={14} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[var(--theme-text-main)] truncate">{c.domain}</p>
                          <p className="text-xs text-[var(--theme-text-sec)] truncate">{c.username}</p>
                        </div>
                      </div>
                      <button
                        onClick={async () => {
                          await deleteCredentialDB(c.id);
                          setCredentials(credentials.filter(x => x.id !== c.id));
                        }}
                        className="opacity-0 group-hover:opacity-100 text-[var(--theme-text-sec)] hover:text-red-500 transition-all p-1.5 bg-[color-mix(in_srgb,var(--theme-text-main)_5%,transparent)] rounded-lg"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
                {credentials.length === 0 && (
                  <div className="text-xs text-[var(--theme-text-sec)] italic py-6 text-center bg-[color-mix(in_srgb,var(--theme-text-main)_2%,transparent)] rounded-xl border border-[color-mix(in_srgb,var(--theme-border)_30%,transparent)]">
                    <Lock size={24} className="mx-auto mb-2 opacity-20" />
                    No credentials saved.
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4 pt-4">
              <h3 className="text-sm font-medium text-[var(--theme-text-main)] flex items-center gap-2 uppercase tracking-wider"><Save size={16} className="text-[var(--theme-accent)]" /> System Cache & History</h3>

              <div className="p-5 bg-[color-mix(in_srgb,var(--theme-text-main)_2%,transparent)] border border-[color-mix(in_srgb,var(--theme-border)_50%,transparent)] rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-[var(--theme-text-main)]">History Tracking</h3>
                    <p className="text-xs text-[var(--theme-text-sec)] mt-1">Record sites visited and your activity locally.</p>
                  </div>
                  <button
                    onClick={() => setIsHistoryEnabled(!isHistoryEnabled)}
                    className={`w-12 h-6 rounded-full transition-colors relative ${isHistoryEnabled ? 'bg-emerald-500' : 'bg-[color-mix(in_srgb,var(--theme-text-main)_15%,transparent)]'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${isHistoryEnabled ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-[color-mix(in_srgb,var(--theme-border)_50%,transparent)] mt-4">
                  <div>
                    <h3 className="text-sm font-medium text-[var(--theme-text-main)]">Clear History</h3>
                    <p className="text-xs text-[var(--theme-text-sec)] mt-1">Deletes all recorded URLs.</p>
                  </div>
                  <button onClick={() => { if (confirm('Clear browsing history?')) { setHistory([]); } }} className="px-3 py-1.5 bg-red-500/10 text-red-500 rounded hover:bg-red-500/20 text-xs font-medium transition-colors border border-red-500/20">Clear History</button>
                </div>
              </div>

              <div className="p-5 bg-[color-mix(in_srgb,var(--theme-text-main)_2%,transparent)] border border-[color-mix(in_srgb,var(--theme-border)_50%,transparent)] rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-[var(--theme-text-main)]">Active Workspace</h3>
                    <p className="text-xs text-[var(--theme-text-sec)] mt-1">You are currently using an isolated workspace save folder.</p>
                  </div>
                  <div className="flex gap-2 items-center">
                    <div className="w-[180px]">
                      <CustomSelect
                        options={workspaces.map(w => ({ value: w, label: w }))}
                        value={currentWs}
                        onChange={(val) => {
                          if (val) ahk.call('RestartWorkspace', val);
                        }}
                        searchable
                      />
                    </div>
                    <button onClick={() => setShowWsModal(true)} className="px-3 py-1.5 bg-[color-mix(in_srgb,var(--theme-accent)_20%,transparent)] text-[var(--theme-accent)] rounded hover:bg-[color-mix(in_srgb,var(--theme-accent)_30%,transparent)] text-xs font-medium transition-colors flex items-center gap-1">
                      <Plus size={14} /> New
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-5 bg-[color-mix(in_srgb,var(--theme-text-main)_2%,transparent)] border border-[color-mix(in_srgb,var(--theme-border)_50%,transparent)] rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-[var(--theme-text-main)]">Clear Runtime Data</h3>
                    <p className="text-xs text-[var(--theme-text-sec)] mt-1">Deletes all system cached objects created by plugins or scripts.</p>
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
        )}

        {/* --- ADVANCED TAB --- */}
        {activeSettingsTab === 'advanced' && (
          <div className="space-y-6 animate-in fade-in duration-300 h-full flex flex-col">
            <div className="mb-2 hidden md:block">
              <h3 className="text-xl font-medium text-[var(--theme-text-main)]">Advanced Configuration</h3>
              <p className="text-xs text-[var(--theme-text-sec)] mt-1">Caution: Modifying these advanced settings can disrupt application behavior.</p>
            </div>

            <div className="flex-1 min-h-0 bg-[color-mix(in_srgb,var(--theme-text-main)_2%,transparent)] border border-[color-mix(in_srgb,var(--theme-border)_50%,transparent)] rounded-2xl p-6 relative">
              <ConfigView embedded={true} />
            </div>
          </div>
        )}
      </div>

      {/* Modals placed globally for SettingsView */}
      <Modal
        isOpen={showCredModal}
        onClose={() => { setShowCredModal(false); setNewCred({ domain: '', username: '', password: '' }); }}
        title="Add Credential"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-[var(--theme-text-sec)] mb-1.5">Domain or Plugin</label>
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
              className="w-full bg-[color-mix(in_srgb,var(--theme-text-main)_3%,transparent)] border border-[color-mix(in_srgb,var(--theme-text-main)_15%,transparent)] rounded-lg px-3 py-2 text-sm text-[var(--theme-text-main)] focus:border-[var(--theme-accent)] outline-none placeholder:text-[var(--theme-text-sec)]"
            />
          </div>
          <div>
            <label className="block text-xs text-[var(--theme-text-sec)] mb-1.5">Username / Email</label>
            <input
              type="text" placeholder="user@email.com"
              value={newCred.username} onChange={e => setNewCred({ ...newCred, username: e.target.value })}
              className="w-full bg-[color-mix(in_srgb,var(--theme-text-main)_3%,transparent)] border border-[color-mix(in_srgb,var(--theme-text-main)_15%,transparent)] rounded-lg px-3 py-2 text-sm text-[var(--theme-text-main)] focus:border-[var(--theme-accent)] outline-none placeholder:text-[var(--theme-text-sec)]"
            />
          </div>
          <div>
            <label className="block text-xs text-[var(--theme-text-sec)] mb-1.5">Password</label>
            <input
              type="password" placeholder="••••••••"
              value={newCred.password} onChange={e => setNewCred({ ...newCred, password: e.target.value })}
              className="w-full bg-[color-mix(in_srgb,var(--theme-text-main)_3%,transparent)] border border-[color-mix(in_srgb,var(--theme-text-main)_15%,transparent)] rounded-lg px-3 py-2 text-sm text-[var(--theme-text-main)] focus:border-[var(--theme-accent)] outline-none placeholder:text-[var(--theme-text-sec)]"
            />
          </div>

          <div className="mt-6 flex justify-end pt-4 border-t border-[color-mix(in_srgb,var(--theme-border)_50%,transparent)]">
            <button
              onClick={async () => {
                if (newCred.domain && newCred.username && newCred.password) {
                  const encrypted = await ahk.asyncCall('EncryptCredential', newCred.password);
                  const credItem = {
                    id: Date.now().toString(),
                    domain: newCred.domain,
                    username: newCred.username,
                    passwordBase64: encrypted
                  };
                  await addCredentialDB(credItem);
                  setCredentials([...credentials, credItem]);
                  setNewCred({ domain: '', username: '', password: '' });
                  setShowCredModal(false);
                }
              }}
              className="px-4 py-2 bg-[var(--theme-accent)] hover:bg-[color-mix(in_srgb,var(--theme-accent)_80%,white)] text-white rounded-lg text-sm font-medium transition-colors w-full"
            >
              Save Credential
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showWsModal}
        onClose={() => { setShowWsModal(false); setNewWsName(''); }}
        title="Create New Workspace"
      >
        <div className="space-y-4">
          <p className="text-xs text-[var(--theme-text-sec)]">A workspace perfectly isolates all your plugins, flows, bookmarks, and settings locally into a new directory.</p>
          <div>
            <label className="block text-xs text-[var(--theme-text-main)] mb-1.5">Workspace Name</label>
            <input
              type="text" value={newWsName} onChange={e => setNewWsName(e.target.value)}
              placeholder="e.g. testing-env, dev, clean-slate" autoFocus
              className="w-full bg-[color-mix(in_srgb,var(--theme-text-main)_3%,transparent)] border border-[color-mix(in_srgb,var(--theme-text-main)_15%,transparent)] rounded-lg px-3 py-2 text-sm text-[var(--theme-text-main)] focus:border-[var(--theme-accent)] outline-none"
              onKeyDown={e => {
                if (e.key === 'Enter' && newWsName.trim()) {
                  ahk.call('CreateWorkspace', newWsName.trim());
                  ahk.call('RestartWorkspace', newWsName.trim());
                }
              }}
            />
          </div>
          <div className="flex gap-3 justify-end pt-4 border-t border-[color-mix(in_srgb,var(--theme-border)_50%,transparent)] mt-4">
            <button onClick={() => { setShowWsModal(false); setNewWsName(''); }} className="px-4 py-2 text-sm font-medium text-[var(--theme-text-sec)] hover:text-[var(--theme-text-main)] transition-colors">Cancel</button>
            <button onClick={() => {
              if (newWsName.trim()) {
                ahk.call('CreateWorkspace', newWsName.trim());
                ahk.call('RestartWorkspace', newWsName.trim());
              }
            }} className="px-4 py-2 text-sm font-medium bg-[var(--theme-accent)] text-white rounded-lg transition-colors">Create & Switch</button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showPortableModal}
        onClose={() => setShowPortableModal(false)}
        title="Migrate Data Source?"
      >
        <div className="space-y-4">
          <p className="text-sm text-[var(--theme-text-main)]">
            You've requested to change the global storage mode to:<br />
            <span className="font-mono text-xs text-[var(--theme-accent)] font-bold uppercase">{pendingPortableMode ? 'Portable' : 'Installed'} Mode</span>
          </p>
          <p className="text-xs text-[var(--theme-text-sec)] leading-relaxed bg-[color-mix(in_srgb,var(--theme-text-main)_3%,transparent)] p-3 rounded-lg border border-[color-mix(in_srgb,var(--theme-text-main)_10%,transparent)]">
            For this change to seamlessly copy over your existing workspace data (plugins, logs, configs) into the new directory structure and avoid data-loss visually, BingeKit must immediately restart and native directory movement must occur.
          </p>
          <div className="flex gap-3 justify-end pt-4 border-t border-[color-mix(in_srgb,var(--theme-border)_50%,transparent)] mt-4">
            <button
              onClick={() => {
                setShowPortableModal(false);
              }}
              className="px-4 py-2 text-sm font-medium text-[var(--theme-text-sec)] hover:text-[var(--theme-text-main)] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setShowPortableModal(false);
                ahk.call('MigrateStorage', pendingPortableMode ? 1 : 0, ahk.call('GetStoragePath') || '');
              }}
              className="px-4 py-2 text-sm font-medium bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500/30 border border-red-500/20 transition-colors"
            >
              Migrate & Restart
            </button>
          </div>
        </div>
      </Modal>
      {showMultiTabDialog && (
        <Modal
          isOpen={showMultiTabDialog}
          title="Disable Multi-Tab Mode?"
          onClose={() => setShowMultiTabDialog(false)}
        >
          <div className="p-6">
            <p className="text-zinc-300 text-sm mb-6 leading-relaxed">
              Disabling Multi-Tab mode will automatically close {browserTabs.length - 1} background tab(s) and keep only your currently active tab open.
              <br /><br />
              Are you sure you want to continue?
            </p>
            <div className="flex items-center justify-end gap-3 mt-4">
              <button
                onClick={() => setShowMultiTabDialog(false)}
                className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const activeTabOrMain = browserTabs.find(t => t.id === activeBrowserTabId) || browserTabs[0];
                  setBrowserTabs([activeTabOrMain]);

                  // Clean up running webview instances in host except the active one
                  browserTabs.forEach(t => {
                    if (t.id !== activeTabOrMain.id) ahk.call('ClosePlayer', t.id);
                  });

                  setIsMultiTabEnabled(false);
                  ahk.call('SaveData', 'multi_tab_enabled.txt', 'false');
                  setShowMultiTabDialog(false);
                }}
                className="px-4 py-2 text-sm bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white rounded-xl transition-colors border border-red-500/30 font-medium"
              >
                Close Tabs & Continue
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
