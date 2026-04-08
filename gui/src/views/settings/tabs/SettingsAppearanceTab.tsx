import React, { useState, useEffect, useRef } from 'react';
import { Palette, Zap, LayoutGrid, ChevronDown } from 'lucide-react';
import { useAppContext } from '../../../context/AppContext';
import { CustomSelect } from '../../../components/ui/CustomSelect';

const NavButtonsSelect = ({ navButtons, setNavButtons }: { navButtons: any, setNavButtons: any }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative w-48">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-[color-mix(in_srgb,var(--theme-text-main)_3%,transparent)] border border-[color-mix(in_srgb,var(--theme-text-main)_10%,transparent)] rounded-lg px-3 py-2 text-sm text-[var(--theme-text-main)] outline-none transition-colors hover:border-[color-mix(in_srgb,var(--theme-text-main)_20%,transparent)] h-[38px] cursor-pointer"
      >
        <span className="truncate">{Object.values(navButtons).filter(Boolean).length} Active Buttons</span>
        <ChevronDown size={14} className={`text-[color-mix(in_srgb,var(--theme-text-main)_50%,transparent)] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div style={{ backgroundColor: 'var(--theme-sidebar)' }} className="absolute z-10 w-full mt-1 border border-[color-mix(in_srgb,var(--theme-border)_50%,transparent)] rounded-lg shadow-xl overflow-hidden shadow-black/40 py-1">
          {Object.entries({ home: 'Home', back: 'Back', forward: 'Forward', reload: 'Reload' }).map(([key, label]) => (
            <label key={key} className="w-full text-left px-3 py-2.5 text-sm flex items-center gap-3 hover:bg-[color-mix(in_srgb,var(--theme-text-main)_5%,transparent)] transition-colors cursor-pointer text-[var(--theme-text-main)]">
              <input
                type="checkbox"
                checked={navButtons[key as keyof typeof navButtons]}
                onChange={(e) => setNavButtons({ ...navButtons, [key]: e.target.checked })}
                className="rounded bg-[color-mix(in_srgb,var(--theme-text-main)_10%,transparent)] border-[color-mix(in_srgb,var(--theme-text-main)_20%,transparent)]"
              />
              {label}
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

export const SettingsAppearanceTab = () => {
  const { theme, setTheme, urlBarMode, setUrlBarMode, navButtons, setNavButtons } = useAppContext();

  const renderColorInput = (label: string, field: string) => (
    <div>
      <label className="block text-xs text-[var(--theme-text-sec)] mb-1.5">{label}</label>
      <div className="flex bg-[color-mix(in_srgb,var(--theme-text-main)_2%,transparent)] border border-[color-mix(in_srgb,var(--theme-text-main)_10%,transparent)] rounded overflow-hidden h-8">
        <input type="color" value={(theme as any)[field] || '#ffffff'} onChange={e => setTheme({ ...theme, [field]: e.target.value })} className="w-8 h-8 cursor-pointer border-none p-0 flex-shrink-0 appearance-none bg-transparent block focus:outline-none" />
        <input type="text" value={(theme as any)[field] || ''} onChange={e => setTheme({ ...theme, [field]: e.target.value })} className="flex-1 min-w-0 bg-transparent border-none text-xs text-[var(--theme-text-main)] px-2 outline-none font-mono uppercase" />
      </div>
    </div>
  );

  return (
    <>
      <div className="space-y-6 animate-in fade-in duration-300">
        <h3 className="text-xl font-medium text-[var(--theme-text-main)] mb-6 hidden md:block">Appearance & Themes</h3>

        <div className="p-5 bg-[color-mix(in_srgb,var(--theme-text-main)_2%,transparent)] border border-[color-mix(in_srgb,var(--theme-border)_50%,transparent)] rounded-2xl space-y-4">
          <h3 className="text-sm font-medium text-[var(--theme-text-main)] flex items-center gap-2"><Zap size={16} className="text-[var(--theme-accent)]" /> Theme Configuration</h3>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-5">
            {renderColorInput('Top Titlebar', 'titlebarBg')}
            {renderColorInput('Side Menu', 'sidebarBg')}
            {renderColorInput('Main Content', 'main')}
            {renderColorInput('Borders', 'border')}
            {renderColorInput('Accent Color (Buttons)', 'accent')}
            {renderColorInput('Main Text', 'textMain')}
            {renderColorInput('Secondary Text', 'textSec')}
            {renderColorInput('URL Bar Background', 'urlbarBg')}
            {renderColorInput('URL Bar Text', 'urlbarText')}
            {renderColorInput('URL Bar Icons', 'urlbarIcon')}
            {renderColorInput('Sidebar Text', 'sidebarText')}
            {renderColorInput('Titlebar Text', 'titlebarText')}
            {renderColorInput('Titlebar Text Hover', 'titlebarTextHover')}
            {renderColorInput('Titlebar Accent', 'titlebarAccent')}
            {renderColorInput('Titlebar Base (Alt 1)', 'titlebarAlt')}
            {renderColorInput('Titlebar Hover (Alt 2)', 'titlebarAlt2')}
          </div>

          <div className="pt-4 mt-6 border-t border-[color-mix(in_srgb,var(--theme-border)_50%,transparent)]">
            <label className="block text-xs font-medium text-[var(--theme-text-main)] mb-3">1-Click Presets</label>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setTheme({ mode: 'dark', titlebarBg: '#09090b', sidebarBg: '#09090b', main: '#09090b', border: '#27272a', accent: '#6366f1', textMain: '#fafafa', textSec: '#a1a1aa', titlebarText: '#a1a1aa', titlebarTextHover: '#fafafa', titlebarAccent: '#6366f1', titlebarAlt: '#18181b', titlebarAlt2: '#27272a', sidebarText: '#a1a1aa', urlbarBg: 'color-mix(in srgb, #fafafa 4%, transparent)' })} className="px-3 py-1.5 text-xs bg-[color-mix(in_srgb,var(--theme-text-main)_8%,transparent)] rounded hover:bg-[color-mix(in_srgb,var(--theme-text-main)_12%,transparent)] transition-colors text-[var(--theme-text-main)]">Dark Mode (Default)</button>
              <button onClick={() => setTheme({ mode: 'light', titlebarBg: '#f4f4f5', sidebarBg: '#eaeaea', main: '#f4f4f5', border: '#d4d4d8', accent: '#3b82f6', textMain: '#18181b', textSec: '#52525b', titlebarText: '#52525b', titlebarTextHover: '#18181b', titlebarAccent: '#3b82f6', titlebarAlt: '#ffffff', titlebarAlt2: '#e4e4e7', sidebarText: '#52525b', urlbarBg: 'color-mix(in srgb, #18181b 4%, transparent)' })} className="px-3 py-1.5 text-xs bg-[color-mix(in_srgb,var(--theme-text-main)_8%,transparent)] rounded hover:bg-[color-mix(in_srgb,var(--theme-text-main)_12%,transparent)] transition-colors text-[var(--theme-text-main)]">Light Mode</button>
              <button onClick={() => setTheme({ mode: 'dracula', titlebarBg: '#282a36', sidebarBg: '#21222c', main: '#282a36', border: '#44475a', accent: '#bd93f9', textMain: '#f8f8f2', textSec: '#6272a4', titlebarText: '#6272a4', titlebarTextHover: '#f8f8f2', titlebarAccent: '#bd93f9', titlebarAlt: '#191a21', titlebarAlt2: '#44475a', sidebarText: '#6272a4', urlbarBg: 'color-mix(in srgb, #f8f8f2 5%, transparent)' })} className="px-3 py-1.5 text-xs bg-[color-mix(in_srgb,var(--theme-text-main)_8%,transparent)] rounded hover:bg-[color-mix(in_srgb,var(--theme-text-main)_12%,transparent)] transition-colors text-[var(--theme-text-main)]">Dracula</button>

              {/* Two-Tone Presets */}
              <button onClick={() => setTheme({ mode: 'dark', titlebarBg: '#1e1b4b', sidebarBg: '#0b0a1f', main: '#09090b', border: '#312e81', accent: '#818cf8', textMain: '#fafafa', textSec: '#a1a1aa', titlebarText: '#a5b4fc', titlebarTextHover: '#e0e7ff', titlebarAccent: '#818cf8', titlebarAlt: '#312e81', titlebarAlt2: '#3730a3', sidebarText: '#a5b4fc', urlbarBg: 'color-mix(in srgb, #312e81 80%, #1e1b4b)' })} className="px-3 py-1.5 text-xs bg-[color-mix(in_srgb,var(--theme-text-main)_8%,transparent)] rounded hover:bg-[color-mix(in_srgb,var(--theme-text-main)_12%,transparent)] transition-colors text-[var(--theme-text-main)] border border-[color-mix(in_srgb,var(--theme-text-main)_15%,transparent)]">Two-Tone Dark</button>

              <button onClick={() => setTheme({ mode: 'light', titlebarBg: '#4c73e6', sidebarBg: '#eaeaea', main: '#f4f4f5', border: '#d4d4d8', accent: '#4c57e6', textMain: '#18181b', textSec: '#52525b', titlebarText: '#c7d2fe', titlebarTextHover: '#ffffff', titlebarAccent: '#ffffff', titlebarAlt: '#f2f2f2', titlebarAlt2: '#ffffff33', sidebarText: '#474747', urlbarBg: '#ffffff', urlbarText: '#525252', urlbarIcon: '#4d4d4d' })} className="px-3 py-1.5 text-xs bg-[color-mix(in_srgb,var(--theme-text-main)_8%,transparent)] rounded hover:bg-[color-mix(in_srgb,var(--theme-text-main)_12%,transparent)] transition-colors text-[var(--theme-text-main)] border border-[color-mix(in_srgb,var(--theme-text-main)_15%,transparent)]">Two-Tone Light</button>
            </div>
          </div>
        </div>

        <div className="p-5 bg-[color-mix(in_srgb,var(--theme-text-main)_2%,transparent)] border border-[color-mix(in_srgb,var(--theme-border)_50%,transparent)] rounded-2xl space-y-4">
          <h3 className="text-sm font-medium text-[var(--theme-text-main)] flex items-center gap-2"><LayoutGrid size={16} className="text-[var(--theme-accent)]" /> Interface Layout</h3>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-[var(--theme-text-main)]">URL Bar Visibility</h4>
              <p className="text-xs text-[var(--theme-text-sec)] mt-1">Choose how the URL bar appears in the player view.</p>
            </div>
            <div className="w-48">
              <CustomSelect
                value={urlBarMode}
                onChange={(val) => { if (val) setUrlBarMode(val as any); }}
                options={[
                  { value: 'full', label: 'Full Bar' },
                  { value: 'title', label: 'Title Only' },
                  { value: 'hidden', label: 'Hidden entirely' }
                ]}
              />
            </div>
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-[color-mix(in_srgb,var(--theme-border)_50%,transparent)]">
            <div>
              <h4 className="text-sm font-medium text-[var(--theme-text-main)]">URL Bar Navigation Buttons</h4>
              <p className="text-xs text-[var(--theme-text-sec)] mt-1">Select which buttons show up on the URL bar.</p>
            </div>
            <NavButtonsSelect navButtons={navButtons} setNavButtons={setNavButtons} />
          </div>
        </div>
      </div>
    </>
  );
};
