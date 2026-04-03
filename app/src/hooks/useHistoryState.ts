import { useState, useRef, useEffect, MutableRefObject } from 'react';
import { ahk } from '../lib/ahk';
import { addHistoryItem, getHistory } from '../lib/db';
import { BookmarkItem, HistoryItem, DiscoveryItem, WatchLaterItem, CredentialItem, FollowedItem, SitePlugin } from '../types';

export function useHistoryState(
  url: string,
  activeTab: string,
  plugins: SitePlugin[],
  pageTitleRef: MutableRefObject<string>,
  setBrowserTabs: any,
  playerNavSignal: number
) {
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isHistoryEnabled, setIsHistoryEnabled] = useState(true);
  const [discoveryItems, setDiscoveryItems] = useState<DiscoveryItem[]>([]);
  const [selectedBookmarks, setSelectedBookmarks] = useState<string[]>([]);
  const [followedItems, setFollowedItems] = useState<FollowedItem[]>([]);
  const [watchLater, setWatchLater] = useState<WatchLaterItem[]>([]);
  const [credentials, setCredentials] = useState<CredentialItem[]>([]);
  const [newCred, setNewCred] = useState({ domain: '', username: '', password: '' });
  const [bookmarkSearchQuery, setBookmarkSearchQuery] = useState('');
  const [editingBookmarkId, setEditingBookmarkId] = useState<string | null>(null);
  const [showCredModal, setShowCredModal] = useState(false);

  const isHistoryEnabledRef = useRef(true);
  const isInitialHistoryEnabledMount = useRef(true);
  const isInitialDiscoveryMount = useRef(true);

  useEffect(() => { isHistoryEnabledRef.current = isHistoryEnabled; }, [isHistoryEnabled]);

  const fetchTitleForUrl = (targetUrl: string): string => {
    try {
      const html = ahk.call('RawFetchHTML', targetUrl);
      if (html) {
        const match = html.match(/<title>(.*?)<\/title>/i);
        if (match && match[1]) return match[1].trim();
      }
      return new URL(targetUrl).hostname;
    } catch { return targetUrl; }
  };

  // Browse History Tracking
  useEffect(() => {
    if (!isHistoryEnabled) return;
    if (activeTab === 'player' && url && !url.startsWith('about:blank') && !url.startsWith('data:')) {
      const timer = setTimeout(() => {
        setHistory(prev => {
          if (prev.length > 0 && prev[0].url === url && prev[0].type === 'browse' && (Date.now() - prev[0].timestamp < 5 * 60 * 1000)) {
            return prev;
          }
          const host = (() => { try { return new URL(url).hostname; } catch { return url; } })();
          const rawTitle = pageTitleRef.current || fetchTitleForUrl(url) || host;
          const cleanTitle = rawTitle.replace(/[^\\x20-\\x7E]/g, "").trim();
          const newItem: HistoryItem = {
            id: Date.now().toString(),
            url,
            title: cleanTitle,
            timestamp: Date.now(),
            domain: host,
            type: 'browse'
          };
          addHistoryItem(newItem).catch(console.error);
          return [newItem, ...prev].slice(0, 2000);
        });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [url, activeTab, isHistoryEnabled]);

  // Watch History Tracking
  useEffect(() => {
    if (!isHistoryEnabled || activeTab !== 'player') return;

    let totalWatchMs = 0;
    let lastPlayTime = Date.now();
    let sessionStartMs = Date.now();
    let isCurrentlyPlaying = false;
    let saveTimer: any;

    let latestTime = 0;
    let latestDur = 0;

    const recordWatchSegment = () => {
      const now = Date.now();
      let addedMs = 0;
      if (isCurrentlyPlaying) {
        addedMs = (now - lastPlayTime);
        totalWatchMs += addedMs;
        lastPlayTime = now;
        
        if (latestTime > 0) {
          latestTime += (addedMs / 1000);
        }
      }

      if (totalWatchMs < 2000) return; // Ignore < 2 seconds of play

      const timeToSave = totalWatchMs;
      totalWatchMs = 0;
      const currentUrl = url;

      setHistory(prev => {
        const host = (() => { try { return new URL(currentUrl).hostname; } catch { return currentUrl; } })();
        let newHistory = [...prev];
        const existingIdx = newHistory.findIndex(h => h.url === currentUrl && h.type === 'watch' && (Date.now() - h.timestamp < 12 * 60 * 60 * 1000));

        let tags: string[] = [];
        const plugin = plugins.find(p => currentUrl.includes(p.baseUrl) || (() => { try { return p.baseUrl.includes(new URL(currentUrl).hostname); } catch { return false; } })());
        if (plugin?.tags) tags = plugin.tags;

        if (existingIdx >= 0) {
          const item = { ...newHistory[existingIdx] };
          item.watchDuration = (item.watchDuration || 0) + timeToSave;
          item.timestamp = Date.now();

          // Sync rich titles dynamically if the plugin feeds better titles via tabs overriding!
          const rawTitle = pageTitleRef.current;
          if (rawTitle && rawTitle.length > 2 && rawTitle !== item.title) {
             const cleanTitle = rawTitle.replace(/[^\p{L}\p{N}\s\-–—:'.,&()|]/gu, "").trim();
             if (cleanTitle) item.title = cleanTitle;
          }

          if (latestTime > 0) {
             const sessionAge = Date.now() - sessionStartMs;
             const dropSize = item.currentTime ? (item.currentTime - latestTime) : 0;
             const isGhostSpike = (!item.currentTime || item.currentTime < 5) && latestTime > 30;

             // Universal Truth Shield: In the first 15 seconds of a session, we inherently distrust massive 
             // trajectory deviations (>30s drops from auto-resetting players, or >30s spikes from SPA ghost videos).
             if ((dropSize > 30 || isGhostSpike) && sessionAge < 15000) {
                // Do not permanently commit these drastic changes to the DB during this turbulent window.
             } else {
                item.currentTime = latestTime;
             }
          }
          if (latestDur > 0) item.duration = latestDur;
          if (tags.length > 0) item.tags = tags;
          newHistory[existingIdx] = item;
          addHistoryItem(item).catch(console.error);
        } else {
          const rawTitle = pageTitleRef.current || fetchTitleForUrl(currentUrl) || host;
          const cleanTitle = rawTitle.replace(/[^\p{L}\p{N}\s\-–—:'.,&()|]/gu, "").trim();
          const newItem: HistoryItem = {
             id: Date.now().toString() + 'w',
             url: currentUrl,
             title: cleanTitle,
             timestamp: Date.now(),
             domain: host,
             type: 'watch',
             watchDuration: timeToSave,
             currentTime: latestTime > 0 ? latestTime : undefined,
             duration: latestDur > 0 ? latestDur : undefined,
             tags
          };
          newHistory.unshift(newItem);
          addHistoryItem(newItem).catch(console.error);
        }
        return newHistory.slice(0, 2000);
      });
    };

    const handlePlayState = (e: any) => {
      if (e.detail && e.detail.isPlaying !== undefined) {
        const now = Date.now();
        setBrowserTabs((prev: any[]) => {
          const newTabs = [...prev];
          const tabIdx = newTabs.findIndex(t => t.id === (e.detail.tabId || 'main'));
          if (tabIdx >= 0) {
            newTabs[tabIdx] = { ...newTabs[tabIdx], isPlaying: e.detail.isPlaying };
          }
          return newTabs;
        });

        if (e.detail.currentTime !== undefined) latestTime = e.detail.currentTime;
        if (e.detail.duration !== undefined) latestDur = e.detail.duration;

        if (e.detail.isPlaying && !isCurrentlyPlaying) {
          isCurrentlyPlaying = true;
          lastPlayTime = now;
        } else if (!e.detail.isPlaying && isCurrentlyPlaying) {
          isCurrentlyPlaying = false;
          recordWatchSegment();
        }
      }
    };

    window.addEventListener('player-play-state', handlePlayState);
    saveTimer = setInterval(() => {
      if (isCurrentlyPlaying) {
        recordWatchSegment();
      }
    }, 2000);

    return () => {
      window.removeEventListener('player-play-state', handlePlayState);
      clearInterval(saveTimer);
      if (isCurrentlyPlaying) {
        isCurrentlyPlaying = false;
        recordWatchSegment();
      }
    };
  }, [url, activeTab, isHistoryEnabled, plugins, setBrowserTabs, pageTitleRef, playerNavSignal]);

  // Sync to disks
  useEffect(() => { if (bookmarks.length > 0) ahk.call('SaveData', 'bookmarks.json', JSON.stringify(bookmarks)); }, [bookmarks]);
  useEffect(() => {
    if (isInitialDiscoveryMount.current) { isInitialDiscoveryMount.current = false; return; }
    ahk.call('SaveData', 'discovery_cache.json', JSON.stringify(discoveryItems));
  }, [discoveryItems]);
  useEffect(() => {
    if (isInitialHistoryEnabledMount.current) { isInitialHistoryEnabledMount.current = false; return; }
    ahk.call('SaveData', 'history_enabled.txt', isHistoryEnabled ? 'true' : 'false');
  }, [isHistoryEnabled]);
  useEffect(() => { if (watchLater.length > 0) ahk.call('SaveData', 'watchlater.json', JSON.stringify(watchLater)); }, [watchLater]);
  useEffect(() => { if (credentials.length > 0) ahk.call('SaveData', 'credentials.json', JSON.stringify(credentials)); }, [credentials]);
  useEffect(() => { if (followedItems.length > 0) ahk.call('SaveData', 'followed.json', JSON.stringify(followedItems)); }, [followedItems]);

  return {
    bookmarks, setBookmarks,
    history, setHistory,
    isHistoryEnabled, setIsHistoryEnabled,
    discoveryItems, setDiscoveryItems,
    selectedBookmarks, setSelectedBookmarks,
    followedItems, setFollowedItems,
    watchLater, setWatchLater,
    credentials, setCredentials,
    newCred, setNewCred,
    bookmarkSearchQuery, setBookmarkSearchQuery,
    editingBookmarkId, setEditingBookmarkId,
    showCredModal, setShowCredModal,
    fetchTitleForUrl
  };
}
