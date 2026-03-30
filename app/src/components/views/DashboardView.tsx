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

export const DashboardView = () => {
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
    
              <div className="w-full h-full bg-zinc-950 flex flex-col items-center justify-center p-8 overflow-y-auto no-scrollbar">
                <div className="flex items-center gap-3 mb-8">
                  <Film size={48} className="text-indigo-500" />
                  <h1 className="text-5xl font-light tracking-tight text-zinc-100">StreamView</h1>
                </div>

                <div className="w-full max-w-2xl relative mb-8 flex flex-col gap-3">
                  <div className="relative w-full">
                    <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input
                      type="text"
                      value={multiSearchQuery}
                      onChange={(e) => setMultiSearchQuery(e.target.value)}
                      placeholder="Search across all plugins or enter URL..."
                      className="w-full bg-zinc-900/80 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-lg text-zinc-200 focus:border-indigo-500 focus:bg-zinc-900 outline-none transition-all shadow-xl"
                      onKeyDown={async (e) => {
                        if (e.key === 'Enter' && multiSearchQuery) {
                          setIsSearching(true);
                          setSearchResults([]);

                          if (searchParamMode === 'navigate') {
                            const navResults = plugins.map(p => ({
                              id: p.id,
                              title: `Search ${p.name}`,
                              url: p.search?.urlFormat ? p.search.urlFormat.replace('{query}', encodeURIComponent(multiSearchQuery)) : p.baseUrl,
                              pluginName: p.name,
                              type: 'search'
                            }));

                            let dest = multiSearchQuery;
                            if (!dest.startsWith('http')) {
                              dest = dest.includes('.') && !dest.includes(' ') ? `https://${dest}` : `https://duckduckgo.com/?q=${encodeURIComponent(dest)}`;
                            }
                            navResults.unshift({
                              id: 'direct-nav',
                              title: `Navigate to ${multiSearchQuery}`,
                              url: dest,
                              pluginName: 'Browser URL',
                              type: 'search'
                            });

                            setSearchResults(navResults);
                            setIsSearching(false);
                            return;
                          }

                          // Multi-search Logic (Fetch mode)
                          const results: any[] = [];
                          for (const plugin of plugins) {
                            if (plugin.search.urlFormat) {
                              console.log(`[Search] Starting fetch for ${plugin.name}...`);
                              const searchUrl = plugin.search.urlFormat.replace('{query}', encodeURIComponent(multiSearchQuery));
                              try {
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
                                    if (attr) {
                                      return targetEl.getAttribute(attr) || '';
                                    }
                                    
                                    let text = targetEl.textContent ? targetEl.textContent.trim() : '';
                                    if (!text && targetEl.hasAttribute('alt')) text = targetEl.getAttribute('alt') || '';
                                    if (!text && targetEl.hasAttribute('title')) text = targetEl.getAttribute('title') || '';
                                    return text;
                                  }
                                  
                                  const itemSelector = '${plugin.search.itemSel ? plugin.search.itemSel.replace(/'/g, "\\'") : 'body'}';
                                  const items = Array.from(document.querySelectorAll(itemSelector));
                                  return items.slice(0, 10).map(item => {
                                    let titleStr = extractValue(item, '${plugin.search.titleSel ? plugin.search.titleSel.replace(/'/g, "\\'") : ''}', null);
                                    let linkStr = extractValue(item, '${plugin.search.linkSel ? plugin.search.linkSel.replace(/'/g, "\\'") : ''}', 'href');
                                    
                                    if (linkStr && !linkStr.startsWith('http')) {
                                      try { linkStr = new URL(linkStr, '${plugin.baseUrl}').href; } catch(e) {}
                                    }
                                    return { title: titleStr, href: linkStr };
                                  });
                                `;

                                const fetchResults: any = await window.SmartFetch(searchUrl, jsQuery);
                                console.log(`[Search] ${plugin.name} returned from SmartFetch:`, fetchResults);

                                if (Array.isArray(fetchResults) && fetchResults.length > 0) {
                                  let validCount = 0;
                                  fetchResults.forEach((res: any, i: number) => {
                                    if (res.title && res.href) {
                                      validCount++;
                                      results.push({
                                        id: plugin.id + '_' + i,
                                        title: res.title,
                                        url: res.href,
                                        pluginName: plugin.name,
                                        type: 'result'
                                      });
                                    }
                                  });
                                  if (validCount === 0) {
                                    console.log(`[Search] ${plugin.name} found 0 valid results.`);
                                    results.push({
                                      id: plugin.id + '_empty',
                                      title: 'No matches found',
                                      url: searchUrl,
                                      pluginName: plugin.name,
                                      type: 'empty'
                                    });
                                  }
                                } else {
                                  console.log(`[Search] ${plugin.name} found 0 results.`);
                                  results.push({
                                    id: plugin.id + '_empty',
                                    title: 'No matches found',
                                    url: searchUrl,
                                    pluginName: plugin.name,
                                    type: 'empty'
                                  });
                                }
                              } catch (e) {
                                console.error(`[Search] Error evaluating ${plugin.name} SmartFetch:`, e);
                                results.push({ id: plugin.id + '_error', title: 'Error executing script', url: searchUrl, pluginName: plugin.name, type: 'empty' });
                              }
                            }
                          }
                          console.log(`[Search] Completed multi-search. Generated ${results.length} total card blocks.`);
                          setSearchResults(results);
                          setIsSearching(false);
                        }
                      }}
                    />
                    {isSearching && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <RefreshCw size={18} className="text-indigo-500 animate-spin" />
                      </div>
                    )}
                  </div>

                  {/* Mode Toggle */}
                  <div className="flex justify-center mt-2">
                    <div className="inline-flex bg-zinc-900/50 p-1 rounded-xl border border-zinc-800/50">
                      <button
                        onClick={() => setSearchParamMode('navigate')}
                        className={`text-xs font-medium px-4 py-1.5 rounded-lg transition-colors ${searchParamMode === 'navigate' ? 'bg-indigo-500/20 text-indigo-400' : 'text-zinc-500 hover:text-zinc-300'}`}
                      >
                        Web Navigate
                      </button>
                      <button
                        onClick={() => setSearchParamMode('fetch')}
                        className={`text-xs font-medium px-4 py-1.5 rounded-lg transition-colors ${searchParamMode === 'fetch' ? 'bg-indigo-500/20 text-indigo-400' : 'text-zinc-500 hover:text-zinc-300'}`}
                      >
                        Deep Fetch HTML
                      </button>
                    </div>
                  </div>
                </div>

                {/* Tags / Custom Search Lists */}
                <div className="w-full">
                  {searchResults.length === 0 && (
                    <div className="w-full max-w-5xl mx-auto space-y-12 pb-20 mt-8">
                      {/* Unique Tags Renderer */}
                      {Array.from(new Set(plugins.flatMap(p => p.tags || []))).sort().map(tag => {
                        const matchedPlugins = plugins.filter(p => p.tags?.includes(tag));
                        if (matchedPlugins.length === 0) return null;
                        return (
                          <div key={tag} className="space-y-4">
                            <h3 className="text-sm font-medium text-emerald-400 uppercase tracking-widest pl-2 flex items-center gap-2">
                              <Puzzle size={14} className="opacity-70" /> {tag}
                            </h3>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                              {matchedPlugins.map(p => (
                                <div
                                  key={p.id}
                                  onClick={() => {
                                    setUrl(p.baseUrl);
                                    setInputUrl(p.baseUrl);
                                    setActiveTab('player');
                                  }}
                                  className="group relative bg-zinc-900/40 hover:bg-zinc-900/80 border border-zinc-800/60 hover:border-emerald-500/30 rounded-2xl p-4 cursor-pointer transition-all duration-300 flex items-center gap-4 overflow-hidden"
                                >
                                  <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-500 group-hover:text-emerald-400 group-hover:bg-emerald-500/10 transition-colors flex-shrink-0">
                                    <Globe size={18} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-medium text-zinc-200 truncate group-hover:text-emerald-300 transition-colors">{p.name}</h4>
                                    <p className="text-xs text-zinc-600 truncate mt-0.5">{p.baseUrl.replace('https://', '').replace(/\/$/, '')}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      })}

                      {/* Uncategorized Plugins */}
                      {plugins.filter(p => !p.tags || p.tags.length === 0).length > 0 && (
                        <div className="space-y-4">
                          <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-widest pl-2">Uncategorized Sites</h3>
                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {plugins.filter(p => !p.tags || p.tags.length === 0).map(p => (
                              <div
                                key={p.id}
                                onClick={() => {
                                  setUrl(p.baseUrl);
                                  setInputUrl(p.baseUrl);
                                  setActiveTab('player');
                                }}
                                className="group bg-zinc-900/40 hover:bg-zinc-900/80 border border-zinc-800/60 hover:border-zinc-700 rounded-2xl p-4 cursor-pointer transition-all duration-300 flex items-center gap-4"
                              >
                                <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-500 transition-colors flex-shrink-0">
                                  <Globe size={18} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-sm font-medium text-zinc-300 truncate">{p.name}</h4>
                                  <p className="text-xs text-zinc-600 truncate mt-0.5">{p.baseUrl.replace('https://', '').replace(/\/$/, '')}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="w-full max-w-5xl space-y-6">
                    <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-4">Search Results</h3>

                    {searchParamMode === 'navigate' ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {searchResults.map((result) => (
                          <div
                            key={result.id}
                            onClick={() => {
                              setUrl(result.url);
                              setInputUrl(result.url);
                              setActiveTab('player');
                            }}
                            className="p-4 bg-zinc-900/50 border border-zinc-800/50 hover:border-indigo-500/30 hover:bg-zinc-900 rounded-xl cursor-pointer transition-all flex items-center gap-4 group"
                          >
                            <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-500 group-hover:text-indigo-400 group-hover:bg-indigo-500/10 transition-colors">
                              <Search size={18} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium text-zinc-200 truncate">{result.title}</h4>
                              <p className="text-xs text-zinc-500 truncate mt-1">{result.pluginName}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {Array.from(new Set(searchResults.map(r => r.pluginName))).map(pName => {
                          const grouping = searchResults.filter(r => r.pluginName === pName);
                          return (
                            <div key={pName} className="bg-zinc-900/40 border border-zinc-800/60 rounded-xl p-5">
                              <h4 className="text-sm font-medium text-indigo-400 mb-4 flex items-center gap-2">
                                <Puzzle size={16} /> {pName}
                                <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full ml-auto">{grouping.length} Items</span>
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                                {grouping.map(result => (
                                  <div
                                    key={result.id}
                                    onClick={() => {
                                      setUrl(result.url);
                                      setInputUrl(result.url);
                                      setActiveTab('player');
                                    }}
                                    className={`p-3 bg-zinc-950/50 border border-zinc-800/80 hover:border-indigo-500/40 rounded-xl cursor-pointer transition-all flex items-start gap-4 ${result.type === 'empty' ? 'opacity-50 hover:opacity-100' : ''}`}
                                  >
                                    <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0 text-zinc-500 mt-0.5">
                                      {result.type === 'empty' ? <Minus size={16} /> : <Film size={16} />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <h5 className="text-sm font-medium text-zinc-200 line-clamp-2 leading-tight">{result.title}</h5>
                                      {result.type !== 'empty' && <p className="text-[10px] text-zinc-500 truncate mt-1.5">{result.url}</p>}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            
  );
};
