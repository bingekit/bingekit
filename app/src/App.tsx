import React from 'react';
import { AppProvider, useAppContext } from './context/AppContext';
import { ahk } from './lib/ahk';
import './lib/bridge';

import Prism from 'prismjs';
if (typeof window !== 'undefined') {
  (window as any).Prism = Prism;
}
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/components/prism-javascript';

import {
  Film, ChevronLeft, ChevronRight, ChevronDown, RotateCw, Search, Bookmark, Clock, EyeOff, Eye, Minus, Square, X, Compass, MonitorPlay, Activity, Puzzle, ListTree, Code, Settings, Zap, Home, Download, Plus, LayoutGrid, Columns, Rows, Globe
} from 'lucide-react';

// UI Wrappers
import { TooltipWrapper } from './components/ui/TooltipWrapper';

// Views
import { DashboardView } from './components/views/DashboardView';
import { PlayerView } from './components/views/PlayerView';
import { SettingsView } from './components/views/SettingsView';
import { LibraryView } from './components/views/LibraryView';
import { ExploreView } from './components/views/ExploreView';
import { ExtensionsView } from './components/views/ExtensionsView';
import { DownloadsView } from './components/views/DownloadsView';
import { ConfigView } from './components/views/ConfigView';

const MainLayout = () => {
  const {
    activeTab, setActiveTab, urlBarMode, setUrlBarMode, theme,
    inputUrl, setInputUrl, url, setUrl, bookmarks, setBookmarks,
    watchLater, setWatchLater, followedItems, fetchTitleForUrl, handleNavigate,
    isQuickOptionsHidden, setIsQuickOptionsHidden, pageTitle, homePage,
    navButtons, installedInterfaces, activeDownloads, pluginUpdateCount,
    isMultiTabEnabled, browserTabs, setBrowserTabs, activeBrowserTabId, setActiveBrowserTabId,
    tilingMode, setTilingMode, navigateUrl, autoFocusPlayerOnTabChange, ctrlClickBackgroundTab
  } = useAppContext();

  const [isPlaying, setIsPlaying] = React.useState(false);
  const [showInterfaces, setShowInterfaces] = React.useState(false);

  const activeDownloadsCount = Object.values(activeDownloads || {}).filter((dl: any) => dl.state !== 2).length;

  React.useEffect(() => {
    const handlePlayState = (e: any) => {
      setIsPlaying(e.detail?.isPlaying);
    };
    window.addEventListener('player-play-state', handlePlayState as any);

    const handleCloseActiveTab = () => {
      ahk.call('ClosePlayer', activeBrowserTabId);
      setBrowserTabs(prev => {
        if (prev.length <= 1) return prev; // Don't close the last tab
        const idx = prev.findIndex(t => t.id === activeBrowserTabId);
        const newTabs = prev.filter(t => t.id !== activeBrowserTabId);
        if (newTabs.length > 0) setActiveBrowserTabId(newTabs[Math.max(0, idx - 1)].id);
        return newTabs;
      });
    };

    const handleNewTabEvent = () => {
      navigateUrl(homePage || 'https://bingekit.app/start/', true);
    };

    window.addEventListener('bk-close-active-tab', handleCloseActiveTab);
    window.addEventListener('bk-new-tab', handleNewTabEvent);

    return () => {
      window.removeEventListener('player-play-state', handlePlayState as any);
      window.removeEventListener('bk-close-active-tab', handleCloseActiveTab);
      window.removeEventListener('bk-new-tab', handleNewTabEvent);
    };
  }, [activeBrowserTabId, homePage]);

  const handleNewTab = () => {
    navigateUrl(homePage || 'https://bingekit.app/start/', true);
  };

  const handleCloseTab = (id: string) => {
    ahk.call('ClosePlayer', id);
    setBrowserTabs(prev => {
      if (prev.length <= 1) return prev; // Don't close the last tab
      const idx = prev.findIndex(t => t.id === id);
      const newTabs = prev.filter(t => t.id !== id);
      if (activeBrowserTabId === id && newTabs.length > 0) {
        setActiveBrowserTabId(newTabs[Math.max(0, idx - 1)].id);
      }
      return newTabs;
    });
  };

  return (
    <div className="flex flex-col h-screen w-full font-sans overflow-hidden" style={{ backgroundColor: theme.mainBg, color: theme.textMain }}>
      <style>{`
        :root {
          --theme-titlebar: ${theme.titlebarBg};
          --theme-sidebar: ${theme.sidebarBg};
          --theme-main: ${theme.mainBg};
          --theme-mainBg: ${theme.mainBg};
          --theme-border: ${theme.border};
          --theme-accent: ${theme.accent};
          --theme-text-main: ${theme.textMain};
          --theme-text-sec: ${theme.textSec};
          
          --theme-titlebar-text: ${theme.titlebarText || theme.textSec || '#a1a1aa'};
          --theme-titlebar-text-hover: ${theme.titlebarTextHover || theme.textMain || '#fafafa'};
          --theme-titlebar-accent: ${theme.titlebarAccent || theme.accent || '#6366f1'};
          --theme-titlebar-alt: ${theme.titlebarAlt || '#18181b'};
          --theme-titlebar-alt2: ${theme.titlebarAlt2 || '#27272a'};
          --theme-sidebar-text: ${theme.sidebarText || theme.textSec || '#a1a1aa'};
          --theme-urlbarBg: ${theme.urlbarBg || 'color-mix(in srgb, var(--theme-text-main) 4%, transparent)'};
          --theme-surface: var(--theme-main);
        }


        /* Essential Layout Backgrounds mapped to IDs */
        #titlebar-region { background-color: var(--theme-titlebar) !important; border-color: color-mix(in srgb, var(--theme-border) 50%, var(--theme-titlebar)) !important; }
        #sidebar-region { background-color: var(--theme-sidebar) !important; border-color: color-mix(in srgb, var(--theme-border) 50%, var(--theme-sidebar)) !important; }
        #main-region, #main-region > div { background-color: var(--theme-main) !important; }

        /* General Borders / Overrides */
        .border-zinc-900, .border-zinc-800, .border-zinc-800\\/50, .border-zinc-800\\/60, .border-zinc-800\\/80, .border-zinc-700 { 
          border-color: color-mix(in srgb, var(--theme-border) 50%, transparent) !important; 
        }

        /* Dynamic Component Backgrounds using Transparent Tinting */
        .bg-zinc-950 { background-color: transparent !important; }
        .bg-zinc-900 { background-color: color-mix(in srgb, var(--theme-text-main) 3%, transparent) !important; }
        .bg-zinc-800 { background-color: color-mix(in srgb, var(--theme-text-main) 7%, transparent) !important; }
        .bg-zinc-700 { background-color: color-mix(in srgb, var(--theme-text-main) 12%, transparent) !important; }
        .bg-zinc-900\\/50, .bg-zinc-950\\/50 { background-color: color-mix(in srgb, var(--theme-text-main) 2%, transparent) !important; }
        .bg-zinc-900\\/30, .bg-zinc-900\\/40 { background-color: color-mix(in srgb, var(--theme-text-main) 1.5%, transparent) !important; }
        .bg-zinc-900\\/80 { background-color: color-mix(in srgb, var(--theme-text-main) 4%, transparent) !important; }

        /* Hover states for standard background tints */
        .hover\\:bg-zinc-900:hover { background-color: color-mix(in srgb, var(--theme-text-main) 5%, transparent) !important; }
        .hover\\:bg-zinc-800:hover { background-color: color-mix(in srgb, var(--theme-text-main) 9%, transparent) !important; }
        .hover\\:bg-zinc-700:hover { background-color: color-mix(in srgb, var(--theme-text-main) 15%, transparent) !important; }
        .hover\\:bg-zinc-900\\/80:hover { background-color: color-mix(in srgb, var(--theme-text-main) 6%, transparent) !important; }
        .hover\\:bg-zinc-900\\/50:hover { background-color: color-mix(in srgb, var(--theme-text-main) 4%, transparent) !important; }

        /* Generic Accent Colors */
        .text-indigo-500, .text-indigo-400, .text-indigo-300, .text-emerald-500, .text-emerald-400, .text-emerald-300 { color: var(--theme-accent) !important; }
        .bg-indigo-500, .bg-indigo-600, .bg-emerald-500, .bg-emerald-600 { background-color: var(--theme-accent) !important; border-color: var(--theme-accent) !important; }
        .bg-indigo-500\\/10, .bg-emerald-500\\/10 { background-color: color-mix(in srgb, var(--theme-accent) 10%, transparent) !important; }
        .bg-indigo-500\\/20, .bg-emerald-500\\/20 { background-color: color-mix(in srgb, var(--theme-accent) 20%, transparent) !important; }
        .bg-indigo-500\\/30, .bg-emerald-500\\/30 { background-color: color-mix(in srgb, var(--theme-accent) 30%, transparent) !important; }
        .border-indigo-500, .border-indigo-500\\/30, .border-indigo-500\\/40, .border-indigo-500\\/50, .border-emerald-500, .border-emerald-500\\/30 { border-color: color-mix(in srgb, var(--theme-accent) 50%, transparent) !important; }
        .fill-indigo-400, .fill-emerald-400 { fill: var(--theme-accent) !important; }
        .hover\\:text-indigo-400:hover, .hover\\:text-emerald-400:hover, .hover\\:text-emerald-300:hover { color: var(--theme-accent) !important; filter: drop-shadow(0 0 4px var(--theme-accent)); }
        .hover\\:bg-indigo-500\\/10:hover, .hover\\:bg-emerald-500\\/10:hover { background-color: color-mix(in srgb, var(--theme-accent) 10%, transparent) !important; }
        .hover\\:bg-emerald-500\\/30:hover { background-color: color-mix(in srgb, var(--theme-accent) 30%, transparent) !important; }
        .hover\\:border-emerald-500\\/30:hover { border-color: color-mix(in srgb, var(--theme-accent) 50%, transparent) !important; }

        /* Text Colors */
        .text-white, .text-zinc-50, .text-zinc-100, .text-zinc-200, .text-zinc-300 { color: var(--theme-text-main) !important; }
        .text-zinc-400, .text-zinc-500, .text-zinc-600 { color: var(--theme-text-sec) !important; }
        
        .hover\\:text-zinc-100:hover, .hover\\:text-zinc-200:hover, .hover\\:text-zinc-300:hover, .hover\\:text-white:hover { color: var(--theme-text-main) !important; }
        .hover\\:text-zinc-400:hover, .hover\\:text-zinc-500:hover { color: var(--theme-text-sec) !important; }

        /* Transparent overrides */
        input.bg-transparent, textarea.bg-transparent { background-color: transparent !important; }

        /* Hard Toolbar Fix */
        form#toolbar-form { display: flex !important; background-color: var(--theme-urlbarBg) !important; }
        form#toolbar-form:focus-within { background-color: color-mix(in srgb, var(--theme-urlbarBg) 80%, var(--theme-titlebar-alt2)) !important; }

        /* Global Selection */
        
        ::selection {
          background-color: color-mix(in srgb, var(--theme-accent) 20%, transparent) !important;
          color: var(--theme-accent) !important;
        }

        /* Titlebar Variables Overrides */
        #titlebar-region { color: var(--theme-titlebar-text) !important; }
        #titlebar-region .text-zinc-500, #titlebar-region .text-zinc-400 { color: var(--theme-titlebar-text) !important; }
        
        #titlebar-region .hover\\:text-zinc-100:hover, #titlebar-region .hover\\:text-zinc-200:hover, #titlebar-region .hover\\:text-zinc-300:hover, #titlebar-region .hover\\:text-white:hover { color: var(--theme-titlebar-text-hover) !important; filter: drop-shadow(0 0 2px var(--theme-titlebar-text-hover)); }
        #titlebar-region input.text-xs { color: var(--theme-titlebar-text-hover) !important; }
        #titlebar-region input::placeholder { color: color-mix(in srgb, var(--theme-titlebar-text) 50%, transparent) !important; }
        
        #sidebar-region { color: var(--theme-sidebar-text) !important; }
        #sidebar-region button.text-zinc-500 { color: var(--theme-sidebar-text) !important; }
        #sidebar-region button.hover\\:text-zinc-200:hover { color: color-mix(in srgb, var(--theme-sidebar-text) 50%, var(--theme-text-main)) !important; }

        #titlebar-region .text-indigo-400, #titlebar-region .text-indigo-500 { color: var(--theme-titlebar-accent) !important; }
        #titlebar-region .fill-indigo-400 { fill: var(--theme-titlebar-accent) !important; }
        #titlebar-region .border-indigo-500\\/50 { border-color: var(--theme-titlebar-accent) !important; }
        #titlebar-region .hover\\:text-indigo-400:hover { color: var(--theme-titlebar-accent) !important; }
        
        #titlebar-region .bg-zinc-800, #titlebar-region .bg-zinc-900, #titlebar-region form { background-color: var(--theme-titlebar-alt) !important; }
        #titlebar-region .border-zinc-800, #titlebar-region .border-zinc-800\\/80 { border-color: var(--theme-titlebar-alt2) !important; }
        
        #titlebar-region .hover\\:bg-zinc-800:hover, #titlebar-region button.hover\\:bg-zinc-800:hover { background-color: var(--theme-titlebar-alt2) !important; color: var(--theme-titlebar-text-hover) !important; }
        
        #titlebar-region form:focus-within { background-color: var(--theme-titlebar-alt2) !important; border-color: var(--theme-titlebar-accent) !important; }
        #titlebar-region .bg-indigo-500\\/10 { background-color: color-mix(in srgb, var(--theme-titlebar-accent) 15%, transparent) !important; }
        #titlebar-region .hover\\:bg-indigo-500\\/20:hover { background-color: color-mix(in srgb, var(--theme-titlebar-accent) 25%, transparent) !important; }
        
        #titlebar-region .bg-red-500\\/90:hover { background-color: rgb(239 68 68 / 0.9) !important; color: white !important; filter: none !important; }
        #titlebar-region .w-px.bg-zinc-800 { background-color: var(--theme-titlebar-alt2) !important; }
      `}</style>

      {/* --- Custom Titlebar (Draggable) --- */}
      <div id="titlebar-region" className={`flex flex-col drag-region select-none border-b ${isMultiTabEnabled ? 'h-[72px]' : 'h-10'}`}>

        {isMultiTabEnabled && (
          <div className="flex-1 flex w-full items-end pl-3 pt-2">
            <div className="flex items-end gap-[2px] flex-1 overflow-x-auto no-scrollbar">
              {browserTabs.map(tab => (
                <div
                  key={tab.id}
                  onClick={(e) => {
                    setActiveBrowserTabId(tab.id);
                    if (autoFocusPlayerOnTabChange && activeTab !== 'player') {
                      setActiveTab('player');
                    }
                  }}
                  className={`h-[32px] max-w-[220px] min-w-[120px] flex-1 px-3 flex items-center justify-between rounded-t-lg transition-all duration-200 cursor-pointer border border-b-0 relative group ${activeBrowserTabId === tab.id
                      ? 'bg-[var(--theme-sidebar)] border-[color-mix(in_srgb,var(--theme-border)_40%,transparent)] text-[var(--theme-text-main)] z-10 shadow-[0_-4px_10px_rgba(0,0,0,0.2)]'
                      : 'bg-[color-mix(in_srgb,var(--theme-text-main)_2%,transparent)] border-transparent text-[var(--theme-titlebar-text)] hover:bg-[color-mix(in_srgb,var(--theme-text-main)_6%,transparent)] hover:text-[var(--theme-text-main)]'
                    }`}
                >
                  <div className="flex items-center gap-2 truncate opacity-90">
                    {tab.favicon ? (
                      <img src={tab.favicon} alt="" className="w-4 h-4 rounded-sm bg-[color-mix(in_srgb,var(--theme-text-main)_10%,transparent)] flex-shrink-0" />
                    ) : (
                      <Globe size={14} className="opacity-70 flex-shrink-0" />
                    )}
                    <span className="text-xs truncate font-medium tracking-wide">{tab.title || tab.url}</span>
                  </div>
                  {browserTabs.length > 1 && (
                    <button
                      className="no-drag p-1 rounded transition-colors opacity-0 group-hover:opacity-100 hover:bg-red-500/20 hover:text-red-400"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCloseTab(tab.id);
                      }}
                    >
                      <X size={12} strokeWidth={2.5} />
                    </button>
                  )}
                  {activeBrowserTabId === tab.id && (
                    <>
                      <div className="absolute top-0 left-0 right-0 h-[2px] bg-[var(--theme-accent)] rounded-t-lg" style={{ boxShadow: '0 0 10px var(--theme-accent)' }} />
                      <div className="absolute -bottom-[1px] left-0 right-0 h-[2px] bg-[var(--theme-sidebar)]" />
                    </>
                  )}
                </div>
              ))}
              <div
                className="no-drag h-7 w-8 flex items-center justify-center rounded-lg text-[var(--theme-titlebar-text)] hover:text-[var(--theme-text-main)] hover:bg-[color-mix(in_srgb,var(--theme-text-main)_8%,transparent)] ml-2 mb-1 transition-all cursor-pointer border border-transparent hover:border-[color-mix(in_srgb,var(--theme-border)_20%,transparent)]"
                onClick={handleNewTab}
              >
                <Plus size={16} strokeWidth={2.5} />
              </div>
            </div>

            {/* Window Controls (Moved up for Multi-Tab) */}
            <div className="flex items-center no-drag ml-auto h-8 self-start -mt-2">
              <TooltipWrapper text="Minimize">
                <button onClick={() => ahk.call('Minimize')} className="px-4 h-[32px] text-zinc-500 hover:bg-zinc-800 transition-colors">
                  <Minus size={14} />
                </button>
              </TooltipWrapper>
              <TooltipWrapper text="Maximize">
                <button onClick={() => ahk.call('Maximize')} className="px-4 h-[32px] text-zinc-500 hover:bg-zinc-800 transition-colors">
                  <Square size={12} />
                </button>
              </TooltipWrapper>
              <TooltipWrapper text="Close">
                <button onClick={() => ahk.call('Close')} className="px-4 h-[32px] text-zinc-500 hover:text-white hover:bg-red-500/90 transition-colors">
                  <X size={14} />
                </button>
              </TooltipWrapper>
            </div>
          </div>
        )}

        {/* Normal Toolbar Layer */}
        <div className={`h-10 flex items-center w-full ${isMultiTabEnabled ? 'bg-[var(--theme-sidebar)] pl-3 border-t border-[color-mix(in_srgb,var(--theme-border)_20%,transparent)]' : 'pl-5'}`}>
          <div className="flex items-center gap-3 w-48 flex-shrink-0">
            <div className="flex items-center gap-2 text-zinc-400 transition-colors">
              <Film size={16} className="text-indigo-500" />
              {activeTab !== 'player' && (
                <span className="text-xs ml-6 font-medium tracking-wider uppercase">BingeKit</span>
              )}
            </div>
          </div>

          {/* URL Bar */}
          {activeTab === 'player' && (
            <div className="flex-1 ml-2 flex items-center justify-start">
              {urlBarMode === 'hidden' ? null : urlBarMode === 'title' ? (
                <div className="flex items-center justify-start text-xs text-zinc-500 font-medium truncate cursor-pointer hover:text-zinc-300 transition-colors" onClick={() => setUrlBarMode('full')}>
                  {pageTitle || (() => {
                    try { return new URL(url).hostname; } catch (e) { return url; }
                  })()}
                </div>
              ) : (
                <form id="toolbar-form" onSubmit={handleNavigate} className="flex items-center no-drag backdrop-blur-xl border border-zinc-800/80 rounded-lg overflow-hidden transition-all focus-within:border-indigo-500/50 h-7 w-full max-w-lg">
                  <div className="flex items-center px-2 gap-1 text-zinc-500 relative">
                    {navButtons.home && (
                      <div className="flex items-center">
                        <TooltipWrapper text="Home">
                          <button type="button" onClick={() => { setUrl(homePage || 'https://bingekit.app/start/'); setInputUrl(homePage || 'https://bingekit.app/start/'); }} className="p-0.5 hover:text-zinc-200 transition-colors"><Home size={14} /></button>
                        </TooltipWrapper>
                        {installedInterfaces.length > 0 && (
                          <div className="relative flex items-center">
                            <button
                              type="button"
                              onClick={(e) => { e.preventDefault(); setShowInterfaces(!showInterfaces); }}
                              className={`p-0.5 ml-0.5 transition-colors rounded ${showInterfaces ? 'bg-indigo-500/20 text-indigo-400' : 'text-zinc-500 hover:text-zinc-200'}`}
                            >
                              <ChevronDown size={12} className={`transition-transform duration-200 ${showInterfaces ? 'rotate-180' : ''}`} />
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {navButtons.back && !showInterfaces && (
                      <TooltipWrapper text="Go Back">
                        <button type="button" onClick={() => ahk.call('PlayerGoBack')} className="p-0.5 hover:text-zinc-200 transition-colors"><ChevronLeft size={14} /></button>
                      </TooltipWrapper>
                    )}
                    {navButtons.forward && !showInterfaces && (
                      <TooltipWrapper text="Go Forward">
                        <button type="button" onClick={() => ahk.call('PlayerGoForward')} className="p-0.5 hover:text-zinc-200 transition-colors"><ChevronRight size={14} /></button>
                      </TooltipWrapper>
                    )}
                    {navButtons.reload && !showInterfaces && (
                      <TooltipWrapper text="Refresh">
                        <button type="button" onClick={() => ahk.call('PlayerReload')} className="p-0.5 hover:text-zinc-200 transition-colors"><RotateCw size={12} /></button>
                      </TooltipWrapper>
                    )}
                  </div>


                  {!showInterfaces && (
                    <div className="w-px h-3 bg-zinc-800 mx-1 flex-shrink-0" />
                  )}

                  <div className="flex-1 flex items-center px-2 gap-2 overflow-hidden">
                    {showInterfaces ? (
                      <div className="flex items-center gap-1.5 w-full overflow-x-auto no-scrollbar py-0.5 animate-in fade-in slide-in-from-left-2 duration-200">
                        <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider mr-1">Interfaces</span>
                        {installedInterfaces.map(inf => (
                          <button
                            key={inf}
                            type="button"
                            onClick={() => {
                              setShowInterfaces(false);
                              setUrl(`interface:${inf}`);
                              setInputUrl(`interface:${inf}`);
                            }}
                            className="px-2 py-0.5 text-[11px] font-medium bg-zinc-800 hover:bg-indigo-500/20 text-zinc-300 hover:text-indigo-400 border border-zinc-700/50 hover:border-indigo-500/30 rounded flex-shrink-0 transition-colors"
                          >
                            {inf}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <>
                        <Search size={12} className="text-zinc-500 flex-shrink-0" />
                        <input
                          type="text"
                          value={inputUrl}
                          onChange={(e) => setInputUrl(e.target.value)}
                          placeholder="Search streams or enter URL..."
                          className="w-full bg-transparent border-none outline-none text-xs text-zinc-200 placeholder:text-zinc-600 font-medium"
                        />
                      </>
                    )}
                  </div>

                  {!showInterfaces && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          if (!bookmarks.find(b => b.url === url)) {
                            setBookmarks([...bookmarks, { id: Date.now().toString(), title: fetchTitleForUrl(url), url }]);
                          }
                        }}
                        className="px-2 text-zinc-500 hover:text-indigo-400 transition-colors flex-shrink-0"
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
                        className="px-2 text-zinc-500 hover:text-indigo-400 transition-colors flex-shrink-0"
                        title="Watch Later"
                      >
                        <Clock size={12} className={watchLater.find(w => w.url === url) ? "text-indigo-400" : ""} />
                      </button>
                    </>
                  )}
                </form>
              )}
            </div>
          )}

          {/* Window Controls (Normal titlebar only) */}
          {!isMultiTabEnabled && (
            <div className="flex items-center no-drag ml-auto">
              {isPlaying && (
                <button title="Pause Media" onClick={() => ahk.call('ToggleMedia')} className="px-5 h-[39px] transition-colors text-indigo-500 hover:text-indigo-400 hover:bg-indigo-500/10">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect>
                  </svg>
                </button>
              )}
              {activeTab === 'player' && (
                <button title="Toggle PiP Mode" onClick={() => ahk.call('TogglePiP')} className="px-5 h-[39px] transition-colors text-zinc-500 hover:text-indigo-400 hover:bg-indigo-500/10">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><rect x="8" y="21" width="8" height="0"></rect><path d="M12 17v4"></path><path d="M16 11h2"></path><path d="M16 7h2"></path></svg>
                </button>
              )}
              {activeTab === 'player' && (
                <TooltipWrapper text={isQuickOptionsHidden ? "Show Quick Menu" : "Hide Quick Menu"}>
                  <button
                    onClick={() => setIsQuickOptionsHidden(!isQuickOptionsHidden)}
                    className={`px-5 h-[39px] transition-colors ${!isQuickOptionsHidden ? 'text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20' : 'text-zinc-500 hover:bg-zinc-800'}`}
                  >
                    <Zap size={14} />
                  </button>
                </TooltipWrapper>
              )}
              <TooltipWrapper text="Minimize">
                <button onClick={() => ahk.call('Minimize')} className="px-5 h-[39px] text-zinc-500 hover:bg-zinc-800 transition-colors">
                  <Minus size={14} />
                </button>
              </TooltipWrapper>
              <TooltipWrapper text="Maximize">
                <button onClick={() => ahk.call('Maximize')} className="px-5 h-[39px] text-zinc-500 hover:bg-zinc-800 transition-colors">
                  <Square size={12} />
                </button>
              </TooltipWrapper>
              <TooltipWrapper text="Close">
                <button onClick={() => ahk.call('Close')} className="px-5 h-[39px] text-zinc-500 hover:text-white hover:bg-red-500/90 transition-colors">
                  <X size={14} />
                </button>
              </TooltipWrapper>
            </div>
          )}

          {/* Quick controls that always show */}
          {isMultiTabEnabled && activeTab === 'player' && (
            <div className="flex items-center no-drag ml-auto">
              {/* Layout Controls */}
              {browserTabs.length > 1 && (
                <div className="flex items-center mx-2 gap-1 bg-zinc-900 rounded p-0.5">
                  <TooltipWrapper text="Single View">
                    <button onClick={() => setTilingMode('none')} className={`p-1 rounded ${tilingMode === 'none' ? 'bg-indigo-500/20 text-indigo-400' : 'text-zinc-500 hover:text-zinc-200'}`}><Square size={14} /></button>
                  </TooltipWrapper>
                  <TooltipWrapper text="Split Vertical">
                    <button onClick={() => setTilingMode('split-vt')} className={`p-1 rounded ${tilingMode === 'split-vt' ? 'bg-indigo-500/20 text-indigo-400' : 'text-zinc-500 hover:text-zinc-200'}`}><Columns size={14} /></button>
                  </TooltipWrapper>
                  <TooltipWrapper text="Split Horizontal">
                    <button onClick={() => setTilingMode('split-hz')} className={`p-1 rounded ${tilingMode === 'split-hz' ? 'bg-indigo-500/20 text-indigo-400' : 'text-zinc-500 hover:text-zinc-200'}`}><Rows size={14} /></button>
                  </TooltipWrapper>
                  <TooltipWrapper text="Grid View">
                    <button onClick={() => setTilingMode('grid')} className={`p-1 rounded ${tilingMode === 'grid' ? 'bg-indigo-500/20 text-indigo-400' : 'text-zinc-500 hover:text-zinc-200'}`}><LayoutGrid size={14} /></button>
                  </TooltipWrapper>
                </div>
              )}

              {isPlaying && (
                <button title="Pause Media" onClick={() => ahk.call('ToggleMedia')} className="px-5 h-[39px] transition-colors text-indigo-500 hover:text-indigo-400 hover:bg-indigo-500/10">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect>
                  </svg>
                </button>
              )}
              <button title="Toggle PiP Mode" onClick={() => ahk.call('TogglePiP')} className="px-5 h-[39px] transition-colors text-zinc-500 hover:text-indigo-400 hover:bg-indigo-500/10">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><rect x="8" y="21" width="8" height="0"></rect><path d="M12 17v4"></path><path d="M16 11h2"></path><path d="M16 7h2"></path></svg>
              </button>
              <TooltipWrapper text={isQuickOptionsHidden ? "Show Quick Menu" : "Hide Quick Menu"}>
                <button
                  onClick={() => setIsQuickOptionsHidden(!isQuickOptionsHidden)}
                  className={`px-5 h-[39px] transition-colors ${!isQuickOptionsHidden ? 'text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20' : 'text-zinc-500 hover:bg-zinc-800'}`}
                >
                  <Zap size={14} />
                </button>
              </TooltipWrapper>
            </div>
          )}
        </div>
      </div>

      {/* --- Main Content Area --- */}
      <div className="flex flex-1 overflow-hidden">
        {/* Slim Sidebar */}
        <div id="sidebar-region" className="w-14 flex flex-col items-center py-4 border-r gap-6 z-10">
          <TooltipWrapper text="Dashboard">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`p-2.5 rounded-xl transition-all duration-200 ${activeTab === 'dashboard' ? 'bg-indigo-500/10 text-indigo-400' : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900'}`}
            >
              <Film size={20} strokeWidth={1.5} />
            </button>
          </TooltipWrapper>
          <TooltipWrapper text="Player">
            <button
              onClick={() => setActiveTab('player')}
              className={`p-2.5 rounded-xl transition-all duration-200 ${activeTab === 'player' ? 'bg-indigo-500/10 text-indigo-400' : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900'}`}
            >
              <MonitorPlay size={20} strokeWidth={1.5} />
            </button>
          </TooltipWrapper>
          <TooltipWrapper text="Explore">
            <button
              onClick={() => setActiveTab('explore')}
              className={`relative p-2.5 rounded-xl transition-all duration-200 ${activeTab === 'explore' ? 'bg-indigo-500/10 text-indigo-400' : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900'}`}
            >
              <Compass size={20} strokeWidth={1.5} />
              {followedItems.some(i => i.hasUpdate) && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
              )}
            </button>
          </TooltipWrapper>
          <TooltipWrapper text="Library">
            <button
              onClick={() => setActiveTab('library')}
              className={`p-2.5 rounded-xl transition-all duration-200 ${activeTab === 'library' ? 'bg-indigo-500/10 text-indigo-400' : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900'}`}
            >
              <Bookmark size={20} strokeWidth={1.5} />
            </button>
          </TooltipWrapper>

          <div className="flex-1" />

          <TooltipWrapper text="Downloads">
            <button
              onClick={() => setActiveTab('downloads')}
              className={`relative p-2.5 rounded-xl transition-all duration-200 ${activeTab === 'downloads' ? 'bg-indigo-500/10 text-indigo-400' : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900'}`}
            >
              <Download size={20} strokeWidth={1.5} />
              {activeDownloadsCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 bg-indigo-500 rounded-full flex items-center justify-center text-[9px] text-white font-bold shadow-[0_0_8px_rgba(99,102,241,0.8)]">
                  {activeDownloadsCount}
                </span>
              )}
            </button>
          </TooltipWrapper>
          <TooltipWrapper text="Extensions">
            <button
              onClick={() => setActiveTab('extensions')}
              className={`relative p-2.5 rounded-xl transition-all duration-200 ${activeTab === 'extensions' ? 'bg-indigo-500/10 text-indigo-400' : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900'}`}
            >
              <Puzzle size={20} strokeWidth={1.5} />
              {pluginUpdateCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[9px] text-white font-bold shadow-[0_0_8px_rgba(239,68,68,0.8)]">
                  {pluginUpdateCount}
                </span>
              )}
            </button>
          </TooltipWrapper>
          <TooltipWrapper text="Settings">
            <button
              onClick={() => setActiveTab('settings')}
              className={`p-2.5 rounded-xl transition-all duration-200 ${activeTab === 'settings' ? 'bg-zinc-800 text-zinc-200' : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900'}`}
            >
              <Settings size={20} strokeWidth={1.5} />
            </button>
          </TooltipWrapper>
        </div>

        {/* Main Viewport */}
        <div id="main-region" className="flex-1 flex flex-col relative">
          <div className="flex-1 w-full h-full relative">
            {activeTab === 'dashboard' && <DashboardView />}
            {activeTab === 'explore' && <ExploreView />}
            {activeTab === 'library' && <LibraryView />}
            {activeTab === 'extensions' && <ExtensionsView />}
            {activeTab === 'downloads' && <DownloadsView />}
            {activeTab === 'settings' && <SettingsView />}
            {activeTab === 'config' && <SettingsView />}
            <div className={`w-full h-full absolute inset-0 ${activeTab === 'player' ? 'z-0' : 'pointer-events-none opacity-0 z-[-1]'}`}>
              <PlayerView />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
