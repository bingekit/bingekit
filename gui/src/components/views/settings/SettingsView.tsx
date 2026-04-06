import React, { useRef, useEffect } from 'react';
import { Settings, Palette, Download, ShieldOff, Shield, Code } from 'lucide-react';
import { useAppContext } from '../../../context/AppContext';
import { ConfigView } from './ConfigView';
import { SettingsGeneralTab } from './tabs/SettingsGeneralTab';
import { SettingsAppearanceTab } from './tabs/SettingsAppearanceTab';
import { SettingsDownloadsTab } from './tabs/SettingsDownloadsTab';
import { SettingsAdblockTab } from './tabs/SettingsAdblockTab';
import { SettingsPrivacyTab } from './tabs/SettingsPrivacyTab';

const settingsScrollMap = new Map<string, number>();

export const SettingsView = () => {
  const { activeSettingsTab, setActiveSettingsTab, activeTab } = useAppContext();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = settingsScrollMap.get(activeSettingsTab) || 0;
    }
  }, [activeSettingsTab]);

  useEffect(() => {
    if (activeTab === 'config') {
      setActiveSettingsTab('advanced');
    }
  }, [activeTab, setActiveSettingsTab]);

  return (
    <div className="flex h-full w-full">
      {/* Left Sidebar Menu */}
      <div className="w-64 flex-shrink-0 p-6 pr-4 border-r border-[color-mix(in_srgb,var(--theme-border)_50%,transparent)] overflow-y-auto no-scrollbar">
        <h2 className="text-2xl font-light tracking-tight text-[var(--theme-text-main)] mb-8">Settings</h2>
        <div className="space-y-1.5">
          <button onClick={() => setActiveSettingsTab('general')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${activeSettingsTab === 'general' ? 'bg-[color-mix(in_srgb,var(--theme-accent)_15%,transparent)] text-[var(--theme-accent)] font-medium' : 'text-[var(--theme-text-sec)] hover:text-[var(--theme-text-main)] hover:bg-[color-mix(in_srgb,var(--theme-text-main)_5%,transparent)]'}`}>
            <Settings size={18} /> General
          </button>
          <button onClick={() => setActiveSettingsTab('appearance')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${activeSettingsTab === 'appearance' ? 'bg-[color-mix(in_srgb,var(--theme-accent)_15%,transparent)] text-[var(--theme-accent)] font-medium' : 'text-[var(--theme-text-sec)] hover:text-[var(--theme-text-main)] hover:bg-[color-mix(in_srgb,var(--theme-text-main)_5%,transparent)]'}`}>
            <Palette size={18} /> Appearance
          </button>
          <button onClick={() => setActiveSettingsTab('downloads')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${activeSettingsTab === 'downloads' ? 'bg-[color-mix(in_srgb,var(--theme-accent)_15%,transparent)] text-[var(--theme-accent)] font-medium' : 'text-[var(--theme-text-sec)] hover:text-[var(--theme-text-main)] hover:bg-[color-mix(in_srgb,var(--theme-text-main)_5%,transparent)]'}`}>
            <Download size={18} /> Downloads
          </button>
          <button onClick={() => setActiveSettingsTab('adblock')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${activeSettingsTab === 'adblock' ? 'bg-[color-mix(in_srgb,var(--theme-accent)_15%,transparent)] text-[var(--theme-accent)] font-medium' : 'text-[var(--theme-text-sec)] hover:text-[var(--theme-text-main)] hover:bg-[color-mix(in_srgb,var(--theme-text-main)_5%,transparent)]'}`}>
            <ShieldOff size={18} /> Adblocker
          </button>
          <button onClick={() => setActiveSettingsTab('privacy')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${activeSettingsTab === 'privacy' ? 'bg-[color-mix(in_srgb,var(--theme-accent)_15%,transparent)] text-[var(--theme-accent)] font-medium' : 'text-[var(--theme-text-sec)] hover:text-[var(--theme-text-main)] hover:bg-[color-mix(in_srgb,var(--theme-text-main)_5%,transparent)]'}`}>
            <Shield size={18} /> Privacy & Data
          </button>
        </div>
        <div className="mt-8 space-y-1.5">
          <label className="px-3 text-xs font-medium text-[color-mix(in_srgb,var(--theme-text-sec)_70%,transparent)] uppercase tracking-wider mb-2 block">System</label>
          <button onClick={() => setActiveSettingsTab('advanced')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${activeSettingsTab === 'advanced' ? 'bg-[color-mix(in_srgb,var(--theme-accent)_15%,transparent)] text-[var(--theme-accent)] font-medium' : 'text-[var(--theme-text-sec)] hover:text-[var(--theme-text-main)] hover:bg-[color-mix(in_srgb,var(--theme-text-main)_5%,transparent)]'}`}>
            <Code size={18} /> Advanced
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div 
        ref={scrollRef}
        className="flex-1 p-8 h-full overflow-y-auto no-scrollbar max-w-5xl"
        onScroll={(e) => settingsScrollMap.set(activeSettingsTab, e.currentTarget.scrollTop)}
      >
        {activeSettingsTab === 'general' && <SettingsGeneralTab />}
        {activeSettingsTab === 'appearance' && <SettingsAppearanceTab />}
        {activeSettingsTab === 'downloads' && <SettingsDownloadsTab />}
        {activeSettingsTab === 'adblock' && <SettingsAdblockTab />}
        {activeSettingsTab === 'privacy' && <SettingsPrivacyTab />}

        {/* --- ADVANCED TAB --- */}
        {activeSettingsTab === 'advanced' && (
          <div className="space-y-6 animate-in fade-in duration-300 h-full flex flex-col">
            <div className="mb-2 hidden md:block">
              <h3 className="text-xl font-medium text-[var(--theme-text-main)]">Advanced Configuration</h3>
              <p className="text-xs text-[var(--theme-text-sec)] mt-1">Caution: Modifying these advanced settings can disrupt application behavior.</p>
            </div>
            <div className="flex-1 min-h-0 bg-[color-mix(in_srgb,var(--theme-text-main)_2%,transparent)] border border-[color-mix(in_srgb,var(--theme-border)_50%,transparent)] rounded-2xl p-6 relative">
              <ConfigView embedded={true} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
