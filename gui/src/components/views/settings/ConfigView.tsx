import React, { useState, useEffect } from 'react';
import { Settings, Save, AlertTriangle, RefreshCcw, Search } from 'lucide-react';
import { ahk } from '../../../lib/ahk';
import { useAppContext } from '../../../context/AppContext';
import { TooltipWrapper } from '../../ui/TooltipWrapper';
import { CustomCheckbox } from '../../ui/CustomCheckbox';

import { Modal } from '../../ui/Modal';

type ConfigType = 'string' | 'boolean' | 'number' | 'folder';

interface ConfigItem {
  id: string;
  name: string;
  type: ConfigType;
  description: string;
  default: any;
  value: any;
  category: string;
  tags?: string[];
  warning?: string;
  requiresRestart?: boolean;
  disabled?: boolean;
}

const DEFAULT_CONFIG: ConfigItem[] = [
  // NAVIGATION & UI
  {
    id: 'AutoFocusPlayerOnTabChange',
    name: 'Auto-Focus Player on Tab Change',
    type: 'boolean',
    category: 'Navigation & UI',
    tags: ['focus', 'tab', 'player', 'active'],
    description: 'When changing tabs or creating a new one, automatically focus the player tab so you can see the content immediately.',
    default: true,
    value: true,
  },
  {
    id: 'CtrlClickBackgroundTab',
    name: 'Ctrl+Click Opens in Background',
    type: 'boolean',
    category: 'Navigation & UI',
    tags: ['tab', 'background', 'ctrl', 'click', 'link'],
    description: 'When holding Control to open a link in a new tab, open it in the background. If disabled, it will immediately focus the new tab.',
    default: true,
    value: true,
  },
  {
    id: 'AutoFocusVideo',
    name: 'Auto Focus Video',
    type: 'boolean',
    category: 'Navigation & UI',
    tags: ['video', 'focus', 'playing', 'fullscreen'],
    description: 'When the video is playing, automatically enables the focused mode (which uses the site plugin CSS selector and styling to focus the player).',
    default: true,
    value: true,
  },

  // EXPERIMENTS
  {
    id: 'ShowTilingOptions',
    name: 'Show Tiling Options',
    type: 'boolean',
    category: 'Experiments',
    tags: ['tiling', 'window', 'split', 'grid'],
    description: 'When enabled, shows advanced window tiling options in the titlebar layout.',
    default: true,
    value: true,
  },

  // PLUGINS & UPDATES
  {
    id: 'UpdateUrl',
    name: 'Update API Endpoint',
    type: 'string',
    category: 'Plugins & Updates',
    tags: ['update', 'github', 'release', 'api'],
    description: 'The API endpoint to poll for new releases (GitHub Releases API format).',
    default: 'https://api.github.com/repos/owhs/bingekit/releases/latest',
    value: 'https://api.github.com/repos/owhs/bingekit/releases/latest',
  },
  {
    id: 'PluginRepoUrl',
    name: 'Plugin Repository URL',
    type: 'string',
    category: 'Plugins & Updates',
    tags: ['plugins', 'repo', 'store', 'market'],
    description: 'The URL pointing to a repo.json manifest for the App Store.',
    default: 'https://raw.githubusercontent.com/owhs/bingekit/main/repo_example/repo.json',
    value: 'https://raw.githubusercontent.com/owhs/bingekit/main/repo_example/repo.json',
  },
  {
    id: 'AutoCheckPluginUpdates',
    name: 'Auto-Check Plugin Updates',
    type: 'boolean',
    category: 'Plugins & Updates',
    tags: ['update', 'background', 'check'],
    description: 'Periodically check the Plugin Repository for updates to installed plugins in the background.',
    default: true,
    value: true,
  },
  {
    id: 'AutoUpdatePlugins',
    name: 'Auto-Update Plugins',
    type: 'boolean',
    category: 'Plugins & Updates',
    tags: ['update', 'auto', 'install'],
    description: 'Automatically download and install plugin updates in the background when they are available.',
    default: false,
    value: false,
  },

  // DEVELOPER TOOLS
  {
    id: 'AllowRightClick',
    name: 'Allow Context Menus',
    type: 'boolean',
    category: 'Developer Tools',
    tags: ['right-click', 'context', 'menu', 'inspect'],
    description: 'Enable the default browser right-click context menus.',
    default: true,
    value: true,
    requiresRestart: true,
  },
  {
    id: 'AllowDevtools',
    name: 'Enable Developer Tools',
    type: 'boolean',
    category: 'Developer Tools',
    tags: ['devtools', 'inspect', 'f12', 'console', 'network'],
    description: 'Allow accessing Chromium Developer Tools (F12 / Ctrl+Shift+I).',
    default: false,
    value: false,
    requiresRestart: true,
  },

  // APPLICATION BEHAVIOR
  {
    id: 'StartupUrl',
    name: 'Startup URL',
    type: 'string',
    category: 'Application Behavior',
    tags: ['start', 'home', 'url', 'dashboard'],
    description: 'The URL to load upon workspace initialization.',
    default: 'http://gui.localhost/index.html',
    value: 'http://gui.localhost/index.html',
  },
  {
    id: 'RememberTabs',
    name: 'Remember Open Tabs',
    type: 'boolean',
    category: 'Application Behavior',
    tags: ['tabs', 'startup', 'restore'],
    description: 'Restore your previously open tabs when restarting BingeKit or reloading the UI.',
    default: true,
    value: true,
  },
  {
    id: 'InstalledDataPath',
    name: 'Workspace Storage Directory',
    type: 'folder',
    category: 'Application Behavior',
    tags: ['path', 'storage', 'data', 'folder', 'workspace'],
    description: 'Custom path for installed-mode workspaces. Will be ignored if Portable Mode is active.',
    default: '',
    value: '',
    requiresRestart: true,
  },

  // HEADLESS FETCHERS
  {
    id: 'ShowHiddenFetcherWindows',
    name: 'Show Fetcher Windows',
    type: 'boolean',
    category: 'Headless Fetchers',
    tags: ['debug', 'visible', 'scraper', 'invisible', 'smartfetch'],
    description: 'Make headless SmartFetch and RawParse invisible windows visible for debugging.',
    default: false,
    value: false,
    requiresRestart: true,
  },
  {
    id: 'FetcherDefaultZoom',
    name: 'Fetcher Window Zoom',
    type: 'number',
    category: 'Headless Fetchers',
    tags: ['zoom', 'scale', 'size'],
    description: 'The native CSS document root zoom scale applied to SmartFetch execution pages.',
    default: 1.0,
    value: 1.0,
  },
  {
    id: 'FetcherTimeout',
    name: 'SmartFetch Default Timeout (ms)',
    type: 'number',
    category: 'Headless Fetchers',
    tags: ['timeout', 'expire', 'stuck', 'captcha', 'delay', 'infinite'],
    description: 'Milliseconds before a stalled SmartFetch task forces its hidden window visible prompting manual investigation (0 completely disables automatic window reveal).',
    default: 30000,
    value: 30000,
  },
  {
    id: 'FetcherDefaultSize',
    name: 'Fetcher Window Size (px)',
    type: 'number',
    category: 'Headless Fetchers',
    tags: ['size', 'width', 'height', 'resolution'],
    description: 'The default native pixel dimension (width/height) of hidden Fetcher windows when made visible.',
    default: 300,
    value: 300,
    requiresRestart: true,
  },

  // SECURITY & NETWORK
  {
    id: 'DisableWebSecurity',
    name: 'Disable Web Security',
    type: 'boolean',
    category: 'Security & Network',
    tags: ['cors', 'security', 'dangerous', 'bypass', 'cross origin'],
    description: 'Disables strict CORS and other security policies. Highly dangerous.',
    default: false,
    value: false,
    warning: 'DANGER: Disabling web security exposes your system to severe vulnerabilities. Use only in isolated, trusted environments.',
    requiresRestart: true,
  },
  {
    id: 'DisableGPU',
    name: 'Disable GPU',
    type: 'boolean',
    category: 'Security & Network',
    tags: ['gpu', 'hardware', 'acceleration', 'graphics', 'glitch', 'crash'],
    description: 'Disables GPU acceleration. Use this if you are experiencing graphical glitches or crashes.',
    default: false,
    value: false,
    requiresRestart: true,
  },
  {
    id: 'Incognito',
    name: 'Incognito Mode (For Testing)',
    type: 'boolean',
    category: 'Security & Network',
    tags: ['incognito', 'private', 'testing'],
    description: 'Enables incognito mode for testing purposes.',
    default: false,
    value: false,
    requiresRestart: true,
  }
];

export const ConfigView = ({ embedded = false }: { embedded?: boolean } = {}) => {
  const [config, setConfig] = useState<ConfigItem[]>(DEFAULT_CONFIG);
  const [searchQuery, setSearchQuery] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isPortableMode, setIsPortableMode] = useState(false);
  const [showMigrateModal, setShowMigrateModal] = useState(false);
  const [pendingMigratePath, setPendingMigratePath] = useState('');
  const [configToSaveHold, setConfigToSaveHold] = useState<Record<string, any>>({});

  const { theme } = useAppContext();

  useEffect(() => {
    const handleFolderSelected = (e: any) => {
      if (e.detail.id === 'InstalledDataPath') {
        updateValue('InstalledDataPath', e.detail.dir);
      }
    };
    window.addEventListener('bk-folder-selected', handleFolderSelected);
    return () => window.removeEventListener('bk-folder-selected', handleFolderSelected);
  }, []);

  useEffect(() => {
    const loadConfig = async () => {
      const dataStr = ahk.call('GetAboutConfig');
      const portableModeResult = ahk.call('GetStorageMode');
      const isPortable = portableModeResult === "1" || portableModeResult === 1 || portableModeResult === true;
      setIsPortableMode(isPortable);

      const installedPath = ahk.call('GetStoragePath') || '';

      if (dataStr) {
        try {
          const parsed = JSON.parse(dataStr);
          setConfig(prev => prev.map(item => {
            if (item.id === 'InstalledDataPath') {
              return { ...item, value: installedPath, disabled: isPortable };
            }
            return {
              ...item,
              value: parsed[item.id] !== undefined ? parsed[item.id] : item.default
            };
          }));
        } catch (e) {
          console.error("Failed to parse about_config.json");
        }
      } else {
        setConfig(prev => prev.map(item => item.id === 'InstalledDataPath' ? { ...item, value: installedPath, disabled: isPortable } : item));
      }
    };
    loadConfig();
  }, []);

  const executeSave = (customPathStr: string | null) => {
    ahk.call('SetAboutConfig', JSON.stringify(configToSaveHold, null, 2));
    setHasUnsavedChanges(false);

    if (customPathStr !== null) {
      ahk.call('MigrateStorage', isPortableMode ? 1 : 0, customPathStr);
    }
  };

  const handleSave = () => {
    const configToSave: Record<string, any> = {};
    let storagePathVal: string | null = null;

    config.forEach(item => {
      if (item.id === 'InstalledDataPath') {
        storagePathVal = item.value;
      } else {
        configToSave[item.id] = item.value;
      }
    });

    setConfigToSaveHold(configToSave);

    const origPath = ahk.call('GetStoragePath') || '';
    if (storagePathVal !== null && storagePathVal !== origPath && !isPortableMode) {
      setPendingMigratePath(storagePathVal);
      setShowMigrateModal(true);
      return;
    }

    // Normal save, no path changes
    ahk.call('SetAboutConfig', JSON.stringify(configToSave, null, 2));
    setHasUnsavedChanges(false);
  };

  const handleRestart = () => {
    handleSave();
    const ws = ahk.call('GetCurrentWorkspace');
    ahk.call('RestartWorkspace', ws || "default");
  };

  const updateValue = (id: string, val: any) => {
    setConfig(prev => prev.map(item => item.id === id ? { ...item, value: val } : item));
    setHasUnsavedChanges(true);
  };

  const filteredConfig = config.filter(item => {
    const q = searchQuery.toLowerCase();
    return item.name.toLowerCase().includes(q) ||
      item.id.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      (item.category && item.category.toLowerCase().includes(q)) ||
      (item.tags && item.tags.some(tag => tag.toLowerCase().includes(q)));
  });

  const groupedConfig = filteredConfig.reduce((acc, item) => {
    const cat = item.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {} as Record<string, ConfigItem[]>);

  return (
    <div className={`flex flex-col h-full w-full ${!embedded ? 'bg-zinc-950 text-zinc-200' : ''}`}>
      {!embedded && (
        <div className="flex items-center justify-between px-8 py-6 border-b border-[color-mix(in_srgb,var(--theme-border)_50%,transparent)] bg-zinc-900/30">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2 text-zinc-100">
              <Settings className="text-indigo-500" size={24} />
              Advanced Preferences
            </h1>
            <p className="text-zinc-500 text-sm mt-1">Caution: Modifying these advanced settings can disrupt application behavior.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
              <input
                type="text"
                placeholder="Search tags or settings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm w-64 focus:outline-none focus:border-indigo-500/50 transition-colors"
              />
            </div>
            {hasUnsavedChanges && (
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-4 py-2 bg-[var(--theme-accent)] hover:bg-[color-mix(in_srgb,var(--theme-accent)_80%,white)] text-white rounded-lg text-sm font-medium transition-colors"
              >
                <Save size={16} />
                Save Changes
              </button>
            )}
            <button
              onClick={handleRestart}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <RefreshCcw size={16} />
              Restart Workspace
            </button>
          </div>
        </div>
      )}

      {embedded && (
        <div className="flex items-center justify-between mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--theme-text-sec)]" size={16} />
            <input
              type="text"
              placeholder="Search tags or settings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-[color-mix(in_srgb,var(--theme-text-main)_3%,transparent)] border border-[color-mix(in_srgb,var(--theme-text-main)_15%,transparent)] rounded-lg text-sm w-64 focus:outline-none focus:border-[var(--theme-accent)] transition-colors text-[var(--theme-text-main)] placeholder:text-[var(--theme-text-sec)]"
            />
          </div>
          <div className="flex items-center gap-4">
            {hasUnsavedChanges && (
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-4 py-2 bg-[var(--theme-accent)] hover:bg-[color-mix(in_srgb,var(--theme-accent)_80%,white)] text-white rounded-lg text-sm font-medium transition-colors"
              >
                <Save size={16} />
                Save Changes
              </button>
            )}
            <button
              onClick={handleRestart}
              className="flex items-center gap-2 px-4 py-2 bg-[color-mix(in_srgb,var(--theme-text-main)_10%,transparent)] hover:bg-[color-mix(in_srgb,var(--theme-text-main)_15%,transparent)] text-[var(--theme-text-main)] rounded-lg text-sm font-medium transition-colors"
            >
              <RefreshCcw size={16} />
              Restart Workspace
            </button>
          </div>
        </div>
      )}

      <div className={`flex-1 overflow-y-auto custom-scrollbar ${!embedded ? 'p-8' : ''}`}>
        <div className={`max-w-5xl mx-auto space-y-8`}>
          {Object.entries(groupedConfig).map(([category, items]) => (
            <div key={category} className={`border border-[color-mix(in_srgb,var(--theme-border)_50%,transparent)] rounded-xl overflow-hidden ${!embedded ? 'bg-[color-mix(in_srgb,var(--theme-text-main)_2%,transparent)] backdrop-blur-sm' : ''}`}>
              <div className="bg-[color-mix(in_srgb,var(--theme-text-main)_2%,transparent)] px-6 py-3 border-b border-[color-mix(in_srgb,var(--theme-border)_50%,transparent)]">
                <h3 className="text-sm font-medium text-[var(--theme-text-main)] uppercase tracking-wider">{category}</h3>
              </div>
              <table className="w-full text-left border-collapse">
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={item.id} className={`border-b border-[color-mix(in_srgb,var(--theme-border)_50%,transparent)] hover:bg-[color-mix(in_srgb,var(--theme-text-main)_3%,transparent)] transition-colors ${idx === items.length - 1 ? 'border-b-0' : ''}`}>
                      <td className="px-6 py-4 align-top w-1/3">
                        <div className="font-medium text-[var(--theme-text-main)]">{item.name}</div>
                        <div className="text-xs text-[var(--theme-text-sec)] font-mono mt-1">{item.id}</div>
                        {item.requiresRestart && (
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-[color-mix(in_srgb,var(--theme-accent)_15%,transparent)] text-[var(--theme-accent)] mt-2`}>
                            Requires Restart
                          </span>
                        )}
                        {item.tags && item.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {item.tags.map(tag => (
                              <button
                                key={tag}
                                onClick={(e) => { e.preventDefault(); setSearchQuery(tag); }}
                                className="text-[9px] px-1.5 py-0.5 rounded bg-[color-mix(in_srgb,var(--theme-text-main)_5%,transparent)] hover:bg-[color-mix(in_srgb,var(--theme-text-main)_10%,transparent)] text-[var(--theme-text-sec)] hover:text-[var(--theme-text-main)] transition-colors cursor-pointer"
                              >
                                #{tag}
                              </button>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 align-top w-1/3">
                        <div className="text-sm text-[var(--theme-text-sec)] leading-relaxed">{item.description}</div>
                        {item.warning && (
                          <div className="flex items-start gap-1.5 mt-2 text-red-400 bg-red-500/10 p-2 rounded border border-red-500/20">
                            <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
                            <span className="text-xs leading-tight">{item.warning}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 align-top w-1/3">
                        {item.type === 'boolean' ? (
                          <CustomCheckbox
                            checked={item.value}
                            onChange={(val) => updateValue(item.id, val)}
                          />
                        ) : item.type === 'string' ? (
                          <input
                            type="text"
                            value={item.value}
                            onChange={(e) => updateValue(item.id, e.target.value)}
                            className="w-full bg-[color-mix(in_srgb,var(--theme-text-main)_5%,transparent)] border border-[color-mix(in_srgb,var(--theme-border)_50%,transparent)] rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-[var(--theme-accent)] text-[var(--theme-text-main)] transition-colors"
                          />
                        ) : item.type === 'number' ? (
                          <input
                            type="number"
                            value={item.value}
                            onChange={(e) => updateValue(item.id, parseFloat(e.target.value))}
                            className="w-32 bg-[color-mix(in_srgb,var(--theme-text-main)_5%,transparent)] border border-[color-mix(in_srgb,var(--theme-border)_50%,transparent)] rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-[var(--theme-accent)] text-[var(--theme-text-main)] transition-colors"
                          />
                        ) : item.type === 'folder' ? (
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={item.value}
                              readOnly
                              placeholder="Default LocalAppData..."
                              className={`flex-1 bg-[color-mix(in_srgb,var(--theme-text-main)_5%,transparent)] border border-[color-mix(in_srgb,var(--theme-border)_50%,transparent)] rounded-md px-3 py-1.5 text-sm text-[var(--theme-text-main)] focus:outline-none transition-colors ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                            />
                            <button
                              disabled={item.disabled}
                              onClick={() => {
                                if (!item.disabled) ahk.call('PromptSelectFolder', item.id);
                              }}
                              className="px-3 py-1.5 bg-[color-mix(in_srgb,var(--theme-text-main)_10%,transparent)] hover:bg-[color-mix(in_srgb,var(--theme-text-main)_15%,transparent)] text-[var(--theme-text-main)] rounded text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Browse
                            </button>
                          </div>
                        ) : (
                          <span className="text-sm text-zinc-500">Unsupported type</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
          {filteredConfig.length === 0 && (
            <div className="text-center py-12 text-zinc-500 text-sm border border-[color-mix(in_srgb,var(--theme-border)_50%,transparent)] rounded-xl pt-10 pb-10">
              No preferences found matching "{searchQuery}"
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={showMigrateModal}
        onClose={() => setShowMigrateModal(false)}
        title="Migrate Data Source?"
      >
        <div className="space-y-4">
          <p className="text-sm text-zinc-300">
            You've requested to change the workspace directory to:<br />
            <span className="font-mono text-xs text-indigo-400 break-all">{pendingMigratePath}</span>
          </p>
          <p className="text-xs text-zinc-400 leading-relaxed bg-zinc-900/50 p-3 rounded-lg border border-zinc-800">
            For this change to seamlessly copy over your existing workspace data (plugins, logs, configs) into the new directory and avoid data-loss visually, BingeKit must immediately restart and native directory movement must occur.
          </p>
          <div className="flex gap-3 justify-end pt-4 border-t border-zinc-800/50 mt-4">
            <button
              onClick={() => {
                setShowMigrateModal(false);
                setConfig(prev => prev.map(i => i.id === 'InstalledDataPath' ? { ...i, value: ahk.call('GetStoragePath') || '' } : i));
                setHasUnsavedChanges(true); // they can try again or reject the path completely
              }}
              className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              Cancel Path Change
            </button>
            <button
              onClick={() => {
                setShowMigrateModal(false);
                executeSave(pendingMigratePath);
              }}
              className="px-4 py-2 text-sm font-medium bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500/30 border border-red-500/20 transition-colors"
            >
              Migrate & Restart
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
