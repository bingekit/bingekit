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

export const UserscriptsView = () => {
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

    <div className="flex w-full h-full bg-zinc-950 overflow-hidden">
      <div className="w-1/3 min-w-[300px] border-r border-zinc-800/50 bg-zinc-950/50 p-6 overflow-y-auto no-scrollbar">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-light tracking-tight text-zinc-100 flex items-center gap-2">
              <Code size={20} className="text-indigo-400" /> Userscripts
            </h2>
            <p className="text-xs text-zinc-500 mt-1">Customise site behaviour.</p>
          </div>
          <button
            onClick={() => {
              const newScript: Userscript = {
                id: Date.now().toString(),
                name: 'New Script',
                domains: ['*'],
                code: '// ==UserScript==\n// @match *\n// ==/UserScript==\n\nconsole.log("Hello from userscript");',
                enabled: true
              };
              setUserscripts([...userscripts, newScript]);
              setEditingUserscriptId(newScript.id);
            }}
            className="p-2 text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors"
          >
            <Plus size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-2">
          {userscripts.map(s => (
            <div
              key={s.id}
              className={`p-3 rounded-xl border transition-all cursor-pointer group ${editingUserscriptId === s.id ? 'bg-zinc-900 border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.1)]' : 'bg-transparent border-zinc-900/50 hover:bg-zinc-900 hover:border-zinc-800'}`}
              onClick={() => setEditingUserscriptId(s.id)}
            >
              <div className="flex justify-between items-center">
                <div className="font-medium text-sm text-zinc-200">{s.name}</div>
                <div className="flex gap-2 items-center">
                  <CustomCheckbox
                    checked={s.enabled}
                    onChange={(enabled) => {
                      setUserscripts(userscripts.map(u => u.id === s.id ? { ...u, enabled } : u));
                    }}
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      ahk.call('DeleteScript', `script_${s.id}.json`);
                      setUserscripts(userscripts.filter(u => u.id !== s.id));
                      if (editingUserscriptId === s.id) setEditingUserscriptId(null);
                    }}
                    className="text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div className="text-xs text-zinc-500 mt-1 truncate">Domains: {s.domains.join(', ')}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex-1 flex flex-col bg-zinc-950 overflow-hidden">
        {editingUserscriptId && userscripts.find(u => u.id === editingUserscriptId) ? (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            <div className="h-14 border-b border-zinc-900 flex items-center px-4 gap-4 flex-shrink-0">
              <input
                type="text"
                value={userscripts.find(u => u.id === editingUserscriptId)?.name}
                onChange={(e) => setUserscripts(userscripts.map(u => u.id === editingUserscriptId ? { ...u, name: e.target.value } : u))}
                className="bg-transparent border-none text-sm font-medium text-zinc-200 outline-none min-w-[150px]"
              />
              <div className="w-px h-4 bg-zinc-800" />
              <div className="flex items-center gap-2 text-xs text-zinc-400 shrink-0">
                Domains:
              </div>
              <div className="flex-1 max-w-sm">
                <TagsInput
                  tags={userscripts.find(u => u.id === editingUserscriptId)?.domains || []}
                  onChange={(domains) => setUserscripts(userscripts.map(u => u.id === editingUserscriptId ? { ...u, domains } : u))}
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto w-full relative group">
              <div className="absolute inset-0 pl-12 font-mono text-sm leading-relaxed overflow-hidden">
                <Editor
                  value={userscripts.find(u => u.id === editingUserscriptId)?.code || ''}
                  onValueChange={(code) => setUserscripts(userscripts.map(u => u.id === editingUserscriptId ? { ...u, code } : u))}
                  highlight={code => Prism.highlight(code, Prism.languages.javascript, 'javascript')}
                  padding={24}
                  style={{
                    fontFamily: '"Fira Code", "JetBrains Mono", Consolas, monospace',
                    fontSize: 14,
                    minHeight: '100%',
                  }}
                  className="bg-transparent text-zinc-300 transition-colors focus-within:bg-zinc-900/30"
                  textareaClassName="focus:outline-none"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-zinc-500">
            <Code size={48} className="mb-4 opacity-20" />
            <p>Select a userscript to edit or create a new one.</p>
          </div>
        )}
      </div>
    </div>

  );
};
