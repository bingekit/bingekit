import { useState, useEffect, useRef } from 'react';
import { ahk } from '../lib/ahk';
import { ActiveDownload } from '../types';

export function useDownloadsState() {
  const [downloadsLoc, setDownloadsLoc] = useState('');
  const [downloadsTemp, setDownloadsTemp] = useState('');
  const [blockedExts, setBlockedExts] = useState<string[]>(['.exe', '.msi', '.bat', '.cmd', '.scr', '.vbs']);
  const [activeDownloads, setActiveDownloads] = useState<Record<string, ActiveDownload>>({});

  const isInitialDlLocMount = useRef(true);
  const isInitialDlTempMount = useRef(true);
  const isInitialBlockedExtsMount = useRef(true);

  useEffect(() => {
    if (isInitialDlLocMount.current) { isInitialDlLocMount.current = false; return; }
    ahk.call('SaveData', 'downloads_loc.txt', downloadsLoc);
  }, [downloadsLoc]);

  useEffect(() => {
    if (isInitialDlTempMount.current) { isInitialDlTempMount.current = false; return; }
    ahk.call('SaveData', 'downloads_temp.txt', downloadsTemp);
  }, [downloadsTemp]);

  useEffect(() => {
    if (isInitialBlockedExtsMount.current) { isInitialBlockedExtsMount.current = false; return; }
    ahk.call('SaveData', 'blocked_exts.json', JSON.stringify(blockedExts));
  }, [blockedExts]);

  useEffect(() => {
    const handleSVDlStarted = (e: any) => {
      setActiveDownloads(prev => ({
        ...prev,
        [e.detail.path]: { file: e.detail.file, path: e.detail.path, total: 0, rcv: 0, state: 0, isFFmpeg: !!e.detail.isFFmpeg }
      }));
    };
    const handleSVDlProgress = (e: any) => {
      setActiveDownloads(prev => {
        if (!prev[e.detail.path]) return prev;
        return {
          ...prev,
          [e.detail.path]: {
            ...prev[e.detail.path],
            total: e.detail.total,
            rcv: e.detail.rcv,
            speed: e.detail.speed !== undefined ? e.detail.speed : prev[e.detail.path].speed,
            ffmpegTime: e.detail.ffmpegTime !== undefined ? e.detail.ffmpegTime : prev[e.detail.path].ffmpegTime
          }
        };
      });
    };
    const handleSVDlState = (e: any) => {
      setActiveDownloads(prev => {
        if (!prev[e.detail.path]) return prev;
        return { ...prev, [e.detail.path]: { ...prev[e.detail.path], state: e.detail.state } };
      });
    };
    const handleSVBlocked = (e: any) => {
      try { ahk.call('ShowTooltip', `Blocked download: ${e.detail.file}`); setTimeout(() => ahk.call('HideTooltip'), 3000); } catch (e) { }
    }

    window.addEventListener('bk-download-started', handleSVDlStarted);
    window.addEventListener('bk-download-progress', handleSVDlProgress);
    window.addEventListener('bk-download-state', handleSVDlState);
    window.addEventListener('bk-download-blocked', handleSVBlocked);

    return () => {
      window.removeEventListener('bk-download-started', handleSVDlStarted);
      window.removeEventListener('bk-download-progress', handleSVDlProgress);
      window.removeEventListener('bk-download-state', handleSVDlState);
      window.removeEventListener('bk-download-blocked', handleSVBlocked);
    };
  }, []);

  return {
    downloadsLoc, setDownloadsLoc,
    downloadsTemp, setDownloadsTemp,
    blockedExts, setBlockedExts,
    activeDownloads, setActiveDownloads
  };
}
