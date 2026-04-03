import React, { useEffect } from 'react';
import { ahk } from '../../lib/ahk';
import { useAppContext } from '../../context/AppContext';

// Layout bounds
import { ThemeStyles } from './ThemeStyles';
import { Titlebar } from './Titlebar';
import { Sidebar } from './Sidebar';

// Views
import { DashboardView } from '../views/DashboardView';
import { PlayerView } from '../views/PlayerView';
import { SettingsView } from '../views/SettingsView';
import { LibraryView } from '../views/LibraryView';
import { ExploreView } from '../views/ExploreView';
import { ExtensionsView } from '../views/ExtensionsView';
import { DownloadsView } from '../views/DownloadsView';

export const MainLayout = () => {
  const {
    theme, activeTab, browserTabs, setBrowserTabs, activeBrowserTabId, 
    setActiveBrowserTabId, navigateUrl, homePage
  } = useAppContext();

  useEffect(() => {
    const handleCloseActiveTab = () => {
      ahk.call('ClosePlayer', activeBrowserTabId);
      setBrowserTabs(prev => {
        if (prev.length <= 1) return prev; // Don't close the last tab
        const idx = prev.findIndex(t => t.id === activeBrowserTabId);
        const newTabs = prev.filter(t => t.id !== activeBrowserTabId);
        if (newTabs.length > 0) setActiveBrowserTabId(newTabs[Math.max(0, idx - 1)].id);
        return newTabs;
      });
    };

    const handleNewTabEvent = () => navigateUrl(homePage || 'https://bingekit.app/start/', true);

    const handleContextAction = (e: any) => {
      const { action, tabId } = e.detail;
      if (action === 'close') {
        ahk.call('ClosePlayer', tabId);
        setBrowserTabs(prev => {
          if (prev.length <= 1) return prev;
          const idx = prev.findIndex(t => t.id === tabId);
          const newTabs = prev.filter(t => t.id !== tabId);
          if (activeBrowserTabId === tabId && newTabs.length > 0) setActiveBrowserTabId(newTabs[Math.max(0, idx - 1)].id);
          return newTabs;
        });
      }
      if (action === 'closeRight') {
        setBrowserTabs(prev => {
          const idx = prev.findIndex(t => t.id === tabId);
          if (idx === -1) return prev;
          const tabsToKeep = prev.slice(0, idx + 1);
          const tabsToClose = prev.slice(idx + 1);
          tabsToClose.forEach(t => { try { ahk.call('ClosePlayer', t.id); } catch (err) { } });
          if (tabsToClose.some(t => t.id === activeBrowserTabId)) setActiveBrowserTabId(tabId);
          return tabsToKeep;
        });
      }
      if (action === 'closeOthers') {
        setBrowserTabs(prev => {
          const tabsToKeep = prev.filter(t => t.id === tabId);
          const tabsToClose = prev.filter(t => t.id !== tabId);
          tabsToClose.forEach(t => { try { ahk.call('ClosePlayer', t.id); } catch (err) { } });
          setActiveBrowserTabId(tabId);
          return tabsToKeep;
        });
      }
      if (action === 'toggleMute') {
        setBrowserTabs(prev => {
          const newTabs = [...prev];
          const idx = newTabs.findIndex(t => t.id === tabId);
          if (idx >= 0) {
            const newMuteState = !newTabs[idx].isMuted;
            newTabs[idx] = { ...newTabs[idx], isMuted: newMuteState };
            try { ahk.call('MutePlayer', newMuteState ? 1 : 0, tabId); } catch (err) { }
          }
          return newTabs;
        });
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
  }, [activeBrowserTabId, homePage, navigateUrl, setBrowserTabs, setActiveBrowserTabId]);

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
          </div>
        </div>
      </div>
    </div>
  );
};
