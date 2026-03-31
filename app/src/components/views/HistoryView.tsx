import React, { useState } from 'react';
import { Search, Clock, Trash2, Calendar, Globe, MonitorPlay, ExternalLink } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

export const HistoryView = () => {
  const { history, setHistory, setUrl, setInputUrl, setActiveTab } = useAppContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [groupBy, setGroupBy] = useState<'time' | 'site'>('time');

  const filteredHistory = history.filter(h => 
    h.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    h.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
    h.domain.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupHistory = () => {
    const groups: Record<string, typeof history> = {};
    const now = Date.now();
    const hourMs = 60 * 60 * 1000;
    const dayMs = 24 * hourMs;
    const weekMs = 7 * dayMs;
    const monthMs = 30 * dayMs;

    filteredHistory.forEach(item => {
      if (groupBy === 'site') {
        const domain = item.domain || 'Unknown';
        if (!groups[domain]) groups[domain] = [];
        groups[domain].push(item);
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

    return groups;
  };

  const groups = groupHistory();

  const groupOrder = ['Past Hour', 'Today', 'This Week', 'This Month', 'Older'];
  const orderedKeys = groupBy === 'time' 
    ? Object.keys(groups).sort((a, b) => groupOrder.indexOf(a) - groupOrder.indexOf(b))
    : Object.keys(groups).sort();

  return (
    <div className="p-8 max-w-5xl mx-auto w-full h-full overflow-y-auto no-scrollbar relative">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-light tracking-tight text-zinc-100 flex items-center gap-3">
          <Clock size={24} className="text-indigo-400" />
          Browsing History
        </h2>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-zinc-900 rounded-lg p-1 border border-zinc-800">
            <button
              onClick={() => setGroupBy('time')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-colors \${groupBy === 'time' ? 'bg-zinc-800 text-zinc-200' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              <Calendar size={14} /> By Date
            </button>
            <button
              onClick={() => setGroupBy('site')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-colors \${groupBy === 'site' ? 'bg-zinc-800 text-zinc-200' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              <Globe size={14} /> By Site
            </button>
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
            <button
              onClick={() => {
                if(confirm('Clear all history?')) {
                  setHistory([]);
                }
              }}
              className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 bg-red-500/10 px-4 py-2 rounded-full transition-colors hidden md:flex"
            >
              <Trash2 size={16} /> Clear All
            </button>
          )}
        </div>
      </div>

      {orderedKeys.map(key => (
        <div key={key} className="mb-8">
          <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            {groupBy === 'time' ? <Calendar size={16} /> : <Globe size={16} />} {key}
            <span className="text-xs normal-case text-zinc-600 bg-zinc-900 px-2 py-0.5 rounded-full ml-2">{groups[key].length}</span>
          </h3>
          <div className="space-y-2">
            {groups[key].map(item => (
              <div
                key={item.id}
                className="group flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-zinc-900/40 border border-zinc-800/50 hover:bg-zinc-900 rounded-xl transition-all gap-4"
              >
                <div className="flex items-center gap-4 flex-1 min-w-0 w-full cursor-pointer" onClick={() => { setUrl(item.url); setInputUrl(item.url); setActiveTab('player'); }}>
                  <div className="w-10 h-10 rounded-lg bg-zinc-800/80 group-hover:bg-indigo-500/10 flex items-center justify-center flex-shrink-0 group-hover:text-indigo-400 transition-colors">
                    <MonitorPlay size={18} className="text-zinc-400 group-hover:text-indigo-400 transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-zinc-200 truncate pr-4">{item.title}</h4>
                    <p className="text-xs text-zinc-500 truncate flex items-center gap-2 mt-0.5">
                      <span className="text-indigo-400/70">{item.domain}</span>
                      <span className="inline-block w-1 h-1 rounded-full bg-zinc-700"></span>
                      {new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} 
                      {groupBy === 'site' && ` - \${new Date(item.timestamp).toLocaleDateString()}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0 pr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => { setUrl(item.url); setInputUrl(item.url); setActiveTab('player'); }}
                    className="p-1.5 rounded-md text-zinc-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors"
                  >
                    <ExternalLink size={16} />
                  </button>
                  <button
                    onClick={() => setHistory(history.filter(h => h.id !== item.id))}
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

      {filteredHistory.length === 0 && (
        <div className="text-center py-20 text-zinc-500">
          <Clock size={48} className="mx-auto mb-4 opacity-20" />
          No history found.
        </div>
      )}
    </div>
  );
};
