import React, { useState } from 'react';
import { ShieldOff, Trash2, Plus, ChevronDown } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { TagsInput } from '../ui/TagsInput';

const collapsibleStateMap = new Map<string, boolean>();
export const CollapsibleSection = ({ title, children, defaultOpen = false }: any) => {
const [isOpen, setIsOpen] = useState(() => collapsibleStateMap.has(title) ? collapsibleStateMap.get(title) : defaultOpen);
  
  const toggle = () => {
    const next = !isOpen;
    setIsOpen(next);
    collapsibleStateMap.set(title, next);
  };

  return (
    <div className="border border-[color-mix(in_srgb,var(--theme-border)_50%,transparent)] rounded-lg overflow-hidden">
      <button onClick={toggle} className="w-full flex items-center justify-between p-3 bg-[color-mix(in_srgb,var(--theme-text-main)_3%,transparent)] hover:bg-[color-mix(in_srgb,var(--theme-text-main)_5%,transparent)] transition-colors text-sm font-medium text-[var(--theme-text-main)]">
        {title}
        <ChevronDown size={16} className={`transition-transform text-[var(--theme-text-sec)] ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="p-4 bg-[color-mix(in_srgb,var(--theme-text-main)_1%,transparent)] border-t border-[color-mix(in_srgb,var(--theme-border)_50%,transparent)]">
          {children}
        </div>
      )}
    </div>
  );
};

export const SettingsAdblockTab = () => {
  const {
    isAdblockEnabled, setIsAdblockEnabled,
    networkFilters, setNetworkFilters,
    adKeywords, setAdKeywords,
    redirectKeywords, setRedirectKeywords,
    inlineKeywords, setInlineKeywords,
    cssAdblockSelectors, setCssAdblockSelectors,
    adblockWhitelist, setAdblockWhitelist
  } = useAppContext();

  return (
    <>
      <div className="space-y-6 animate-in fade-in duration-300">
            <h3 className="text-xl font-medium text-[var(--theme-text-main)] mb-6 hidden md:block">Adblocker & Content Filters</h3>

            <div className="p-5 bg-[color-mix(in_srgb,var(--theme-text-main)_2%,transparent)] border border-[color-mix(in_srgb,var(--theme-border)_50%,transparent)] rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-medium text-[var(--theme-text-main)]">Native Adblocker & Filters</h3>
                  <p className="text-xs text-[var(--theme-text-sec)] mt-1">Filters network requests and injects element blockers.</p>
                </div>
                <button
                  onClick={() => setIsAdblockEnabled(!isAdblockEnabled)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${isAdblockEnabled ? 'bg-emerald-500' : 'bg-[color-mix(in_srgb,var(--theme-text-main)_15%,transparent)]'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${isAdblockEnabled ? 'left-7' : 'left-1'}`} />
                </button>
              </div>

              <div className="space-y-4 pt-4 border-t border-[color-mix(in_srgb,var(--theme-border)_50%,transparent)]">
                <CollapsibleSection title="Web Resource Event Filters" defaultOpen={true}>
                  <p className="text-xs text-[var(--theme-text-sec)] mb-3">Hard-blocks these domains/paths from ever resolving in the webview.</p>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                    {Object.entries(networkFilters || {}).map(([term, enabled]) => (
                      <label key={term} className={`group flex items-center gap-2 p-2 rounded-lg border transition-all cursor-pointer ${enabled ? 'bg-[color-mix(in_srgb,var(--theme-accent)_10%,transparent)] border-[color-mix(in_srgb,var(--theme-accent)_30%,transparent)]' : 'bg-[color-mix(in_srgb,var(--theme-text-main)_5%,transparent)] border-[color-mix(in_srgb,var(--theme-border)_50%,transparent)] grayscale opacity-70 hover:opacity-100 hover:grayscale-0'}`}>
                        <div className={`w-4 h-4 rounded flex-shrink-0 flex items-center justify-center border transition-all ${enabled ? 'border-[var(--theme-accent)] bg-[var(--theme-accent)]' : 'border-[color-mix(in_srgb,var(--theme-text-main)_30%,transparent)] bg-transparent'}`}>
                          {enabled && <div className="w-1.5 h-1.5 bg-white rounded-full scale-100" />}
                        </div>
                        <span className={`text-xs font-mono truncate min-w-0 flex-1 transition-colors ${enabled ? 'text-[var(--theme-accent)]' : 'text-[var(--theme-text-main)]'}`}>{term}</span>
                        <input type="checkbox" className="hidden" checked={enabled} onChange={(e) => {
                          setNetworkFilters(prev => ({ ...prev, [term]: e.target.checked }));
                        }} />
                        <button onClick={(e) => {
                          e.preventDefault(); e.stopPropagation();
                          const newFilters = { ...networkFilters }; delete newFilters[term];
                          setNetworkFilters(newFilters);
                        }} className="opacity-0 group-hover:opacity-100 text-red-500 hover:bg-red-500/20 p-1 rounded transition-all">
                          <Trash2 size={12} />
                        </button>
                      </label>
                    ))}
                    <div className="flex items-center gap-2 p-1 pl-2 rounded-lg border border-dashed border-[color-mix(in_srgb,var(--theme-border)_50%,transparent)] bg-[color-mix(in_srgb,var(--theme-text-main)_3%,transparent)] focus-within:border-[var(--theme-accent)] transition-colors">
                      <Plus size={14} className="text-[var(--theme-text-sec)]" />
                      <input type="text" placeholder="Add network rule..." className="bg-transparent border-none outline-none text-xs font-mono text-[var(--theme-text-main)] w-full py-1 placeholder:text-[var(--theme-text-sec)] placeholder:opacity-50"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const val = e.currentTarget.value.trim();
                            if (val) { setNetworkFilters(prev => ({ ...(prev || {}), [val]: true })); e.currentTarget.value = ''; }
                          }
                        }} />
                    </div>
                  </div>
                </CollapsibleSection>

                <CollapsibleSection title="Source Attribute Keywords (Script SRC)">
                  <p className="text-xs text-[var(--theme-text-sec)] mb-3">Dynamically injected scripts with these paths will be blocked via element creation hooks.</p>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                    {Object.entries(adKeywords || {}).map(([term, enabled]) => (
                      <label key={term} className={`group flex items-center gap-2 p-2 rounded-lg border transition-all cursor-pointer ${enabled ? 'bg-[color-mix(in_srgb,var(--theme-accent)_10%,transparent)] border-[color-mix(in_srgb,var(--theme-accent)_30%,transparent)]' : 'bg-[color-mix(in_srgb,var(--theme-text-main)_5%,transparent)] border-[color-mix(in_srgb,var(--theme-border)_50%,transparent)] grayscale opacity-70 hover:opacity-100 hover:grayscale-0'}`}>
                        <div className={`w-4 h-4 rounded flex-shrink-0 flex items-center justify-center border transition-all ${enabled ? 'border-[var(--theme-accent)] bg-[var(--theme-accent)]' : 'border-[color-mix(in_srgb,var(--theme-text-main)_30%,transparent)] bg-transparent'}`}>
                          {enabled && <div className="w-1.5 h-1.5 bg-white rounded-full scale-100" />}
                        </div>
                        <span className={`text-xs font-mono truncate min-w-0 flex-1 transition-colors ${enabled ? 'text-[var(--theme-accent)]' : 'text-[var(--theme-text-main)]'}`}>{term}</span>
                        <input type="checkbox" className="hidden" checked={enabled} onChange={(e) => { setAdKeywords(prev => ({ ...prev, [term]: e.target.checked })); }} />
                        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); const next = { ...adKeywords }; delete next[term]; setAdKeywords(next); }} className="opacity-0 group-hover:opacity-100 text-red-500 hover:bg-red-500/20 p-1 rounded transition-all"><Trash2 size={12} /></button>
                      </label>
                    ))}
                    <div className="flex items-center gap-2 p-1 pl-2 rounded-lg border border-dashed border-[color-mix(in_srgb,var(--theme-border)_50%,transparent)] bg-[color-mix(in_srgb,var(--theme-text-main)_3%,transparent)] focus-within:border-[var(--theme-accent)] transition-colors">
                      <Plus size={14} className="text-[var(--theme-text-sec)]" />
                      <input type="text" placeholder="Add keyword..." className="bg-transparent border-none outline-none text-xs font-mono text-[var(--theme-text-main)] w-full py-1 placeholder:text-[var(--theme-text-sec)] placeholder:opacity-50"
                        onKeyDown={(e) => { if (e.key === 'Enter') { const val = e.currentTarget.value.trim(); if (val) { setAdKeywords(prev => ({ ...(prev || {}), [val]: true })); e.currentTarget.value = ''; } } }} />
                    </div>
                  </div>
                </CollapsibleSection>

                <CollapsibleSection title="Redirect & Fetch Keywords">
                  <p className="text-xs text-[var(--theme-text-sec)] mb-3">Matches against meta, fetch, or location assignments to prevent page redirection and tracking.</p>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                    {Object.entries(redirectKeywords || {}).map(([term, enabled]) => (
                      <label key={term} className={`group flex items-center gap-2 p-2 rounded-lg border transition-all cursor-pointer ${enabled ? 'bg-[color-mix(in_srgb,var(--theme-accent)_10%,transparent)] border-[color-mix(in_srgb,var(--theme-accent)_30%,transparent)]' : 'bg-[color-mix(in_srgb,var(--theme-text-main)_5%,transparent)] border-[color-mix(in_srgb,var(--theme-border)_50%,transparent)] grayscale opacity-70 hover:opacity-100 hover:grayscale-0'}`}>
                        <div className={`w-4 h-4 rounded flex-shrink-0 flex items-center justify-center border transition-all ${enabled ? 'border-[var(--theme-accent)] bg-[var(--theme-accent)]' : 'border-[color-mix(in_srgb,var(--theme-text-main)_30%,transparent)] bg-transparent'}`}>
                          {enabled && <div className="w-1.5 h-1.5 bg-white rounded-full scale-100" />}
                        </div>
                        <span className={`text-xs font-mono truncate min-w-0 flex-1 transition-colors ${enabled ? 'text-[var(--theme-accent)]' : 'text-[var(--theme-text-main)]'}`}>{term}</span>
                        <input type="checkbox" className="hidden" checked={enabled} onChange={(e) => { setRedirectKeywords(prev => ({ ...prev, [term]: e.target.checked })); }} />
                        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); const next = { ...redirectKeywords }; delete next[term]; setRedirectKeywords(next); }} className="opacity-0 group-hover:opacity-100 text-red-500 hover:bg-red-500/20 p-1 rounded transition-all"><Trash2 size={12} /></button>
                      </label>
                    ))}
                    <div className="flex items-center gap-2 p-1 pl-2 rounded-lg border border-dashed border-[color-mix(in_srgb,var(--theme-border)_50%,transparent)] bg-[color-mix(in_srgb,var(--theme-text-main)_3%,transparent)] focus-within:border-[var(--theme-accent)] transition-colors">
                      <Plus size={14} className="text-[var(--theme-text-sec)]" />
                      <input type="text" placeholder="Add keyword..." className="bg-transparent border-none outline-none text-xs font-mono text-[var(--theme-text-main)] w-full py-1 placeholder:text-[var(--theme-text-sec)] placeholder:opacity-50"
                        onKeyDown={(e) => { if (e.key === 'Enter') { const val = e.currentTarget.value.trim(); if (val) { setRedirectKeywords(prev => ({ ...(prev || {}), [val]: true })); e.currentTarget.value = ''; } } }} />
                    </div>
                  </div>
                </CollapsibleSection>

                <CollapsibleSection title="Inline Script Context Keywords">
                  <p className="text-xs text-[var(--theme-text-sec)] mb-3">If inline text nodes match these, the script block is destroyed before evaluation (e.g. debugger, eval).</p>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                    {Object.entries(inlineKeywords || {}).map(([term, enabled]) => (
                      <label key={term} className={`group flex items-center gap-2 p-2 rounded-lg border transition-all cursor-pointer ${enabled ? 'bg-[color-mix(in_srgb,var(--theme-accent)_10%,transparent)] border-[color-mix(in_srgb,var(--theme-accent)_30%,transparent)]' : 'bg-[color-mix(in_srgb,var(--theme-text-main)_5%,transparent)] border-[color-mix(in_srgb,var(--theme-border)_50%,transparent)] grayscale opacity-70 hover:opacity-100 hover:grayscale-0'}`}>
                        <div className={`w-4 h-4 rounded flex-shrink-0 flex items-center justify-center border transition-all ${enabled ? 'border-[var(--theme-accent)] bg-[var(--theme-accent)]' : 'border-[color-mix(in_srgb,var(--theme-text-main)_30%,transparent)] bg-transparent'}`}>
                          {enabled && <div className="w-1.5 h-1.5 bg-white rounded-full scale-100" />}
                        </div>
                        <span className={`text-xs font-mono truncate min-w-0 flex-1 transition-colors ${enabled ? 'text-[var(--theme-accent)]' : 'text-[var(--theme-text-main)]'}`}>{term}</span>
                        <input type="checkbox" className="hidden" checked={enabled} onChange={(e) => { setInlineKeywords(prev => ({ ...prev, [term]: e.target.checked })); }} />
                        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); const next = { ...inlineKeywords }; delete next[term]; setInlineKeywords(next); }} className="opacity-0 group-hover:opacity-100 text-red-500 hover:bg-red-500/20 p-1 rounded transition-all"><Trash2 size={12} /></button>
                      </label>
                    ))}
                    <div className="flex items-center gap-2 p-1 pl-2 rounded-lg border border-dashed border-[color-mix(in_srgb,var(--theme-border)_50%,transparent)] bg-[color-mix(in_srgb,var(--theme-text-main)_3%,transparent)] focus-within:border-[var(--theme-accent)] transition-colors">
                      <Plus size={14} className="text-[var(--theme-text-sec)]" />
                      <input type="text" placeholder="Add keyword..." className="bg-transparent border-none outline-none text-xs font-mono text-[var(--theme-text-main)] w-full py-1 placeholder:text-[var(--theme-text-sec)] placeholder:opacity-50"
                        onKeyDown={(e) => { if (e.key === 'Enter') { const val = e.currentTarget.value.trim(); if (val) { setInlineKeywords(prev => ({ ...(prev || {}), [val]: true })); e.currentTarget.value = ''; } } }} />
                    </div>
                  </div>
                </CollapsibleSection>

                <CollapsibleSection title="CSS Styling Display None Selectors">
                  <p className="text-xs text-[var(--theme-text-sec)] mb-3">Dynamically inject global display:none rules to hide annoying ad containers or elements.</p>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                    {Object.entries(cssAdblockSelectors || {}).map(([term, enabled]) => (
                      <label key={term} className={`group flex items-center gap-2 p-2 rounded-lg border transition-all cursor-pointer ${enabled ? 'bg-[color-mix(in_srgb,var(--theme-accent)_10%,transparent)] border-[color-mix(in_srgb,var(--theme-accent)_30%,transparent)]' : 'bg-[color-mix(in_srgb,var(--theme-text-main)_5%,transparent)] border-[color-mix(in_srgb,var(--theme-border)_50%,transparent)] grayscale opacity-70 hover:opacity-100 hover:grayscale-0'}`}>
                        <div className={`w-4 h-4 rounded flex-shrink-0 flex items-center justify-center border transition-all ${enabled ? 'border-[var(--theme-accent)] bg-[var(--theme-accent)]' : 'border-[color-mix(in_srgb,var(--theme-text-main)_30%,transparent)] bg-transparent'}`}>
                          {enabled && <div className="w-1.5 h-1.5 bg-white rounded-full scale-100" />}
                        </div>
                        <span className={`text-xs font-mono truncate min-w-0 flex-1 transition-colors ${enabled ? 'text-[var(--theme-accent)]' : 'text-[var(--theme-text-main)]'}`}>{term}</span>
                        <input type="checkbox" className="hidden" checked={enabled} onChange={(e) => { setCssAdblockSelectors(prev => ({ ...prev, [term]: e.target.checked })); }} />
                        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); const next = { ...cssAdblockSelectors }; delete next[term]; setCssAdblockSelectors(next); }} className="opacity-0 group-hover:opacity-100 text-red-500 hover:bg-red-500/20 p-1 rounded transition-all"><Trash2 size={12} /></button>
                      </label>
                    ))}
                    <div className="flex items-center gap-2 p-1 pl-2 rounded-lg border border-dashed border-[color-mix(in_srgb,var(--theme-border)_50%,transparent)] bg-[color-mix(in_srgb,var(--theme-text-main)_3%,transparent)] focus-within:border-[var(--theme-accent)] transition-colors">
                      <Plus size={14} className="text-[var(--theme-text-sec)]" />
                      <input type="text" placeholder="Add CSS selector..." className="bg-transparent border-none outline-none text-xs font-mono text-[var(--theme-text-main)] w-full py-1 placeholder:text-[var(--theme-text-sec)] placeholder:opacity-50"
                        onKeyDown={(e) => { if (e.key === 'Enter') { const val = e.currentTarget.value.trim(); if (val) { setCssAdblockSelectors(prev => ({ ...(prev || {}), [val]: true })); e.currentTarget.value = ''; } } }} />
                    </div>
                  </div>
                </CollapsibleSection>
              </div>

              <div className="pt-4 mt-4 border-t border-[color-mix(in_srgb,var(--theme-border)_50%,transparent)]">
                <label className="block text-sm font-medium text-[var(--theme-text-main)] mb-1.5">Site Whitelist</label>
                <p className="text-xs text-[var(--theme-text-sec)] mb-4">Adblocker will be disabled entirely on these domains (e.g. google.com)</p>
                <TagsInput tags={adblockWhitelist} onChange={setAdblockWhitelist} />
              </div>
            </div>
          </div>
    </>
  );
};
