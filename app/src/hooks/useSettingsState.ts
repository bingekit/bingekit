import React, { useState, useEffect, useRef } from 'react';
import { ahk } from '../lib/ahk';

type NavButtonsConfig = { home: boolean; back: boolean; forward: boolean; reload: boolean };

export function useSettingsState() {
  const [navButtons, _setNavButtons] = useState<NavButtonsConfig>({ home: true, back: true, forward: true, reload: true });
  const setNavButtons = (val: React.SetStateAction<NavButtonsConfig>) => {
    _setNavButtons(prev => {
      const next = typeof val === 'function' ? (val as any)(prev) : val;
      ahk.call('SaveData', 'nav_buttons.json', JSON.stringify(next));
      return next;
    });
  };

  const [isAdblockEnabled, _setIsAdblockEnabled] = useState(true);
  const setIsAdblockEnabled = (val: React.SetStateAction<boolean>) => {
    _setIsAdblockEnabled(prev => {
      const next = typeof val === 'function' ? (val as any)(prev) : val;
      try { ahk.call('UpdateAdblockStatus', next ? 'true' : 'false'); } catch (e) { }
      try { ahk.call('SaveData', 'adblock_enabled.txt', next ? 'true' : 'false'); } catch (e) { }
      return next;
    });
  };

  const [adblockWhitelist, _setAdblockWhitelist] = useState<string[]>([]);
  const setAdblockWhitelist = (val: React.SetStateAction<string[]>) => {
    _setAdblockWhitelist(prev => {
      const next = typeof val === 'function' ? (val as any)(prev) : val;
      try { ahk.call('UpdateAdblockWhitelist', JSON.stringify(next)); } catch(e) {}
      ahk.call('SaveData', 'adblock_whitelist.json', JSON.stringify(next));
      return next;
    });
  };

  const [networkFilters, _setNetworkFilters] = useState<Record<string, boolean>>({});
  const setNetworkFilters = (val: React.SetStateAction<Record<string, boolean>>) => {
    _setNetworkFilters(prev => {
      const next = typeof val === 'function' ? (val as any)(prev) : val;
      try { ahk.call('UpdateNetworkFilters', JSON.stringify(next)); } catch(e) {}
      ahk.call('SaveData', 'network_filters.json', JSON.stringify(next));
      return next;
    });
  };

  const [isCompiledApp, setIsCompiledApp] = useState(true);
  const [isPortableApp, setIsPortableApp] = useState(false);
  const [ffmpegStatusApp, setFfmpegStatusApp] = useState('checking...');

  const [searchThreadLimit, _setSearchThreadLimit] = useState(5);
  const setSearchThreadLimit = (val: React.SetStateAction<number>) => {
    _setSearchThreadLimit(prev => {
      const next = typeof val === 'function' ? (val as any)(prev) : val;
      ahk.call('SaveData', 'search_thread_limit.txt', next.toString());
      return next;
    });
  };

  const [defaultSearchEngine, _setDefaultSearchEngine] = useState('https://duckduckgo.com/?q=');
  const setDefaultSearchEngine = (val: React.SetStateAction<string>) => {
    _setDefaultSearchEngine(prev => {
      const next = typeof val === 'function' ? (val as any)(prev) : val;
      ahk.call('SaveData', 'search_engine.txt', next);
      return next;
    });
  };

  const [installedInterfaces, setInstalledInterfaces] = useState<string[]>([]);
  const [pluginRepoUrl, setPluginRepoUrl] = useState('https://raw.githubusercontent.com/owhs/bingekit/main/repo_example/repo.json');
  const [autoCheckPluginUpdates, setAutoCheckPluginUpdates] = useState(true);
  const [autoUpdatePlugins, setAutoUpdatePlugins] = useState(false);
  const [autoFocusPlayerOnTabChange, setAutoFocusPlayerOnTabChange] = useState(true);
  const [ctrlClickBackgroundTab, setCtrlClickBackgroundTab] = useState(true);
  const [autoFocusVideo, setAutoFocusVideo] = useState(true);


  return {
    navButtons, setNavButtons,
    isAdblockEnabled, setIsAdblockEnabled,
    adblockWhitelist, setAdblockWhitelist,
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
