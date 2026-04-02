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
  Film, ChevronLeft, ChevronRight, ChevronDown, RotateCw, Search, Bookmark, Clock, EyeOff, Eye, Minus, Square, X, Compass, MonitorPlay, Activity, Puzzle, ListTree, Code, Settings, Zap, Home, Download
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
    navButtons, installedInterfaces, activeDownloads
  } = useAppContext();

  const [isPlaying, setIsPlaying] = React.useState(false);
  const [showInterfaces, setShowInterfaces] = React.useState(false);

  const activeDownloadsCount = Object.values(activeDownloads || {}).filter((dl: any) => dl.state !== 2).length;

  React.useEffect(() => {
    const handlePlayState = (e: any) => {
      setIsPlaying(e.detail?.isPlaying);
    };
    window.addEventListener('player-play-state', handlePlayState as any);
    return () => window.removeEventListener('player-play-state', handlePlayState as any);
  }, []);

  return (
    <div className="flex flex-col h-screen w-full font-sans overflow-hidden" style={{ backgroundColor: theme.mainBg, color: theme.textMain }}>
      <style>{`
        :root {
          --theme-titlebar: ${theme.titlebarBg};
          --theme-sidebar: ${theme.sidebarBg};
          --theme-main: ${theme.mainBg};
          --theme-border: ${theme.border};
          --theme-accent: ${theme.accent};
          --theme-text-main: ${theme.textMain};
          --theme-text-sec: ${theme.textSec};
          
          --theme-titlebar-text: ${theme.titlebarText || theme.textSec || '#a1a1aa'};
          --theme-titlebar-text-hover: ${theme.titlebarTextHover || theme.textMain || '#fafafa'};
          --theme-titlebar-accent: ${theme.titlebarAccent || theme.accent || '#6366f1'};
          --theme-titlebar-alt: ${theme.titlebarAlt || '#18181b'};
          --theme-titlebar-alt2: ${theme.titlebarAlt2 || '#27272a'};
          --theme-surface: var(--theme-main);
        }


        /* Essential Layout Backgrounds mapped to IDs */
        #titlebar-region { background-color: var(--theme-titlebar) !important; border-color: var(--theme-border) !important; }
        #sidebar-region { background-color: var(--theme-sidebar) !important; border-color: var(--theme-border) !important; }
        #main-region, #main-region > div { background-color: var(--theme-main) !important; }

        /* General Borders / Overrides */
        .border-zinc-900, .border-zinc-800, .border-zinc-800\\/50, .border-zinc-800\\/60, .border-zinc-800\\/80, .border-zinc-700 { 
          border-color: var(--theme-border) !important; 
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
        form#toolbar-form { display: flex !important; }

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
      <div id="titlebar-region" className="h-10 flex items-center drag-region select-none pl-5 border-b">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-zinc-400 transition-colors">
            <Film size={16} className="text-indigo-500" />

            {activeTab !== 'player' && (
              <span className="text-xs  ml-6 font-medium tracking-wider uppercase">BingeKit</span>
            )}
          </div>
        </div>

        {/* URL Bar */}
        {activeTab === 'player' && (
          <div className="flex-1 ml-6 flex items-center justify-left">
            {urlBarMode === 'hidden' ? null : urlBarMode === 'title' ? (
              <div className="flex items-center justify-center text-xs text-zinc-500 font-medium truncate cursor-pointer hover:text-zinc-300 transition-colors" onClick={() => setUrlBarMode('full')}>
                {pageTitle || (() => {
                  try { return new URL(url).hostname; } catch (e) { return url; }
                })()}
              </div>
            ) : (
              <form id="toolbar-form" onSubmit={handleNavigate} className="flex items-center no-drag bg-zinc-900/80 backdrop-blur-xl border border-zinc-800/80 rounded-lg overflow-hidden transition-all focus-within:border-indigo-500/50 focus-within:bg-zinc-900 h-7 w-full max-w-lg">
                <div className="flex items-center px-2 gap-1 text-zinc-500 relative">
                  {navButtons.home && (
                    <div className="flex items-center">
                      <TooltipWrapper text="Home">
                        <button type="button" onClick={() => { setUrl(homePage || 'https://fmhy.net/video'); setInputUrl(homePage || 'https://fmhy.net/video'); }} className="p-0.5 hover:text-zinc-200 transition-colors"><Home size={14} /></button>
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

        {/* Window Controls */}
        <div className="flex items-center no-drag ml-auto">
          {isPlaying && (
            <button title="Pause Media" onClick={() => ahk.call('ToggleMedia')} className="p-5 px-5 transition-colors text-indigo-500 hover:text-indigo-400 hover:bg-indigo-500/10">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect>
              </svg>
            </button>
          )}
          {activeTab === 'player' && (
            <button title="Toggle PiP Mode" onClick={() => ahk.call('TogglePiP')} className="p-5 px-5 transition-colors text-zinc-500 hover:text-indigo-400 hover:bg-indigo-500/10">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><rect x="8" y="21" width="8" height="0"></rect><path d="M12 17v4"></path><path d="M16 11h2"></path><path d="M16 7h2"></path></svg>
            </button>
          )}
          {activeTab === 'player' && (
            <TooltipWrapper text={isQuickOptionsHidden ? "Show Quick Menu" : "Hide Quick Menu"}>
              <button
                onClick={() => setIsQuickOptionsHidden(!isQuickOptionsHidden)}
                className={`p-5 px-5 transition-colors ${!isQuickOptionsHidden ? 'text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20' : 'text-zinc-500 hover:bg-zinc-800'}`}
              >
                <Zap size={14} />
              </button>
            </TooltipWrapper>
          )}
          <TooltipWrapper text="Minimize">
            <button onClick={() => ahk.call('Minimize')} className="p-5 px-5 text-zinc-500 hover:bg-zinc-800 transition-colors">
              <Minus size={14} />
            </button>
          </TooltipWrapper>
          <TooltipWrapper text="Maximize">
            <button onClick={() => ahk.call('Maximize')} className="p-5 px-5 text-zinc-500 hover:bg-zinc-800 transition-colors">
              <Square size={12} />
            </button>
          </TooltipWrapper>
          <TooltipWrapper text="Close">
            <button onClick={() => ahk.call('Close')} className="p-5 px-5 text-zinc-500 hover:text-white hover:bg-red-500/90 transition-colors">
              <X size={14} />
            </button>
          </TooltipWrapper>
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
              className={`p-2.5 rounded-xl transition-all duration-200 ${activeTab === 'extensions' ? 'bg-indigo-500/10 text-indigo-400' : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900'}`}
            >
              <Puzzle size={20} strokeWidth={1.5} />
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
            {activeTab === 'player' && <PlayerView />}
            {activeTab === 'explore' && <ExploreView />}
            {activeTab === 'library' && <LibraryView />}
            {activeTab === 'extensions' && <ExtensionsView />}
            {activeTab === 'downloads' && <DownloadsView />}
            {activeTab === 'settings' && <SettingsView />}
            {activeTab === 'config' && <ConfigView />}
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
