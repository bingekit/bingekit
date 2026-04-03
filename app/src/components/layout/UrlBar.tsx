import React, { useState } from 'react';
import { Home, ChevronDown, ChevronLeft, ChevronRight, RotateCw, Search, Bookmark, Clock } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { ahk } from '../../lib/ahk';
import { TooltipWrapper } from '../ui/TooltipWrapper';

export const UrlBar = () => {
  const {
    url, setUrl, inputUrl, setInputUrl, urlBarMode, setUrlBarMode, pageTitle,
    navButtons, installedInterfaces, handleNavigate, bookmarks, setBookmarks,
    watchLater, setWatchLater, fetchTitleForUrl, homePage, isMultiTabEnabled
  } = useAppContext();

  const [showInterfaces, setShowInterfaces] = useState(false);

  if (urlBarMode === 'hidden') return null;

  if (urlBarMode === 'title') {
    return (
      <div className="flex items-center justify-start text-xs text-zinc-500 font-medium truncate cursor-pointer hover:text-zinc-300 transition-colors" onClick={() => setUrlBarMode('full')}>
        {pageTitle || (() => {
          try { return new URL(url).hostname; } catch (e) { return url; }
        })()}
      </div>
    );
  }

  return (
    <form id="toolbar-form" onSubmit={handleNavigate} className={`flex items-center no-drag backdrop-blur-xl border border-zinc-800/80 rounded-lg overflow-hidden transition-all focus-within:border-indigo-500/50 h-7 w-full ${isMultiTabEnabled ? 'max-w-none mr-2' : 'max-w-lg'}`}>
      <div className="flex items-center px-2 gap-1 urlbar-icon relative">
        {navButtons.home && (
          <div className="flex items-center">
            <TooltipWrapper text="Home">
              <button type="button" onClick={() => { setUrl(homePage || 'https://bingekit.app/start/'); setInputUrl(homePage || 'https://bingekit.app/start/'); }} className="p-0.5 hover:urlbar-icon-hover transition-colors"><Home size={14} /></button>
            </TooltipWrapper>
            {installedInterfaces.length > 0 && (
              <div className="relative flex items-center">
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); setShowInterfaces(!showInterfaces); }}
                  className={`p-0.5 ml-0.5 transition-colors rounded ${showInterfaces ? 'bg-indigo-500/20 text-indigo-400' : 'urlbar-icon hover:urlbar-icon-hover'}`}
                >
                  <ChevronDown size={12} className={`transition-transform duration-200 ${showInterfaces ? 'rotate-180' : ''}`} />
                </button>
              </div>
            )}
          </div>
        )}

        {navButtons.back && !showInterfaces && (
          <TooltipWrapper text="Go Back">
            <button type="button" onClick={() => ahk.call('PlayerGoBack')} className="p-0.5 hover:urlbar-icon-hover transition-colors"><ChevronLeft size={14} /></button>
          </TooltipWrapper>
        )}
        {navButtons.forward && !showInterfaces && (
          <TooltipWrapper text="Go Forward">
            <button type="button" onClick={() => ahk.call('PlayerGoForward')} className="p-0.5 hover:urlbar-icon-hover transition-colors"><ChevronRight size={14} /></button>
          </TooltipWrapper>
        )}
        {navButtons.reload && !showInterfaces && (
          <TooltipWrapper text="Refresh">
            <button type="button" onClick={() => ahk.call('PlayerReload')} className="p-0.5 hover:urlbar-icon-hover transition-colors"><RotateCw size={12} /></button>
          </TooltipWrapper>
        )}
      </div>

      {!showInterfaces && (
        <div className="w-px h-3 bg-zinc-800 mx-1 flex-shrink-0" />
      )}

      <div className="flex-1 flex items-center px-2 gap-2 overflow-hidden">
        {showInterfaces ? (
          <div className="flex items-center gap-1.5 w-full overflow-x-auto no-scrollbar py-0.5 animate-in fade-in slide-in-from-left-2 duration-200">
            <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider mr-1">Interfaces</span>
            {installedInterfaces.map(inf => (
              <button
                key={inf}
                type="button"
                onClick={() => {
                  setShowInterfaces(false);
                  setUrl(`interface:${inf}`);
                  setInputUrl(`interface:${inf}`);
                }}
                className="px-2 py-0.5 text-[11px] font-medium bg-zinc-800 hover:bg-indigo-500/20 text-zinc-300 hover:text-indigo-400 border border-zinc-700/50 hover:border-indigo-500/30 rounded flex-shrink-0 transition-colors"
              >
                {inf}
              </button>
            ))}
          </div>
        ) : (
          <>
            <Search size={12} className="urlbar-icon flex-shrink-0" />
            <input
              type="text"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="Search streams or enter URL..."
              spellCheck={false}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              className="w-full bg-transparent border-none outline-none text-xs text-zinc-200 placeholder:text-zinc-600 font-medium"
            />
          </>
        )}
      </div>

      {!showInterfaces && (
        <>
          <button
            type="button"
            onClick={() => {
              if (!bookmarks.find(b => b.url === url)) {
                setBookmarks([...bookmarks, { id: Date.now().toString(), title: fetchTitleForUrl(url), url }]);
              }
            }}
            className="px-2 urlbar-icon hover:urlbar-icon-hover transition-colors flex-shrink-0"
            title="Bookmark"
          >
            <Bookmark size={12} className={bookmarks.find(b => b.url === url) ? "fill-indigo-400 text-indigo-400" : ""} />
          </button>
          <button
            type="button"
            onClick={() => {
              if (!watchLater.find(w => w.url === url)) {
                setWatchLater([...watchLater, { id: Date.now().toString(), title: fetchTitleForUrl(url), url, addedAt: Date.now() }]);
              }
            }}
            className="px-2 urlbar-icon hover:urlbar-icon-hover transition-colors flex-shrink-0"
            title="Watch Later"
          >
            <Clock size={12} className={watchLater.find(w => w.url === url) ? "text-indigo-400" : ""} />
          </button>
        </>
      )}
    </form>
  );
};
