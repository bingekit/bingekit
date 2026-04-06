import React from 'react';
import { Search, Bookmark, Settings, Minus, Square, X, ChevronLeft, ChevronRight, ChevronDown, RotateCw, Film, Tv, Play, LayoutGrid, Shield, ShieldOff, Plus, Puzzle, Save, Trash2, Download, Upload, KeyRound, Code, ListTree, MonitorPlay, Activity, RefreshCw, Bell, Compass, Zap, Clock, Folder, Lock, EyeOff, Eye, Globe } from 'lucide-react';
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
import { getAutoLoginScript } from '../../lib/authHelper';

const PlayerSlot: React.FC<{ tabId: string, isVisuallyActive: boolean, className?: string }> = ({ tabId, isVisuallyActive, className }) => {
  const slotRef = React.useRef<HTMLDivElement>(null);
  const lastRectRef = React.useRef('');

  React.useEffect(() => {
    if (!slotRef.current) return;
    const observer = new ResizeObserver(() => {
      if (slotRef.current) {
        const rect = slotRef.current.getBoundingClientRect();
        if (rect.width < 50 || rect.height < 50) return;
        const rectStr = `${Math.round(rect.left)},${Math.round(rect.top)},${Math.round(rect.width)},${Math.round(rect.height)},${isVisuallyActive}`;
        if (lastRectRef.current !== rectStr) {
          lastRectRef.current = rectStr;
          ahk.asyncCall('UpdatePlayerRect', Math.round(rect.left), Math.round(rect.top), Math.round(rect.width), Math.round(rect.height), isVisuallyActive, tabId);
        }
      }
    });

    observer.observe(slotRef.current);
    const rect = slotRef.current.getBoundingClientRect();
    if (rect.width >= 50 && rect.height >= 50) {
      const rectStr = `${Math.round(rect.left)},${Math.round(rect.top)},${Math.round(rect.width)},${Math.round(rect.height)},${isVisuallyActive}`;
      lastRectRef.current = rectStr;
      ahk.asyncCall('UpdatePlayerRect', Math.round(rect.left), Math.round(rect.top), Math.round(rect.width), Math.round(rect.height), isVisuallyActive, tabId);
    }

    return () => {
      observer.disconnect();
      lastRectRef.current = '';
      try { ahk.asyncCall('UpdatePlayerRect', Math.round(rect.left), Math.round(rect.top), Math.round(rect.width), Math.round(rect.height), false, tabId); } catch (err) { }
    };
  }, [isVisuallyActive, tabId]);

  return <div ref={slotRef} className={className} />;
};

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
    discoveryItems, setDiscoveryItems, history,
    isFocusedMode, setIsFocusedMode, authStatus, playerStatus, pageTitle,
    isMultiTabEnabled, tilingMode, browserTabs, activeBrowserTabId, playerNavSignal
  } = useAppContext();

  const [activeMediaUrl, setActiveMediaUrl] = React.useState<string | null>(null);
  const [activeMediaQualities, setActiveMediaQualities] = React.useState<any[]>([]);
  const [activeSubtitleUrl, setActiveSubtitleUrl] = React.useState<string | null>(null);

  const lastResumeUrl = React.useRef('');

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

        ahk.asyncCall('InjectJS', `
                 (function() {
                    const styleId = 'bk-focus-style';
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
        ahk.asyncCall('InjectJS', `
                 (function() {
                    let existingStyle = document.getElementById('bk-focus-style');
                    if (existingStyle) existingStyle.parentNode.removeChild(existingStyle);
                 })();
              `);
      }
    }

  }, [isFocusedMode, activeTab, playerStatus, url, plugins, playerNavSignal]);

  const initiatorId = React.useRef(Math.random().toString());

  // Setup authentication synchronization listener
  React.useEffect(() => {
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('BingeKitAuthSync');
      bc.onmessage = (ev) => {
          if (ev.data && ev.data.hostname && ev.data.initiator !== initiatorId.current) {
             try {
                const currentH = new URL(url).hostname;
                if (currentH === ev.data.hostname || currentH.includes(ev.data.hostname) || ev.data.hostname.includes(currentH)) {
                    if (window.confirm(`A new login session was established for ${ev.data.hostname}.\n\nWould you like to refresh this window right now to apply the authenticated session?`)) {
                        ahk.asyncCall('UpdatePlayerUrl', url);
                    }
                }
             } catch(e) {}
          }
      };
    } catch(e) {}
    return () => { if(bc) bc.close(); };
  }, [url]);

  // Live Auto-Login Session Nav-Injection Bridging handled natively in global.js

  React.useEffect(() => {
      const handleLiveMsg = async (e: any) => {
         if (e.data && (e.data.type === 'bk-live-login-success' || e.data.type === 'bk-live-login-fail')) {
             const targetDomain = e.data.domain;
             if (e.data.type === 'bk-live-login-success') {
                 window.showToast(`Live Auto-Login Completed Successfully!`, "success");
                 try {
                    const bc = new BroadcastChannel('BingeKitAuthSync');
                    bc.postMessage({ hostname: new URL(url).hostname, initiator: initiatorId.current });
                    bc.close();
                 } catch(err) {}
                 setTimeout(() => { ahk.asyncCall('UpdatePlayerUrl', url); }, 1500); 
             }
             if (targetDomain) {
                 ahk.asyncCall('CacheSet', 'bkLiveLogin_' + targetDomain, '');
             }
             // For legacy cleanup
             ahk.asyncCall('CacheSet', '__bkLiveLoginScript', '');
         }
      };
      window.addEventListener('message', handleLiveMsg);
      return () => window.removeEventListener('message', handleLiveMsg);
  }, [url]);

  React.useEffect(() => {
    if (activeTab !== 'player') return;
    const plugin = plugins.find(p => url.includes(p.baseUrl) || (() => { try { return p.baseUrl.includes(new URL(url).hostname); } catch { return false; } })());
    const { ignoreVideoUrls, ignoreVideoCSS } = plugin?.player || {};
    const elements = plugin?.elementBlockers || "";
    ahk.asyncCall('InjectJS', `window.top.postMessage({ type: 'bk-ignore-cfg', urls: ${JSON.stringify(ignoreVideoUrls || "")}, css: ${JSON.stringify(ignoreVideoCSS || "")}, elements: ${JSON.stringify(elements)} }, '*');`);
  }, [url, activeTab, plugins]);

  React.useEffect(() => {
    lastResumeUrl.current = '';
  }, [playerNavSignal]);

  const historyRef = React.useRef(history);
  historyRef.current = history;

  React.useEffect(() => {
    if (activeTab !== 'player' || playerStatus !== 'found') return;
    if (url === lastResumeUrl.current) return;

    // Auto-Resume Video from History
    const hItem = historyRef.current.find(h => h.url === url && h.type === 'watch');
    if (hItem && hItem.currentTime && hItem.currentTime > 15) {
      if (hItem.duration && hItem.currentTime > (hItem.duration * 0.9)) return;
      
      lastResumeUrl.current = url;
      const cmd = `window.top.postMessage({ type: 'bk-seek-cmd', time: ${hItem.currentTime}, mainUrl: "${url}" }, '*');`;
      ahk.asyncCall('InjectJS', cmd);
      setTimeout(() => ahk.asyncCall('InjectJS', cmd), 1500); // 1 lightweight retry
    } else {
      // The video is completely new to BingeKit (or functionally unwatched at <15s).
      // Many SPA sites (like icefy) lazily recycle the exact same HTML5 <video> element 
      // without resetting its .currentTime attribute, natively causing the new episode 
      // to literally physically resume at the exact second the last one finished!
      // We must violently wipe the timeline to 0s to obliterate the site's cached bleed!
      lastResumeUrl.current = url;
      const cmd = `window.top.postMessage({ type: 'bk-seek-cmd', time: 0, mainUrl: "${url}" }, '*');`;
      ahk.asyncCall('InjectJS', cmd);
      setTimeout(() => ahk.asyncCall('InjectJS', cmd), 1500);
    }
  }, [url, activeTab, playerStatus]);

  React.useEffect(() => {
    let lastUrl = '';
    const handleMediaDetect = (e: any) => {
      if (e.detail.type === 'video') {
        const url = e.detail.url;
        if (url !== lastUrl) {
          lastUrl = url;
          setActiveMediaUrl(url);
        }
      }
    };
    window.addEventListener('bk-media-detected', handleMediaDetect);

    let isPolling = false;
    const intv = setInterval(async () => {
      if (isPolling) return;
      isPolling = true;
      try {
        const m = await ahk.asyncCall('GetActiveMedia');
        if (m && typeof m === 'string' && m.length > 5 && m !== activeMediaUrl) {
          lastUrl = m;
          setActiveMediaUrl(m);
        } else if (!m && activeMediaUrl) {
          lastUrl = '';
          setActiveMediaUrl(null);
        }

        try {
          const qStr = await ahk.asyncCall('GetActiveMediaQualities');
          if (qStr && typeof qStr === 'string' && qStr.length > 5) {
            const qParsed = JSON.parse(qStr);
            if (JSON.stringify(qParsed) !== JSON.stringify(activeMediaQualities)) setActiveMediaQualities(qParsed);
          } else if (!qStr && activeMediaQualities.length > 0) setActiveMediaQualities([]);
        } catch (e) { }

        try {
          const sub = await ahk.asyncCall('GetActiveSubtitle');
          if (sub && sub !== activeSubtitleUrl) setActiveSubtitleUrl(sub);
          else if (!sub && activeSubtitleUrl) setActiveSubtitleUrl(null);
        } catch (e) { }
      } catch (e) { }
      isPolling = false;
    }, 2000);

    return () => {
      window.removeEventListener('bk-media-detected', handleMediaDetect);
      clearInterval(intv);
    };
  }, [activeMediaUrl, activeMediaQualities, activeSubtitleUrl]);



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
          {activeMediaUrl && (
            <>
              <div className="w-px h-4 bg-zinc-800 mx-2" />
              {activeMediaQualities && activeMediaQualities.length > 0 ? (
                <div className="relative group flex items-center">
                  <Download size={14} className="text-emerald-400 absolute left-2 pointer-events-none" />
                  <select
                    className="text-xs font-medium text-emerald-400 animate-pulse appearance-none bg-emerald-500/10 hover:bg-emerald-500/20 py-1 pl-7 pr-6 rounded outline-none border-none cursor-pointer"
                    onChange={(e) => {
                      if (e.target.value === "") return;
                      let dName = pageTitle ? (pageTitle.replace(/[^a-z0-9]/gi, '_').replace(/_+/g, '_') + '.mp4') : `ActiveStream_${Date.now()}.mp4`;
                      ahk.asyncCall('DownloadActiveVideo', e.target.value, dName, activeSubtitleUrl || "");
                      e.target.value = "";
                    }}
                    value=""
                  >
                    <option value="" disabled>Rip ({activeMediaQualities.length})</option>
                    {activeMediaQualities.map(q => (
                      <option key={q.label} value={q.url} className="bg-zinc-900 text-zinc-300">
                        ★ {q.label} Match
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-1.5 pointer-events-none opacity-50"><ChevronDown size={14} className="text-emerald-400" /></div>
                </div>
              ) : (
                <button
                  onClick={() => {
                    let dName = pageTitle ? (pageTitle.replace(/[^a-z0-9]/gi, '_').replace(/_+/g, '_') + '.mp4') : `ActiveStream_${Date.now()}.mp4`;
                    ahk.asyncCall('DownloadActiveVideo', activeMediaUrl, dName, activeSubtitleUrl || "");
                  }}
                  className="text-xs font-medium text-emerald-400 animate-pulse hover:text-emerald-300 flex items-center gap-1.5 transition-colors shrink-0 px-2 bg-emerald-500/10 hover:bg-emerald-500/20 py-1 rounded"
                >
                  <Download size={14} /> Rip Stream
                </button>
              )}
            </>
          )}
          {activeSubtitleUrl && (
            <button
              onClick={() => {
                let dName = pageTitle ? (pageTitle.replace(/[^a-z0-9]/gi, '_').replace(/_+/g, '_') + '.vtt') : `sub_${Date.now()}.vtt`;
                ahk.asyncCall('DownloadSubtitle', activeSubtitleUrl, dName);
              }}
              className="ml-2 text-xs font-medium text-amber-400 hover:text-amber-300 flex items-center gap-1.5 transition-colors shrink-0 px-2 bg-amber-500/10 hover:bg-amber-500/20 py-1 rounded"
            >
              <span className="font-bold border border-amber-400/50 rounded-sm px-1 leading-none text-[8px] uppercase tracking-wider">CC</span>
              Download Sub
            </button>
          )}
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
          {authStatus !== 'loggedIn' && (
            <div className="flex items-center gap-1.5 shrink-0">
            <button
              title="Auto Login (Background Worker)"
              onClick={async () => {
                try {
                  const plugin = plugins.find(p => url.includes(p.baseUrl) || (() => { try { return p.baseUrl.includes(new URL(url).hostname); } catch { return false; } })());
                  
                  if (plugin) {
                    // We must use the exact robust background logic
                    const resolvedLoginUrl = plugin.auth?.loginUrl || plugin.baseUrl;
                    const cred = credentials.find(c => {
                        try { return c.domain === new URL(plugin.baseUrl).hostname || c.domain === new URL(resolvedLoginUrl).hostname; } catch(e) { return false; }
                    });
                    
                    if (!cred) {
                      window.showToast("No credentials found for this plugin's domains.", "error");
                      return;
                    }
                    
                    window.showToast("Initiating Smart Auto-Login Verification...", "info");
                    
                    // Do the robust SmartFetch sync
                    const { ensureAuthForPlugin } = await import('../../lib/authHelper');
                    const authValid = await ensureAuthForPlugin(plugin, credentials);
                    
                    if (authValid) {
                       window.showToast("Logged in successfully! Syncing session across active windows...", "success");
                       try {
                           const bc = new BroadcastChannel('BingeKitAuthSync');
                           bc.postMessage({ hostname: new URL(url).hostname, initiator: initiatorId.current });
                           bc.close();
                       } catch(e) {}
                       setTimeout(() => { ahk.asyncCall('UpdatePlayerUrl', url); }, 1500); // Reload tab
                    } else {
                       window.showToast("Auto-login completed, but could not confirm success.", "warning");
                    }
                  } else {
                    // Try general credentials if no plugin matched
                    const hostname = new URL(url).hostname;
                    const cred = credentials.find(c => hostname.includes(c.domain) || c.domain.includes(hostname));
                    if (cred) {
                      const plainPass = await ahk.asyncCall('DecryptCredential', cred.passwordBase64);
                      const parsedPass = plainPass ? plainPass.replace(/\\/g, '\\\\').replace(/"/g, '\\"') : '';
                      const js = `
                                  (function() {
                                    const pass = "${parsedPass}";
                                    const userInputs = document.querySelectorAll('input[type="text"], input[type="email"], input[name*="user"], input[name*="email"]');
                                    const passInputs = document.querySelectorAll('input[type="password"]');
                                    if (userInputs.length > 0) { userInputs[0].value = "${cred.username || ""}"; userInputs[0].dispatchEvent(new Event('input', { bubbles: true })); }
                                    if (passInputs.length > 0) { passInputs[0].value = pass; passInputs[0].dispatchEvent(new Event('input', { bubbles: true })); }
                                  })();
                                `;
                      ahk.asyncCall('InjectJS', js);
                      window.showToast("Injected basic credential fallback.", "info");
                    } else {
                      window.showToast('No matching plugin or saved credentials found.', 'error');
                    }
                  }
                } catch(err: any) {
                  window.showToast("Silent UI Error: " + (err.message || String(err)), "error");
                  console.error("Auto-Login UI Click Exception:", err);
                }
              }}
              className="text-xs font-medium text-zinc-400 hover:text-zinc-200 flex items-center gap-1.5 transition-colors shrink-0 px-2 py-1 bg-zinc-800/30 hover:bg-zinc-800/50 rounded-lg"
            >
              <KeyRound size={14} /> Auto-Login (Silent)
            </button>
            <div className="w-1 h-1 rounded-full bg-zinc-700/50 mx-1" />
            <button
              title="Auto Login (Live Foreground Window)"
              onClick={async () => {
                try {
                  const plugin = plugins.find(p => url.includes(p.baseUrl) || (() => { try { return p.baseUrl.includes(new URL(url).hostname); } catch { return false; } })());
                  if (plugin) {
                      const resolvedLoginUrl = plugin.auth?.loginUrl || plugin.baseUrl;
                      const cred = credentials.find(c => {
                          try { return c.domain === new URL(plugin.baseUrl).hostname || c.domain === new URL(resolvedLoginUrl).hostname; } catch(e) { return false; }
                      });
                      
                      if (!cred || (!cred.username && !cred.passwordBase64)) {
                        window.showToast("No credentials found for this plugin's domains.", "error");
                        return;
                      }
                      window.showToast("Initiating LIVE Auto-Login Flow...", "info");
                      const rawPass = await ahk.asyncCall('DecryptCredential', cred.passwordBase64) || '';
                      const { getAutoLoginScript } = await import('../../lib/authHelper');
                      const loginJs = getAutoLoginScript(plugin, cred, rawPass);
                      
                      let targetUrl = resolvedLoginUrl;
                      let waitForLinkJs = "";
                      if (plugin.auth?.loginUrlJs) {
                          targetUrl = plugin.baseUrl; // Start at base URL to let the crawler find the link natively
                          waitForLinkJs = `
                             const isAuthPage = window.location.href.includes('login') || window.location.href.includes('signin') || window.location.href.includes('oauth') || document.querySelector('input[type="password"]');
                             if (!isAuthPage) {
                                 const findLinkIvl = setInterval(() => {
                                      try {
                                          let link = (function() { ${plugin.auth.loginUrlJs} })();
                                          if (link) {
                                              clearInterval(findLinkIvl);
                                              const finalUrl = link.startsWith('http') ? link : new URL(link, window.location.href).toString();
                                              window.location.href = finalUrl;
                                          }
                                      } catch(e) {}
                                 }, 1000);
                             }
                          `;
                      }
                      
                      const tgtDomainStr = String(cred.domain || "");
                      const wrappedJs = `
                         // Immediately abort if navigation left the target credential scope
                         if (window.location.hostname.includes('localhost') || window.location.href.startsWith('about:blank')) {
                             window.top.postMessage({ type: 'bk-live-login-fail', domain: ${JSON.stringify(tgtDomainStr)} }, '*');
                             return;
                         }
                         
                         const tgtDomain = ${JSON.stringify(tgtDomainStr)};
                         const curHost = window.location.hostname.toLowerCase();
                         if (tgtDomain && !curHost.includes(tgtDomain) && !curHost.includes('login') && !curHost.includes('auth') && !curHost.includes('account') && !curHost.includes('signin') && !curHost.includes('oauth')) {
                             window.top.postMessage({ type: 'bk-live-login-fail', domain: tgtDomain }, '*');
                             return;
                         }

                         ${waitForLinkJs}
                         
                         // Prevent parallel evaluation racing using Web Locks!
                         if (window.navigator && window.navigator.locks) {
                             window.navigator.locks.request("bk-live-setup-" + tgtDomain, { mode: "exclusive", ifAvailable: true }, async (lock) => {
                                 if (!lock) { console.log("[AutoLogin] Another parallel tab holds the setup lock for " + tgtDomain + ". Yielding."); return; }
                                 await executeLoginFlow();
                             }).catch(() => executeLoginFlow());
                         } else {
                             executeLoginFlow();
                         }

                         async function executeLoginFlow() {
                              if (window._bkLiveLoginHooked) return;
                              window._bkLiveLoginHooked = true;
                              const loginTask = async function() { ${loginJs} };
                              try {
                                 const result = await loginTask();
                                 if (result) {
                                    window.top.postMessage({ type: 'bk-live-login-success', domain: tgtDomain }, '*');
                                 } else {
                                    window.top.postMessage({ type: 'bk-live-login-fail', domain: tgtDomain }, '*');
                                 }
                              } catch(e) {
                                 window.top.postMessage({ type: 'bk-live-login-fail', domain: tgtDomain }, '*');
                              }
                         }
                      `;
                      
                      ahk.asyncCall('CacheSet', 'bkLiveLogin_' + tgtDomainStr, wrappedJs);
                      
                      ahk.asyncCall('UpdatePlayerUrl', targetUrl);
                  } else {
                      window.showToast('No matching plugin configuration found.', 'error');
                  }
                } catch (e) {
                  console.error(e);
                  window.showToast("An error occurred starting live auto-login.", "error");
                }
              }}
              className="text-xs font-medium text-zinc-400 hover:text-indigo-400 flex items-center gap-1.5 transition-colors shrink-0 px-2 py-1 bg-zinc-800/30 hover:bg-zinc-800/50 rounded-lg"
            >
              <MonitorPlay size={14} /> Live Setup
            </button>
            </div>
          )}
        </div>
      )}


      <div className="w-full flex-1 relative bg-zinc-900 border-none overflow-hidden">
        {(() => {
          if (!isMultiTabEnabled || tilingMode === 'none' || browserTabs.length === 1) {
            return (
              <div className="w-full h-full relative">
                {browserTabs.map(t => (
                  <PlayerSlot
                    key={t.id}
                    tabId={t.id}
                    isVisuallyActive={activeTab === 'player' && t.id === activeBrowserTabId}
                    className={t.id === activeBrowserTabId ? "w-full h-full absolute top-0 left-0 z-10" : "absolute top-0 left-0 w-full h-full z-[-1] opacity-0 pointer-events-none"}
                  />
                ))}
              </div>
            );
          }

          if (tilingMode === 'split-vt') {
            const visibleIds = [browserTabs[0].id, browserTabs[1].id];
            return (
              <div className="w-full h-full relative">
                <div className="flex w-full h-full gap-0.5 bg-zinc-800 relative z-10">
                  <PlayerSlot tabId={visibleIds[0]} isVisuallyActive={activeTab === 'player'} className="flex-1 h-full bg-zinc-900" />
                  <PlayerSlot tabId={visibleIds[1]} isVisuallyActive={activeTab === 'player'} className="flex-1 h-full bg-zinc-900" />
                </div>
                {browserTabs.filter(t => !visibleIds.includes(t.id)).map(t => (
                  <PlayerSlot key={t.id} tabId={t.id} isVisuallyActive={false} className="absolute top-0 left-0 w-full h-full z-[-1] opacity-0 pointer-events-none" />
                ))}
              </div>
            );
          }

          if (tilingMode === 'split-hz') {
            const visibleIds = [browserTabs[0].id, browserTabs[1].id];
            return (
              <div className="w-full h-full relative">
                <div className="flex flex-col w-full h-full gap-0.5 bg-zinc-800 relative z-10">
                  <PlayerSlot tabId={visibleIds[0]} isVisuallyActive={activeTab === 'player'} className="w-full flex-1 bg-zinc-900" />
                  <PlayerSlot tabId={visibleIds[1]} isVisuallyActive={activeTab === 'player'} className="w-full flex-1 bg-zinc-900" />
                </div>
                {browserTabs.filter(t => !visibleIds.includes(t.id)).map(t => (
                  <PlayerSlot key={t.id} tabId={t.id} isVisuallyActive={false} className="absolute top-0 left-0 w-full h-full z-[-1] opacity-0 pointer-events-none" />
                ))}
              </div>
            );
          }

          if (tilingMode === 'grid') {
            const visibleIds = browserTabs.slice(0, 4).map(t => t.id);
            return (
              <div className="w-full h-full relative">
                <div className="grid grid-cols-2 grid-rows-2 w-full h-full gap-0.5 bg-zinc-800 relative z-10">
                  {browserTabs.slice(0, 4).map((t, idx) => (
                    <PlayerSlot key={t.id} tabId={t.id} isVisuallyActive={activeTab === 'player'} className={`w-full h-full bg-zinc-900 overflow-hidden ${browserTabs.length === 3 && idx === 2 ? 'col-span-2' : ''}`} />
                  ))}
                </div>
                {browserTabs.filter(t => !visibleIds.includes(t.id)).map(t => (
                  <PlayerSlot key={t.id} tabId={t.id} isVisuallyActive={false} className="absolute top-0 left-0 w-full h-full z-[-1] opacity-0 pointer-events-none" />
                ))}
              </div>
            );
          }

          return null;
        })()}
      </div>
    </div>

  );
};
