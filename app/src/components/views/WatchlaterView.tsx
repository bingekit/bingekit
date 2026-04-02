import React from 'react';
import { Search, Bookmark, Settings, Minus, Square, X, ChevronLeft, ChevronRight, RotateCw, Film, Tv, Play, LayoutGrid, Shield, ShieldOff, Plus, Puzzle, Save, Trash2, Download, Upload, KeyRound, Code, ListTree, MonitorPlay, Activity, RefreshCw, Bell, Compass, Zap, Clock, Folder, Lock, EyeOff, Eye, Globe } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { ahk } from '../../lib/ahk';
import { TooltipWrapper } from '../ui/TooltipWrapper';
import { CustomCheckbox } from '../ui/CustomCheckbox';
import { TagsInput } from '../ui/TagsInput';
import { Modal } from '../ui/Modal';
import _Editor from 'react-simple-code-editor';
const Editor = (_Editor as any).default || _Editor;
import Prism from 'prismjs';
import { DEFAULT_PLUGIN, SitePlugin, CustomFlow, Userscript, FollowedItem, BookmarkItem, WatchLaterItem, CredentialItem } from '../../types';

export const WatchlaterView = () => {
  const {
    url, setUrl, inputUrl, setInputUrl, isAdblockEnabled, setIsAdblockEnabled, urlBarMode, setUrlBarMode,
    theme, setTheme, bookmarks, setBookmarks, selectedBookmarks, setSelectedBookmarks,
    followedItems, setFollowedItems, isCheckingUpdates, setIsCheckingUpdates, plugins, setPlugins,
    editingPlugin, setEditingPlugin, testSearchUrl, setTestSearchUrl, testSearchResults, setTestSearchResults,
    isTestingSearch, setIsTestingSearch, flows, setFlows, editingFlow, setEditingFlow, userscripts, setUserscripts,
    editingUserscriptId, setEditingUserscriptId, activeTab, setActiveTab, multiSearchQuery, setMultiSearchQuery,
    searchResults, setSearchResults, isSearching, setIsSearching, watchLater, setWatchLater, credentials, setCredentials,
    newCred, setNewCred, bookmarkSearchQuery, setBookmarkSearchQuery, editingBookmarkId, setEditingBookmarkId,
    showCredModal, setShowCredModal, searchParamMode, setSearchParamMode, isQuickOptionsHidden, setIsQuickOptionsHidden,
    playerRef, savePlugin, deletePlugin, updateEditingPlugin, fetchTitleForUrl, runFlow, checkForUpdates, handleNavigate, loadPlugins
  } = useAppContext();

  return (

    <div className="p-8 max-w-6xl mx-auto w-full h-full overflow-y-auto no-scrollbar">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-light tracking-tight text-zinc-100">Watch Later</h2>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {watchLater.map(item => (
          <div
            key={item.id}
            onClick={() => {
              setUrl(item.url);
              setInputUrl(item.url);
              setActiveTab('player');
            }}
            className="group p-4 bg-zinc-900/50 border border-zinc-800/50 hover:border-indigo-500/30 hover:bg-zinc-900 rounded-xl cursor-pointer transition-all duration-300 flex items-center gap-4"
          >
            <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-500/20 group-hover:text-indigo-400 transition-all">
              <Clock size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-zinc-200 truncate">{item.title}</h3>
              <p className="text-xs text-zinc-500 truncate mt-1">{item.url}</p>
            </div>
            <div className="px-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setWatchLater(watchLater.filter(w => w.id !== item.id));
                }}
                className="p-2 text-zinc-600 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
        {watchLater.length === 0 && (
          <div className="text-center py-12 text-zinc-500 text-sm">
            <Clock size={32} className="mx-auto mb-4 opacity-20" />
            Your watch later list is empty.
          </div>
        )}
      </div>
    </div>

  );
};
