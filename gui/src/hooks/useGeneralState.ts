import React, { useState, useEffect, useRef } from 'react';
import { ahk } from '../lib/ahk';

export function useGeneralState() {
  const themeTimerRef = useRef<any>(null);
  const [theme, _setTheme] = useState({
    mode: 'dark',
    titlebarBg: '#09090b', sidebarBg: '#09090b', mainBg: '#09090b',
    border: '#27272a', accent: '#6366f1', textMain: '#fafafa', textSec: '#a1a1aa',
    titlebarText: '#a1a1aa', titlebarTextHover: '#fafafa', titlebarAccent: '#6366f1',
    titlebarAlt: '#18181b', titlebarAlt2: '#27272a', sidebarText: '#a1a1aa',
    urlbarBg: '', urlbarText: '', urlbarIcon: ''
  });
  const setTheme = (val: React.SetStateAction<any>) => {
    _setTheme(prev => {
      const next = typeof val === 'function' ? (val as any)(prev) : val;
      if (themeTimerRef.current) clearTimeout(themeTimerRef.current);
      themeTimerRef.current = setTimeout(() => {
        try { ahk.call('SaveData', 'theme.json', JSON.stringify(next)); } catch (e) { }
      }, 500);
      return next;
    });
  };

  const [activeTab, setActiveTab] = useState<'dashboard' | 'player' | 'bookmarks' | 'watchlater' | 'plugins' | 'activity' | 'settings' | 'flows' | 'userscripts' | 'history' | 'discovery' | 'workspaces' | 'downloads' | 'config'>('dashboard');
  const [activeSettingsTab, _setActiveSettingsTab] = useState<'general' | 'appearance' | 'downloads' | 'privacy' | 'adblock' | 'advanced'>('general');
  const setActiveSettingsTab = (val: React.SetStateAction<'general' | 'appearance' | 'downloads' | 'privacy' | 'adblock' | 'advanced'>) => {
    _setActiveSettingsTab(prev => {
      const next = typeof val === 'function' ? (val as any)(prev) : val;
      try { ahk.call('SaveData', 'active_settings_tab.txt', next); } catch (e) { }
      return next;
    });
  };

  const [isQuickOptionsHidden, _setIsQuickOptionsHidden] = useState(true);
  const setIsQuickOptionsHidden = (val: React.SetStateAction<boolean>) => {
    _setIsQuickOptionsHidden(prev => {
      const next = typeof val === 'function' ? (val as any)(prev) : val;
      try { ahk.call('SaveData', 'quick_options_hidden.txt', next ? 'true' : 'false'); } catch (e) { }
      return next;
    });
  };

  const [isFocusedMode, _setIsFocusedMode] = useState<boolean>(false);
  const setIsFocusedMode = (val: React.SetStateAction<boolean>) => {
    _setIsFocusedMode(prev => {
      const next = typeof val === 'function' ? (val as any)(prev) : val;
      try { ahk.call('SaveData', 'focused_mode.txt', next ? 'true' : 'false'); } catch (e) { }
      return next;
    });
  };

  const [testSearchQuery, setTestSearchQuery] = useState('matrix');
  const [testSearchResults, setTestSearchResults] = useState<{ status: string, nodesCount: number, results: any[] }>({ status: 'idle', nodesCount: 0, results: [] });
  const [isTestingSearch, setIsTestingSearch] = useState(false);

  const [searchParamMode, _setSearchParamMode] = useState<'fetch' | 'navigate'>('fetch');
  const setSearchParamMode = (val: React.SetStateAction<'fetch' | 'navigate'>) => {
    _setSearchParamMode(prev => {
      const next = typeof val === 'function' ? (val as any)(prev) : val;
      try { ahk.call('SaveData', 'search_param_mode.txt', next); } catch (e) { }
      return next;
    });
  };

  const [urlBarMode, _setUrlBarMode] = useState<'full' | 'title' | 'hidden'>('full');
  const setUrlBarMode = (val: React.SetStateAction<'full' | 'title' | 'hidden'>) => {
    _setUrlBarMode(prev => {
      const next = typeof val === 'function' ? (val as any)(prev) : val;
      try { ahk.call('SaveData', 'url_bar_mode.txt', next); } catch (e) { }
      return next;
    });
  };

  const timerRef = useRef<any>(null);
  const [homePage, _setHomePage] = useState('https://bingekit.app/home/');
  const setHomePage = (val: React.SetStateAction<string>) => {
    _setHomePage(prev => {
      const next = typeof val === 'function' ? (val as any)(prev) : val;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        try { ahk.call('SaveData', 'home_page.txt', next); } catch (e) { }
      }, 500);
      return next;
    });
  };



  return {
    theme, setTheme,
    activeTab, setActiveTab,
    activeSettingsTab, setActiveSettingsTab,
    isQuickOptionsHidden, setIsQuickOptionsHidden,
    isFocusedMode, setIsFocusedMode,
    testSearchQuery, setTestSearchQuery,
    testSearchResults, setTestSearchResults,
    isTestingSearch, setIsTestingSearch,
    searchParamMode, setSearchParamMode,
    urlBarMode, setUrlBarMode,
    homePage, setHomePage
  };
}
