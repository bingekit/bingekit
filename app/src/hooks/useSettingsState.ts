import { useState, useEffect } from 'react';
import { ahk } from '../lib/ahk';

type NavButtonsConfig = { home: boolean; back: boolean; forward: boolean; reload: boolean };

export function useSettingsState() {
  const [navButtons, setNavButtons] = useState<NavButtonsConfig>({ home: true, back: true, forward: true, reload: true });
  const [isAdblockEnabled, setIsAdblockEnabled] = useState(true);
  const [networkFilters, setNetworkFilters] = useState<Record<string, boolean>>({});
  const [isCompiledApp, setIsCompiledApp] = useState(true);
  const [isPortableApp, setIsPortableApp] = useState(false);
  const [ffmpegStatusApp, setFfmpegStatusApp] = useState('checking...');
  const [searchThreadLimit, setSearchThreadLimit] = useState(5);
  const [defaultSearchEngine, setDefaultSearchEngine] = useState('https://duckduckgo.com/?q=');
  const [installedInterfaces, setInstalledInterfaces] = useState<string[]>([]);
  const [pluginRepoUrl, setPluginRepoUrl] = useState('https://raw.githubusercontent.com/owhs/bingekit/main/repo_example/repo.json');
  const [autoCheckPluginUpdates, setAutoCheckPluginUpdates] = useState(true);
  const [autoUpdatePlugins, setAutoUpdatePlugins] = useState(false);
  const [autoFocusPlayerOnTabChange, setAutoFocusPlayerOnTabChange] = useState(true);
  const [ctrlClickBackgroundTab, setCtrlClickBackgroundTab] = useState(true);
  const [autoFocusVideo, setAutoFocusVideo] = useState(true);

  useEffect(() => {
    try { ahk.call('UpdateAdblockStatus', isAdblockEnabled ? 'true' : 'false'); } catch (e) { }
  }, [isAdblockEnabled]);

  useEffect(() => { ahk.call('SaveData', 'search_engine.txt', defaultSearchEngine); }, [defaultSearchEngine]);
  useEffect(() => { ahk.call('SaveData', 'search_thread_limit.txt', searchThreadLimit.toString()); }, [searchThreadLimit]);
  useEffect(() => { ahk.call('SaveData', 'nav_buttons.json', JSON.stringify(navButtons)); }, [navButtons]);
  
  useEffect(() => {
    ahk.call('SaveData', 'network_filters.json', JSON.stringify(networkFilters));
    try { ahk.call('UpdateNetworkFilters', JSON.stringify(networkFilters)); } catch (e) { }
  }, [networkFilters]);

  return {
    navButtons, setNavButtons,
    isAdblockEnabled, setIsAdblockEnabled,
    networkFilters, setNetworkFilters,
    isCompiledApp, setIsCompiledApp,
    isPortableApp, setIsPortableApp,
    ffmpegStatusApp, setFfmpegStatusApp,
    searchThreadLimit, setSearchThreadLimit,
    defaultSearchEngine, setDefaultSearchEngine,
    installedInterfaces, setInstalledInterfaces,
    pluginRepoUrl, setPluginRepoUrl,
    autoCheckPluginUpdates, setAutoCheckPluginUpdates,
    autoUpdatePlugins, setAutoUpdatePlugins,
    autoFocusPlayerOnTabChange, setAutoFocusPlayerOnTabChange,
    ctrlClickBackgroundTab, setCtrlClickBackgroundTab,
    autoFocusVideo, setAutoFocusVideo
  };
}
