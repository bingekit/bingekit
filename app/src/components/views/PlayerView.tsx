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

export const PlayerView = () => {
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
    
              <div className="w-full h-full bg-zinc-950 flex flex-col relative">
                {/* Quick Options Bar & Toggle */}
                {!isQuickOptionsHidden && (
                  <div className="h-10 bg-zinc-950 border-b border-zinc-900 flex items-center px-4 gap-4 z-10 shrink-0">
                    <button
                      onClick={() => {
                        setMultiSearchQuery(new URL(url).hostname);
                        setActiveTab('dashboard');
                      }}
                      className="text-xs font-medium text-zinc-400 hover:text-indigo-400 flex items-center gap-1.5 transition-colors"
                    >
                      <Search size={14} /> Find Mirrors
                    </button>
                    <div className="w-px h-4 bg-zinc-800" />
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                      <span className="text-xs text-zinc-600 font-medium whitespace-nowrap">Run Flow:</span>
                      {flows.map(flow => (
                        <button
                          key={flow.id}
                          onClick={async () => {
                            await runFlow(flow);
                            setActiveTab('player');
                          }}
                          className="text-xs font-medium text-zinc-400 hover:text-emerald-400 flex items-center gap-1 transition-colors bg-zinc-900 px-2 py-1 rounded whitespace-nowrap"
                        >
                          <Zap size={12} /> {flow.name}
                        </button>
                      ))}
                      {flows.length === 0 && (
                        <span className="text-xs text-zinc-600 italic whitespace-nowrap">No flows</span>
                      )}
                    </div>
                    <div className="flex-1" />
                    <button
                      title="Inject Login Credentials"
                      onClick={() => {
                        const plugin = plugins.find(p => url.includes(p.baseUrl));
                        if (plugin && plugin.auth.usernameValue && plugin.auth.passwordValue) {
                          const js = `
                            (function() {
                              const userEl = document.querySelector("${plugin.auth.userSel}");
                              const passEl = document.querySelector("${plugin.auth.passSel}");
                              if (userEl) {
                                userEl.value = "${plugin.auth.usernameValue}";
                                userEl.dispatchEvent(new Event('input', { bubbles: true }));
                              }
                              if (passEl) {
                                passEl.value = "${plugin.auth.passwordValue}";
                                passEl.dispatchEvent(new Event('input', { bubbles: true }));
                              }
                              const submitEl = document.querySelector("${plugin.auth.submitSel}");
                              if (submitEl) submitEl.click();
                            })();
                          `;
                          ahk.call('InjectJS', js);
                        } else {
                          // Try general credentials
                          const hostname = new URL(url).hostname;
                          const cred = credentials.find(c => hostname.includes(c.domain) || c.domain.includes(hostname));
                          if (cred) {
                            // Basic injection for standard forms if no plugin matches
                            const js = `
                              (function() {
                                const pass = atob("${cred.passwordBase64}");
                                const userInputs = document.querySelectorAll('input[type="text"], input[type="email"], input[name*="user"], input[name*="email"]');
                                const passInputs = document.querySelectorAll('input[type="password"]');
                                if (userInputs.length > 0) { userInputs[0].value = "${cred.username}"; userInputs[0].dispatchEvent(new Event('input', { bubbles: true })); }
                                if (passInputs.length > 0) { passInputs[0].value = pass; passInputs[0].dispatchEvent(new Event('input', { bubbles: true })); }
                              })();
                            `;
                            ahk.call('InjectJS', js);
                          } else {
                            alert('No matching plugin or saved credentials found.');
                          }
                        }
                      }}
                      className="text-xs font-medium text-zinc-400 hover:text-indigo-400 flex items-center gap-1.5 transition-colors shrink-0"
                    >
                      <KeyRound size={14} /> Auto-Login
                    </button>
                  </div>
                )}
                {/* Toggle Button for Quick Options */}
                <button
                  onClick={() => setIsQuickOptionsHidden(!isQuickOptionsHidden)}
                  className={`absolute right-4 z-20 p-1.5 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800/50 rounded-lg text-zinc-500 hover:text-zinc-300 transition-all shadow-lg backdrop-blur-sm ${isQuickOptionsHidden ? 'top-4' : 'top-12'}`}
                  title={isQuickOptionsHidden ? "Show Quick Menu" : "Hide Quick Menu"}
                >
                  {isQuickOptionsHidden ? <ChevronLeft size={14} /> : <X size={14} />}
                </button>

                <div ref={playerRef} className="w-full flex-1 bg-zinc-900 border-none relative" />
              </div>
            
  );
};
