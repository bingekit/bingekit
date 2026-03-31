import React from 'react';
import { Search, Bookmark, Settings, Minus, Square, X, ChevronLeft, ChevronRight, RotateCw, Film, Tv, Play, LayoutGrid, Shield, ShieldOff, Plus, Puzzle, Save, Trash2, Download, Upload, KeyRound, Code, ListTree, MonitorPlay, Activity, RefreshCw, Bell, Compass, Zap, Clock, Folder, Lock, EyeOff, Eye, Globe } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { ahk } from '../../lib/ahk';
import { TooltipWrapper } from '../ui/TooltipWrapper';
import { CustomCheckbox } from '../ui/CustomCheckbox';
import { TagsInput } from '../ui/TagsInput';
import { Modal } from '../ui/Modal';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import { DEFAULT_PLUGIN, SitePlugin, CustomFlow, Userscript, FollowedItem, BookmarkItem, WatchLaterItem, CredentialItem } from '../../types';

export const ActivityView = () => {
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
              setActiveTab('player');
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

  );
};
