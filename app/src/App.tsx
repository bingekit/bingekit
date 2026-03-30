import React from 'react';
import { AppProvider, useAppContext } from './context/AppContext';
import { ahk } from './lib/ahk';
import './lib/bridge';

import {
  Film, ChevronLeft, ChevronRight, RotateCw, Search, Bookmark, Clock, EyeOff, Eye, Minus, Square, X, Compass, MonitorPlay, Activity, Puzzle, ListTree, Code, Settings, Zap
} from 'lucide-react';

// UI Wrappers
import { TooltipWrapper } from './components/ui/TooltipWrapper';

// Views
import { DashboardView } from './components/views/DashboardView';
import { PlayerView } from './components/views/PlayerView';
import { BookmarksView } from './components/views/BookmarksView';
import { WatchlaterView } from './components/views/WatchlaterView';
import { PluginsView } from './components/views/PluginsView';
import { ActivityView } from './components/views/ActivityView';
import { SettingsView } from './components/views/SettingsView';
import { FlowsView } from './components/views/FlowsView';
import { UserscriptsView } from './components/views/UserscriptsView';

const MainLayout = () => {
  const {
    activeTab, setActiveTab, urlBarMode, setUrlBarMode, theme,
    inputUrl, setInputUrl, url, setUrl, bookmarks, setBookmarks,
    watchLater, setWatchLater, followedItems, fetchTitleForUrl, handleNavigate,
    isQuickOptionsHidden, setIsQuickOptionsHidden
  } = useAppContext();

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
        .text-indigo-500, .text-indigo-400 { color: var(--theme-accent) !important; }
        .bg-indigo-500, .bg-indigo-600 { background-color: var(--theme-accent) !important; border-color: var(--theme-accent) !important; }
        .bg-indigo-500\\/10 { background-color: color-mix(in srgb, var(--theme-accent) 10%, transparent) !important; }
        .bg-indigo-500\\/20 { background-color: color-mix(in srgb, var(--theme-accent) 20%, transparent) !important; }
        .bg-indigo-500\\/30 { background-color: color-mix(in srgb, var(--theme-accent) 30%, transparent) !important; }
        .border-indigo-500, .border-indigo-500\\/30, .border-indigo-500\\/40, .border-indigo-500\\/50 { border-color: color-mix(in srgb, var(--theme-accent) 50%, transparent) !important; }
        .fill-indigo-400 { fill: var(--theme-accent) !important; }
        .hover\\:text-indigo-400:hover { color: var(--theme-accent) !important; filter: drop-shadow(0 0 4px var(--theme-accent)); }
        .hover\\:bg-indigo-500\\/10:hover { background-color: color-mix(in srgb, var(--theme-accent) 10%, transparent) !important; }

        /* Text Colors */
        .text-white, .text-zinc-50, .text-zinc-100, .text-zinc-200, .text-zinc-300 { color: var(--theme-text-main) !important; }
        .text-zinc-400, .text-zinc-500, .text-zinc-600 { color: var(--theme-text-sec) !important; }
        
        .hover\\:text-zinc-100:hover, .hover\\:text-zinc-200:hover, .hover\\:text-zinc-300:hover, .hover\\:text-white:hover { color: var(--theme-text-main) !important; }
        .hover\\:text-zinc-400:hover, .hover\\:text-zinc-500:hover { color: var(--theme-text-sec) !important; }

        /* Transparent overrides */
        input.bg-transparent, textarea.bg-transparent { background-color: transparent !important; }

        /* Hard Toolbar Fix */
        form#toolbar-form { display: flex !important; }
      `}</style>

      {/* --- Custom Titlebar (Draggable) --- */}
      <div id="titlebar-region" className="h-10 flex items-center justify-between drag-region select-none pl-5 border-b">
        <div className="flex items-center gap-3 no-drag">
          <div className="flex items-center gap-2 text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer" onClick={() => setActiveTab('dashboard')} title="Dashboard">
            <Film size={16} className="text-indigo-500" />
            {/* <span className="text-xs font-medium tracking-wider uppercase">StreamView</span> */}
          </div>
        </div>

        {/* URL Bar */}
        {activeTab === 'player' && (
          <div className="flex-1 max-w-xl mx-4 no-drag flex items-center justify-center">
            {urlBarMode === 'hidden' ? null : urlBarMode === 'title' ? (
              <div className="flex items-center justify-center text-xs text-zinc-500 font-medium truncate cursor-pointer hover:text-zinc-300 transition-colors" onClick={() => setUrlBarMode('full')}>
                {(() => {
                  try { return new URL(url).hostname; } catch (e) { return url; }
                })()}
              </div>
            ) : (
              <form id="toolbar-form" onSubmit={handleNavigate} className="flex items-center bg-zinc-900/80 backdrop-blur-xl border border-zinc-800/80 rounded-lg overflow-hidden transition-all focus-within:border-indigo-500/50 focus-within:bg-zinc-900 h-7 w-full max-w-lg">
                <div className="flex items-center px-2 gap-1 text-zinc-500">
                  <TooltipWrapper text="Go Back">
                    <button type="button" onClick={() => ahk.call('PlayerGoBack')} className="p-0.5 hover:text-zinc-200 transition-colors"><ChevronLeft size={14} /></button>
                  </TooltipWrapper>
                  <TooltipWrapper text="Go Forward">
                    <button type="button" onClick={() => ahk.call('PlayerGoForward')} className="p-0.5 hover:text-zinc-200 transition-colors"><ChevronRight size={14} /></button>
                  </TooltipWrapper>
                  <TooltipWrapper text="Refresh">
                    <button type="button" onClick={() => ahk.call('PlayerReload')} className="p-0.5 hover:text-zinc-200 transition-colors"><RotateCw size={12} /></button>
                  </TooltipWrapper>
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
        )}

        {/* Window Controls */}
        <div className="flex items-center no-drag">
          {activeTab === 'player' && (
            <TooltipWrapper text="Toggle URL Bar">
              <button onClick={() => setUrlBarMode(m => m === 'full' ? 'title' : m === 'title' ? 'hidden' : 'full')} className={`p-5 px-5 transition-colors ${urlBarMode !== 'hidden' ? 'text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20' : 'text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800'}`}>
                {urlBarMode === 'hidden' ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </TooltipWrapper>
          )}
          {activeTab === 'player' && (
            <TooltipWrapper text={isQuickOptionsHidden ? "Show Quick Menu" : "Hide Quick Menu"}>
              <button
                onClick={() => setIsQuickOptionsHidden(!isQuickOptionsHidden)}
                className={`p-5 px-5 transition-colors ${!isQuickOptionsHidden ? 'text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20' : 'text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800'}`}
              >
                <Zap size={14} />
              </button>
            </TooltipWrapper>
          )}
          <TooltipWrapper text="Minimize">
            <button onClick={() => ahk.call('Minimize')} className="p-5 px-5 text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800 transition-colors">
              <Minus size={14} />
            </button>
          </TooltipWrapper>
          <TooltipWrapper text="Maximize">
            <button onClick={() => ahk.call('Maximize')} className="p-5 px-5 text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800 transition-colors">
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
              <Compass size={20} strokeWidth={1.5} />
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
          <TooltipWrapper text="Bookmarks">
            <button
              onClick={() => setActiveTab('bookmarks')}
              className={`p-2.5 rounded-xl transition-all duration-200 ${activeTab === 'bookmarks' ? 'bg-indigo-500/10 text-indigo-400' : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900'}`}
            >
              <Bookmark size={20} strokeWidth={1.5} />
            </button>
          </TooltipWrapper>
          <TooltipWrapper text="Watch Later">
            <button
              onClick={() => setActiveTab('watchlater')}
              className={`p-2.5 rounded-xl transition-all duration-200 ${activeTab === 'watchlater' ? 'bg-indigo-500/10 text-indigo-400' : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900'}`}
            >
              <Clock size={20} strokeWidth={1.5} />
            </button>
          </TooltipWrapper>
          <TooltipWrapper text="Activity">
            <button
              onClick={() => setActiveTab('activity')}
              className={`relative p-2.5 rounded-xl transition-all duration-200 ${activeTab === 'activity' ? 'bg-indigo-500/10 text-indigo-400' : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900'}`}
            >
              <Activity size={20} strokeWidth={1.5} />
              {followedItems.some(i => i.hasUpdate) && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
              )}
            </button>
          </TooltipWrapper>

          <div className="flex-1" />

          <TooltipWrapper text="Sites">
            <button
              onClick={() => setActiveTab('plugins')}
              className={`p-2.5 rounded-xl transition-all duration-200 ${activeTab === 'plugins' ? 'bg-indigo-500/10 text-indigo-400' : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900'}`}
            >
              <Puzzle size={20} strokeWidth={1.5} />
            </button>
          </TooltipWrapper>
          <TooltipWrapper text="Flows">
            <button
              onClick={() => setActiveTab('flows')}
              className={`p-2.5 rounded-xl transition-all duration-200 ${activeTab === 'flows' ? 'bg-indigo-500/10 text-indigo-400' : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900'}`}
            >
              <ListTree size={20} strokeWidth={1.5} />
            </button>
          </TooltipWrapper>
          <TooltipWrapper text="Userscripts">
            <button
              onClick={() => setActiveTab('userscripts')}
              className={`p-2.5 rounded-xl transition-all duration-200 ${activeTab === 'userscripts' ? 'bg-indigo-500/10 text-indigo-400' : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900'}`}
            >
              <Code size={20} strokeWidth={1.5} />
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
            {activeTab === 'bookmarks' && <BookmarksView />}
            {activeTab === 'watchlater' && <WatchlaterView />}
            {activeTab === 'plugins' && <PluginsView />}
            {activeTab === 'activity' && <ActivityView />}
            {activeTab === 'settings' && <SettingsView />}
            {activeTab === 'flows' && <FlowsView />}
            {activeTab === 'userscripts' && <UserscriptsView />}
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
