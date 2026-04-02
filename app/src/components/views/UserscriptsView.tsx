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

import { MetadataEditor } from './MetadataEditor';

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

  const [activeSubTab, setActiveSubTab] = React.useState<'code' | 'metadata'>('code');

  return (

    <div className="flex w-full h-full bg-zinc-950 overflow-hidden">
      <div className="w-1/4 min-w-[250px] border-r border-zinc-800/50 bg-zinc-950/50 p-6 overflow-y-auto no-scrollbar">
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
                description: '',
                author: '',
                version: '1.0.0',
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
                <div className="flex items-center gap-2">
                  {s.icon ? (
                    <div className="w-6 h-6 rounded bg-zinc-800/80 flex items-center justify-center shrink-0 border border-zinc-700/50">
                      {s.icon.includes('<svg') || s.icon.includes('http') ? (
                        <div className="w-3 h-3" dangerouslySetInnerHTML={{ __html: s.icon.includes('<svg') ? s.icon : `<img src="${s.icon}" class="w-full h-full object-contain" />` }} />
                      ) : (
                        <span className="text-[10px]">{s.icon}</span>
                      )}
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded bg-zinc-800/80 flex items-center justify-center shrink-0 text-zinc-500 border border-zinc-700/50">
                      <Code size={12} />
                    </div>
                  )}
                  <div className="font-medium text-sm text-zinc-200 truncate">{s.name}</div>
                </div>
                <div className="flex gap-2 items-center">
                  <CustomCheckbox
                    checked={s.enabled}
                    onChange={(enabled) => {
                      const updated = { ...s, enabled };
                      setUserscripts(userscripts.map(u => u.id === s.id ? updated : u));
                      ahk.call('SaveScript', `script_${s.id}.json`, JSON.stringify(updated, null, 2));
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
              <div className="text-xs text-zinc-500 mt-1 truncate ml-8">Domains: {s.domains.join(', ')}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex-1 flex flex-col bg-zinc-950 overflow-hidden">
        {editingUserscriptId && userscripts.find(u => u.id === editingUserscriptId) ? (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            <div className="h-14 border-b border-zinc-900 flex items-center px-4 gap-4 flex-shrink-0 bg-zinc-950">
              <input
                type="text"
                value={userscripts.find(u => u.id === editingUserscriptId)?.name}
                onChange={(e) => {
                  const s = userscripts.find(u => u.id === editingUserscriptId)!;
                  const updated = { ...s, name: e.target.value };
                  setUserscripts(userscripts.map(u => u.id === editingUserscriptId ? updated : u));
                  ahk.call('SaveScript', `script_${updated.id}.json`, JSON.stringify(updated, null, 2));
                }}
                className="bg-transparent border-none text-sm font-medium text-zinc-200 outline-none min-w-[150px]"
              />
              <div className="w-px h-4 bg-zinc-800" />
              <div className="flex gap-1 shrink-0 bg-zinc-900/50 p-1 rounded-lg">
                <button
                  onClick={() => setActiveSubTab('code')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${activeSubTab === 'code' ? 'bg-indigo-500/20 text-indigo-400' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  Code
                </button>
                <button
                  onClick={() => setActiveSubTab('metadata')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${activeSubTab === 'metadata' ? 'bg-indigo-500/20 text-indigo-400' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  Metadata
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto w-full relative group flex flex-col">
              {activeSubTab === 'metadata' ? (
                <div className="p-8 max-w-3xl space-y-8 h-full">
                  <div className="space-y-2">
                    <label className="block text-xs text-zinc-500">Target Domains</label>
                    <TagsInput
                      tags={userscripts.find(u => u.id === editingUserscriptId)?.domains || []}
                      onChange={(domains) => {
                        const s = userscripts.find(u => u.id === editingUserscriptId)!;
                        const updated = { ...s, domains };
                        setUserscripts(userscripts.map(u => u.id === editingUserscriptId ? updated : u));
                        ahk.call('SaveScript', `script_${updated.id}.json`, JSON.stringify(updated, null, 2));
                      }}
                    />
                    <p className="text-xs text-zinc-600 mt-1">Use <code>*</code> for all domains or exact hostnames like <code>example.com</code></p>
                  </div>

                  <MetadataEditor
                    metadata={userscripts.find(u => u.id === editingUserscriptId)!}
                    onChange={(key, val) => {
                      const s = userscripts.find(u => u.id === editingUserscriptId)!;
                      const updated = { ...s, [key]: val };
                      setUserscripts(userscripts.map(u => u.id === editingUserscriptId ? updated : u));
                      ahk.call('SaveScript', `script_${updated.id}.json`, JSON.stringify(updated, null, 2));
                    }}
                  />
                </div>
              ) : (
                <div className="absolute inset-0 pl-12 pt-2 font-mono text-sm leading-relaxed overflow-hidden">
                  <Editor
                    value={userscripts.find(u => u.id === editingUserscriptId)?.code || ''}
                    onValueChange={(code) => {
                      const s = userscripts.find(u => u.id === editingUserscriptId)!;
                      const updated = { ...s, code };
                      setUserscripts(userscripts.map(u => u.id === editingUserscriptId ? updated : u));
                      ahk.call('SaveScript', `script_${updated.id}.json`, JSON.stringify(updated, null, 2));
                    }}
                    highlight={code => Prism.highlight(code, Prism.languages.javascript, 'javascript')}
                    padding={24}
                    style={{
                      fontFamily: '"Fira Code", "JetBrains Mono", Consolas, monospace',
                      fontSize: 14,
                      minHeight: '100%',
                    }}
                    className="bg-transparent text-zinc-300 transition-colors focus-within:bg-zinc-900/30 w-full h-full"
                    textareaClassName="focus:outline-none"
                  />
                </div>
              )}
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
