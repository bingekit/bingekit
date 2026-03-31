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
    playerRef, savePlugin, deletePlugin, updateEditingPlugin, fetchTitleForUrl, runFlow, checkForUpdates, handleNavigate, loadPlugins,
    discoveryItems, setDiscoveryItems,
    isFocusedMode, setIsFocusedMode, authStatus, playerStatus
  } = useAppContext();

  React.useEffect(() => {
    // Discovery Engine Background Task
    const timer = setTimeout(async () => {
      if (activeTab !== 'player') return;
      const plugin = plugins.find(p => url.includes(p.baseUrl));
      if (!plugin || !plugin.details?.similarSel || !window.SmartFetch) return;

      const jsQuery = `
        const items = Array.from(document.querySelectorAll('${plugin.details.similarSel.replace(/'/g, "\\\\'")}'));
        return items.slice(0, 5).map(item => {
           let titleEl = item.querySelector('${(plugin.details.similarTitleSel || 'a').replace(/'/g, "\\\\'")}') || item;
           const title = titleEl ? (titleEl.getAttribute('title') || titleEl.textContent || '').trim() : '';
           let linkEl = item.querySelector('${(plugin.details.similarLinkSel || 'a').replace(/'/g, "\\\\'")}') || (item.tagName === 'A' ? item : item.querySelector('a'));
           let href = linkEl ? linkEl.getAttribute('href') : '';
           if (href && !href.startsWith('http')) {
             try { href = new URL(href, '${plugin.baseUrl}').href; } catch {}
           }
           let imgEl = ${plugin.details.similarImageSel ? `item.querySelector('${plugin.details.similarImageSel.replace(/'/g, "\\\\'")}')` : 'item.querySelector("img")'};
           let img = imgEl ? (imgEl.getAttribute('src') || imgEl.getAttribute('data-src') || '') : '';
           if (img && !img.startsWith('http') && !img.startsWith('data:')) {
             try { img = new URL(img, '${plugin.baseUrl}').href; } catch {}
           }
           return { title, href, img };
        }).filter(i => i.title && i.href);
      `;
      try {
        const res = await window.SmartFetch(url, jsQuery);
        if (Array.isArray(res) && res.length > 0) {
          setDiscoveryItems((prev: any) => {
            const newItems = [...prev];
            let changed = false;
            for (const item of res) {
              if (!newItems.some(i => i.url === item.href)) {
                newItems.unshift({
                  id: Date.now().toString() + Math.random().toString(),
                  title: item.title,
                  url: item.href,
                  siteId: plugin.id,
                  addedAt: Date.now(),
                  dismissed: false,
                  imgUrl: item.img
                });
                changed = true;
              }
            }
            if (changed) return newItems.slice(0, 500);
            return prev;
          });
        }
      } catch (e) {
        console.error('Discovery Engine failed', e);
      }
    }, 6000); // Wait 6 seconds for page to be usable
    return () => clearTimeout(timer);
  }, [url, activeTab, plugins]);


  React.useEffect(() => {
    if (activeTab !== 'player' || playerStatus !== 'found') return;
    const plugin = plugins.find(p => url.includes(p.baseUrl) || (() => { try { return p.baseUrl.includes(new URL(url).hostname); } catch { return false; } })());
    if (plugin && plugin.player.playerSel) {
      if (isFocusedMode) {
        const userCss = plugin.player.focusCss || "";
        let customCssBlock = "";
        if (userCss) {
          if (userCss.includes('{') && userCss.includes('}')) {
            customCssBlock = userCss;
          } else {
            customCssBlock = `${plugin.player.playerSel} { ${userCss} }`;
          }
        }
        const defaultCssBlock = `
                 ${plugin.player.playerSel} {
                    position: fixed !important;
                    top: 0 !important;
                    left: 0 !important;
                    width: 100vw !important;
                    height: 100vh !important;
                    z-index: 2147483647 !important;
                    background: #000 !important;
                 }
                 body { overflow: hidden !important; }
              `;
        const fullCss = defaultCssBlock + "\\n" + customCssBlock;

        ahk.call('InjectJS', `
                 (function() {
                    const styleId = 'sv-focus-style';
                    let existingStyle = document.getElementById(styleId);
                    if (!existingStyle) {
                      existingStyle = document.createElement('style');
                      existingStyle.id = styleId;
                      (document.head || document.documentElement).appendChild(existingStyle);
                    }
                    const newCss = ${JSON.stringify(fullCss)};
                    if (existingStyle.innerHTML !== newCss) {
                      existingStyle.innerHTML = newCss;
                    }
                 })();
              `);
      } else {
        ahk.call('InjectJS', `
                 (function() {
                    let existingStyle = document.getElementById('sv-focus-style');
                    if (existingStyle) existingStyle.parentNode.removeChild(existingStyle);
                 })();
              `);
      }
    }
  }, [isFocusedMode, activeTab, playerStatus, url, plugins]);

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
            {(() => {
              const currentPlugin = plugins.find(p => url.includes(p.baseUrl) || (() => { try { return p.baseUrl.includes(new URL(url).hostname); } catch { return false; } })());
              const detailsFlowId = currentPlugin?.details?.delegateFlowId;
              const dFlow = flows.find(f => f.id === detailsFlowId);

              return (
                <>
                  {dFlow && (
                    <button
                      onClick={async () => {
                        if (!currentPlugin || !dFlow) return;
                        const inputs = currentPlugin.details.delegateFlowInputs || {};
                        const resolvedVars: Record<string, string> = { url };

                        const selectorsToFetch = [];
                        for (const [key, val] of Object.entries(inputs)) {
                          if (typeof val === 'string' && val.startsWith('js:')) {
                            selectorsToFetch.push({ key, type: 'eval', script: val.substring(3) });
                          } else if (typeof val === 'string' && val.startsWith('selector:')) {
                            const sel = val.substring(9);
                            const isAttr = sel.includes('@');
                            selectorsToFetch.push({
                              key: key as string,
                              selector: (isAttr ? sel.split('@')[0] : sel) as string,
                              type: (isAttr ? 'attr' : 'text') as string,
                              attr: (isAttr ? sel.split('@')[1] : null) as string | null
                            });
                          } else {
                            resolvedVars[key] = val as string;
                          }
                        }

                        if (selectorsToFetch.length > 0) {
                          // Run SmartFetch to evaluate selectors & js against the player's URL
                          // Note: Currently SmartFetch natively supports 'text' and 'attr', but we can inject eval scripts into the payload config
                          const payload = selectorsToFetch.map(item => {
                            if (item.type === 'eval') {
                              // Workaround to execute arbitrary JS in the SmartFetch `extractTitle`/extract... bindings 
                              // by passing an arrow function string since SmartFetch string-evals functions in its crawler!
                              return { key: item.key, selector: `()=>${item.script}`, type: 'text' };
                            }
                            return item;
                          });

                          const scraped = await window.SmartFetch(url, JSON.stringify(payload));
                          if (scraped && scraped.items && scraped.items.length > 0) {
                            Object.assign(resolvedVars, scraped.items[0]);
                          }
                        }

                        await runFlow(dFlow, url, resolvedVars);
                        setActiveTab('player');
                      }}
                      className="text-xs font-medium text-indigo-400 hover:bg-indigo-500/10 border border-indigo-500/20 flex items-center gap-1 transition-colors bg-zinc-900 px-2 flex-shrink-0 py-1 rounded whitespace-nowrap"
                    >
                      <ListTree size={12} /> Fetch Details
                    </button>
                  )}

                  {flows.filter(f => f.id !== detailsFlowId).map(flow => (
                    <button
                      key={flow.id}
                      onClick={async () => {
                        await runFlow(flow);
                        setActiveTab('player');
                      }}
                      className="text-xs font-medium text-zinc-400 hover:text-emerald-400 flex items-center gap-1 transition-colors bg-zinc-900 px-2 flex-shrink-0 py-1 rounded whitespace-nowrap"
                    >
                      <Zap size={12} /> {flow.name}
                    </button>
                  ))}
                  {flows.length === 0 && !dFlow && (
                    <span className="text-xs text-zinc-600 italic whitespace-nowrap">No flows</span>
                  )}
                </>
              );
            })()}
          </div>
          <div className="flex-1" />
          {playerStatus === 'found' && (
            <button
              title={isFocusedMode ? "Disable Focused Mode" : "Enable Focused Mode"}
              onClick={() => setIsFocusedMode(!isFocusedMode)}
              className={`text-xs font-medium flex items-center gap-1.5 transition-colors shrink-0 ${isFocusedMode ? 'text-indigo-400' : 'text-zinc-600 hover:text-zinc-400'}`}
            >
              {isFocusedMode ? <Eye size={14} /> : <EyeOff size={14} />} Focused
            </button>
          )}
          {authStatus !== 'unknown' && (
            <div className="flex items-center gap-2 border-l border-zinc-800 pl-4 ml-2">
              <span title={authStatus === 'loggedIn' ? 'Logged In' : 'Not Logged In'} className={`w-2 h-2 rounded-full ${authStatus === 'loggedIn' ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'}`} />
            </div>
          )}
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


      <div ref={playerRef} className="w-full flex-1 bg-zinc-900 border-none relative" />
    </div>

  );
};
