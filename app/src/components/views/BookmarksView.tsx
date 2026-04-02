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

export const BookmarksView = () => {
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

    <div className="p-8 max-w-6xl mx-auto w-full h-full overflow-y-auto no-scrollbar relative">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-light tracking-tight text-zinc-100">Bookmarks</h2>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search bookmarks..."
              value={bookmarkSearchQuery}
              onChange={e => setBookmarkSearchQuery(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded-full py-2 pl-9 pr-4 text-sm text-zinc-200 outline-none focus:border-indigo-500 transition-colors w-64"
            />
          </div>
          {selectedBookmarks.length > 0 && (
            <button
              onClick={() => {
                setBookmarks(bookmarks.filter(b => !selectedBookmarks.includes(b.id)));
                setSelectedBookmarks([]);
              }}
              className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 bg-red-500/10 px-4 py-2 rounded-full transition-colors"
            >
              <Trash2 size={16} /> Delete Selected ({selectedBookmarks.length})
            </button>
          )}
          <button
            onClick={() => {
              const newId = Date.now().toString();
              const newUrl = inputUrl && inputUrl !== 'https://fmhy.net/video' ? inputUrl : 'https://';
              const urlHostname = (() => { try { return new URL(newUrl).hostname } catch { return 'New Site' } })();
              setBookmarks([{ id: newId, title: urlHostname, url: newUrl, folder: 'General', tags: [urlHostname.split('.')[0]] }, ...bookmarks]);
              setEditingBookmarkId(newId);
            }}
            className="flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 px-4 py-2 rounded-full transition-colors"
          >
            <Plus size={16} /> Add Bookmark
          </button>
        </div>
      </div>

      {Array.from(new Set(['All', ...bookmarks.map(b => b.folder).filter(Boolean)])).map(folder => {
        const itemsInFolder = bookmarks.filter(b => (folder === 'All' && !b.folder) || b.folder === folder)
          .filter(b => b.title.toLowerCase().includes(bookmarkSearchQuery.toLowerCase()) || b.url.toLowerCase().includes(bookmarkSearchQuery.toLowerCase()) || b.tags?.some(t => t.toLowerCase().includes(bookmarkSearchQuery.toLowerCase())));

        if (itemsInFolder.length === 0) return null;

        return (
          <div key={folder || 'All'} className="mb-8">
            <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Folder size={16} /> {folder}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {itemsInFolder.map(bookmark => (
                <div
                  key={bookmark.id}
                  className="group relative p-4 bg-zinc-900/50 border border-zinc-800/50 hover:border-indigo-500/30 hover:bg-zinc-900 rounded-2xl transition-all duration-300 flex items-start gap-4"
                >
                  <div className="absolute top-3 right-3 z-10 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <CustomCheckbox
                      checked={selectedBookmarks.includes(bookmark.id)}
                      onChange={(checked) => {
                        if (checked) setSelectedBookmarks([...selectedBookmarks, bookmark.id]);
                        else setSelectedBookmarks(selectedBookmarks.filter(id => id !== bookmark.id));
                      }}
                    />
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditingBookmarkId(bookmark.id); }}
                      className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors"
                    >
                      <Settings size={14} />
                    </button>
                  </div>
                  <div
                    className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-500/20 group-hover:text-indigo-400 transition-all cursor-pointer"
                    onClick={() => {
                      setUrl(bookmark.url);
                      setInputUrl(bookmark.url);
                      setActiveTab('player');
                    }}
                  >
                    <Tv size={18} />
                  </div>
                  <div className="flex-1 min-w-0 pr-8">
                    <h4 className="text-sm font-medium text-zinc-200 truncate cursor-pointer" onClick={() => { setUrl(bookmark.url); setInputUrl(bookmark.url); setActiveTab('player'); }}>
                      {bookmark.title}
                    </h4>
                    <p className="text-xs text-zinc-500 truncate mt-0.5">{bookmark.url}</p>
                    {(bookmark.folder || (bookmark.tags && bookmark.tags.length > 0)) && (
                      <div className="flex gap-1.5 mt-2 flex-wrap max-h-[44px] overflow-hidden">
                        {bookmark.folder && (
                          <span className="bg-zinc-800 text-zinc-400 text-[10px] px-2 py-0.5 rounded flex items-center gap-1"><Folder size={10} /> {bookmark.folder}</span>
                        )}
                        {bookmark.tags?.map((t, idx) => (
                          <span key={idx} className="bg-zinc-800/50 text-zinc-500 text-[10px] px-2 py-0.5 rounded">{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {bookmarks.filter(b => b.title.toLowerCase().includes(bookmarkSearchQuery.toLowerCase()) || b.url.toLowerCase().includes(bookmarkSearchQuery.toLowerCase()) || b.tags?.some(t => t.toLowerCase().includes(bookmarkSearchQuery.toLowerCase()))).length === 0 && (
        <div className="text-center py-20 text-zinc-500">
          <Bookmark size={48} className="mx-auto mb-4 opacity-20" />
          No bookmarks found matching your search.
        </div>
      )}

      {/* Edit Bookmark Modal */}
      <Modal
        isOpen={!!editingBookmarkId}
        onClose={() => setEditingBookmarkId(null)}
        title="Edit Bookmark"
      >
        {editingBookmarkId && (() => {
          const bm = bookmarks.find(b => b.id === editingBookmarkId);
          if (!bm) return null;
          return (
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-zinc-500 mb-1.5">Title</label>
                <input
                  value={bm.title}
                  onChange={(e) => setBookmarks(bookmarks.map(b => b.id === bm.id ? { ...b, title: e.target.value } : b))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1.5">URL</label>
                <input
                  value={bm.url}
                  onChange={(e) => setBookmarks(bookmarks.map(b => b.id === bm.id ? { ...b, url: e.target.value } : b))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 outline-none focus:border-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-zinc-500 mb-1.5">Folder</label>
                  <input
                    value={bm.folder || ''}
                    onChange={(e) => setBookmarks(bookmarks.map(b => b.id === bm.id ? { ...b, folder: e.target.value } : b))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 outline-none focus:border-indigo-500"
                    placeholder="General"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1.5">Tags</label>
                  <TagsInput
                    tags={bm.tags || []}
                    onChange={newTags => setBookmarks(bookmarks.map(b => b.id === bm.id ? { ...b, tags: newTags } : b))}
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-zinc-800/50">
                <button
                  onClick={() => {
                    setBookmarks(bookmarks.filter(b => b.id !== bm.id));
                    setEditingBookmarkId(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  Delete
                </button>
                <button
                  onClick={() => setEditingBookmarkId(null)}
                  className="px-4 py-2 text-sm font-medium bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          );
        })()}
      </Modal>
    </div>

  );
};
