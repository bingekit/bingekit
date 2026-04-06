import React from 'react';
import { Film, MonitorPlay, Compass, Bookmark, Download, Puzzle, Settings, BookOpen } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { TooltipWrapper } from '../ui/TooltipWrapper';

export const Sidebar = () => {
  const { activeTab, setActiveTab, followedItems, activeDownloads, pluginUpdateCount } = useAppContext();

  const activeDownloadsCount = Object.values(activeDownloads || {}).filter((dl: any) => dl.state !== 2).length;

  return (
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

      <TooltipWrapper text="Help & Docs">
        <button
          onClick={() => setActiveTab('docs')}
          className={`relative p-2.5 rounded-xl transition-all duration-200 ${activeTab === 'docs' ? 'bg-indigo-500/10 text-indigo-400' : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900'}`}
        >
          <BookOpen size={20} strokeWidth={1.5} />
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
  );
};
