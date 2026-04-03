import { useState, useEffect, useRef } from 'react';
import { ahk } from '../lib/ahk';

export function useGeneralState() {
  const [theme, setTheme] = useState({
    mode: 'dark',
    titlebarBg: '#09090b', sidebarBg: '#09090b', mainBg: '#09090b',
    border: '#27272a', accent: '#6366f1', textMain: '#fafafa', textSec: '#a1a1aa',
    titlebarText: '#a1a1aa', titlebarTextHover: '#fafafa', titlebarAccent: '#6366f1',
    titlebarAlt: '#18181b', titlebarAlt2: '#27272a', sidebarText: '#a1a1aa',
    urlbarBg: '', urlbarText: '', urlbarIcon: ''
  });

  const [activeTab, setActiveTab] = useState<'dashboard' | 'player' | 'bookmarks' | 'watchlater' | 'plugins' | 'activity' | 'settings' | 'flows' | 'userscripts' | 'history' | 'discovery' | 'workspaces' | 'downloads' | 'config'>('dashboard');
  const [activeSettingsTab, setActiveSettingsTab] = useState<'general' | 'appearance' | 'downloads' | 'privacy' | 'advanced'>('general');
  const [isQuickOptionsHidden, setIsQuickOptionsHidden] = useState(true);
  const [isFocusedMode, setIsFocusedMode] = useState<boolean>(false);
  const [testSearchQuery, setTestSearchQuery] = useState('matrix');
  const [testSearchResults, setTestSearchResults] = useState<{ status: string, nodesCount: number, results: any[] }>({ status: 'idle', nodesCount: 0, results: [] });
  const [isTestingSearch, setIsTestingSearch] = useState(false);
  const [searchParamMode, setSearchParamMode] = useState<'fetch' | 'navigate'>('fetch');
  const [urlBarMode, setUrlBarMode] = useState<'full' | 'title' | 'hidden'>('full');
  const [homePage, setHomePage] = useState('https://bingekit.app/start/');

  const isInitialThemeMount = useRef(true);
  useEffect(() => {
    if (isInitialThemeMount.current) { isInitialThemeMount.current = false; return; }
    ahk.call('SaveData', 'theme.json', JSON.stringify(theme));
  }, [theme]);

  const isInitialHomePageMount = useRef(true);
  useEffect(() => {
    if (isInitialHomePageMount.current) { isInitialHomePageMount.current = false; return; }
    const saveTimer = setTimeout(() => {
      ahk.call('SaveData', 'home_page.txt', homePage);
    }, 500);
    return () => clearTimeout(saveTimer);
  }, [homePage]);

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
