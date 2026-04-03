import React, { useState } from 'react';
import { Search, Clock, Trash2, Calendar, Globe, MonitorPlay, ExternalLink, PlaySquare, Compass, Filter } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { clearHistoryDB, clearBrowsedHistoryDB, deleteHistoryItemDB } from '../../lib/db';

let historyScrollPos = 0;

export const HistoryView = () => {
  const { history, setHistory, navigateUrl, ctrlClickBackgroundTab } = useAppContext();
  const [searchQuery, setSearchQuery] = useState('');

  const scrollRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = historyScrollPos;
  }, []);
  const [filterType, setFilterType] = useState<'all' | 'browse' | 'watch'>('all');
  const [groupBy, setGroupBy] = useState<'time' | 'site' | 'length'>('time');

  const filteredHistory = history.filter(h => {
    const searchMatch = h.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (h.tags && h.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())));
    const typeMatch = filterType === 'all' ? true : (filterType === 'watch' ? h.type === 'watch' : h.type !== 'watch');
    return searchMatch && typeMatch;
  });

  const deduplicatedHistory = React.useMemo(() => {
    const urlMap = new Map<string, typeof history[0]>();
    const sorted = [...filteredHistory].sort((a, b) => b.timestamp - a.timestamp);
    sorted.forEach(item => {
      const existing = urlMap.get(item.url);
      if (!existing) {
        urlMap.set(item.url, { ...item });
      } else {
        if (existing.type === 'browse' && item.type === 'watch') {
          urlMap.set(item.url, { ...item, timestamp: Math.max(existing.timestamp, item.timestamp) });
        }
      }
    });
    return Array.from(urlMap.values()).sort((a, b) => b.timestamp - a.timestamp);
  }, [filteredHistory]);

  const formatDuration = (ms: number) => {
    if (!ms) return '';
    const totalSeconds = Math.floor(ms / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m === 0) return `${s}s`;
    return `${m}m ${s}s`;
  };

  const groupHistory = () => {
    const groups: Record<string, typeof history> = {};
    const now = Date.now();
    const hourMs = 60 * 60 * 1000;
    const dayMs = 24 * hourMs;
    const weekMs = 7 * dayMs;
    const monthMs = 30 * dayMs;

    deduplicatedHistory.forEach(item => {
      if (groupBy === 'site') {
        const domain = item.domain || 'Unknown';
        if (!groups[domain]) groups[domain] = [];
        groups[domain].push(item);
      } else if (groupBy === 'length') {
        if (item.type !== 'watch' || !item.watchDuration) {
          if (!groups['Not Watched']) groups['Not Watched'] = [];
          groups['Not Watched'].push(item);
        } else {
          const h = item.watchDuration / 3600000;
          let groupName = '< 10 Mins';
          if (h >= 2) groupName = '> 2 Hours';
          else if (h >= 1) groupName = '1-2 Hours';
          else if (item.watchDuration >= 1800000) groupName = '30-60 Mins';
          else if (item.watchDuration >= 600000) groupName = '10-30 Mins';

          if (!groups[groupName]) groups[groupName] = [];
          groups[groupName].push(item);
        }
      } else {
        const diff = now - item.timestamp;
        let groupName = 'Older';
        if (diff < hourMs) groupName = 'Past Hour';
        else if (diff < dayMs) groupName = 'Today';
        else if (diff < weekMs) groupName = 'This Week';
        else if (diff < monthMs) groupName = 'This Month';

        if (!groups[groupName]) groups[groupName] = [];
        groups[groupName].push(item);
      }
    });

    // Sub-sort by descending watch duration if grouping by length
    if (groupBy === 'length') {
      Object.keys(groups).forEach(k => {
        groups[k].sort((a, b) => (b.watchDuration || 0) - (a.watchDuration || 0));
      });
    }

    return groups;
  };

  const groups = groupHistory();

  const timeOrder = ['Past Hour', 'Today', 'This Week', 'This Month', 'Older'];
  const lengthOrder = ['> 2 Hours', '1-2 Hours', '30-60 Mins', '10-30 Mins', '< 10 Mins', 'Not Watched'];

  const orderedKeys = groupBy === 'time'
    ? Object.keys(groups).sort((a, b) => timeOrder.indexOf(a) - timeOrder.indexOf(b))
    : groupBy === 'length'
      ? Object.keys(groups).sort((a, b) => lengthOrder.indexOf(a) - lengthOrder.indexOf(b))
      : Object.keys(groups).sort();

  return (
    <div
      ref={scrollRef}
      onScroll={(e) => historyScrollPos = e.currentTarget.scrollTop}
      className="p-8 max-w-6xl mx-auto w-full h-full overflow-y-auto no-scrollbar relative"
    >
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-light tracking-tight text-zinc-100 flex items-center gap-3">
          <Clock size={24} className="text-indigo-400" />
          History
        </h2>

        <div className="flex items-center gap-4">
          <div className="flex items-center bg-zinc-900 rounded-lg p-1 border border-zinc-800">
            <button
              onClick={() => setGroupBy('time')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${groupBy === 'time' ? 'bg-zinc-800 text-zinc-200' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              <Calendar size={14} /> Date
            </button>
            <button
              onClick={() => setGroupBy('site')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${groupBy === 'site' ? 'bg-zinc-800 text-zinc-200' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              <Globe size={14} /> Site
            </button>
            <button
              onClick={() => setGroupBy('length')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${groupBy === 'length' ? 'bg-zinc-800 text-zinc-200' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              <Clock size={14} /> Length
            </button>
          </div>

          <div className="flex items-center bg-zinc-900 rounded-lg p-1 border border-zinc-800">
            <button onClick={() => setFilterType('all')} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${filterType === 'all' ? 'bg-zinc-800 text-zinc-200' : 'text-zinc-500 hover:text-zinc-300'}`}>All</button>
            <button onClick={() => setFilterType('browse')} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${filterType === 'browse' ? 'bg-zinc-800 text-zinc-200' : 'text-zinc-500 hover:text-zinc-300'}`}>Browsed</button>
            <button onClick={() => setFilterType('watch')} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${filterType === 'watch' ? 'bg-zinc-800 text-zinc-200' : 'text-zinc-500 hover:text-zinc-300'}`}>Watched</button>
          </div>

          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search history..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded-full py-2 pl-9 pr-4 text-sm text-zinc-200 outline-none focus:border-indigo-500 transition-colors w-64"
            />
          </div>

          {(history.length > 0) && (
            <div className="flex items-center gap-2 hidden md:flex">
              <button
                onClick={async () => {
                  if (await window.showConfirm('Clear non-watched browsing history?')) {
                    setHistory(history.filter(h => h.type === 'watch'));
                    clearBrowsedHistoryDB().catch(console.error);
                  }
                }}
                className="flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-200 bg-zinc-900 border border-zinc-700/50 hover:border-zinc-500 px-3 py-2 rounded-full transition-colors"
                title="Clear Browsed"
              >
                <Trash2 size={16} /> <span className="hidden lg:inline">Browsed</span>
              </button>
              <button
                onClick={async () => {
                  if (await window.showConfirm('Clear all history?')) {
                    setHistory([]);
                    clearHistoryDB().catch(console.error);
                  }
                }}
                className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 bg-red-500/10 px-4 py-2 rounded-full transition-colors"
              >
                <Trash2 size={16} /> <span className="hidden lg:inline">All</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {orderedKeys.map(key => (
        <div key={key} className="mb-8">
          <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            {groupBy === 'time' ? <Calendar size={16} /> : groupBy === 'site' ? <Globe size={16} /> : <Clock size={16} />} {key}
            <span className="text-xs normal-case text-zinc-600 bg-zinc-900 px-2 py-0.5 rounded-full ml-2">{groups[key].length}</span>
          </h3>
          <div className="space-y-2">
            {groups[key].map(item => (
              <div
                key={item.id}
                className="group flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-zinc-900/40 border border-zinc-800/50 hover:bg-zinc-900 rounded-xl transition-all gap-4"
              >
                <div className="flex items-center gap-4 flex-1 min-w-0 w-full cursor-pointer" onClick={(e) => { const isCtrl = e.ctrlKey || e.metaKey; navigateUrl(item.url, isCtrl, isCtrl && ctrlClickBackgroundTab); }}>
                  <div className={`w-10 h-10 rounded-lg bg-zinc-900/40 group-hover:bg-indigo-500/10 flex items-center justify-center flex-shrink-0 transition-colors ${item.type === 'watch' ? 'text-emerald-400' : 'text-zinc-400 group-hover:text-indigo-400'}`}>
                    {item.type === 'watch' ? <PlaySquare size={18} /> : <Compass size={18} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-zinc-200 truncate pr-4 flex items-center gap-2">
                      {(item.title || '').replace(/[^\x20-\x7E]/g, "").trim()}
                      {item.type === 'watch' && item.watchDuration && (
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded flex items-center gap-1 font-mono uppercase tracking-wider">
                          <Clock size={10} /> {formatDuration(item.watchDuration)}
                        </span>
                      )}
                      {item.type === 'watch' && item.currentTime !== undefined && item.currentTime > 15 && (
                        <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-1.5 py-0.5 rounded flex items-center gap-1 font-mono uppercase tracking-wider ml-1">
                          <PlaySquare size={10} /> Left at {formatDuration(item.currentTime * 1000)}
                        </span>
                      )}
                    </h4>
                    <div className="text-xs text-zinc-500 truncate flex items-center gap-2 mt-0.5">
                      <span className="text-indigo-400/70">{item.domain}</span>
                      <span className="inline-block w-1 h-1 rounded-full bg-zinc-700"></span>
                      {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {groupBy === 'site' && ` - ${new Date(item.timestamp).toLocaleDateString()}`}
                      {item.tags && item.tags.length > 0 && (
                        <>
                          <span className="inline-block w-1 h-1 rounded-full bg-zinc-700 ms-1 mr-1"></span>
                          {item.tags.map(t => (
                            <span key={t} className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 rounded">{t}</span>
                          ))}
                        </>
                      )}
                    </div>
                    <div className="text-[10px] text-zinc-600/70 truncate mt-1">
                      {item.url}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0 pr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { const isCtrl = e.ctrlKey || e.metaKey; navigateUrl(item.url, isCtrl, isCtrl && ctrlClickBackgroundTab); }}
                    className="p-1.5 rounded-md text-zinc-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors"
                  >
                    <ExternalLink size={16} />
                  </button>
                  <button
                    onClick={() => {
                      setHistory(history.filter(h => h.id !== item.id));
                      deleteHistoryItemDB(item.id).catch(console.error);
                    }}
                    className="p-1.5 rounded-md text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {deduplicatedHistory.length === 0 && (
        <div className="text-center py-20 text-zinc-500">
          <Clock size={48} className="mx-auto mb-4 opacity-20" />
          No history found.
        </div>
      )}
    </div>
  );
};
