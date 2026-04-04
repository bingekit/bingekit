import { useState, useEffect, useRef } from 'react';
import { ahk } from '../lib/ahk';
import { resolvePluginUrl } from '../lib/urlHelper';
import { ensureAuthForPlugin } from '../lib/authHelper';
import { SitePlugin, Userscript, CustomFlow, CredentialItem, FollowedItem } from '../types';

export function usePluginsState(
  url: string,
  theme: any,
  setNetworkFilters: any,
  credentials: CredentialItem[],
  followedItems: FollowedItem[],
  setFollowedItems: any,
  pluginRepoUrl: string,
  autoCheckPluginUpdates: boolean,
  autoUpdatePlugins: boolean,
  setMultiSearchQuery: any,
  setSearchParamMode: any,
  setActiveTab: any,
  computeNavUrl: (target: string) => string
) {
  const [plugins, setPlugins] = useState<SitePlugin[]>([]);
  const [editingPlugin, setEditingPlugin] = useState<SitePlugin | null>(null);
  const [flows, setFlows] = useState<CustomFlow[]>([]);
  const [editingFlow, setEditingFlow] = useState<CustomFlow | null>(null);
  const [userscripts, setUserscripts] = useState<Userscript[]>([]);
  const [editingUserscriptId, setEditingUserscriptId] = useState<string | null>(null);
  const [pluginUpdateCount, setPluginUpdateCount] = useState(0);
  const [isCheckingUpdates, setIsCheckingUpdates] = useState(false);

  const isInitialPluginCheck = useRef(false);

  // Sync plugin blockers to global network filters
  useEffect(() => {
    if (plugins.length === 0) return;
    setNetworkFilters((prev: Record<string, boolean> | undefined) => {
      const safePrev = prev || {};
      let changed = false;
      const newFilters = { ...safePrev };
      plugins.forEach(p => {
        if (p.enabled === false) return;
        ['networkBlockers'].forEach(key => {
          const blockers = p[key as keyof SitePlugin] as string[];
          if (Array.isArray(blockers)) {
            blockers.forEach(b => {
               if (b && typeof b === 'string' && !newFilters[b]) {
                 newFilters[b] = true;
                 changed = true;
               }
            });
          }
        });
      });
      return changed ? newFilters : safePrev;
    });
  }, [plugins, setNetworkFilters]);
  const loadPlugins = () => {
    const filesStr = ahk.call('ListSites');
    if (filesStr) {
      const files = filesStr.split('|').filter(Boolean);
      const loadedPlugins: SitePlugin[] = [];
      for (const file of files) {
        const data = ahk.call('LoadSite', file);
        if (data) {
          try { loadedPlugins.push(JSON.parse(data)); } catch (e) { }
        }
      }
      setPlugins(loadedPlugins);
    }
  };

  const savePlugin = () => {
    if (!editingPlugin) return;
    const pluginToSave = { ...editingPlugin, id: editingPlugin.id || Date.now().toString() };
    const filename = `${pluginToSave.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${pluginToSave.id}.json`;
    ahk.call('SaveSite', filename, JSON.stringify(pluginToSave, null, 2));
    setEditingPlugin(null);
    loadPlugins();
  };

  const deletePlugin = (plugin: SitePlugin) => {
    const filename = `${plugin.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${plugin.id}.json`;
    ahk.call('DeleteSite', filename);
    if (editingPlugin?.id === plugin.id) setEditingPlugin(null);
    loadPlugins();
  };

  const updateEditingPlugin = (section: keyof SitePlugin | 'root', field: string, value: any) => {
    setEditingPlugin((prev) => {
      if (!prev) return prev;
      if (section === 'root') {
        return { ...prev, [field]: value };
      } else {
        return {
          ...prev,
          [section]: { ...(prev[section as keyof SitePlugin] as any), [field]: value }
        };
      }
    });
  };

  // Sync payload to AHK (Runs on script/plugin changes or URL changes)
  useEffect(() => {
    const activeScripts = userscripts.filter(s => s.enabled);
    let payload = '';

    if (activeScripts.length > 0 || plugins.some(p => p.customCss || p.customJs) || Object.keys(theme).length > 0) {
      payload = `
        (function() {
          window._svPluginStyles = ${JSON.stringify(plugins.map(p => ({ baseUrl: p.baseUrl, css: p.customCss })).filter(p => p.css))};

          function getInjectTarget() {
            return document.head || document.documentElement || document.body;
          }

          function ensureStyles() {
            var target = getInjectTarget();
            if (!target) return;
            
            var currentUrl = window.location.href;
            var currentHost = window.location.hostname;
            if (!currentHost && currentUrl.startsWith('custom:')) currentHost = currentUrl;
            
            window._svPluginStyles.forEach(p => {
              try {
                var pHost = '';
                try { pHost = new URL(p.baseUrl).hostname; } catch(e) { pHost = p.baseUrl; }
                
                var matchP = false;
                if (pHost.startsWith('custom:')) {
                  matchP = pHost.endsWith('*') ? currentUrl.startsWith(pHost.slice(0, -1)) : currentUrl === pHost;
                } else {
                  matchP = currentHost.includes(pHost) || pHost.includes(currentHost) || currentUrl.includes(pHost);
                }
                
                if (matchP && p.css) {
                  var styleId = 'bk-plugin-style-' + pHost;
                  var existingStyle = document.getElementById(styleId);
                  if (!existingStyle) {
                    var style = document.createElement('style');
                    style.id = styleId;
                    style.innerHTML = p.css;
                    target.appendChild(style);
                  } else if (existingStyle.innerHTML !== p.css) {
                    existingStyle.innerHTML = p.css;
                  }
                }
              } catch(e) {}
            });

            var themeVars = \`${Object.entries(theme).filter(([k]) => k !== 'mode').map(([k, v]) => `--theme-${k}: ${v};`).join(' ')}\`;
            var tStyle = document.getElementById('bk-theme-injection');
            if (!tStyle) {
              tStyle = document.createElement('style');
              tStyle.id = 'bk-theme-injection';
              target.appendChild(tStyle);
            }
            if (tStyle.innerHTML !== \`:root { \${themeVars} }\`) {
              tStyle.innerHTML = \`:root { \${themeVars} }\`;
            }
          }

          function applyBingeKitPayload() {
            var currentUrl = window.location.href;
            if (currentUrl.includes('#custom:')) {
              currentUrl = currentUrl.substring(currentUrl.indexOf('#custom:') + 1);
            }
            if (currentUrl === 'about:blank' || currentUrl.startsWith('data:text/html')) {
              currentUrl = 'about:blank';
            }
            var currentHost = window.location.hostname;
            if (!currentHost && currentUrl.startsWith('custom:')) currentHost = currentUrl;
            
            var scripts = ${JSON.stringify(activeScripts)};
            scripts.forEach(s => {
              var matches = s.domains.includes('*') || s.domains.some(d => {
                if (d.startsWith('custom:')) return d.endsWith('*') ? currentUrl.startsWith(d.slice(0, -1)) : currentUrl === d;
                return currentHost.includes(d) || currentUrl.includes(d);
              });
              if (matches) { try { eval(s.code); } catch(e) { console.error('[Userscript Error]', s.name, e); } }
            });
            
            var siteJs = ${JSON.stringify(plugins.map(p => ({ baseUrl: p.baseUrl, js: p.customJs })).filter(p => p.js))};
            siteJs.forEach(p => {
              try {
                var pHost = '';
                try { pHost = new URL(p.baseUrl).hostname; } catch(e) { pHost = p.baseUrl; }
                var matchP = false;
                if (pHost.startsWith('custom:')) {
                  matchP = pHost.endsWith('*') ? currentUrl.startsWith(pHost.slice(0, -1)) : currentUrl === pHost;
                } else {
                  matchP = currentHost.includes(pHost) || pHost.includes(currentHost) || currentUrl.includes(pHost);
                }
                if (matchP && p.js) {
                  try { eval(p.js); } catch(e) { console.error('[Plugin JS Error]', p.baseUrl, e); }
                }
              } catch(e) {}
            });
            
            ensureStyles();
          }

          window._svApplyPayload = applyBingeKitPayload;
          window._svEnsureStyles = ensureStyles;

          function tryInit() {
            if (!getInjectTarget()) {
              setTimeout(tryInit, 50);
              return;
            }
            window._svApplyPayload();
          }
          tryInit();

          if (!window._svStyleEnforcer) {
            window._svStyleEnforcer = setInterval(() => {
              if (window._svEnsureStyles) window._svEnsureStyles();
            }, 2000);
          }

          var playerPlugins = ${JSON.stringify(plugins.filter(p => p.player?.playerSel || p.auth?.checkAuthJs || p.details?.titleSel).map(p => ({
            baseUrl: p.baseUrl,
            playerSel: p.player?.playerSel || '',
            checkAuthJs: p.auth?.checkAuthJs || '',
            titleSel: p.details?.titleSel || ''
          })))};

          if (!window._svPlayerStatusPoller) {
            window._svPlayerStatusPoller = setInterval(() => {
              var currentUrl = window.location.href;
              var currentHost = window.location.hostname;
              if (!currentHost && currentUrl.startsWith('custom:')) currentHost = currentUrl;
              
              var matched = playerPlugins.find(p => {
                  var pHost = '';
                  try { pHost = new URL(p.baseUrl).hostname; } catch(e) { pHost = p.baseUrl; }
                  if (pHost.startsWith('custom:')) {
                    return pHost.endsWith('*') ? currentUrl.startsWith(pHost.slice(0, -1)) : currentUrl === pHost;
                  } else {
                    return currentHost.includes(pHost) || pHost.includes(currentHost) || currentUrl.includes(pHost);
                  }
              });

              var authStr = 'unknown';
              var hasPlayer = false;
              var titleStr = '';
              try { titleStr = document.title; } catch(e) {}

              if (matched) {
                  if (matched.checkAuthJs) {
                      authStr = (function() { try { const res = eval('(function(){' + matched.checkAuthJs + '})()'); return !!res ? 'loggedIn' : 'loggedOut'; } catch(e) { return 'unknown'; } })();
                  }
                  if (matched.playerSel) {
                      try { hasPlayer = !!document.querySelector(matched.playerSel); } catch(e) {}
                  }
                  if (matched.titleSel) {
                      try { 
                           const titleEl = document.querySelector(matched.titleSel);
                           if (titleEl) titleStr = titleEl.textContent.trim();
                      } catch(e) {}
                  }
              }
              
              try {
                if (window.chrome && window.chrome.webview && window.chrome.webview.hostObjects && window.chrome.webview.hostObjects.ahk) {
                    window.chrome.webview.hostObjects.ahk.ReportPlayerStatus(authStr, hasPlayer, titleStr);
                }
              } catch(e) {}
            }, 2000);
          }

          if (!window._svAjaxHooked) {
             window._svAjaxHooked = true;
             const origPush = window.history.pushState;
             window.history.pushState = function() {
                var res = origPush.apply(this, arguments);
                if (window._svApplyPayload) {
                    setTimeout(window._svApplyPayload, 50);
                    setTimeout(window._svEnsureStyles, 500);
                }
                return res;
             };
             const origReplace = window.history.replaceState;
             window.history.replaceState = function() {
                var res = origReplace.apply(this, arguments);
                if (window._svApplyPayload) {
                    setTimeout(window._svApplyPayload, 50);
                    setTimeout(window._svEnsureStyles, 500);
                }
                return res;
             };
             window.addEventListener('popstate', () => { 
                if (window._svApplyPayload) {
                    setTimeout(window._svApplyPayload, 50);
                    setTimeout(window._svEnsureStyles, 500);
                }
             });
          }
        })();
      `;
    }
    ahk.call('UpdateUserscriptPayload', payload);
  }, [userscripts, plugins, url, theme]);


  const checkPluginUpdates = async () => {
    if (!pluginRepoUrl) return;
    try {
      const result = ahk.call("RawFetchHTML", pluginRepoUrl);
      if (result) {
        const repoData = JSON.parse(result);
        const updates: { id: string, zipUrl: string }[] = [];

        repoData.plugins?.forEach((rp: any) => {
          const local = plugins.find(lp => lp.id === rp.id);
          if (local && local.version && rp.version && local.version !== rp.version && rp.zipUrl) {
            updates.push({ id: rp.id, zipUrl: rp.zipUrl });
          }
        });

        setPluginUpdateCount(updates.length);

        if (updates.length > 0 && autoUpdatePlugins) {
          setTimeout(() => {
            let installedAny = false;
            updates.forEach(u => {
              const success = ahk.call("InstallExtensionZip", u.zipUrl, "sites");
              if (success === "true" || success === true || success === 1) installedAny = true;
            });
            if (installedAny) {
              loadPlugins();
              setPluginUpdateCount(0);
            }
          }, 100);
        }
      }
    } catch (e) { }
  };

  const checkForUpdates = async () => {
    setIsCheckingUpdates(true);
    const updatedItems = [...followedItems];

    for (let i = 0; i < updatedItems.length; i++) {
      const item = updatedItems[i];
      const plugin = plugins.find(p => p.id === item.siteId);
      if (!plugin) continue;

      let trackingConf = item.trackingFlowId && plugin.trackingFlows ? plugin.trackingFlows.find(t => t.id === item.trackingFlowId) : null;
      if (!trackingConf && plugin.trackingFlows && plugin.trackingFlows.length > 0) {
        trackingConf = plugin.trackingFlows.find(t => t.urlRegex && new RegExp(t.urlRegex).test(item.url)) || plugin.trackingFlows[0];
      }
      if (!trackingConf) trackingConf = plugin.tracking; // Fallback

      if (trackingConf && trackingConf.listSel && trackingConf.itemSel && (window as any).SmartFetch) {
        try {
          const authValid = await ensureAuthForPlugin(plugin, credentials);
          if (!authValid && plugin.auth?.loginUrl) {
            console.warn("Auto-login failed for", plugin.name, "skipping updates");
            continue;
          }

          const js = `
            const items = Array.from(document.querySelectorAll('${trackingConf.itemSel.replace(/'/g, "\\\\'")}'));
            return items.map(el => {
               try {
                 return {
                   id: (function(){ ${trackingConf.idExtractJs || "return '';"} })(),
                   title: (function(){ ${trackingConf.titleExtractJs || "return '';"} })(),
                   url: (function(){ ${trackingConf.urlExtractJs || "return '';"} })(),
                   status: (function(){ ${trackingConf.statusExtractJs || "return 'released';"} })()
                 };
               } catch(e) { return null; }
            }).filter(i => i && i.id);
          `;
          const results = await (window as any).SmartFetch(item.url, js);
          if (Array.isArray(results) && results.length > 0) {
            const newLatest = results[0]?.id || ''; 
            if (item.latestAvailable !== newLatest) {
              item.hasUpdate = true;
              item.latestAvailable = newLatest;
            }
            if (!item.watchedEpisodes) item.watchedEpisodes = [];
            const unwatched = results.filter(r => !item.watchedEpisodes?.includes(r.id));
            if (unwatched.length > 0) item.hasUpdate = true;
            item.knownCount = results.length;
          }
        } catch (e) {
          console.error("Tracking update failed", e);
        }
      } else {
        const html = ahk.call('RawFetchHTML', item.url);
        if (!html) continue;
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        if (item.type === 'tv' && plugin.media.epSel) {
          const eps = doc.querySelectorAll(plugin.media.epSel);
          if (eps.length > item.knownCount) { item.knownCount = eps.length; item.hasUpdate = true; }
        } else if (item.type === 'film' && plugin.player.playerSel) {
          const player = doc.querySelector(plugin.player.playerSel);
          if (player && item.knownCount === 0) { item.knownCount = 1; item.hasUpdate = true; }
        }
      }
    }

    setFollowedItems(updatedItems);
    setIsCheckingUpdates(false);
  };

  const runFlow = async (flow: CustomFlow, multiSearchQuery: string, initialUrl: string = url, customVars: Record<string, string> = {}) => {
    let currentVar = initialUrl;
    let actualVars = { ...customVars };

    if (flow.variables && flow.variables.length > 0) {
      for (const vName of flow.variables) {
        if (!actualVars[vName]) {
          const val = await window.showPrompt(`Please provide value for variable: {${vName}}`, "");
          if (val === null) {
            window.showToast?.("Flow evaluation cancelled.", "error");
            return;
          }
          actualVars[vName] = val || "";
        }
      }
    }

    console.log('Running flow:', flow.name, 'with inputs:', actualVars);

    const resolveVars = async (str: string) => {
      if (!str) return str;
      let res = str.replace(/\\{\\{CURRENT_URL\\}\\}/g, url)
        .replace(/\\{\\{PREV\\}\\}/g, currentVar)
        .replace(/\\{\\{SEARCH\\}\\}/g, multiSearchQuery);

      Object.entries(actualVars).forEach(([key, val]) => {
        res = res.replace(new RegExp(`\\{${key}\\}`, 'g'), val);
      });

      const promptRegex = /\\{\\{prompt:([^}]+)\\}\\}/g;
      let match;
      while ((match = promptRegex.exec(res)) !== null) {
        const promptTitle = match[1];
        const userInput = await window.showPrompt(`Flow Input Required:\n${promptTitle}`, "");
        if (userInput === null) throw new Error("Flow evaluation cancelled.");
        res = res.replace(match[0], userInput || "");
      }
      return res;
    };

    // Yield to the event loop so React can flush the DOM and close the modal before heavy/synchronous COM calls begin
    await new Promise(resolve => setTimeout(resolve, 150));

    try {
      for (let i = 0; i < flow.steps.length; i++) {
        const step = flow.steps[i];
        
        console.log(`[Flow Evaluator] Executing step ${i + 1}/${flow.steps.length}: [${step.type}]`, step);
        
        try {
          if (step.type === 'navigate') {
        const dest = await resolveVars(step.params.url || '');
        let navUrl = computeNavUrl(dest);
        ahk.call('UpdatePlayerUrl', navUrl);
        currentVar = dest;
        await new Promise(r => setTimeout(r, 1500));
      } else if (step.type === 'inject') {
        const code = await resolveVars(step.params.code || '');
        ahk.call('InjectJS', code);
      } else if (step.type === 'waitForElement') {
        const selector = await resolveVars(step.params.selector || '');
        let found = false;
        let attempts = 0;
        while (!found && attempts < 50) { // Max 5 seconds
          const js = `
             (function() {
                try {
                   return !!document.querySelector('${selector.replace(/'/g, "\\\\'")}');
                } catch(e) {
                   return false;
                }
             })()
          `;
          try {
            const res = await ahk.call('EvalPlayerJS', js);
            if (res === 'true') { found = true; break; }
          } catch (e: any) { 
            console.error('EvalPlayerJS failed:', e);
          }
          await new Promise(r => setTimeout(r, 100)); // Yields to event loop
          attempts++;
        }
        if (!found) throw new Error(`Timeout waiting for element: ${selector}`);
      } else if (step.type === 'interact') {
        const selector = await resolveVars(step.params.selector || '');
        const actionType = step.params.actionType || 'click';
        const value = await resolveVars(step.params.value || '');

        const jsCode = `
          (function() {
            try {
              var el = document.querySelector('${selector.replace(/'/g, "\\\\'")}');
              if (el) {
                ${actionType === 'setValue' ? `
                   el.value = '${value.replace(/'/g, "\\\\'")}';
                   el.dispatchEvent(new Event('input', {bubbles: true}));
                   el.dispatchEvent(new Event('change', {bubbles: true}));
                   if (el.tagName === 'FORM') el.submit();
                ` : `el.click();`}
                return true;
              }
              return false;
            } catch(e) {
              return false;
            }
          })();
        `;
        ahk.call('InjectJS', jsCode);
        await new Promise(r => setTimeout(r, 200));
      } else if (step.type === 'RawFetchHTML') {
        const fetchUrl = await resolveVars(step.params.url || '');
        const html = ahk.call('RawFetchHTML', fetchUrl);
        currentVar = html;
      } else if (step.type === 'callFlow') {
        const targetFlowId = await resolveVars(step.params.flowId || '');
        const targetFlow = flows.find(f => f.id === targetFlowId);
        if (targetFlow) await runFlow(targetFlow, multiSearchQuery, currentVar);
      } else if (step.type === 'pluginAction') {
        const targetPluginId = await resolveVars(step.params.pluginId || '');
        const actionName = await resolveVars(step.params.actionName || '');
        try {
          const res = await (window as any).RunPluginFunction(targetPluginId, actionName, currentVar);
          currentVar = (typeof res === 'object') ? JSON.stringify(res) : String(res);
        } catch (e: any) { 
          throw new Error(`Plugin Action Failed: ${e.message || String(e)}`);
        }
      } else if (step.type === 'callPlugin') {
        const targetPluginId = await resolveVars(step.params.pluginId || '');
        const targetPlugin = plugins.find(p => p.id === targetPluginId);
        if (targetPlugin && targetPlugin.search?.urlFormat) {
          const sq = await resolveVars(step.params.query || currentVar);
          const resolvedFormat = resolvePluginUrl(targetPlugin.baseUrl, targetPlugin.search.urlFormat);
          const pUrl = resolvedFormat.replace('{query}', encodeURIComponent(sq));
          setMultiSearchQuery(sq);
          setSearchParamMode('fetch');
          setActiveTab('dashboard');
          setTimeout(() => {
            const input = document.getElementById('search-input');
            if (input) input.focus();
          }, 100);
        }
      } else if (step.type === 'smartFetch') {
        const targetUrl = await resolveVars(step.params.url || '');
        const targetPluginId = await resolveVars(step.params.pluginId || '');
        const targetPlugin = plugins.find(p => p.id === targetPluginId);

        if (targetPlugin && targetUrl && (window as any).SmartFetch) {
          const jsQuery = `
              return (function() {
                 try {
                    const items = Array.from(document.querySelectorAll('${targetPlugin.search?.itemSel?.replace(/'/g, "\\\\'") || 'body'}'));
                    return items.slice(0, 10).map(item => {
                       try {
                          let el = item.querySelector('${targetPlugin.search?.titleSel?.replace(/'/g, "\\\\'") || ''}');
                          const title = el ? el.textContent.trim() : '';
                          el = item.querySelector('${targetPlugin.search?.linkSel?.replace(/'/g, "\\\\'") || ''}');
                          const href = el ? el.getAttribute('href') : '';
                          return { title, href };
                       } catch(ea) { return { title: '', href: '' }; }
                    });
                 } catch(e) {
                    return [];
                 }
              })();
           `;
          const res = await (window as any).SmartFetch(targetUrl, jsQuery);
          if (res) currentVar = typeof res === 'object' ? JSON.stringify(res) : String(res);
        }
      } else if (step.type === 'customSmartFetch') {
        const targetUrl = await resolveVars(step.params.url || '');
        const jsCode = await resolveVars(step.params.code || 'return [];');

        if (targetUrl && (window as any).SmartFetch) {
          const jsQuery = `
             return new Promise(async (resolve) => {
               try {
                 const res = await (async () => {
                   ${jsCode}
                 })();
                 resolve(res);
               } catch(e) {
                 resolve({ error: e.message || String(e) });
               }
             });
           `;
          const res = await (window as any).SmartFetch(targetUrl, jsQuery);
          currentVar = typeof res === 'object' ? JSON.stringify(res) : String(res);
        }
      } else if (step.type === 'wait') {
        const msStr = await resolveVars(step.params.ms || '1000');
        const ms = parseInt(msStr) || 1000;
        await new Promise(r => setTimeout(r, ms));
      }
        
        // Yield after every single step so React can process updates and UI won't lock!
        await new Promise(r => setTimeout(r, 10));

        } catch (stepError: any) {
             throw new Error(`[Step ${i + 1} - ${step.type}] failed: ${stepError.message}`);
        }
    }
    window.showToast?.(`Flow "${flow.name}" completed successfully.`, "success");
    return currentVar;
  } catch (e: any) {
    console.error(e);
    window.showToast?.(e.message || "Flow evaluation failed.", "error");
    return null;
  }
};

  useEffect(() => {
    if (autoCheckPluginUpdates && plugins.length > 0 && !isInitialPluginCheck.current) {
      isInitialPluginCheck.current = true;
      checkPluginUpdates();
    }
  }, [plugins.length, autoCheckPluginUpdates, pluginRepoUrl]);

  return {
    plugins, setPlugins,
    editingPlugin, setEditingPlugin,
    flows, setFlows,
    editingFlow, setEditingFlow,
    userscripts, setUserscripts,
    editingUserscriptId, setEditingUserscriptId,
    pluginUpdateCount, setPluginUpdateCount,
    isCheckingUpdates, setIsCheckingUpdates,
    loadPlugins, savePlugin, deletePlugin, updateEditingPlugin,
    checkForUpdates, checkPluginUpdates, runFlow
  };
}
