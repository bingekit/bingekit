import React, { useState, useEffect } from 'react';
import { RefreshCw, Globe, LayoutGrid, Download } from 'lucide-react';
import { useAppContext } from '../../../../context/AppContext';
import { ahk } from '../../../../lib/ahk';
import { CustomSelect } from '../../../ui/CustomSelect';
import { Modal } from '../../../ui/Modal';

export const SettingsGeneralTab = () => {
  const {
    defaultSearchEngine, setDefaultSearchEngine,
    searchThreadLimit, setSearchThreadLimit,
    homePage, setHomePage,
    plugins,
    isCompiledApp, isPortableApp,
    isMultiTabEnabled, setIsMultiTabEnabled,
    browserTabs, setBrowserTabs, activeBrowserTabId
  } = useAppContext();

  const [appVersion, setAppVersion] = useState<string>('0.0.0');
  const [updateObj, setUpdateObj] = useState<any>(null);
  const [isCheckingAppUpdates, setIsCheckingAppUpdates] = useState(false);
  const [showMultiTabDialog, setShowMultiTabDialog] = useState(false);
  const [showPortableModal, setShowPortableModal] = useState<boolean>(false);
  const [pendingPortableMode, setPendingPortableMode] = useState<boolean>(false);

  useEffect(() => {
    try {
      const ver = ahk.call('GetAppVersion');
      if (ver) setAppVersion(ver);
    } catch (e) { }
  }, []);

  const checkAppUpdates = async () => {
    setIsCheckingAppUpdates(true);
    try {
      const res = await ahk.call('CheckForUpdates');
      if (res) {
        const parsed = JSON.parse(res);
        setUpdateObj(parsed);
      } else {
        setUpdateObj({ upToDate: true });
      }
    } catch (e) {
      setUpdateObj({ error: true });
    }
    setIsCheckingAppUpdates(false);
  };

  const installUpdate = () => {
    if (updateObj && updateObj.url) {
      ahk.call('InstallUpdate', updateObj.url);
    }
  };

  return (
    <>
      <div className="space-y-6 animate-in fade-in duration-300">
            <h3 className="text-xl font-medium text-[var(--theme-text-main)] mb-6 hidden md:block">General Preferences</h3>

            <div className="p-5 bg-[color-mix(in_srgb,var(--theme-text-main)_2%,transparent)] border border-[color-mix(in_srgb,var(--theme-border)_50%,transparent)] rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-medium text-[var(--theme-text-main)]">System Updates & Version</h3>
                <p className="text-xs text-[var(--theme-text-sec)] mt-1">Current Version: <span className="font-mono text-[var(--theme-text-main)]">v{appVersion}</span></p>

                {updateObj && (
                  <div className={`mt-3 text-xs ${updateObj.error ? 'text-red-400' : updateObj.upToDate ? 'text-emerald-400' : 'text-indigo-400'}`}>
                    {updateObj.unsupported && <span className="text-[var(--theme-text-sec)]">Auto-updater requires a compiled executable.</span>}
                    {updateObj.error && !updateObj.unsupported && "Failed to check for updates. Check your connection or rate limits."}
                    {updateObj.upToDate && "You are on the latest version."}
                    {updateObj.version && (
                      <div className="flex flex-col gap-2">
                        <span className="font-medium">Version v{updateObj.version} is available!</span>
                        {updateObj.body && (
                          <div className="bg-[color-mix(in_srgb,var(--theme-text-main)_2%,transparent)] p-3 rounded-lg border border-[color-mix(in_srgb,var(--theme-border)_50%,transparent)] max-h-32 overflow-y-auto text-[var(--theme-text-sec)]">
                            {updateObj.body.split('\n').map((line: string, i: number) => (
                              <p key={i}>{line}</p>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                {!isCompiledApp || updateObj?.unsupported ? (
                  <button disabled className="px-4 py-2 bg-[color-mix(in_srgb,var(--theme-text-main)_5%,transparent)] text-[var(--theme-text-sec)] rounded-lg text-sm font-medium transition-colors ml-auto flex items-center gap-2 cursor-not-allowed border border-[color-mix(in_srgb,var(--theme-text-main)_10%,transparent)]">
                    <RefreshCw size={14} /> Disabled (Uncompiled)
                  </button>
                ) : !updateObj?.version ? (
                  <button
                    onClick={checkAppUpdates}
                    disabled={isCheckingAppUpdates}
                    className="px-4 py-2 bg-[color-mix(in_srgb,var(--theme-text-main)_8%,transparent)] hover:bg-[color-mix(in_srgb,var(--theme-text-main)_12%,transparent)] text-[var(--theme-text-main)] rounded-lg text-sm font-medium transition-colors ml-auto flex items-center gap-2 disabled:opacity-50"
                  >
                    <RefreshCw size={14} className={isCheckingAppUpdates ? "animate-spin" : ""} />
                    {isCheckingAppUpdates ? "Checking..." : "Check for Updates"}
                  </button>
                ) : (
                  <button
                    onClick={installUpdate}
                    className="px-4 py-2 bg-[var(--theme-accent)] hover:bg-[color-mix(in_srgb,var(--theme-accent)_90%,white)] text-white rounded-lg text-sm font-medium shadow-[0_0_15px_color-mix(in_srgb,var(--theme-accent)_30%,transparent)] flex items-center gap-2 transition-colors ml-auto"
                  >
                    <Download size={14} /> Update and Restart
                  </button>
                )}
              </div>
            </div>

            <div className="p-5 bg-[color-mix(in_srgb,var(--theme-text-main)_2%,transparent)] border border-[color-mix(in_srgb,var(--theme-border)_50%,transparent)] rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-medium text-[var(--theme-text-main)] flex items-center gap-2">
                  <Globe size={16} className="text-[var(--theme-accent)]" />
                  Global Storage Mode (Portable vs Installed)
                </h3>
                <p className="text-xs text-[var(--theme-text-sec)] mt-1 max-w-xl">
                  Portable Mode isolates all your plugins, scripts, and logs right next to the executable. Installed mode moves it into your Windows `%LOCALAPPDATA%` tree. Toggling this triggers a data-migration sequence.
                </p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-xs font-mono text-[var(--theme-text-sec)] uppercase">{isPortableApp ? 'Portable' : 'Installed'}</span>
                <button
                  onClick={() => {
                    setPendingPortableMode(!isPortableApp);
                    setShowPortableModal(true);
                  }}
                  className={`w-12 h-6 rounded-full transition-colors relative ${isPortableApp ? 'bg-[var(--theme-accent)]' : 'bg-[color-mix(in_srgb,var(--theme-text-main)_15%,transparent)]'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${isPortableApp ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
            </div>

            <div className="p-5 bg-[color-mix(in_srgb,var(--theme-text-main)_2%,transparent)] border border-[color-mix(in_srgb,var(--theme-border)_50%,transparent)] rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-medium text-[var(--theme-text-main)] flex items-center gap-2">
                  <LayoutGrid size={16} className="text-[var(--theme-accent)]" />
                  Enable Multi-Tab Interface (Beta)
                </h3>
                <p className="text-xs text-[var(--theme-text-sec)] mt-1 max-w-xl">
                  Transforms the UI to allow multiple web views, tabs, and dynamic tiling. Enabling this will reorganize the top title bar and change how you manage active sites.
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div
                  onClick={() => {
                    if (isMultiTabEnabled && browserTabs.length > 1) {
                      setShowMultiTabDialog(true);
                    } else {
                      const newMultiTab = !isMultiTabEnabled;
                      setIsMultiTabEnabled(newMultiTab);
                      ahk.call('SaveData', 'multi_tab_enabled.txt', newMultiTab ? 'true' : 'false');
                    }
                  }}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${isMultiTabEnabled ? 'bg-[var(--theme-accent)]' : 'bg-[color-mix(in_srgb,var(--theme-text-main)_15%,transparent)]'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${isMultiTabEnabled ? 'left-7' : 'left-1'}`} />
                </div>
              </div>
            </div>

            <div className="p-5 bg-[color-mix(in_srgb,var(--theme-text-main)_2%,transparent)] border border-[color-mix(in_srgb,var(--theme-border)_50%,transparent)] rounded-2xl space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-[var(--theme-text-main)]">Multi-Search Engine</h3>
                  <p className="text-xs text-[var(--theme-text-sec)] mt-1">Default engine for the floating search bar.</p>
                </div>
                <div className="w-48">
                  <CustomSelect
                    value={defaultSearchEngine || 'https://duckduckgo.com/?q='}
                    onChange={(val) => { if (val) setDefaultSearchEngine(val); }}
                    options={[
                      { value: 'https://duckduckgo.com/?q=', label: 'DuckDuckGo' },
                      { value: 'https://www.google.com/search?q=', label: 'Google' },
                      { value: 'https://search.brave.com/search?q=', label: 'Brave' },
                      { value: 'https://www.bing.com/search?q=', label: 'Bing' }
                    ]}
                  />
                </div>
              </div>
              <div className="pt-6 border-t border-[color-mix(in_srgb,var(--theme-border)_50%,transparent)] flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-[var(--theme-text-main)]">Max Simultaneous Searches</h3>
                  <p className="text-xs text-[var(--theme-text-sec)] mt-1">Chunk site searches in batches rather than querying all at once.</p>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="1"
                    max="30"
                    value={searchThreadLimit}
                    onChange={(e) => setSearchThreadLimit(Number(e.target.value))}
                    className="w-32 cursor-pointer"
                    style={{ accentColor: 'var(--theme-accent)' }}
                  />
                  <span className="text-sm font-medium text-[var(--theme-accent)] w-6 text-right whitespace-nowrap">{searchThreadLimit}</span>
                </div>
              </div>
              <div className="pt-6 border-t border-[color-mix(in_srgb,var(--theme-border)_50%,transparent)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-medium text-[var(--theme-text-main)]">Player Home Page</h3>
                  <p className="text-xs text-[var(--theme-text-sec)] mt-1">Default page when opening the application player.</p>
                </div>
                <div className="w-full md:w-96 flex gap-2">
                  <input
                    type="text"
                    value={homePage || ''}
                    onChange={(e) => setHomePage(e.target.value)}
                    placeholder="Custom URL..."
                    className="flex-1 min-w-0 bg-[color-mix(in_srgb,var(--theme-text-main)_3%,transparent)] border border-[color-mix(in_srgb,var(--theme-text-main)_10%,transparent)] rounded-lg px-3 py-2 text-sm text-[var(--theme-text-main)] focus:border-[var(--theme-accent)] outline-none"
                  />
                  <div className="w-32 flex-shrink-0">
                    <CustomSelect
                      value=""
                      onChange={(val) => { if (val) setHomePage(val); }}
                      options={plugins.map(p => ({ value: p.baseUrl, label: p.name }))}
                      placeholder="Set to Plugin"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

      <Modal isOpen={showPortableModal} onClose={() => setShowPortableModal(false)} title="Migrate Data Source?">
        <div className="space-y-4">
          <p className="text-sm text-[var(--theme-text-main)]">
            You've requested to change the global storage mode to:<br />
            <span className="font-mono text-xs text-[var(--theme-accent)] font-bold uppercase">{pendingPortableMode ? 'Portable' : 'Installed'} Mode</span>
          </p>
          <p className="text-xs text-[var(--theme-text-sec)] leading-relaxed bg-[color-mix(in_srgb,var(--theme-text-main)_3%,transparent)] p-3 rounded-lg border border-[color-mix(in_srgb,var(--theme-text-main)_10%,transparent)]">
            For this change to seamlessly copy over your existing workspace data (plugins, logs, configs) into the new directory structure and avoid data-loss visually, BingeKit must immediately restart and native directory movement must occur.
          </p>
          <div className="flex gap-3 justify-end pt-4 border-t border-[color-mix(in_srgb,var(--theme-border)_50%,transparent)] mt-4">
            <button
              onClick={() => {
                setShowPortableModal(false);
              }}
              className="px-4 py-2 text-sm font-medium text-[var(--theme-text-sec)] hover:text-[var(--theme-text-main)] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setShowPortableModal(false);
                ahk.call('MigrateStorage', pendingPortableMode ? 1 : 0, ahk.call('GetStoragePath') || '');
              }}
              className="px-4 py-2 text-sm font-medium bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500/30 border border-red-500/20 transition-colors"
            >
              Migrate & Restart
            </button>
          </div>
        </div>
      </Modal>
      
      {showMultiTabDialog && (
        <Modal isOpen={showMultiTabDialog} title="Disable Multi-Tab Mode?" onClose={() => setShowMultiTabDialog(false)}>
          <div className="p-6">
            <p className="text-zinc-300 text-sm mb-6 leading-relaxed">
              Disabling Multi-Tab mode will automatically close {browserTabs.length - 1} background tab(s) and keep only your currently active tab open.
              <br /><br />
              Are you sure you want to continue?
            </p>
            <div className="flex items-center justify-end gap-3 mt-4">
              <button
                onClick={() => setShowMultiTabDialog(false)}
                className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const activeTabOrMain = browserTabs.find(t => t.id === activeBrowserTabId) || browserTabs[0];
                  setBrowserTabs([activeTabOrMain]);

                  // Clean up running webview instances in host except the active one
                  browserTabs.forEach(t => {
                    if (t.id !== activeTabOrMain.id) ahk.call('ClosePlayer', t.id);
                  });

                  setIsMultiTabEnabled(false);
                  ahk.call('SaveData', 'multi_tab_enabled.txt', 'false');
                  setShowMultiTabDialog(false);
                }}
                className="px-4 py-2 text-sm bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white rounded-xl transition-colors border border-red-500/30 font-medium"
              >
                Close Tabs & Continue
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};
