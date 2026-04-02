import React from 'react';
import { Search, Bookmark, Settings, Minus, Square, X, ChevronLeft, ChevronRight, RotateCw, Film, Tv, Play, LayoutGrid, Shield, ShieldOff, Plus, Puzzle, Save, Trash2, Download, Upload, KeyRound, Code, ListTree, MonitorPlay, Activity, RefreshCw, Bell, Compass, Zap, Clock, Folder, Lock, EyeOff, Eye, Globe } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { ahk } from '../../lib/ahk';
import { TooltipWrapper } from '../ui/TooltipWrapper';
import { CustomCheckbox } from '../ui/CustomCheckbox';
import { TagsInput } from '../ui/TagsInput';
import { Modal } from '../ui/Modal';
import { CustomSelect } from '../ui/CustomSelect';
import _Editor from 'react-simple-code-editor';
const Editor = (_Editor as any).default || _Editor;
import Prism from 'prismjs';
import { ensureAuthForPlugin } from '../../lib/authHelper';
import { resolvePluginUrl } from '../../lib/urlHelper';
import { DEFAULT_PLUGIN, SitePlugin, CustomFlow, Userscript, FollowedItem, BookmarkItem, WatchLaterItem, CredentialItem } from '../../types';

export const ActivityView = () => {
  const [expandedItemId, setExpandedItemId] = React.useState<string | null>(null);
  const [activeTrackingSourceId, setActiveTrackingSourceId] = React.useState<string | null>(null);
  const [isFetchingEpisodes, setIsFetchingEpisodes] = React.useState(false);
  const [liveEpisodes, setLiveEpisodes] = React.useState<any[]>([]);
  const [isAddingTracking, setIsAddingTracking] = React.useState(false);
  const [addTrackerState, setAddTrackerState] = React.useState<any>({ url: '', siteId: '', flowId: '', label: '', title: '', imgUrl: '', testerItems: null, inputMode: 'url', idValue: '' });
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

  React.useEffect(() => {
    const handleEpisodes = (e: any) => {
      setIsFetchingEpisodes(false);
      if (e.detail?.id === activeTrackingSourceId) {
        setLiveEpisodes(e.detail.episodes || []);
      }
    };
    window.addEventListener('bk-live-episodes', handleEpisodes);
    return () => window.removeEventListener('bk-live-episodes', handleEpisodes);
  }, [activeTrackingSourceId]);

  return (

    <div className="p-8 max-w-6xl mx-auto w-full h-full overflow-y-auto no-scrollbar">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-light tracking-tight text-zinc-100">Following & Activity</h2>
        <div className="flex gap-3">
          <button
            onClick={() => {
              setAddTrackerState({ url: url, siteId: plugins[0]?.id || '', flowId: '', label: '', title: new URL(url).hostname || '', imgUrl: '', inputMode: 'url', idValue: '' });
              setIsAddingTracking(true);
            }}
            className="flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 px-4 py-2 rounded-full transition-colors"
          >
            <Plus size={16} /> Custom Track
          </button>
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
            <Bookmark size={16} /> Quick Add
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
        {(() => {
          const grouped = new Map();
          followedItems.forEach(item => {
            const key = item.label || item.id; // Use label if present, else distinct
            if (!grouped.has(key)) {
              grouped.set(key, { ...item, _sources: [item], title: item.label ? (item.label.split('|')[0] || item.title) : item.title });
            } else {
              const g = grouped.get(key);
              g._sources.push(item);
              if (item.hasUpdate) g.hasUpdate = true;
              // Merging watched logic is implicit since they share via ActivityView marking anyway...
              // Better: union of watchedEpisodes
              const mergedWatched = new Set([...(g.watchedEpisodes || []), ...(item.watchedEpisodes || [])]);
              g.watchedEpisodes = Array.from(mergedWatched);
            }
          });
          return Array.from(grouped.values()).map(item => {
            const primarySource = item._sources[0];
            const plugin = plugins.find(p => p.id === primarySource.siteId);
            const hasAdvancedTracking = primarySource.trackingFlowId || !!(plugin?.tracking?.listSel && plugin?.tracking?.itemSel) || (plugin?.trackingFlows && plugin.trackingFlows.length > 0);

            return (
              <div
                key={item.label || item.id}
                onClick={() => {
                  if (item.hasUpdate) {
                    setFollowedItems(followedItems.map(i => item._sources.some((s: any) => s.id === i.id) ? { ...i, hasUpdate: false } : i));
                  }
                  if (hasAdvancedTracking) {
                    setExpandedItemId(item.label || item.id);
                    setActiveTrackingSourceId(item._sources[0].id);
                    setLiveEpisodes([]);
                    setIsFetchingEpisodes(true);
                    fetchLiveEpisodes(item._sources[0], plugin, credentials);
                  } else {
                    setUrl(item._sources[0].url);
                    setInputUrl(item._sources[0].url);
                    setActiveTab('player');
                  }
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
                  <p className="text-[10px] text-zinc-600 truncate mt-2 font-mono uppercase tracking-wider">
                    {item._sources.length > 1 ? `Tracked across ${item._sources.length} sites` : (plugins.find(p => p.id === primarySource.siteId)?.name || 'Unknown Site')}
                  </p>
                </div>
              </div>
            );
          })
        })()}
        {followedItems.length === 0 && (
          <div className="col-span-full text-center py-12 text-zinc-500 text-sm">
            <Bell size={32} className="mx-auto mb-4 opacity-20" />
            You aren't tracking any shows or films yet.
          </div>
        )}
      </div>

      {expandedItemId && (
        <Modal isOpen={true} title="Tracking Details" onClose={() => setExpandedItemId(null)}>
          {(() => {
            const sources = followedItems.filter(i => (i.label || i.id) === expandedItemId);
            if (sources.length === 0) return null;
            const item = sources.find(i => i.id === activeTrackingSourceId) || sources[0];
            const groupTitle = item.label ? (item.label.split('|')[0] || item.title) : item.title;

            return (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-white">{groupTitle}</h3>
                  <button onClick={() => {
                    if (confirm('Stop tracking this item across all sources?')) {
                      setFollowedItems(followedItems.filter(i => (i.label || i.id) !== expandedItemId));
                      setExpandedItemId(null);
                    }
                  }} className="text-red-400 hover:text-red-300 px-3 py-1 bg-red-500/10 rounded flex items-center gap-2 text-sm">
                    <Trash2 size={14} /> Stop Tracking
                  </button>
                </div>

                {sources.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar border-b border-zinc-800/50">
                    {sources.map(src => {
                      const isActive = src.id === activeTrackingSourceId;
                      const plName = plugins.find(p => p.id === src.siteId)?.name || 'Unknown Site';
                      return (
                        <button
                          key={src.id}
                          onClick={() => {
                            setActiveTrackingSourceId(src.id);
                            setLiveEpisodes([]);
                            setIsFetchingEpisodes(true);
                            fetchLiveEpisodes(src, plugins.find(p => p.id === src.siteId)!, credentials);
                          }}
                          className={`px-4 py-2 rounded-t-lg text-xs font-medium border-b-2 whitespace-nowrap transition-colors flex gap-2 items-center ${isActive ? 'text-emerald-400 border-emerald-400 bg-emerald-500/5' : 'text-zinc-500 border-transparent hover:text-zinc-300 hover:bg-zinc-800/50'}`}
                        >
                          {plName}
                          {src.hasUpdate && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>}
                        </button>
                      );
                    })}
                  </div>
                )}

                <div className="flex gap-2">
                  <button onClick={() => { setUrl(item.url); setInputUrl(item.url); setActiveTab('player'); }} className="flex-1 py-2 bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700 text-white rounded text-sm font-medium transition-colors flex items-center justify-center gap-2">
                    <Play size={16} /> Open Page
                  </button>
                </div>

                <div className="mt-6 border-t border-zinc-800 pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-zinc-400">
                      Episodes ({(item.watchedEpisodes || []).length}/{liveEpisodes.length})
                    </h4>
                    <button
                      onClick={() => { setIsFetchingEpisodes(true); setLiveEpisodes([]); fetchLiveEpisodes(item, plugins.find(p => p.id === item.siteId)!, credentials); }}
                      className="text-xs flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded transition-colors"
                    >
                      <RefreshCw size={12} className={isFetchingEpisodes ? "animate-spin" : ""} /> Check Now
                    </button>
                  </div>
                  <div className="max-h-[40vh] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                    {liveEpisodes.map((ep, idx) => {
                      const isWatched = item.watchedEpisodes?.includes(ep.id);
                      return (
                        <div key={idx} className={`p-3 rounded border flex items-center justify-between ${isWatched ? 'bg-zinc-900/40 border-zinc-800/40' : 'bg-zinc-800 border-zinc-700'}`}>
                          <div>
                            <p className={`text-sm font-medium ${isWatched ? 'text-zinc-500 line-through' : 'text-zinc-200'}`}>{ep.title || ep.id}</p>
                            <p className="text-xs text-zinc-500 mt-1">{ep.id}</p>
                          </div>
                          <div className="flex gap-1.5 flex-col items-end">
                            <button
                              onClick={() => {
                                let updated = item.watchedEpisodes ? [...item.watchedEpisodes] : [];
                                if (updated.includes(ep.id)) {
                                  updated = updated.filter(i => i !== ep.id);
                                } else {
                                  updated.push(ep.id);
                                }
                                setFollowedItems(followedItems.map(i => i.id === item.id ? { ...i, watchedEpisodes: updated } : i));
                              }}
                              className={`px-3 py-1.5 w-full rounded text-xs font-medium transition-colors ${isWatched ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700' : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 mix-blend-screen'}`}
                            >
                              {isWatched ? 'Unmark' : 'Mark Watched'}
                            </button>
                            {!isWatched && (
                              <button
                                onClick={() => {
                                  let updated = item.watchedEpisodes ? [...item.watchedEpisodes] : [];
                                  const watchIdx = liveEpisodes.findIndex(e => e.id === ep.id);
                                  const toMark = liveEpisodes.slice(watchIdx).map(e => e.id);
                                  toMark.forEach(id => {
                                    if (!updated.includes(id)) updated.push(id);
                                  });
                                  setFollowedItems(followedItems.map(i => i.id === item.id ? { ...i, watchedEpisodes: updated } : i));
                                }}
                                className="px-3 py-1 w-full rounded text-[10px] font-medium transition-colors border border-emerald-500/20 text-emerald-500/80 hover:bg-emerald-500/10"
                              >
                                Mark &lt;= Upto Here
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {!isFetchingEpisodes && liveEpisodes.length === 0 && (
                      <p className="text-sm text-zinc-500 p-4 text-center border border-dashed border-zinc-800 rounded">No episodes found or tracking selectors invalid.</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
        </Modal>
      )}

      {isAddingTracking && (
        <Modal isOpen={true} onClose={() => setIsAddingTracking(false)} title="Custom Tracking Info" width="600px">
          <div className="space-y-4">
            {(() => {
              const activePl = plugins.find(p => p.id === addTrackerState.siteId);
              const activeFlow = addTrackerState.flowId ? activePl?.trackingFlows?.find(f => f.id === addTrackerState.flowId) : activePl?.trackingFlows?.[0];
              const hasUrlPattern = !!activeFlow?.urlPattern;
              const isIdMode = hasUrlPattern && addTrackerState.inputMode === 'id';

              const getResolvedUrl = () => {
                let rawUrl = '';
                if (isIdMode && activeFlow?.urlPattern) {
                  const val = (addTrackerState.idValue || '').trim();
                  rawUrl = val ? activeFlow.urlPattern.replace('{id}', val) : '';
                } else {
                  rawUrl = (addTrackerState.url || '').trim();
                }
                if (rawUrl && activePl?.baseUrl) {
                  return resolvePluginUrl(activePl.baseUrl, rawUrl);
                }
                return rawUrl;
              };

              return (
                <>
                  {plugins.length > 0 && (
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <label className="text-xs text-zinc-400 mb-1 block">Site Plugin</label>
                        <CustomSelect
                          options={plugins.map(p => ({ label: p.name, value: p.id }))}
                          value={addTrackerState.siteId}
                          onChange={val => setAddTrackerState({ ...addTrackerState, siteId: val, flowId: '' })}
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-xs text-zinc-400 mb-1 block">Specific Tracking Flow</label>
                        <CustomSelect
                          options={(() => {
                            const pl = plugins.find(p => p.id === addTrackerState.siteId);
                            const flows = pl?.trackingFlows || [];
                            return [{ label: "Default (or Auto-Match)", value: "" }, ...flows.map(f => ({ label: f.name || f.id, value: f.id }))];
                          })()}
                          value={addTrackerState.flowId}
                          onChange={val => setAddTrackerState({ ...addTrackerState, flowId: val })}
                        />
                        {(() => {
                          const pl = plugins.find(p => p.id === addTrackerState.siteId);
                          const flow = addTrackerState.flowId ? pl?.trackingFlows?.find(f => f.id === addTrackerState.flowId) : pl?.trackingFlows?.[0];
                          if (flow?.urlRegex) return <p className="text-[10px] text-zinc-500 mt-1">URL Match Regex: <span className="font-mono">{flow.urlRegex}</span></p>;
                          return null;
                        })()}
                      </div>
                    </div>
                  )}

                  <div className="bg-zinc-900/40 border border-zinc-800 rounded-lg p-3">
                    {hasUrlPattern && (
                      <div className="flex gap-4 mb-3 border-b border-zinc-800 pb-3">
                        <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                          <input type="radio" checked={!isIdMode} onChange={() => setAddTrackerState({ ...addTrackerState, inputMode: 'url' })} className="accent-emerald-500 w-3 h-3" />
                          URL Input
                        </label>
                        <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                          <input type="radio" checked={isIdMode} onChange={() => setAddTrackerState({ ...addTrackerState, inputMode: 'id' })} className="accent-emerald-500 w-3 h-3" />
                          Pattern ID Input (Faster)
                        </label>
                      </div>
                    )}

                    {!isIdMode ? (
                      <div>
                        <label className="text-xs text-zinc-400 mb-1 block">Tracking Source URL</label>
                        <input
                          value={addTrackerState.url}
                          onChange={e => setAddTrackerState({ ...addTrackerState, url: e.target.value })}
                          className="w-full bg-black/40 border border-zinc-800 text-sm p-2 rounded text-zinc-200 outline-none focus:border-emerald-500/50 transition-colors"
                          placeholder="https://..."
                        />
                      </div>
                    ) : (
                      <div>
                        <label className="text-xs text-zinc-400 mb-1 block">Show ID</label>
                        <input
                          value={addTrackerState.idValue}
                          onChange={e => setAddTrackerState({ ...addTrackerState, idValue: e.target.value })}
                          className="w-full bg-black/40 border border-zinc-800 text-sm p-2 rounded text-zinc-200 outline-none focus:border-emerald-500/50 transition-colors"
                          placeholder="e.g. arcane-2"
                        />
                        {addTrackerState.idValue && getResolvedUrl() && (
                          <p className="text-[10px] text-emerald-500 mt-2 flex gap-1">Resolves URL to: <a href={getResolvedUrl()} target="_blank" rel="noreferrer" className="underline truncate opacity-80 hover:opacity-100">{getResolvedUrl()}</a></p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="text-xs text-zinc-400 mb-1 block">Title / Show Name</label>
                      <input value={addTrackerState.title} onChange={e => setAddTrackerState({ ...addTrackerState, title: e.target.value })} className="w-full bg-zinc-900 border border-zinc-800 text-sm p-2 rounded text-zinc-200 outline-none" />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-zinc-400 mb-1 block">Group Label (optional)</label>
                      <input value={addTrackerState.label} onChange={e => setAddTrackerState({ ...addTrackerState, label: e.target.value })} className="w-full bg-zinc-900 border border-zinc-800 text-sm p-2 rounded text-zinc-200 outline-none" placeholder="e.g. arcane" />
                      <p className="text-[10px] text-zinc-500 mt-1">Cross-site sync key.</p>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-zinc-400 mb-1 block">Cover Image URL (optional)</label>
                    <input value={addTrackerState.imgUrl} onChange={e => setAddTrackerState({ ...addTrackerState, imgUrl: e.target.value })} className="w-full bg-zinc-900 border border-zinc-800 text-sm p-2 rounded text-zinc-200 outline-none" />
                  </div>

                  <div className="border border-zinc-800 bg-zinc-900/50 p-3 rounded-lg mt-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-emerald-400">Test Extractor</span>
                      <button
                        onClick={async () => {
                          const pl = plugins.find(p => p.id === addTrackerState.siteId);
                          let trackingConf = pl?.tracking;
                          if (pl?.trackingFlows) {
                            if (addTrackerState.flowId) trackingConf = pl.trackingFlows.find(t => t.id === addTrackerState.flowId);
                            else if (pl.trackingFlows.length > 0) trackingConf = pl.trackingFlows[0];
                          }
                          if (!pl || !trackingConf || !window.SmartFetch) {
                            alert("Cannot test extractor logic.");
                            return;
                          }
                          const js = `
                                    const items = Array.from(document.querySelectorAll('${trackingConf.itemSel?.replace(/'/g, "\\\\'") || ''}'));
                                    return items.slice(0, 3).map(el => {
                                       try {
                                         return {
                                           id: (function(){ ${trackingConf.idExtractJs || "return '';"} })(),
                                           title: (function(){ ${trackingConf.titleExtractJs || "return '';"} })()
                                         };
                                       } catch(e) { return null; }
                                    }).filter(i => i && i.id);
                                  `;
                          setAddTrackerState(prev => ({ ...prev, testerItems: "loading" }));
                          const res = await window.SmartFetch(getResolvedUrl(), js);
                          setAddTrackerState(prev => ({ ...prev, testerItems: res }));
                        }}
                        className="text-xs px-3 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded"
                      >Test Now</button>
                    </div>
                    {addTrackerState.testerItems === "loading" && <p className="text-xs text-zinc-500">Executing background extractor...</p>}
                    {Array.isArray(addTrackerState.testerItems) && (
                      <pre className="text-[10px] text-zinc-400 mt-2 bg-black/40 p-2 rounded custom-scrollbar max-h-32 overflow-y-auto">
                        {JSON.stringify(addTrackerState.testerItems, null, 2)}
                      </pre>
                    )}
                  </div>

                  <div className="flex justify-end pt-4 border-t border-zinc-800 gap-3">
                    <button onClick={() => setIsAddingTracking(false)} className="px-4 py-2 rounded text-sm bg-zinc-800 hover:bg-zinc-700 text-zinc-200">Cancel</button>
                    <button onClick={() => {
                      if (!addTrackerState.siteId) { alert("Site ID is required"); return; }
                      if (isIdMode && !addTrackerState.idValue) { alert("ID is required when in Pattern ID Mode"); return; }
                      if (!isIdMode && !addTrackerState.url) { alert("URL is required"); return; }
                      const finalUrl = getResolvedUrl();
                      let hostname = addTrackerState.title;
                      try { if (!hostname && finalUrl.startsWith('http')) hostname = new URL(finalUrl).hostname; } catch (e) { }
                      setFollowedItems([
                        ...followedItems,
                        {
                          id: Date.now().toString(),
                          title: hostname || 'Unknown',
                          label: addTrackerState.label || '',
                          url: finalUrl,
                          siteId: addTrackerState.siteId,
                          trackingFlowId: addTrackerState.flowId,
                          imgUrl: addTrackerState.imgUrl,
                          type: 'tv',
                          knownCount: 0,
                          hasUpdate: false
                        }
                      ]);
                      setIsAddingTracking(false);
                    }} className="px-4 py-2 rounded text-sm bg-emerald-500 hover:bg-emerald-600 text-white font-medium">Add Tracker</button>
                  </div>
                </>
              );
            })()}
          </div>
        </Modal>
      )}
    </div>
  );
};


// Extracted fetching function to avoid inline clutter
const fetchLiveEpisodes = async (item: FollowedItem, plugin: SitePlugin, credentials: CredentialItem[]) => {
  if (!window.SmartFetch) return;

  // Run Auth Check / Auto Login Workflow
  const authValid = await ensureAuthForPlugin(plugin, credentials);
  if (!authValid && plugin.auth?.loginUrl) {
    console.warn("Auto-login failed for", plugin.name);
    window.dispatchEvent(new CustomEvent('bk-live-episodes', { detail: { id: item.id, episodes: [] } }));
    return;
  }

  let trackingConf = item.trackingFlowId && plugin.trackingFlows ? plugin.trackingFlows.find(t => t.id === item.trackingFlowId) : null;
  if (!trackingConf && plugin.trackingFlows && plugin.trackingFlows.length > 0) {
    trackingConf = plugin.trackingFlows.find(t => t.urlRegex && new RegExp(t.urlRegex).test(item.url)) || plugin.trackingFlows[0];
  }
  if (!trackingConf) trackingConf = plugin.tracking; // Fallback
  if (!trackingConf) return;

  const js = `
    const items = Array.from(document.querySelectorAll('${trackingConf.itemSel?.replace(/'/g, "\\\\'") || ''}'));
    return items.map(el => {
        try {
          return {
            id: (function(){ ${trackingConf.idExtractJs || "return '';"} })(),
            title: (function(){ ${trackingConf.titleExtractJs || "return '';"} })()
          };
        } catch(e) { return null; }
    }).filter(i => i && i.id);
  `;
  try {
    const results = await window.SmartFetch(item.url, js);
    if (Array.isArray(results)) {
      window.dispatchEvent(new CustomEvent('bk-live-episodes', { detail: { id: item.id, episodes: results } }));
    } else {
      window.dispatchEvent(new CustomEvent('bk-live-episodes', { detail: { id: item.id, episodes: [] } }));
    }
  } catch (e) { console.error('Live episode fetch failed:', e); window.dispatchEvent(new CustomEvent('bk-live-episodes', { detail: { id: item.id, episodes: [] } })); }
};
