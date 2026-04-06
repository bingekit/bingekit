import React, { useEffect } from 'react';
import { ahk } from '../../lib/ahk';
import { useAppContext } from '../../context/AppContext';

// Layout bounds
import { ThemeStyles } from './ThemeStyles';
import { Titlebar } from './Titlebar';
import { Sidebar } from './Sidebar';
import { GlobalPrompt } from '../ui/GlobalPrompt';
import { GlobalConfirm } from '../ui/GlobalConfirm';

// Views
import { DashboardView } from '../views/DashboardView';
import { PlayerView } from '../views/PlayerView';
import { SettingsView } from '../views/settings/SettingsView';
import { LibraryView } from '../views/library/LibraryView';
import { ExploreView } from '../views/explore/ExploreView';
import { ExtensionsView } from '../views/plugins/ExtensionsView';
import { DownloadsView } from '../views/DownloadsView';
import { DocsView } from '../views/DocsView';

declare global {
  interface Window {
    showToast: (message: string, arg1?: string | any, arg2?: string, arg3?: string) => void;
  }
}

export const MainLayout = () => {
  const {
    theme, activeTab, browserTabs, setBrowserTabs, activeBrowserTabId,
    setActiveBrowserTabId, navigateUrl, homePage,
    bookmarks, setBookmarks, url, fetchTitleForUrl
  } = useAppContext();

  useEffect(() => {
    window.showToast = (msg: string, arg1: any = 'info', arg2: string = '', arg3: string = '') => {
      try {
        if (typeof arg1 === 'object') arg1 = JSON.stringify(arg1);
        (window as any).chrome.webview.hostObjects.ahk.ShowToast(msg, arg1, arg2, arg3);
      } catch { }
    };

    const handleCloseActiveTab = () => {
      if (browserTabs.length <= 1) return; // Don't close the last tab

      const tabIdToClose = activeBrowserTabId;
      ahk.asyncCall('ClosePlayer', tabIdToClose);

      const idx = browserTabs.findIndex(t => t.id === tabIdToClose);
      const newTabs = browserTabs.filter(t => t.id !== tabIdToClose);
      if (newTabs.length > 0) setActiveBrowserTabId(newTabs[Math.max(0, idx - 1)].id);
      setBrowserTabs(newTabs);
    };

    const handleNewTabEvent = () => navigateUrl(homePage || 'https://bingekit.app/home/', true);

    const handleContextAction = (e: any) => {
      const { action, tabId } = e.detail;

      if (action === 'close') {
        if (browserTabs.length <= 1) return;

        ahk.asyncCall('ClosePlayer', tabId);

        const idx = browserTabs.findIndex(t => t.id === tabId);
        const newTabs = browserTabs.filter(t => t.id !== tabId);
        if (activeBrowserTabId === tabId && newTabs.length > 0) setActiveBrowserTabId(newTabs[Math.max(0, idx - 1)].id);
        setBrowserTabs(newTabs);
      }
      else if (action === 'closeRight') {
        const idx = browserTabs.findIndex(t => t.id === tabId);
        if (idx === -1) return;

        const tabsToKeep = browserTabs.slice(0, idx + 1);
        const tabsToClose = browserTabs.slice(idx + 1);

        tabsToClose.forEach(t => { ahk.asyncCall('ClosePlayer', t.id); });

        if (tabsToClose.some(t => t.id === activeBrowserTabId)) setActiveBrowserTabId(tabId);
        setBrowserTabs(tabsToKeep);
      }
      else if (action === 'closeOthers') {
        const tabsToKeep = browserTabs.filter(t => t.id === tabId);
        const tabsToClose = browserTabs.filter(t => t.id !== tabId);

        tabsToClose.forEach(t => { ahk.asyncCall('ClosePlayer', t.id); });

        setActiveBrowserTabId(tabId);
        setBrowserTabs(tabsToKeep);
      }
      else if (action === 'toggleMute') {
        const idx = browserTabs.findIndex(t => t.id === tabId);
        if (idx >= 0) {
          const newMuteState = !browserTabs[idx].isMuted;
          ahk.asyncCall('MutePlayer', newMuteState ? 1 : 0, tabId);

          const newTabs = [...browserTabs];
          newTabs[idx] = { ...newTabs[idx], isMuted: newMuteState };
          setBrowserTabs(newTabs);
        }
      }
    };

    window.addEventListener('bk-close-active-tab', handleCloseActiveTab);
    window.addEventListener('bk-new-tab', handleNewTabEvent);
    window.addEventListener('bk-tab-context-action', handleContextAction);

    return () => {
      window.removeEventListener('bk-close-active-tab', handleCloseActiveTab);
      window.removeEventListener('bk-new-tab', handleNewTabEvent);
      window.removeEventListener('bk-tab-context-action', handleContextAction);
    };
  }, [activeBrowserTabId, browserTabs, homePage, navigateUrl, setBrowserTabs, setActiveBrowserTabId]);

  useEffect(() => {
    const toggleBookmark = () => {
      const exists = bookmarks.find(b => b.url === url);
      if (exists) {
        window.showToast("Bookmark removed", "info");
        setBookmarks(prev => prev.filter(b => b.url !== url));
      } else {
        window.showToast("Bookmark added", "success");
        setBookmarks(prev => [...prev, { id: Date.now().toString(), title: fetchTitleForUrl(url), url }]);
      }
    };

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        toggleBookmark();
      }
    };
    
    window.addEventListener('keydown', handleGlobalKeyDown);
    window.addEventListener('bk-toggle-bookmark', toggleBookmark);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
      window.removeEventListener('bk-toggle-bookmark', toggleBookmark);
    };
  }, [url, bookmarks, setBookmarks, fetchTitleForUrl]);

  return (
    <div className="flex flex-col h-screen w-full font-sans overflow-hidden" style={{ backgroundColor: theme.mainBg, color: theme.textMain }}>
      <ThemeStyles />
      <Titlebar />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <div id="main-region" className="flex-1 flex flex-col relative">
          <div className="flex-1 w-full h-full relative">
            {activeTab === 'dashboard' && <DashboardView />}
            {activeTab === 'explore' && <ExploreView />}
            {activeTab === 'library' && <LibraryView />}
            {activeTab === 'extensions' && <ExtensionsView />}
            {activeTab === 'downloads' && <DownloadsView />}
            {(activeTab === 'settings' || activeTab === 'config') && <SettingsView />}
            <div className={`w-full h-full absolute inset-0 ${activeTab === 'player' ? 'z-0' : 'pointer-events-none opacity-0 z-[-1]'}`}>
              <PlayerView />
            </div>
            <div className={`w-full h-full absolute inset-0 ${activeTab === 'docs' ? 'z-10' : 'pointer-events-none opacity-0 z-[-1]'}`} style={{ backgroundColor: theme.mainBg }}>
              {/* Only render DocsView if it has been activated once to save resources, but keep it mounted. Actually it's simple enough to just render it */}
              <DocsView />
            </div>
          </div>
        </div>
      </div>

      <GlobalPrompt />
      <GlobalConfirm />
    </div>
  );
};
