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

export const PluginsView = () => {
  const {
    url, setUrl, inputUrl, setInputUrl, isAdblockEnabled, setIsAdblockEnabled, urlBarMode, setUrlBarMode,
    theme, setTheme, bookmarks, setBookmarks, selectedBookmarks, setSelectedBookmarks,
    followedItems, setFollowedItems, isCheckingUpdates, setIsCheckingUpdates, plugins, setPlugins,
    editingPlugin, setEditingPlugin, testSearchQuery, setTestSearchQuery, testSearchResults, setTestSearchResults,
    isTestingSearch, setIsTestingSearch, flows, setFlows, editingFlow, setEditingFlow, userscripts, setUserscripts,
    editingUserscriptId, setEditingUserscriptId, activeTab, setActiveTab, multiSearchQuery, setMultiSearchQuery,
    searchResults, setSearchResults, isSearching, setIsSearching, watchLater, setWatchLater, credentials, setCredentials,
    newCred, setNewCred, bookmarkSearchQuery, setBookmarkSearchQuery, editingBookmarkId, setEditingBookmarkId,
    showCredModal, setShowCredModal, searchParamMode, setSearchParamMode, isQuickOptionsHidden, setIsQuickOptionsHidden,
    playerRef, savePlugin, deletePlugin, updateEditingPlugin, fetchTitleForUrl, runFlow, checkForUpdates, handleNavigate, loadPlugins
  } = useAppContext();

  return (

    <div className="flex h-full w-full overflow-hidden">
      {/* Plugins List */}
      <div className="w-1/3 min-w-[300px] border-r border-zinc-800/50 bg-zinc-950/50 p-6 overflow-y-auto no-scrollbar">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-light tracking-tight text-zinc-100 flex items-center gap-2">
              <Puzzle size={20} className="text-indigo-400" /> Site Plugins
            </h2>
            <p className="text-xs text-zinc-500 mt-1">Custom site integrations.</p>
          </div>
          <button
            onClick={() => setEditingPlugin({ ...DEFAULT_PLUGIN, id: Date.now().toString() })}
            className="p-2 text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors"
          >
            <Plus size={18} />
          </button>
        </div>

        <div className="space-y-3">
          {plugins.map(plugin => (
            <div
              key={plugin.id}
              onClick={() => {
                const safePlugin = {
                  ...DEFAULT_PLUGIN,
                  ...plugin,
                  search: { ...DEFAULT_PLUGIN.search, ...(plugin.search || {}) },
                  additionalSearches: plugin.additionalSearches || [],
                  enabled: plugin.enabled !== false
                };
                setEditingPlugin(safePlugin);
              }}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${editingPlugin?.id === plugin.id ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-zinc-900/30 border-zinc-800/50 hover:border-zinc-700'}`}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-zinc-200">{plugin.name}</h3>
                <div className="flex items-center gap-2">
                  <CustomCheckbox
                    checked={plugin.enabled !== false}
                    onChange={(val) => {
                      const updated = { ...plugin, enabled: val };
                      setPlugins(plugins.map(p => p.id === plugin.id ? updated : p));
                      const filename = `${updated.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${updated.id}.json`;
                      ahk.call('SaveSite', filename, JSON.stringify(updated, null, 2));
                    }}
                  />
                  <button
                    onClick={(e) => { e.stopPropagation(); deletePlugin(plugin); }}
                    className="text-zinc-600 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <p className="text-xs text-zinc-500 mt-1 truncate">{plugin.baseUrl}</p>
            </div>
          ))}
          {plugins.length === 0 && (
            <div className="text-center py-8 text-sm text-zinc-600">
              No plugins installed.<br />Create one or import from the sites folder.
            </div>
          )}
        </div>
      </div>

      {/* Plugin Editor */}
      <div className="flex-1 bg-zinc-950 p-6 overflow-y-auto no-scrollbar">
        {editingPlugin ? (
          <div className="max-w-3xl mx-auto space-y-8 pb-20">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-light tracking-tight text-zinc-100">
                {editingPlugin.id ? 'Edit Plugin' : 'New Plugin'}
              </h2>
              <div className="flex gap-3">
                <button
                  onClick={() => setEditingPlugin(null)}
                  className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={savePlugin}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors shadow-lg shadow-indigo-500/20"
                >
                  <Save size={16} /> Save Plugin
                </button>
              </div>
            </div>

            {/* General */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-indigo-400 flex items-center gap-2 uppercase tracking-wider"><Settings size={16} /> General</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-zinc-500 mb-1.5">Site Name</label>
                  <input
                    type="text" value={editingPlugin.name}
                    onChange={(e) => updateEditingPlugin('root', 'name', e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1.5">Base URL</label>
                  <input
                    type="text" value={editingPlugin.baseUrl}
                    onChange={(e) => updateEditingPlugin('root', 'baseUrl', e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-zinc-500 mb-1.5">Tags</label>
                  <TagsInput
                    tags={editingPlugin.tags || []}
                    onChange={newTags => updateEditingPlugin('root', 'tags', newTags)}
                  />
                </div>
                <div className="hidden md:block"></div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1.5">Custom CSS</label>
                  <textarea
                    value={editingPlugin.customCss || ''}
                    onChange={(e) => updateEditingPlugin('root', 'customCss', e.target.value)}
                    rows={4}
                    placeholder="body { background: #000; }"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 outline-none font-mono resize-y"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1.5">Custom JS (Runs on load)</label>
                  <textarea
                    value={editingPlugin.customJs || ''}
                    onChange={(e) => updateEditingPlugin('root', 'customJs', e.target.value)}
                    rows={4}
                    placeholder="console.log('Site loaded');"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 outline-none font-mono resize-y"
                  />
                </div>
              </div>
            </div>

            {/* Authentication Flow */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-indigo-400 flex items-center gap-2 uppercase tracking-wider"><KeyRound size={16} /> Authentication Flow</h3>
              <div className="p-5 bg-zinc-900/30 border border-zinc-800/50 rounded-xl space-y-4">
                <div>
                  <label className="block text-xs text-zinc-500 mb-1.5">Login URL</label>
                  <input
                    type="text" value={editingPlugin.auth.loginUrl} placeholder="https://site.com/login"
                    onChange={(e) => updateEditingPlugin('auth', 'loginUrl', e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 outline-none"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1.5">Username Selector</label>
                    <input
                      type="text" value={editingPlugin.auth.userSel} placeholder="input[name='user']"
                      onChange={(e) => updateEditingPlugin('auth', 'userSel', e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1.5">Password Selector</label>
                    <input
                      type="text" value={editingPlugin.auth.passSel} placeholder="input[name='pass']"
                      onChange={(e) => updateEditingPlugin('auth', 'passSel', e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1.5">Submit Selector</label>
                    <input
                      type="text" value={editingPlugin.auth.submitSel} placeholder="button[type='submit']"
                      onChange={(e) => updateEditingPlugin('auth', 'submitSel', e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 outline-none font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Search Parsing */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-indigo-400 flex items-center gap-2 uppercase tracking-wider"><Search size={16} /> Search Parsing</h3>
              <div className="p-5 bg-zinc-900/30 border border-zinc-800/50 rounded-xl space-y-4">
                <div className="flex items-center gap-3 mb-2">
                  <CustomCheckbox
                    checked={editingPlugin.search.isFormSearch || false}
                    onChange={(val) => updateEditingPlugin('search', 'isFormSearch', val)}
                  />
                  <span className="text-sm text-zinc-300">Use Form Search instead of URL Formatting</span>
                </div>

                {!editingPlugin.search.isFormSearch ? (
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1.5">Search URL Format (use {'{query}'})</label>
                    <input
                      type="text" value={editingPlugin.search.urlFormat} placeholder="https://site.com/search?q={query}"
                      onChange={(e) => updateEditingPlugin('search', 'urlFormat', e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 outline-none font-mono"
                    />
                  </div>
                ) : (
                  <div className="space-y-4 border border-zinc-800/80 rounded-lg p-4 bg-zinc-950/30">
                    <div>
                      <label className="block text-xs text-zinc-500 mb-1.5">Form Page URL (Start URL)</label>
                      <input
                        type="text" value={editingPlugin.search.urlFormat} placeholder="https://site.com/"
                        onChange={(e) => updateEditingPlugin('search', 'urlFormat', e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 outline-none font-mono"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-zinc-500 mb-1.5">Input Selector</label>
                        <input
                          type="text" value={editingPlugin.search.formInputSel || ''} placeholder="input[name='q']"
                          onChange={(e) => updateEditingPlugin('search', 'formInputSel', e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 outline-none font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-zinc-500 mb-1.5">Submit Selector</label>
                        <input
                          type="text" value={editingPlugin.search.formSubmitSel || ''} placeholder="button[type='submit']"
                          onChange={(e) => updateEditingPlugin('search', 'formSubmitSel', e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 outline-none font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-zinc-500 mb-1.5">Submission Wait Mode</label>
                        <select
                          value={editingPlugin.search.searchWaitMode || 'navigation'}
                          onChange={(e) => updateEditingPlugin('search', 'searchWaitMode', e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 outline-none"
                        >
                          <option value="navigation">Navigation (Page Reloads)</option>
                          <option value="ajax">AJAX / Popup (No Reload)</option>
                        </select>
                      </div>
                      {editingPlugin.search.searchWaitMode === 'ajax' && (
                        <div>
                          <label className="block text-xs text-zinc-500 mb-1.5">AJAX Delay (ms)</label>
                          <input
                            type="number" value={editingPlugin.search.formSubmitDelay || 2000}
                            onChange={(e) => updateEditingPlugin('search', 'formSubmitDelay', parseInt(e.target.value))}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 outline-none font-mono"
                          />
                        </div>
                      )}
                    </div>
                    <div className="pt-2 border-t border-zinc-800/80">
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-xs text-zinc-500">Extra Form Actions (Before Submit)</label>
                        <button
                          onClick={() => {
                            const newActions = [...(editingPlugin.search.formExtraActions || []), { id: Date.now().toString(), selector: '', action: 'setValue', value: '' }];
                            updateEditingPlugin('search', 'formExtraActions', newActions);
                          }}
                          className="text-[10px] bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-2 py-1 rounded flex items-center gap-1"
                        >
                          <Plus size={12} /> Add Action
                        </button>
                      </div>
                      <div className="space-y-2">
                        {(editingPlugin.search.formExtraActions || []).map((act, idx) => (
                          <div key={act.id || idx} className="flex gap-2 items-center">
                            <input
                              type="text" placeholder="Selector" value={act.selector}
                              onChange={(e) => {
                                const arr = [...editingPlugin.search.formExtraActions!];
                                arr[idx].selector = e.target.value;
                                updateEditingPlugin('search', 'formExtraActions', arr);
                              }}
                              className="flex-1 bg-zinc-900 border border-zinc-800 rounded px-2 py-1.5 text-xs text-zinc-200 focus:border-indigo-500 outline-none font-mono"
                            />
                            <select
                              value={act.action}
                              onChange={(e) => {
                                const arr = [...editingPlugin.search.formExtraActions!];
                                arr[idx].action = e.target.value as any;
                                updateEditingPlugin('search', 'formExtraActions', arr);
                              }}
                              className="w-28 bg-zinc-900 border border-zinc-800 rounded px-2 py-1.5 text-xs text-zinc-200 focus:border-indigo-500 outline-none"
                            >
                              <option value="setValue">Set Value</option>
                              <option value="check">Check</option>
                              <option value="uncheck">Uncheck</option>
                              <option value="click">Click</option>
                              <option value="setAttribute">Set Attr</option>
                              <option value="removeAttribute">Remove Attr</option>
                            </select>
                            <input
                              type="text" placeholder={act.action === 'setAttribute' ? "name=val" : "Value"} value={act.value}
                              onChange={(e) => {
                                const arr = [...editingPlugin.search.formExtraActions!];
                                arr[idx].value = e.target.value;
                                updateEditingPlugin('search', 'formExtraActions', arr);
                              }}
                              style={{ display: ['setValue', 'setAttribute', 'removeAttribute'].includes(act.action) ? 'block' : 'none' }}
                              className="w-32 bg-zinc-900 border border-zinc-800 rounded px-2 py-1.5 text-xs text-zinc-200 focus:border-indigo-500 outline-none font-mono"
                            />
                            <button
                              onClick={() => {
                                const arr = editingPlugin.search.formExtraActions!.filter((_, i) => i !== idx);
                                updateEditingPlugin('search', 'formExtraActions', arr);
                              }}
                              className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1.5">List Item Selector</label>
                    <input
                      type="text" value={editingPlugin.search.itemSel} placeholder=".result-item"
                      onChange={(e) => updateEditingPlugin('search', 'itemSel', e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1.5">Title Selector</label>
                    <input
                      type="text" value={editingPlugin.search.titleSel} placeholder=".title > a"
                      onChange={(e) => updateEditingPlugin('search', 'titleSel', e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1.5">Link Selector</label>
                    <input
                      type="text" value={editingPlugin.search.linkSel} placeholder="a.play-btn"
                      onChange={(e) => updateEditingPlugin('search', 'linkSel', e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1.5">Thumbnail Selector</label>
                    <input
                      type="text" value={editingPlugin.search.imgSel} placeholder="img.poster"
                      onChange={(e) => updateEditingPlugin('search', 'imgSel', e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1.5">Year Selector</label>
                    <input
                      type="text" value={editingPlugin.search.yearSel} placeholder=".year"
                      onChange={(e) => updateEditingPlugin('search', 'yearSel', e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1.5">Type Selector</label>
                    <input
                      type="text" value={editingPlugin.search.typeSel} placeholder=".type"
                      onChange={(e) => updateEditingPlugin('search', 'typeSel', e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 outline-none font-mono"
                    />
                  </div>
                </div>
                <div className="mt-6 pt-6 border-t border-zinc-800/50">
                  <h4 className="text-sm font-medium text-zinc-300 mb-3 flex items-center justify-between">
                    SmartFetch Selector Tester
                    {isTestingSearch && <RefreshCw size={14} className="text-indigo-400 animate-spin" />}
                  </h4>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={testSearchQuery}
                      onChange={(e) => setTestSearchQuery(e.target.value)}
                      placeholder="Enter a search query to test (e.g. matrix)"
                      className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 outline-none focus:border-indigo-500"
                    />
                    <button
                      onClick={async () => {
                        if (!testSearchQuery) return;
                        setIsTestingSearch(true);
                        try {
                          const isFormSearch = !!editingPlugin.search.isFormSearch;
                          const startUrl = isFormSearch 
                            ? editingPlugin.search.urlFormat 
                            : editingPlugin.search.urlFormat.replace('{query}', encodeURIComponent(testSearchQuery));
                            
                          if (!startUrl || !startUrl.startsWith('http')) {
                            setTestSearchResults({ status: 'error', nodesCount: 0, results: [{ error: 'Invalid URL Format configured.' }] });
                            setIsTestingSearch(false);
                            return;
                          }

                          const encodedExtras = JSON.stringify(editingPlugin.search.formExtraActions || []);

                          const jsQuery = `
                                      function extractValue(el, selector, defaultAttr) {
                                        if (!el) return '';
                                        if (!selector && !defaultAttr) return el.textContent ? el.textContent.trim() : '';
                                        if (!selector && defaultAttr) return el.getAttribute(defaultAttr) || '';
                                        if (selector.startsWith('()=>')) return eval(selector.slice(4))(el);
                                        let targetSel = selector;
                                        let attr = defaultAttr;
                                        if (selector.includes('@')) {
                                          const parts = selector.split('@');
                                          targetSel = parts[0];
                                          attr = parts[1];
                                        }
                                        const targetEl = targetSel ? (el.querySelector(targetSel) || el) : el;
                                        if (attr) { return targetEl.getAttribute(attr) || ''; }
                                        let text = targetEl.textContent ? targetEl.textContent.trim() : '';
                                        if (!text && targetEl.hasAttribute('alt')) text = targetEl.getAttribute('alt') || '';
                                        if (!text && targetEl.hasAttribute('title')) text = targetEl.getAttribute('title') || '';
                                        return text;
                                      }
                                      
                                      function scrapeItems() {
                                        const itemSelector = '${editingPlugin.search.itemSel ? editingPlugin.search.itemSel.replace(/'/g, "\\'") : 'body'}';
                                        const items = Array.from(document.querySelectorAll(itemSelector));
                                        const results = items.slice(0, 5).map(item => ({
                                          title: extractValue(item, '${editingPlugin.search.titleSel ? editingPlugin.search.titleSel.replace(/'/g, "\\'") : ''}', null),
                                          href: extractValue(item, '${editingPlugin.search.linkSel ? editingPlugin.search.linkSel.replace(/'/g, "\\'") : ''}', 'href'),
                                          htmlPreview: item.outerHTML.substring(0, 150) + '...'
                                        }));
                                        return { count: items.length, items: results };
                                      }
                                      
                                      function processExtras(actions) {
                                        actions.forEach(act => {
                                          const el = document.querySelector(act.selector);
                                          if (!el) return;
                                          if (act.action === 'setValue') {
                                             el.value = act.value;
                                             el.dispatchEvent(new Event('input', {bubbles: true}));
                                             el.dispatchEvent(new Event('change', {bubbles: true}));
                                          } else if (act.action === 'check') {
                                             el.checked = true;
                                             el.dispatchEvent(new Event('change', {bubbles: true}));
                                          } else if (act.action === 'uncheck') {
                                             el.checked = false;
                                             el.dispatchEvent(new Event('change', {bubbles: true}));
                                          } else if (act.action === 'click') {
                                             el.click();
                                          } else if (act.action === 'setAttribute') {
                                             const parts = act.value.split('=');
                                             el.setAttribute(parts[0], parts.slice(1).join('='));
                                          } else if (act.action === 'removeAttribute') {
                                             el.removeAttribute(act.value);
                                          }
                                        });
                                      }

                                      if (${isFormSearch}) {
                                        return new Promise((resolve) => {
                                          const isAjax = "${editingPlugin.search.searchWaitMode}" === "ajax";
                                          const query = "${testSearchQuery.replace(/"/g, '\\"')}";
                                          const extras = ${encodedExtras};
                                          
                                          if (sessionStorage.getItem('sv_test_phase')) {
                                            sessionStorage.removeItem('sv_test_phase');
                                            setTimeout(() => resolve(scrapeItems()), 1000);
                                            return;
                                          }
                                          
                                          const inputSel = "${(editingPlugin.search.formInputSel || '').replace(/"/g, '\\"')}";
                                          const submitSel = "${(editingPlugin.search.formSubmitSel || '').replace(/"/g, '\\"')}";
                                          
                                          console.log('[SmartFetch Debug] Form Search Start', { isAjax, inputSel, submitSel, query, extrasCount: extras.length });

                                          const input = inputSel ? document.querySelector(inputSel) : null;
                                          const submit = submitSel ? document.querySelector(submitSel) : null;
                                          console.log('[SmartFetch Debug] Found elements:', { input: !!input, submit: !!submit });
                                          
                                          if (input) {
                                            console.log('[SmartFetch Debug] Setting input value');
                                            input.value = query;
                                            input.dispatchEvent(new Event('input', {bubbles: true}));
                                            input.dispatchEvent(new Event('change', {bubbles: true}));
                                          } else if (inputSel) {
                                            console.warn('[SmartFetch Debug] Input selector was provided but element not found:', inputSel);
                                          }
                                          
                                          console.log('[SmartFetch Debug] Processing extra actions...');
                                          processExtras(extras);
                                          
                                          if (submit) {
                                            if (isAjax) {
                                              console.log('[SmartFetch Debug] AJAX Mode: Clicking submit and waiting ${editingPlugin.search.formSubmitDelay || 2000}ms');
                                              submit.click();
                                              setTimeout(() => {
                                                console.log('[SmartFetch Debug] AJAX Delay finished, scraping items...');
                                                resolve(scrapeItems());
                                              }, ${editingPlugin.search.formSubmitDelay || 2000});
                                            } else {
                                              console.log('[SmartFetch Debug] Navigation Mode: Setting session marker and clicking submit');
                                              sessionStorage.setItem('sv_test_phase', '1');
                                              submit.click();
                                              // Fallback: If navigation doesn't happen within 8 seconds, resolve to avoid hanging
                                              setTimeout(() => {
                                                console.log('[SmartFetch Debug] Navigation timeout (8s) hit! Resolving to prevent hang.');
                                                sessionStorage.removeItem('sv_test_phase');
                                                resolve({ count: 0, items: [{ error: 'Navigation timeout - page did not reload' }] });
                                              }, 8000);
                                            }
                                          } else {
                                            if (submitSel) console.warn('[SmartFetch Debug] Submit selector was provided but element not found:', submitSel);
                                            console.log('[SmartFetch Debug] No submit element, falling back to basic wait and scrape.');
                                            setTimeout(() => resolve(scrapeItems()), ${editingPlugin.search.formSubmitDelay || 2000});
                                          }
                                        });
                                      } else {
                                        return scrapeItems();
                                      }
                                    `;
                          const fetchResults: any = await window.SmartFetch(startUrl, jsQuery);
                          if (fetchResults) {
                            setTestSearchResults({
                              status: 'success',
                              nodesCount: fetchResults.count,
                              results: fetchResults.items
                            });
                          } else {
                            setTestSearchResults({ status: 'error', nodesCount: 0, results: [{ error: 'Fetch returned null/empty' }] });
                          }
                        } catch (e: any) {
                          setTestSearchResults({ status: 'error', nodesCount: 0, results: [{ error: e.message || 'Unknown error' }] });
                        }
                        setIsTestingSearch(false);
                      }}
                      className="px-4 py-2 bg-indigo-500/20 text-indigo-400 font-medium text-sm rounded-lg hover:bg-indigo-500/30 transition-colors whitespace-nowrap"
                    >
                      Test Fetch
                    </button>
                  </div>

                  {testSearchResults.status !== 'idle' && (
                    <div className="bg-zinc-950 rounded-lg border border-zinc-800/80 p-3 overflow-y-auto max-h-64 no-scrollbar">
                      <div className="text-xs font-mono text-zinc-400 mb-2 border-b border-zinc-800/50 pb-2 flex justify-between">
                        <span>Nodes Scraped By itemSel (<span className="text-white">{editingPlugin.search.itemSel || 'body'}</span>): <span className={testSearchResults.nodesCount > 0 ? "text-emerald-400" : "text-amber-400"}>{testSearchResults.nodesCount}</span></span>
                      </div>
                      <pre className="text-[10px] text-zinc-300 font-mono whitespace-pre-wrap break-all">
                        {JSON.stringify(testSearchResults.results, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Additional Searches */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-emerald-400 flex items-center gap-2 uppercase tracking-wider"><Search size={16} /> Additional Search Methods</h3>
                <button
                  onClick={() => {
                    const newId = Date.now().toString();
                    const newSearch = { 
                      id: newId, name: 'New Search', tags: [], urlFormat: '', itemSel: '', titleSel: '', linkSel: '', imgSel: '', yearSel: '', typeSel: '' 
                    };
                    updateEditingPlugin('root', 'additionalSearches', [...(editingPlugin.additionalSearches || []), newSearch]);
                  }}
                  className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded hover:bg-emerald-500/30 flex items-center gap-1"
                >
                  <Plus size={14} /> Add Search Method
                </button>
              </div>
              
              <div className="space-y-4">
                {(editingPlugin.additionalSearches || []).map((searchMethod, idx) => (
                  <div key={searchMethod.id} className="p-5 bg-zinc-900/30 border border-zinc-800/50 hover:border-emerald-500/30 transition-colors rounded-xl space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-zinc-500 mb-1.5">Method Name / Label</label>
                          <input
                            type="text" value={searchMethod.name} placeholder="e.g. Movies Search"
                            onChange={(e) => {
                              const arr = [...editingPlugin.additionalSearches!];
                              arr[idx].name = e.target.value;
                              updateEditingPlugin('root', 'additionalSearches', arr);
                            }}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-emerald-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-zinc-500 mb-1.5">Tags (Dashboard Filter)</label>
                          <TagsInput
                            tags={searchMethod.tags || []}
                            onChange={(newTags) => {
                              const arr = [...editingPlugin.additionalSearches!];
                              arr[idx].tags = newTags;
                              updateEditingPlugin('root', 'additionalSearches', arr);
                            }}
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-xs text-zinc-500 mb-1.5">Search URL Format (use {'{query}'})</label>
                          <input
                            type="text" value={searchMethod.urlFormat || ''} placeholder="https://site.com/search?type=movie&q={query}"
                            onChange={(e) => {
                              const arr = [...editingPlugin.additionalSearches!];
                              arr[idx].urlFormat = e.target.value;
                              updateEditingPlugin('root', 'additionalSearches', arr);
                            }}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-emerald-500 outline-none font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-zinc-500 mb-1.5">Item Selector</label>
                          <input
                            type="text" value={searchMethod.itemSel || ''} placeholder=".result-item"
                            onChange={(e) => {
                              const arr = [...editingPlugin.additionalSearches!];
                              arr[idx].itemSel = e.target.value;
                              updateEditingPlugin('root', 'additionalSearches', arr);
                            }}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-emerald-500 outline-none font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-zinc-500 mb-1.5">Title Selector</label>
                          <input
                            type="text" value={searchMethod.titleSel || ''} placeholder=".title"
                            onChange={(e) => {
                              const arr = [...editingPlugin.additionalSearches!];
                              arr[idx].titleSel = e.target.value;
                              updateEditingPlugin('root', 'additionalSearches', arr);
                            }}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-emerald-500 outline-none font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-zinc-500 mb-1.5">Link Selector</label>
                          <input
                            type="text" value={searchMethod.linkSel || ''} placeholder="a.play"
                            onChange={(e) => {
                              const arr = [...editingPlugin.additionalSearches!];
                              arr[idx].linkSel = e.target.value;
                              updateEditingPlugin('root', 'additionalSearches', arr);
                            }}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-emerald-500 outline-none font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-zinc-500 mb-1.5">Image Selector</label>
                          <input
                            type="text" value={searchMethod.imgSel || ''} placeholder="img"
                            onChange={(e) => {
                              const arr = [...editingPlugin.additionalSearches!];
                              arr[idx].imgSel = e.target.value;
                              updateEditingPlugin('root', 'additionalSearches', arr);
                            }}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-emerald-500 outline-none font-mono"
                          />
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          const arr = editingPlugin.additionalSearches!.filter((_, i) => i !== idx);
                          updateEditingPlugin('root', 'additionalSearches', arr);
                        }}
                        className="ml-4 p-2 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors shrink-0"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
                
                {(!editingPlugin.additionalSearches || editingPlugin.additionalSearches.length === 0) && (
                  <div className="text-center p-8 border border-dashed border-zinc-800 rounded-xl text-zinc-500 text-sm">
                    No additional search methods defined.
                  </div>
                )}
              </div>
            </div>

            {/* Details Parsing */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-indigo-400 flex items-center gap-2 uppercase tracking-wider"><ListTree size={16} /> Details Parsing</h3>
              <div className="p-5 bg-zinc-900/30 border border-zinc-800/50 rounded-xl grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-zinc-500 mb-1.5">Title Selector</label>
                  <input
                    type="text" value={editingPlugin.details.titleSel} placeholder="h1.title"
                    onChange={(e) => updateEditingPlugin('details', 'titleSel', e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1.5">Description Selector</label>
                  <input
                    type="text" value={editingPlugin.details.descSel} placeholder=".description"
                    onChange={(e) => updateEditingPlugin('details', 'descSel', e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1.5">Cast Selector</label>
                  <input
                    type="text" value={editingPlugin.details.castSel} placeholder=".cast-list > li"
                    onChange={(e) => updateEditingPlugin('details', 'castSel', e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1.5">Rating Selector</label>
                  <input
                    type="text" value={editingPlugin.details.ratingSel} placeholder=".rating"
                    onChange={(e) => updateEditingPlugin('details', 'ratingSel', e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1.5">Poster Selector</label>
                  <input
                    type="text" value={editingPlugin.details.posterSel} placeholder="img.main-poster"
                    onChange={(e) => updateEditingPlugin('details', 'posterSel', e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1.5">Similar Shows Selector</label>
                  <input
                    type="text" value={editingPlugin.details.similarSel} placeholder=".similar-items > a"
                    onChange={(e) => updateEditingPlugin('details', 'similarSel', e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 outline-none font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Media Parsing */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-indigo-400 flex items-center gap-2 uppercase tracking-wider"><ListTree size={16} /> Media Structure</h3>
              <div className="p-5 bg-zinc-900/30 border border-zinc-800/50 rounded-xl grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-zinc-500 mb-1.5">Season Selector</label>
                  <input
                    type="text" value={editingPlugin.media.seasonSel} placeholder=".season-list > li"
                    onChange={(e) => updateEditingPlugin('media', 'seasonSel', e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1.5">Episode Selector</label>
                  <input
                    type="text" value={editingPlugin.media.epSel} placeholder=".episodes > a"
                    onChange={(e) => updateEditingPlugin('media', 'epSel', e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 outline-none font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Player & Styling */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-indigo-400 flex items-center gap-2 uppercase tracking-wider"><MonitorPlay size={16} /> Player & Focus</h3>
              <div className="p-5 bg-zinc-900/30 border border-zinc-800/50 rounded-xl space-y-4">
                <div>
                  <label className="block text-xs text-zinc-500 mb-1.5">Player Element Selector</label>
                  <input
                    type="text" value={editingPlugin.player.playerSel} placeholder="video#main-player, iframe.video-frame"
                    onChange={(e) => updateEditingPlugin('player', 'playerSel', e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1.5">Custom Focus CSS (Injected on load)</label>
                  <textarea
                    value={editingPlugin.player.focusCss}
                    onChange={(e) => updateEditingPlugin('player', 'focusCss', e.target.value)}
                    rows={4}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 outline-none font-mono resize-none"
                  />
                  <p className="text-xs text-zinc-600 mt-2">
                    Use this CSS to force the player to fill the screen and hide site navigation.
                  </p>
                </div>
              </div>
            </div>

            {/* Custom Functions */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-indigo-400 flex items-center gap-2 uppercase tracking-wider"><Code size={16} /> Custom Functions</h3>
                <button
                  onClick={() => {
                    const newFuncs = [...(editingPlugin.customFunctions || []), { name: 'newFunction', description: '', code: 'function newFunction(html) {\n  return null;\n}' }];
                    setEditingPlugin({ ...editingPlugin, customFunctions: newFuncs });
                  }}
                  className="text-xs bg-indigo-500/20 text-indigo-400 px-2 py-1 rounded hover:bg-indigo-500/30 flex items-center gap-1"
                >
                  <Plus size={14} /> Add Function
                </button>
              </div>
              <div className="space-y-4">
                {(editingPlugin.customFunctions || []).map((func, idx) => (
                  <div key={idx} className="p-5 bg-zinc-900/30 border border-zinc-800/50 rounded-xl space-y-4">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1 space-y-4">
                        <div>
                          <label className="block text-xs text-zinc-500 mb-1.5">Function Name</label>
                          <input
                            type="text" value={func.name} placeholder="e.g. fetchCastDetails"
                            onChange={(e) => {
                              const newFuncs = [...editingPlugin.customFunctions];
                              newFuncs[idx].name = e.target.value;
                              setEditingPlugin({ ...editingPlugin, customFunctions: newFuncs });
                            }}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 outline-none font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-zinc-500 mb-1.5">Description</label>
                          <input
                            type="text" value={func.description} placeholder="What does this do?"
                            onChange={(e) => {
                              const newFuncs = [...editingPlugin.customFunctions];
                              newFuncs[idx].description = e.target.value;
                              setEditingPlugin({ ...editingPlugin, customFunctions: newFuncs });
                            }}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 outline-none"
                          />
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          const newFuncs = editingPlugin.customFunctions.filter((_, i) => i !== idx);
                          setEditingPlugin({ ...editingPlugin, customFunctions: newFuncs });
                        }}
                        className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-500 mb-1.5">JavaScript Code</label>
                      <textarea
                        value={func.code}
                        onChange={(e) => {
                          const newFuncs = [...editingPlugin.customFunctions];
                          newFuncs[idx].code = e.target.value;
                          setEditingPlugin({ ...editingPlugin, customFunctions: newFuncs });
                        }}
                        rows={6}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:border-indigo-500 outline-none font-mono resize-y"
                      />
                    </div>
                  </div>
                ))}
                {(!editingPlugin.customFunctions || editingPlugin.customFunctions.length === 0) && (
                  <div className="text-center p-8 border border-dashed border-zinc-800 rounded-xl text-zinc-500 text-sm">
                    No custom functions defined.
                  </div>
                )}
              </div>
            </div>

          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-zinc-500">
            <Puzzle size={48} className="mb-4 opacity-20" />
            <p>Select a plugin to edit or create a new one.</p>
          </div>
        )}
      </div>
    </div>

  );
};
