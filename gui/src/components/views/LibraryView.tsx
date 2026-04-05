import React, { useState } from 'react';
import { BookmarksView } from './BookmarksView';
import { WatchlaterView } from './WatchlaterView';
import { HistoryView } from './HistoryView';
import { Bookmark, Clock } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

let cachedLibrarySubTab = 'bookmarks';

export const LibraryView = () => {
  const { isHistoryEnabled } = useAppContext();
  const [activeSubTab, _setActiveSubTab] = useState(cachedLibrarySubTab);
  const setActiveSubTab = (val: string) => { cachedLibrarySubTab = val; _setActiveSubTab(val); };

  return (
    <div className="w-full h-full flex flex-col relative bg-transparent">
      {/* Tab Navigation */}
      <div className="flex border-b border-zinc-800/50 px-8 pt-4 gap-6">
        <button
          onClick={() => setActiveSubTab('bookmarks')}
          className={`pb-3 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${activeSubTab === 'bookmarks'
            ? 'border-indigo-500 text-indigo-400'
            : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
        >
          <Bookmark size={16} /> Bookmarks
        </button>
        <button
          onClick={() => setActiveSubTab('watchlater')}
          className={`pb-3 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${activeSubTab === 'watchlater'
            ? 'border-indigo-500 text-indigo-400'
            : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
        >
          <Clock size={16} /> Watch Later
        </button>
        {isHistoryEnabled && (
          <button
            onClick={() => setActiveSubTab('history')}
            className={`pb-3 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${activeSubTab === 'history'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
          >
            <Clock size={16} /> History
          </button>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden relative">
        <div className={`absolute inset-0 transition-opacity duration-300 flex flex-col ${activeSubTab === 'bookmarks' ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none z-0'}`}>
          <BookmarksView />
        </div>
        <div className={`absolute inset-0 transition-opacity duration-300 flex flex-col ${activeSubTab === 'watchlater' ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none z-0'}`}>
          <WatchlaterView />
        </div>
        <div className={`absolute inset-0 transition-opacity duration-300 flex flex-col ${activeSubTab === 'history' ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none z-0'}`}>
          <HistoryView />
        </div>
      </div>
    </div>
  );
};
