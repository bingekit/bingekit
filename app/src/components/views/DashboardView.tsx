import React, { useState } from 'react';
import { Search, Bookmark, Settings, Minus, Square, X, ChevronLeft, ChevronRight, RotateCw, Film, Tv, Play, LayoutGrid, Shield, ShieldOff, Plus, Puzzle, Save, Trash2, Download, Upload, KeyRound, Code, ListTree, MonitorPlay, Activity, RefreshCw, Bell, Compass, Zap, Clock, Folder, Lock, EyeOff, Eye, Globe } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { resolvePluginUrl } from '../../lib/urlHelper';
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
    showCredModal, setShowCredModal, searchParamMode, setSearchParamMode, isQuickOptionsHidden, setIsQuickOptionsHidden, defaultSearchEngine,
    playerRef, savePlugin, deletePlugin, updateEditingPlugin, fetchTitleForUrl, runFlow, checkForUpdates, handleNavigate, loadPlugins
  } = useAppContext();

  const [activeSearchTags, setActiveSearchTags] = useState<string[]>([]);
  const [isDeepSearch, setIsDeepSearch] = useState(false);
  const allSearchTags = Array.from(new Set(plugins.filter(p => p.enabled !== false).flatMap(p => {
    const defaultTag = p.tags || [];
    const addlTags = (p.additionalSearches || []).flatMap(s => s.tags || []);
    return [...defaultTag, ...addlTags];
  }))).sort();

  return (

    <div className="w-full h-full bg-zinc-950 flex flex-col items-center px-8 pt-[15vh] pb-24 overflow-y-auto custom-scrollbar">
      <div className="flex items-center gap-3 mb-8 shrink-0">
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
              if (e.key === 'Enter') {
                if (!multiSearchQuery.trim()) {
                  setSearchResults([]);
                  setIsSearching(false);
                  return;
                }

                setIsSearching(true);
                setSearchResults([]);

                const enabledPlugins = plugins.filter(p => p.enabled !== false);

                if (searchParamMode === 'navigate') {
                  const navResults = enabledPlugins.map(p => ({
                    id: p.id,
                    title: `Search ${p.name}`,
                    url: p.search?.urlFormat ? resolvePluginUrl(p.baseUrl, p.search.urlFormat).replace('{query}', encodeURIComponent(multiSearchQuery)) : p.baseUrl,
                    pluginName: p.name,
                    type: 'search'
                  }));

                  let dest = multiSearchQuery;
                  if (!dest.startsWith('http')) {
                    dest = dest.includes('.') && !dest.includes(' ') ? `https://${dest}` : `${defaultSearchEngine}${encodeURIComponent(dest)}`;
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
                let baseQuery = multiSearchQuery;
                let queryTargetSeason = '';
                let queryTargetEpisode = '';
                let querySubtitle = '';
                
                const metaMatch = multiSearchQuery.match(/(.*?)(?:\s*-\s*|\s+)s(\d{1,2})(?:e(\d{1,2}))?(?:\s|$)/i);
                if (metaMatch) {
                  baseQuery = metaMatch[1].trim() || metaMatch[0];
                  queryTargetSeason = metaMatch[2];
                  queryTargetEpisode = metaMatch[3] || '';
                } else {
                  const dashMatch = multiSearchQuery.match(/(.*?)\s*-\s*(.*)/);
                  if (dashMatch) {
                    baseQuery = dashMatch[1].trim();
                    querySubtitle = dashMatch[2].trim();
                  }
                }

                const results: any[] = [];

                // Build search operations based on selected tags
                const searchOperations: { plugin: SitePlugin, name: string, cfg: any }[] = [];

                for (const plugin of enabledPlugins) {
                  if (activeSearchTags.length === 0) {
                    if (plugin.search?.urlFormat) {
                      searchOperations.push({ plugin, name: plugin.name, cfg: plugin.search });
                    }
                  } else {
                    // Check base plugin properties against active tags
                    const pluginTags = plugin.tags || [];
                    if (activeSearchTags.some(t => pluginTags.includes(t)) && plugin.search?.urlFormat) {
                      searchOperations.push({ plugin, name: plugin.name, cfg: plugin.search });
                    }

                    // Check additional searches
                    if (plugin.additionalSearches) {
                      for (const addl of plugin.additionalSearches) {
                        const addlTags = addl.tags || [];
                        if (activeSearchTags.some(t => addlTags.includes(t)) && addl.urlFormat) {
                          searchOperations.push({ plugin, name: `${plugin.name} (${addl.name})`, cfg: addl });
                        }
                      }
                    }
                  }
                }

                for (const op of searchOperations) {
                  const { plugin, name: opName, cfg } = op;
                  if (cfg.delegateFlowId) {
                    console.log(`[Search] Delegating fetch for ${opName} to custom flow...`);
                    const tFlow = flows.find(f => f.id === cfg.delegateFlowId);
                    if (tFlow) {
                      try {
                        const flowRes = await runFlow(tFlow, multiSearchQuery, cfg.delegateFlowInputs || {});
                        let parsed: any[] = [];
                        if (typeof flowRes === 'string') {
                          try { parsed = JSON.parse(flowRes); } catch (e) { }
                        } else if (Array.isArray(flowRes)) {
                          parsed = flowRes;
                        }
                        parsed.forEach((item: any) => {
                          if (!item.title) return;
                          results.push({
                            id: `${plugin.id}-${Date.now()}-${Math.random()}`,
                            title: item.title,
                            url: item.href || item.url,
                            pluginName: opName,
                            type: 'search'
                          });
                        });
                      } catch (e) {
                        console.error('Flow delegation error:', e);
                      }
                    }
                  } else if (cfg.urlFormat) {
                    console.log(`[Search] Starting fetch for ${opName}...`);
                    const resolvedFormat = resolvePluginUrl(plugin.baseUrl, cfg.urlFormat);
                    const searchUrl = resolvedFormat.replace('{query}', encodeURIComponent(baseQuery));
                    try {
                      const isFormSearch = !!cfg.isFormSearch;
                      const encodedExtras = JSON.stringify(cfg.formExtraActions || []);

                      const pluginConfigString = JSON.stringify({
                        itemSel: cfg.itemSel || '',
                        titleSel: cfg.titleSel || '',
                        linkSel: cfg.linkSel || ''
                      });

                      const jsQuery = `
                                  if (!Document.prototype.$) Document.prototype.$ = function(s) { return Array.from(this.querySelectorAll(s)); };
                                  if (!Document.prototype.$$) Document.prototype.$$ = function(s) { return this.querySelector(s); };
                                  if (!Element.prototype.$) Element.prototype.$ = function(s) { return Array.from(this.querySelectorAll(s)); };
                                  if (!Element.prototype.$$) Element.prototype.$$ = function(s) { return this.querySelector(s); };
                                  
                                  const pluginConfig = ${pluginConfigString};
                                  function extractValue(el, selector, defaultAttr) {
                                    if (!el) return '';
                                    if (!selector && !defaultAttr) {
                                      if (typeof el === 'object' && !el.nodeType) return el.title || el.href || el.text || '';
                                      return el.textContent ? el.textContent.trim() : '';
                                    }
                                    
                                    if (selector.startsWith('js:')) {
                                      let code = selector.slice(3).trim();
                                      if (!/\breturn\b/.test(code)) code = 'return (' + code + ');';
                                      try { return new Function('el', code)(el); } catch(e) { return ''; }
                                    }
                                    if (selector.startsWith('()=>')) {
                                      try { return eval(selector.slice(4))(el); } catch(e) { return ''; }
                                    }
                                    
                                    if (typeof el === 'object' && !el.nodeType) {
                                      let key = selector || defaultAttr;
                                      return key ? (el[key] || '') : (el.title || el.href || el.text || '');
                                    }
                                    
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
                                  
                                  function scrapeItems() {
                                    let items = [];
                                    const itemSel = pluginConfig.itemSel;
                                    if (itemSel.startsWith('js:')) {
                                      let code = itemSel.slice(3).trim();
                                      if (!/\breturn\b/.test(code)) code = 'return (' + code + ');';
                                      try { items = new Function(code)() || []; } catch(e) {}
                                    } else if (itemSel.startsWith('()=>')) {
                                      try { items = eval(itemSel.slice(4))() || []; } catch(e) {}
                                    } else {
                                      items = Array.from(document.querySelectorAll(itemSel || 'body'));
                                    }
                                    
                                    return items.slice(0, 10).map(item => {
                                      let titleStr = extractValue(item, pluginConfig.titleSel, null);
                                      let linkStr = extractValue(item, pluginConfig.linkSel, 'href');
                                      
                                      if (linkStr && !linkStr.startsWith('http')) {
                                        try { linkStr = new URL(linkStr, '${plugin.baseUrl}').href; } catch(e) {}
                                      }
                                      return { title: titleStr, href: linkStr };
                                    });
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
                                      const isAjax = "${cfg.searchWaitMode}" === "ajax";
                                      const query = "${baseQuery.replace(/"/g, '\\"')}";
                                      const extras = ${encodedExtras};
                                      
                                      if (sessionStorage.getItem('sv_search_phase')) {
                                        sessionStorage.removeItem('sv_search_phase');
                                        setTimeout(() => resolve(scrapeItems()), 1000);
                                        return;
                                      }
                                      
                                      const inputSel = "${(cfg.formInputSel || '').replace(/"/g, '\\"')}";
                                      const submitSel = "${(cfg.formSubmitSel || '').replace(/"/g, '\\"')}";
                                      
                                      console.log('[SmartFetch Debug] Form Search Start (Dashboard)', { isAjax, inputSel, submitSel, query, extrasCount: extras.length });

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
                                          console.log('[SmartFetch Debug] AJAX Mode: Clicking submit and waiting ${cfg.formSubmitDelay || 2000}ms');
                                          submit.click();
                                          setTimeout(() => {
                                            console.log('[SmartFetch Debug] AJAX Delay finished, scraping items...');
                                            resolve(scrapeItems());
                                          }, ${cfg.formSubmitDelay || 2000});
                                        } else {
                                          console.log('[SmartFetch Debug] Navigation Mode: Setting session marker and clicking submit');
                                          sessionStorage.setItem('sv_search_phase', '1');
                                          submit.click();
                                          // Fallback: If navigation doesn't happen within 8 seconds, resolve to avoid hanging
                                          setTimeout(() => {
                                            console.log('[SmartFetch Debug] Navigation timeout (8s) hit! Resolving empty to prevent hang.');
                                            sessionStorage.removeItem('sv_search_phase');
                                            resolve([]);
                                          }, 8000);
                                        }
                                      } else {
                                        if (submitSel) console.warn('[SmartFetch Debug] Submit selector was provided but element not found:', submitSel);
                                        console.log('[SmartFetch Debug] No submit element, falling back to basic wait and resolve.');
                                        setTimeout(() => resolve(scrapeItems()), ${cfg.formSubmitDelay || 2000});
                                      }
                                    });
                                  } else {
                                    return scrapeItems();
                                  }
                                `;

                      const fetchResults: any = await window.SmartFetch(searchUrl, jsQuery);
                      console.log(`[Search] ${opName} returned from SmartFetch:`, fetchResults);

                      if (Array.isArray(fetchResults) && fetchResults.length > 0) {
                        const validResults = fetchResults.filter(r => r.title && r.href);
                        const totalValidCount = validResults.length;
                        
                        for (let i = 0; i < validResults.length; i++) {
                          const res = validResults[i];
                          const cleanStr = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
                          const isExactMatch = cleanStr(res.title) === cleanStr(baseQuery) || cleanStr(res.title) === cleanStr(multiSearchQuery);
                          let matchedDeep = false;

                          if (isDeepSearch && (isExactMatch || totalValidCount === 1)) {
                            console.log(`[Search] Deep Scan match found for ${res.title}. Executing target script!`);

                            const epSelEscaped = (plugin.media?.epSel || '').replace(/'/g, "\\'");
                            const seasonSelEscaped = (plugin.media?.seasonSel || '').replace(/'/g, "\\'");
                            const customJs = plugin.media?.deepJs || '';

                            let deepJsQuery = '';
                            if (customJs) {
                                deepJsQuery = `
                                   window.SV_TARGET_SEASON = ${JSON.stringify(queryTargetSeason)};
                                   window.SV_TARGET_EPISODE = ${JSON.stringify(queryTargetEpisode)};
                                   window.SV_TARGET_SUBTITLE = ${JSON.stringify(querySubtitle)};
                                   window.SV_BASE_QUERY = ${JSON.stringify(baseQuery)};
                                   return new Promise(async (resolve) => {
                                     try {
                                       const res = await (async () => {
                                         ${customJs}
                                       })();
                                       resolve(res);
                                     } catch (e) {
                                       resolve([]);
                                     }
                                   });
                                 `;
                              } else {
                                const tvConfigString = JSON.stringify({
                                  epSel: plugin.media.epSel || '',
                                  seasonSel: plugin.media.seasonSel || ''
                                });

                                deepJsQuery = `
                                   window.SV_TARGET_SEASON = ${JSON.stringify(queryTargetSeason)};
                                   window.SV_TARGET_EPISODE = ${JSON.stringify(queryTargetEpisode)};
                                   window.SV_TARGET_SUBTITLE = ${JSON.stringify(querySubtitle)};
                                   window.SV_BASE_QUERY = ${JSON.stringify(baseQuery)};
                                   
                                   if (!Document.prototype.$) Document.prototype.$ = function(s) { return Array.from(this.querySelectorAll(s)); };
                                   if (!Document.prototype.$$) Document.prototype.$$ = function(s) { return this.querySelector(s); };
                                   if (!Element.prototype.$) Element.prototype.$ = function(s) { return Array.from(this.querySelectorAll(s)); };
                                   if (!Element.prototype.$$) Element.prototype.$$ = function(s) { return this.querySelector(s); };
                                   
                                   const tvConfig = ${tvConfigString};
                                   function getNodes(sel) {
                                     if (!sel) return [];
                                     if (sel.startsWith('js:')) {
                                        let code = sel.slice(3).trim();
                                        if (!/\breturn\b/.test(code)) code = 'return (' + code + ');';
                                        try { return new Function(code)() || []; } catch(e) { console.error('js: error', e); return []; }
                                     }
                                     if (sel.startsWith('()=>')) {
                                        try { return eval(sel.slice(4))() || []; } catch(e) { return []; }
                                     }
                                     return Array.from(document.querySelectorAll(sel));
                                   }
                                   function getEps() {
                                     let items = [];
                                     let nodes = getNodes(tvConfig.epSel);
                                     if (nodes.length === 0) nodes = getNodes(tvConfig.seasonSel);
                                     
                                     nodes.forEach(el => {
                                       if (typeof el === 'object' && !el.nodeType) {
                                          if (el.href && el.title) items.push(el);
                                          return;
                                       }
                                       let text = el.textContent ? el.textContent.trim() : '';
                                       if (!text) text = el.getAttribute('title') || el.getAttribute('alt') || 'Episode';
                                       let href = el.getAttribute('href') || '';
                                       if (href && !href.startsWith('http')) {
                                         try { href = new URL(href, '${res.href}').href; } catch(e) {}
                                       }
                                       if (href && text) items.push({ title: text, href });
                                     });
                                     return items;
                                   }
                                   return new Promise((resolve) => {
                                     if (document.readyState === 'complete') {
                                        resolve(getEps());
                                     } else {
                                        window.addEventListener('load', () => resolve(getEps()));
                                        setTimeout(() => resolve(getEps()), 3000);
                                     }
                                   });
                                 `;
                              }

                              try {
                                const deepResults: any = await window.SmartFetch(res.href, deepJsQuery);
                                if (Array.isArray(deepResults) && deepResults.length > 0) {
                                  matchedDeep = true;
                                  results.length = 0; // Clear other concurrent results

                                  results.push({
                                    id: plugin.id + '_parent_' + Math.random().toString(36).substring(7),
                                    title: res.title,
                                    url: res.href,
                                    pluginName: opName,
                                    type: 'result'
                                  });
                                  deepResults.forEach((dep: any) => {
                                    results.push({
                                      id: plugin.id + '_deep_' + Math.random().toString(36).substring(7),
                                      title: '↳ ' + dep.title,
                                      url: dep.href,
                                      pluginName: opName,
                                      type: 'result'
                                    });
                                  });

                                  setSearchResults(results);
                                  setIsSearching(false);
                                  return; // Break out immediately!
                                }
                              } catch (e) {
                                console.error('[Search] Deep Search failed', e);
                              }
                            }

                            if (!matchedDeep) {
                              results.push({
                                id: plugin.id + '_' + Math.random().toString(36).substring(7),
                                title: res.title,
                                url: res.href,
                                pluginName: opName,
                                type: 'result'
                              });
                            }
                        }
                        if (totalValidCount === 0) {
                          console.log(`[Search] ${opName} found 0 valid results.`);
                          results.push({
                            id: plugin.id + '_empty_' + Math.random().toString(36).substring(7),
                            title: 'No matches found',
                            url: searchUrl,
                            pluginName: opName,
                            type: 'empty'
                          });
                        }
                      } else {
                        console.log(`[Search] ${opName} found 0 results.`);
                        results.push({
                          id: plugin.id + '_empty_' + Math.random().toString(36).substring(7),
                          title: 'No matches found',
                          url: searchUrl,
                          pluginName: opName,
                          type: 'empty'
                        });
                      }
                    } catch (e) {
                      console.error(`[Search] Error evaluating ${opName} SmartFetch:`, e);
                      results.push({ id: plugin.id + '_error_' + Math.random().toString(36).substring(7), title: 'Error executing script', url: searchUrl, pluginName: opName, type: 'empty' });
                    }
                  }
                }
                console.log(`[Search] Completed multi-search. Generated ${results.length} total card blocks.`);
                setSearchResults(results);
                setIsSearching(false);
              }
            }}
          />
          {multiSearchQuery && !isSearching && (
            <button
              onClick={() => {
                setMultiSearchQuery('');
                setSearchResults([]);
                setIsSearching(false);
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 bg-zinc-900/80 p-1 rounded-full"
            >
              <X size={18} />
            </button>
          )}
          {isSearching && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 bg-zinc-900/80 p-1">
              <RefreshCw size={18} className="text-indigo-500 animate-spin" />
            </div>
          )}
        </div>

        {/* Mode & Tags Toggle */}
        <div className="flex flex-col items-center gap-3 mt-2">
          {searchParamMode === 'fetch' && allSearchTags.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-2 max-w-xl">
              <span className="text-xs text-zinc-500 mr-2"><Search size={12} className="inline mr-1" />Filters:</span>
              {allSearchTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => {
                    if (activeSearchTags.includes(tag)) {
                      setActiveSearchTags(activeSearchTags.filter(t => t !== tag));
                    } else {
                      setActiveSearchTags([...activeSearchTags, tag]);
                    }
                  }}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-all ${activeSearchTags.includes(tag)
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      : 'bg-zinc-900/50 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                    }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center justify-center gap-4">
            <div className="inline-flex bg-zinc-900/50 p-1 rounded-xl border border-zinc-800/50">
              <button
                onClick={() => setSearchParamMode('fetch')}
                className={`text-xs font-medium px-4 py-1.5 rounded-lg transition-colors ${searchParamMode === 'fetch' ? 'bg-indigo-500/20 text-indigo-400' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                Auto Search
              </button>
              <button
                onClick={() => setSearchParamMode('navigate')}
                className={`text-xs font-medium px-4 py-1.5 rounded-lg transition-colors ${searchParamMode === 'navigate' ? 'bg-indigo-500/20 text-indigo-400' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                Web Navigate
              </button>
            </div>

            {searchParamMode === 'fetch' && (
              <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-400 hover:text-indigo-400 transition-colors bg-zinc-900/50 px-3 py-1.5 rounded-xl border border-zinc-800/50">
                <input
                  type="checkbox"
                  checked={isDeepSearch}
                  onChange={(e) => setIsDeepSearch(e.target.checked)}
                  className="rounded bg-zinc-800 border-zinc-700 text-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:ring-offset-0 focus:ring-offset-transparent cursor-pointer"
                />
                Deep Scan Match
              </label>
            )}
          </div>
        </div>
      </div>

      {/* Tags / Custom Search Lists */}
      <div className="w-full">
        {searchResults.length === 0 && (
          <div className="w-full max-w-6xl mx-auto space-y-12 pb-20 mt-8">
            {/* Unique Tags Renderer */}
            {Array.from(new Set(plugins.filter(p => p.enabled !== false).flatMap(p => p.tags || []))).sort().map(tag => {
              const matchedPlugins = plugins.filter(p => p.enabled !== false && p.tags?.includes(tag));
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
                          {p.icon ? (
                            p.icon.includes('<svg') || p.icon.includes('http') ? (
                              <div className="w-5 h-5" dangerouslySetInnerHTML={{ __html: p.icon.includes('<svg') ? p.icon : `<img src="${p.icon}" class="w-full h-full object-contain" />` }} />
                            ) : (
                              <span className="text-lg">{p.icon}</span>
                            )
                          ) : (
                            <Globe size={18} />
                          )}
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
            {plugins.filter(p => p.enabled !== false && (!p.tags || p.tags.length === 0)).length > 0 && (
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-widest pl-2">Uncategorized Sites</h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {plugins.filter(p => p.enabled !== false && (!p.tags || p.tags.length === 0)).map(p => (
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
                        {p.icon ? (
                          p.icon.includes('<svg') || p.icon.includes('http') ? (
                            <div className="w-5 h-5" dangerouslySetInnerHTML={{ __html: p.icon.includes('<svg') ? p.icon : `<img src="${p.icon}" class="w-full h-full object-contain" />` }} />
                          ) : (
                            <span className="text-lg">{p.icon}</span>
                          )
                        ) : (
                          <Globe size={18} />
                        )}
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
        <div className="w-full max-w-6xl space-y-6">
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
