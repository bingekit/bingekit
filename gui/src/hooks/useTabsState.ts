import { useState, useEffect, useRef, MutableRefObject } from 'react';
import { ahk } from '../lib/ahk';

export function useTabsState(
  activeTab: string,
  setActiveTab: any,
  url: string,
  setUrl: any,
  setInputUrl: any,
  setPageTitle: any,
  setAuthStatus: any,
  setPlayerStatus: any,
  pageTitleRef: MutableRefObject<string>,
  computeNavUrl: (target: string) => string,
  setPlayerNavSignal: any
) {
  const [isMultiTabEnabled, setIsMultiTabEnabled] = useState(false);
  const [browserTabs, setBrowserTabs] = useState<{ id: string, url: string, inputUrl: string, title?: string, favicon?: string, isPlaying?: boolean, isMuted?: boolean }[]>([{ id: 'main', url: 'https://bingekit.app/home/', inputUrl: 'https://bingekit.app/home/' }]);
  const [activeBrowserTabId, setActiveBrowserTabId] = useState('main');
  const [tilingMode, setTilingMode] = useState<'none' | 'split-hz' | 'split-vt' | 'grid'>('none');

  const activeBrowserTabIdRef = useRef('main');
  const previousTabIdRef = useRef('main');
  const lastSyncUrls = useRef<Record<string, string>>({});
  const isInitialMultiTabMount = useRef(true);
  const [isReadyToSave, setIsReadyToSave] = useState(false);

  useEffect(() => {
    if (activeBrowserTabIdRef.current !== activeBrowserTabId) {
      activeBrowserTabIdRef.current = activeBrowserTabId;
      ahk.asyncCall('SetActiveTabId', activeBrowserTabId);

      const activeTabObj = browserTabs.find(t => t.id === activeBrowserTabId);
      if (activeTabObj) {
        lastSyncUrls.current[activeBrowserTabId] = activeTabObj.url;
        setUrl(activeTabObj.url);
        setInputUrl(activeTabObj.inputUrl || activeTabObj.url);
        document.title = activeTabObj.title || 'BingeKit';
      }
    }
  }, [activeBrowserTabId, browserTabs, setInputUrl, setUrl]);

  useEffect(() => {
    if (isReadyToSave) {
      ahk.call('SaveData', 'active_tab_id.txt', activeBrowserTabId);
    }
  }, [activeBrowserTabId, isReadyToSave]);

  useEffect(() => {
    if (isReadyToSave) {
      ahk.call('SaveData', 'active_tabs.json', JSON.stringify(browserTabs));
    }
  }, [browserTabs, isReadyToSave]);



  useEffect(() => {
    const handleUrlEvent = (e: any) => {
      if (e.detail && e.detail.url) {
        const eventTabId = e.detail.tabId || 'main';
        const eventLastSync = lastSyncUrls.current[eventTabId];

        if ((e.detail.url === 'about:blank' || e.detail.url === 'err://' || e.detail.url.startsWith('edge://') || e.detail.url.startsWith('data:text/html')) && (eventLastSync?.startsWith('custom:') || eventLastSync === 'about:blank')) {
          return;
        }
        let reportedUrl = e.detail.url;
        if (reportedUrl.startsWith('http://interface.localhost/')) {
          reportedUrl = reportedUrl.replace('http://interface.localhost/', 'interface:');
          reportedUrl = reportedUrl.replace(/\/index\.html?$/i, '');
          reportedUrl = reportedUrl.replace(/index\.html?$/i, '');
          reportedUrl = reportedUrl.replace(/\/$/, '');
        }
        setBrowserTabs(prev => {
          const tabIdx = prev.findIndex(t => t.id === eventTabId);
          if (tabIdx >= 0) {
            if (prev[tabIdx].url === reportedUrl && prev[tabIdx].inputUrl === reportedUrl) return prev;
            const newTabs = [...prev];
            newTabs[tabIdx] = { ...newTabs[tabIdx], url: reportedUrl, inputUrl: reportedUrl };
            return newTabs;
          } else {
            const newTabs = [...prev];
            newTabs.push({ id: eventTabId, url: reportedUrl, inputUrl: reportedUrl });
            return newTabs;
          }
        });
        lastSyncUrls.current[eventTabId] = reportedUrl;
        if (eventTabId === activeBrowserTabIdRef.current) {
          setUrl(reportedUrl);
          setInputUrl(reportedUrl);
          setPageTitle('');
          pageTitleRef.current = '';
          setPlayerStatus('notFound'); // Force re-triggering of auto-resume when new video actually spawns
          setPlayerNavSignal((s: number) => s + 1);
        }
      }
    };
    window.addEventListener('player-url-changed', handleUrlEvent);

    const handleStatusUpdate = (e: any) => {
      if (e.detail) {
        const eventTabId = e.detail.tabId || 'main';

        let safeTitle = e.detail.title;
        if (!safeTitle || safeTitle.trim() === '') safeTitle = '';
        else {
          if (safeTitle.startsWith('blank.localhost/#')) safeTitle = safeTitle.substring('blank.localhost/#'.length);
          else if (safeTitle.startsWith('http://blank.localhost/#')) safeTitle = safeTitle.substring('http://blank.localhost/#'.length);

          if (safeTitle.startsWith('interface.localhost/')) {
            safeTitle = safeTitle.substring('interface.localhost/'.length).replace(/\/index\.html?$/i, '').replace(/\/$/, '');
          }
        }

        setBrowserTabs(prev => {
          const tabIdx = prev.findIndex(t => t.id === eventTabId);
          if (tabIdx >= 0) {
            if (prev[tabIdx].title === safeTitle) return prev;
            const newTabs = [...prev];
            newTabs[tabIdx] = { ...newTabs[tabIdx], title: safeTitle };
            return newTabs;
          }
          return prev;
        });

        if (eventTabId === activeBrowserTabIdRef.current) {
          if (e.detail.authStatus !== undefined) setAuthStatus(e.detail.authStatus);
          if (e.detail.hasPlayer !== undefined) setPlayerStatus(e.detail.hasPlayer ? 'found' : 'notFound');
          setPageTitle(safeTitle);
          pageTitleRef.current = safeTitle;
        }
      }
    };
    window.addEventListener('player-status-update', handleStatusUpdate);

    const handleFaviconUpdate = (e: any) => {
      if (e.detail && e.detail.favicon !== undefined) {
        setBrowserTabs(prev => {
          const tabIdx = prev.findIndex(t => t.id === (e.detail.tabId || 'main'));
          if (tabIdx >= 0) {
            if (prev[tabIdx].favicon === e.detail.favicon) return prev;
            const newTabs = [...prev];
            newTabs[tabIdx] = { ...newTabs[tabIdx], favicon: e.detail.favicon };
            return newTabs;
          }
          return prev;
        });
      }
    };
    window.addEventListener('player-favicon-update', handleFaviconUpdate);

    return () => {
      window.removeEventListener('player-url-changed', handleUrlEvent);
      window.removeEventListener('player-status-update', handleStatusUpdate);
      window.removeEventListener('player-favicon-update', handleFaviconUpdate);
    };
  }, [setAuthStatus, setInputUrl, setPageTitle, setPlayerStatus, setUrl, pageTitleRef]);



  return {
    isMultiTabEnabled, setIsMultiTabEnabled,
    browserTabs, setBrowserTabs,
    activeBrowserTabId, setActiveBrowserTabId,
    tilingMode, setTilingMode,
    lastSyncUrls,
    setIsReadyToSave // Expose the state setter instead of the ref
  };
}
