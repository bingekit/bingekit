import React, { useState } from 'react';
import { Search, Compass, EyeOff, Play, Clock, Sparkles } from 'lucide-react';
import { useAppContext } from '../../../context/AppContext';

let discoveryScrollPos = 0;

export const DiscoveryView = () => {
  const { discoveryItems, setDiscoveryItems, setUrl, setInputUrl, setActiveTab, watchLater, setWatchLater, plugins } = useAppContext();
  const [searchQuery, setSearchQuery] = useState('');

  const scrollRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = discoveryScrollPos;
  }, []);

  const activeItems = discoveryItems.filter(i => !i.dismissed && (
    i.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.url.toLowerCase().includes(searchQuery.toLowerCase())
  ));

  const handleWatchNow = (itemUrl: string) => {
    setUrl(itemUrl);
    setInputUrl(itemUrl);
    setActiveTab('player');
  };

  const handleWatchLater = (item: any) => {
    if (!watchLater.some(w => w.url === item.url)) {
      setWatchLater([{ id: Date.now().toString(), title: item.title, url: item.url, addedAt: Date.now() }, ...watchLater]);
    }
  };

  const handleDismiss = (id: string) => {
    setDiscoveryItems(discoveryItems.map(i => i.id === id ? { ...i, dismissed: true } : i));
  };

  return (
    <div 
      ref={scrollRef}
      onScroll={(e) => discoveryScrollPos = e.currentTarget.scrollTop}
      className="p-8 max-w-6xl mx-auto w-full h-full overflow-y-auto no-scrollbar relative"
    >
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-light tracking-tight text-zinc-100 flex items-center gap-3">
            <Compass size={24} className="text-indigo-400" />
            Discovery Mode
          </h2>
          <p className="text-sm text-zinc-500 mt-2">Personalized recommendations extracted natively as you browse.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search recommendations..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded-full py-2 pl-9 pr-4 text-sm text-zinc-200 outline-none focus:border-indigo-500 transition-colors w-64"
            />
          </div>

          <button
            onClick={async () => {
              if (await window.showConfirm('Clear all dismissed items?')) {
                setDiscoveryItems(discoveryItems.filter(i => !i.dismissed));
              }
            }}
            className="text-xs px-3 py-1.5 text-zinc-500 hover:text-red-400 bg-zinc-900/50 hover:bg-red-500/10 rounded-full transition-colors hidden md:block"
          >
            Clear Dismissed
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activeItems.map(item => {
          const plugin = plugins.find(p => p.id === item.siteId);
          return (
            <div
              key={item.id}
              className="group relative p-5 bg-zinc-900/40 border border-zinc-800/50 hover:border-indigo-500/30 hover:bg-zinc-900 rounded-2xl transition-all duration-300 flex flex-col h-full"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform shadow-inner">
                  <Sparkles size={20} />
                </div>
                <div className="flex-1 min-w-0 pr-4">
                  <h4 className="text-sm font-medium text-zinc-200 line-clamp-2 leading-snug">{item.title}</h4>
                  <p className="text-xs text-indigo-400/80 mt-1 truncate">{plugin?.name || new URL(item.url).hostname}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mt-auto pt-4 border-t border-zinc-800/50">
                <button
                  onClick={() => handleWatchNow(item.url)}
                  className="flex-1 flex justify-center items-center gap-1.5 text-xs text-zinc-300 bg-zinc-800 hover:bg-indigo-500 hover:text-white px-3 py-2 rounded-lg transition-colors font-medium"
                >
                  <Play size={14} /> Watch Now
                </button>
                <button
                  onClick={() => handleWatchLater(item)}
                  className="flex-1 flex justify-center items-center gap-1.5 text-xs text-zinc-400 bg-zinc-900/80 hover:bg-zinc-800 hover:text-zinc-200 px-3 py-2 rounded-lg transition-colors border border-zinc-800"
                >
                  <Clock size={14} /> Watch Later
                </button>
              </div>

              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleDismiss(item.id)}
                  className="p-1.5 text-zinc-500 hover:text-red-400 bg-zinc-900 hover:bg-red-500/10 rounded-md transition-colors shadow-sm border border-transparent hover:border-red-500/20"
                  title="Hide Suggestion"
                >
                  <EyeOff size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {activeItems.length === 0 && (
        <div className="text-center py-20 text-zinc-500">
          <Compass size={48} className="mx-auto mb-4 opacity-20 text-indigo-400" />
          <p>No new discovery recommendations yet.</p>
          <p className="text-xs mt-2 text-zinc-600">Browse with site plugins to start seeing suggestions here.</p>
        </div>
      )}
    </div>
  );
};
