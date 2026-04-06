import React, { useState } from 'react';
import { Search, Plus, Trash2, RefreshCw } from 'lucide-react';
import { CustomCheckbox } from '../../ui/CustomCheckbox';
import { CustomSelect } from '../../ui/CustomSelect';
import { SearchConfig, CustomFlow } from '../../../types';
import { resolvePluginUrl } from '../../../lib/urlHelper';

export const SearchConfigEditor = ({
  config,
  onChange,
  flows,
  testSearchQuery,
  setTestSearchQuery,
  baseUrl = ''
}: {
  config: any; // using any to support both SitePlugin.search and SearchConfig
  onChange: (key: string, val: any) => void;
  flows: CustomFlow[];
  testSearchQuery: string;
  setTestSearchQuery: (val: string) => void;
  baseUrl?: string;
}) => {
  const [isTestingSearch, setIsTestingSearch] = useState(false);
  const [testSearchResults, setTestSearchResults] = useState<{ status: string, nodesCount: number, results: any[] }>({ status: 'idle', nodesCount: 0, results: [] });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-4 pb-4 border-b border-zinc-800/50">
        <CustomCheckbox
          checked={!!config.delegateFlowId}
          onChange={(val) => {
            if (val) {
              onChange('delegateFlowId', flows[0]?.id || '');
              onChange('delegateFlowInputs', {});
            } else {
              onChange('delegateFlowId', undefined);
              onChange('delegateFlowInputs', undefined);
            }
          }}
        />
        <span className="text-sm font-medium text-accent">Delegate execution to a Custom Flow</span>
      </div>

      {config.delegateFlowId ? (
        <div className="space-y-4 p-4 bg-accent/5 border border-accent/20 rounded-lg">
          <div>
            <label className="block text-xs text-accent mb-1.5">Target Flow</label>
            <CustomSelect
              searchable
              options={flows.map(f => ({ label: f.name, value: f.id }))}
              value={config.delegateFlowId}
              onChange={(val) => onChange('delegateFlowId', val)}
            />
          </div>

          {(() => {
            const selectedFlow = flows.find(f => f.id === config.delegateFlowId);
            if (!selectedFlow || !selectedFlow.variables || selectedFlow.variables.length === 0) {
              return <div className="text-xs text-zinc-500 pt-2">This flow does not accept any variables.</div>;
            }
            return (
              <div className="pt-2 border-t border-accent/20 space-y-3">
                <label className="block text-xs text-accent mb-1.5">Map Flow Variables</label>
                {selectedFlow.variables.map(v => {
                  const valStr = config.delegateFlowInputs?.[v] || '';
                  const isSel = valStr.startsWith('selector:');
                  const isJs = valStr.startsWith('js:');
                  const type = isSel ? 'selector' : isJs ? 'js' : 'string';
                  const cleanVal = isSel ? valStr.substring(9) : isJs ? valStr.substring(3) : valStr;

                  return (
                    <div key={v} className="flex gap-2 items-start">
                      <span className="text-xs text-zinc-400 w-1/4 truncate font-mono mt-2">{v}</span>
                      <div className="flex-1 flex flex-col gap-2">
                        <select
                          className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1.5 text-xs text-zinc-200 outline-none hover:border-zinc-700 transition-colors"
                          value={type}
                          onChange={(e) => {
                            const newType = e.target.value;
                            const prefix = newType === 'selector' ? 'selector:' : newType === 'js' ? 'js:' : '';
                            const inputs = { ...(config.delegateFlowInputs || {}) };
                            inputs[v] = prefix + cleanVal;
                            onChange('delegateFlowInputs', inputs);
                          }}
                        >
                          <option value="string">String / Native (e.g. {'{url}'})</option>
                          <option value="selector">CSS Selector (on current page)</option>
                          <option value="js">JavaScript (evaluated on page)</option>
                        </select>
                        <input
                          type="text"
                          placeholder={type === 'selector' ? 'img.poster@src' : type === 'js' ? 'return document.title;' : '{query}'}
                          value={cleanVal}
                          onChange={(e) => {
                            const prefix = type === 'selector' ? 'selector:' : type === 'js' ? 'js:' : '';
                            const inputs = { ...(config.delegateFlowInputs || {}) };
                            inputs[v] = prefix + e.target.value;
                            onChange('delegateFlowInputs', inputs);
                          }}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1.5 text-xs text-zinc-200 focus:border-accent outline-none font-mono"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      ) : (
        <>
          <div className="flex items-center gap-3 mb-2">
            <CustomCheckbox
              checked={config.isFormSearch || false}
              onChange={(val) => onChange('isFormSearch', val)}
            />
            <span className="text-sm text-zinc-300">Use Form Search instead of URL Formatting</span>
          </div>

          {!config.isFormSearch ? (
            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">Search URL Format (use {'{query}'})</label>
              <input
                type="text" value={config.urlFormat || ''} placeholder="https://site.com/search?q={query} OR /search?q={query}"
                onChange={(e) => onChange('urlFormat', e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-accent outline-none font-mono"
              />
            </div>
          ) : (
            <div className="space-y-4 border border-zinc-800/80 rounded-lg p-4 bg-zinc-950/30">
              <div>
                <label className="block text-xs text-zinc-500 mb-1.5">Form Page URL (Start URL)</label>
                <input
                  type="text" value={config.urlFormat || ''} placeholder="https://site.com/ OR /start"
                  onChange={(e) => onChange('urlFormat', e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-accent outline-none font-mono"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-zinc-500 mb-1.5">Input Selector</label>
                  <input
                    type="text" value={config.formInputSel || ''} placeholder="input[name='q']"
                    onChange={(e) => onChange('formInputSel', e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-accent outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1.5">Submit Selector</label>
                  <input
                    type="text" value={config.formSubmitSel || ''} placeholder="button[type='submit']"
                    onChange={(e) => onChange('formSubmitSel', e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-accent outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1.5">Submission Wait Mode</label>
                  <select
                    value={config.searchWaitMode || 'navigation'}
                    onChange={(e) => onChange('searchWaitMode', e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-accent outline-none"
                  >
                    <option value="navigation">Navigation (Page Reloads)</option>
                    <option value="ajax">AJAX / Popup (No Reload)</option>
                  </select>
                </div>
                {config.searchWaitMode === 'ajax' && (
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1.5">AJAX Delay (ms)</label>
                    <input
                      type="number" value={config.formSubmitDelay || 2000}
                      onChange={(e) => onChange('formSubmitDelay', parseInt(e.target.value))}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-accent outline-none font-mono"
                    />
                  </div>
                )}
              </div>
              <div className="pt-2 border-t border-zinc-800/80">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs text-zinc-500">Extra Form Actions (Before Submit)</label>
                  <button
                    onClick={() => {
                      const newActions = [...(config.formExtraActions || []), { id: Date.now().toString(), selector: '', action: 'setValue', value: '' }];
                      onChange('formExtraActions', newActions);
                    }}
                    className="text-[10px] bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-2 py-1 rounded flex items-center gap-1"
                  >
                    <Plus size={12} /> Add Action
                  </button>
                </div>
                <div className="space-y-2">
                  {(config.formExtraActions || []).map((act: any, idx: number) => (
                    <div key={act.id || idx} className="flex gap-2 items-center">
                      <input
                        type="text" placeholder="Selector" value={act.selector}
                        onChange={(e) => {
                          const arr = [...config.formExtraActions!];
                          arr[idx].selector = e.target.value;
                          onChange('formExtraActions', arr);
                        }}
                        className="flex-1 bg-zinc-900 border border-zinc-800 rounded px-2 py-1.5 text-xs text-zinc-200 focus:border-accent outline-none font-mono"
                      />
                      <select
                        value={act.action}
                        onChange={(e) => {
                          const arr = [...config.formExtraActions!];
                          arr[idx].action = e.target.value;
                          onChange('formExtraActions', arr);
                        }}
                        className="w-28 bg-zinc-900 border border-zinc-800 rounded px-2 py-1.5 text-xs text-zinc-200 focus:border-accent outline-none"
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
                          const arr = [...config.formExtraActions!];
                          arr[idx].value = e.target.value;
                          onChange('formExtraActions', arr);
                        }}
                        style={{ display: ['setValue', 'setAttribute', 'removeAttribute'].includes(act.action) ? 'block' : 'none' }}
                        className="w-32 bg-zinc-900 border border-zinc-800 rounded px-2 py-1.5 text-xs text-zinc-200 focus:border-accent outline-none font-mono"
                      />
                      <button
                        onClick={() => {
                          const arr = config.formExtraActions!.filter((_: any, i: number) => i !== idx);
                          onChange('formExtraActions', arr);
                        }}
                        className="p-1.5 text-zinc-500 hover:text-accent hover:bg-accent/10 rounded transition-colors"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="bg-zinc-800/40 border border-zinc-700/50 rounded-lg p-3 mb-4 text-xs text-zinc-400">
            <strong className="text-zinc-300">Pro Tip:</strong> Prefix any selector below with <code className="text-zinc-300 bg-zinc-900 px-1 py-0.5 rounded">js:</code> to run a JavaScript expression instead of a CSS query. (e.g. <code className="text-zinc-300 bg-zinc-900 px-1 py-0.5 rounded">js: return el.href;</code> or <code className="text-zinc-300 bg-zinc-900 px-1 py-0.5 rounded">js: return [];</code> for items)
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">List Item Selector</label>
              <input
                type="text" value={config.itemSel || ''} placeholder=".result-item"
                onChange={(e) => onChange('itemSel', e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-accent outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">Title Selector</label>
              <input
                type="text" value={config.titleSel || ''} placeholder=".title > a"
                onChange={(e) => onChange('titleSel', e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-accent outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">Link Selector</label>
              <input
                type="text" value={config.linkSel || ''} placeholder="a.play-btn"
                onChange={(e) => onChange('linkSel', e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-accent outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">Thumbnail Selector</label>
              <input
                type="text" value={config.imgSel || ''} placeholder="img.poster"
                onChange={(e) => onChange('imgSel', e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-accent outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">Year Selector</label>
              <input
                type="text" value={config.yearSel || ''} placeholder=".year"
                onChange={(e) => onChange('yearSel', e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-accent outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">Type Selector</label>
              <input
                type="text" value={config.typeSel || ''} placeholder=".type"
                onChange={(e) => onChange('typeSel', e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-accent outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">Cost/Price Selector</label>
              <input
                type="text" value={config.costSel || ''} placeholder=".price"
                onChange={(e) => onChange('costSel', e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-accent outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">Rent/Buy Status Selector</label>
              <input
                type="text" value={config.rentBuySel || ''} placeholder=".purchase-type"
                onChange={(e) => onChange('rentBuySel', e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-accent outline-none font-mono"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-zinc-500 mb-1.5">Price/Cost JS Extractor (optional)</label>
              <input
                type="text" value={config.priceExtractJs || ''} placeholder="return el ? el.textContent.replace('$', '') : '';"
                onChange={(e) => onChange('priceExtractJs', e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-accent outline-none font-mono"
              />
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-zinc-800/50">
            <h4 className="text-sm font-medium text-zinc-300 mb-3 flex items-center justify-between">
              SmartFetch Selector Tester
              {isTestingSearch && <RefreshCw size={14} className="text-accent animate-spin" />}
            </h4>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={testSearchQuery}
                onChange={(e) => setTestSearchQuery(e.target.value)}
                placeholder="Enter a search query to test (e.g. matrix)"
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 outline-none focus:border-accent"
              />
              <button
                onClick={async () => {
                  if (!testSearchQuery) return;
                  setIsTestingSearch(true);
                  try {
                    const isFormSearch = !!config.isFormSearch;
                    let rawUrl = isFormSearch
                      ? config.urlFormat
                      : (config.urlFormat || '').replace('{query}', encodeURIComponent(testSearchQuery));

                    const startUrl = resolvePluginUrl(baseUrl, rawUrl);

                    if (!startUrl || !startUrl.startsWith('http')) {
                      setTestSearchResults({ status: 'error', nodesCount: 0, results: [{ error: 'Invalid URL Format configured.' }] });
                      setIsTestingSearch(false);
                      return;
                    }

                    const encodedExtras = JSON.stringify(config.formExtraActions || []);

                    const pluginConfigString = JSON.stringify({
                      itemSel: config.itemSel || '',
                      titleSel: config.titleSel || '',
                      linkSel: config.linkSel || '',
                      costSel: config.costSel || '',
                      rentBuySel: config.rentBuySel || ''
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
                          try { return new Function('el', code)(el); } catch(e) { return 'ERR: ' + e.message; }
                        }
                        if (selector.startsWith('()=>')) {
                          try { return eval(selector.slice(4))(el); } catch(e) { return 'ERR: ' + e.message; }
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
                        if (attr) { return targetEl.getAttribute(attr) || ''; }
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
                            try { items = new Function(code)() || []; } catch(e) { console.error('item list err', e); }
                        } else if (itemSel.startsWith('()=>')) {
                            try { items = eval(itemSel.slice(4))() || []; } catch(e) {}
                        } else {
                            items = Array.from(document.querySelectorAll(itemSel || 'body'));
                        }
                        
                        const parsed = items.map(item => {
                          let title = extractValue(item, pluginConfig.titleSel, null);
                          let href = extractValue(item, pluginConfig.linkSel, 'href');
                          let cost = extractValue(item, pluginConfig.costSel, null);
                          let rentBuy = extractValue(item, pluginConfig.rentBuySel, null);
                          if (href && !href.startsWith('http') && !href.startsWith('ERR:')) {
                            try { href = new URL(href, '${rawUrl}').href; } catch(e) {}
                          }
                          return {
                            title,
                            href,
                            cost,
                            rentBuy,
                            htmlPreview: (item && item.nodeType) ? item.outerHTML.substring(0, 150) + '...' : JSON.stringify(item)
                          };
                        });
                        
                        const validResults = parsed.filter(p => (p.title || p.href) && !p.href.startsWith('ERR:'));
                        const results = (validResults.length > 0 ? validResults : parsed).slice(0, 5);
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
                          const isAjax = "${config.searchWaitMode}" === "ajax";
                          const query = "${testSearchQuery.replace(/"/g, '\\"')}";
                          const extras = ${encodedExtras};
                          
                          if (sessionStorage.getItem('bk_test_phase')) {
                            sessionStorage.removeItem('bk_test_phase');
                            setTimeout(() => resolve(scrapeItems()), 1000);
                            return;
                          }
                          
                          const inputSel = "${(config.formInputSel || '').replace(/"/g, '\\"')}";
                          const submitSel = "${(config.formSubmitSel || '').replace(/"/g, '\\"')}";
                          
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
                              console.log('[SmartFetch Debug] AJAX Mode: Clicking submit and waiting ${config.formSubmitDelay || 2000}ms');
                              submit.click();
                              setTimeout(() => {
                                console.log('[SmartFetch Debug] AJAX Delay finished, scraping items...');
                                resolve(scrapeItems());
                              }, ${config.formSubmitDelay || 2000});
                            } else {
                              console.log('[SmartFetch Debug] Navigation Mode: Setting session marker and clicking submit');
                              sessionStorage.setItem('bk_test_phase', '1');
                              submit.click();
                              // Fallback: If navigation doesn't happen within 8 seconds, resolve to avoid hanging
                              setTimeout(() => {
                                console.log('[SmartFetch Debug] Navigation timeout (8s) hit! Resolving to prevent hang.');
                                sessionStorage.removeItem('bk_test_phase');
                                resolve({ count: 0, items: [{ error: 'Navigation timeout - page did not reload' }] });
                              }, 8000);
                            }
                          } else {
                            if (submitSel) console.warn('[SmartFetch Debug] Submit selector was provided but element not found:', submitSel);
                            console.log('[SmartFetch Debug] No submit element, falling back to basic wait and scrape.');
                            setTimeout(() => resolve(scrapeItems()), ${config.formSubmitDelay || 2000});
                          }
                        });
                      } else {
                        return scrapeItems();
                      }
                    `;
                    const fetchResults: any = await (window as any).SmartFetch(startUrl, jsQuery);
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
                className="px-4 py-2 bg-accent/20 text-accent font-medium text-sm rounded-lg hover:bg-accent/30 transition-colors whitespace-nowrap"
              >
                Test Fetch
              </button>
            </div>

            {testSearchResults.status !== 'idle' && (
              <div className="bg-zinc-950 rounded-lg border border-zinc-800/80 p-3 overflow-y-auto max-h-64 no-scrollbar">
                <div className="text-xs font-mono text-zinc-400 mb-2 border-b border-zinc-800/50 pb-2 flex justify-between">
                  <span>Nodes Scraped By itemSel (<span className="text-white">{config.itemSel || 'body'}</span>): <span className={testSearchResults.nodesCount > 0 ? "text-accent" : "text-accent"}>{testSearchResults.nodesCount}</span></span>
                </div>
                <pre className="text-[10px] text-zinc-300 font-mono whitespace-pre-wrap break-all">
                  {JSON.stringify(testSearchResults.results, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
