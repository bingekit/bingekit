import React, { useState, useEffect } from 'react';
import { Settings, Save, AlertTriangle, RefreshCcw, Search } from 'lucide-react';
import { ahk } from '../../lib/ahk';
import { useAppContext } from '../../context/AppContext';
import { TooltipWrapper } from '../ui/TooltipWrapper';
import { CustomCheckbox } from '../ui/CustomCheckbox';

type ConfigType = 'string' | 'boolean' | 'number';

interface ConfigItem {
  id: string;
  name: string;
  type: ConfigType;
  description: string;
  default: any;
  value: any;
  warning?: string;
  requiresRestart?: boolean;
}

const DEFAULT_CONFIG: ConfigItem[] = [
  {
    id: 'StartupUrl',
    name: 'Startup URL',
    type: 'string',
    description: 'The URL to load upon workspace initialization.',
    default: 'http://gui.localhost/index.html',
    value: 'http://gui.localhost/index.html',
  },
  {
    id: 'UpdateUrl',
    name: 'Update API Endpoint',
    type: 'string',
    description: 'The API endpoint to poll for new releases (GitHub Releases API format).',
    default: 'https://api.github.com/repos/owhs/bingekit/releases/latest',
    value: 'https://api.github.com/repos/owhs/bingekit/releases/latest',
  },
  {
    id: 'AllowRightClick',
    name: 'Allow Context Menus',
    type: 'boolean',
    description: 'Enable the default browser right-click context menus.',
    default: true,
    value: true,
    requiresRestart: true,
  },
  {
    id: 'AllowDevtools',
    name: 'Enable Developer Tools',
    type: 'boolean',
    description: 'Allow accessing Chromium Developer Tools (F12 / Ctrl+Shift+I).',
    default: false,
    value: false,
    requiresRestart: true,
  },
  {
    id: 'DebugMode',
    name: 'Debug Mode',
    type: 'boolean',
    description: 'Enable comprehensive verbose logging across the application environment.',
    default: false,
    value: false,
  },
  {
    id: 'ShowHiddenFetcherWindows',
    name: 'Show Fetcher Windows',
    type: 'boolean',
    description: 'Make headless SmartFetch and RawParse invisible windows visible for debugging.',
    default: false,
    value: false,
  },
  {
    id: 'DisableWebSecurity',
    name: 'Disable Web Security',
    type: 'boolean',
    description: 'Disables strict CORS and other security policies. Highly dangerous.',
    default: false,
    value: false,
    warning: 'DANGER: Disabling web security exposes your system to severe vulnerabilities. Use only in isolated, trusted environments.',
    requiresRestart: true,
  }
];

export const ConfigView = () => {
  const [config, setConfig] = useState<ConfigItem[]>(DEFAULT_CONFIG);
  const [searchQuery, setSearchQuery] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const { theme } = useAppContext();

  useEffect(() => {
    const loadConfig = async () => {
      const dataStr = ahk.call('GetAboutConfig');
      if (dataStr) {
        try {
          const parsed = JSON.parse(dataStr);
          setConfig(prev => prev.map(item => ({
            ...item,
            value: parsed[item.id] !== undefined ? parsed[item.id] : item.default
          })));
        } catch (e) {
          console.error("Failed to parse about_config.json");
        }
      }
    };
    loadConfig();
  }, []);

  const handleSave = () => {
    const configToSave: Record<string, any> = {};
    config.forEach(item => {
      configToSave[item.id] = item.value;
    });
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

  const filteredConfig = config.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full w-full bg-zinc-950 text-zinc-200">
      <div className="flex items-center justify-between px-8 py-6 border-b border-zinc-800/50 bg-zinc-900/30">
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
              placeholder="Search preferences..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm w-64 focus:outline-none focus:border-indigo-500/50 transition-colors"
            />
          </div>
          {hasUnsavedChanges && (
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm font-medium transition-colors"
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

      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        <div className="max-w-5xl mx-auto border border-zinc-800/80 rounded-xl overflow-hidden bg-zinc-900/20 backdrop-blur-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-900/50 border-b border-zinc-800 text-xs uppercase tracking-wider text-zinc-500 font-medium">
                <th className="px-6 py-4 w-1/3">Preference Name</th>
                <th className="px-6 py-4 w-1/3">Description</th>
                <th className="px-6 py-4 w-1/3">Value</th>
              </tr>
            </thead>
            <tbody>
              {filteredConfig.map((item, idx) => (
                <tr key={item.id} className={`border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors ${idx === filteredConfig.length - 1 ? 'border-b-0' : ''}`}>
                  <td className="px-6 py-4 align-top">
                    <div className="font-medium text-zinc-200">{item.name}</div>
                    <div className="text-xs text-zinc-500 font-mono mt-1">{item.id}</div>
                    {item.requiresRestart && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-500/10 text-indigo-400 mt-2">
                        Requires Restart
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 align-top">
                    <div className="text-sm text-zinc-400 leading-relaxed">{item.description}</div>
                    {item.warning && (
                      <div className="flex items-start gap-1.5 mt-2 text-red-400 bg-red-500/10 p-2 rounded border border-red-500/20">
                        <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
                        <span className="text-xs leading-tight">{item.warning}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 align-top">
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
                        className="w-full bg-zinc-900 border border-zinc-700/50 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-500/50 text-zinc-200 transition-colors"
                      />
                    ) : item.type === 'number' ? (
                      <input
                        type="number"
                        value={item.value}
                        onChange={(e) => updateValue(item.id, parseFloat(e.target.value))}
                        className="w-32 bg-zinc-900 border border-zinc-700/50 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-500/50 text-zinc-200 transition-colors"
                      />
                    ) : (
                      <span className="text-sm text-zinc-500">Unsupported type</span>
                    )}
                  </td>
                </tr>
              ))}
              {filteredConfig.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-zinc-500 text-sm">
                    No preferences found matching "{searchQuery}"
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
