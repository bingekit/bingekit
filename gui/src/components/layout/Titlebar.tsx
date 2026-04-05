import React, { useState, useEffect } from 'react';
import { Film, Minus, Square, X, Plus, LayoutGrid, Columns, Rows, Globe, Music, VolumeX, Zap } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { restrictToHorizontalAxis, restrictToParentElement } from '@dnd-kit/modifiers';
import { CSS } from '@dnd-kit/utilities';

import { useAppContext } from '../../context/AppContext';
import { ahk } from '../../lib/ahk';
import { TooltipWrapper } from '../ui/TooltipWrapper';
import { UrlBar } from './UrlBar';

const SortableTab = ({ id, active, className, ...props }: any) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    zIndex: isDragging ? 50 : (active ? 10 : 1),
    perspective: 1000,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${className} ${isDragging ? 'shadow-2xl brightness-110 opacity-90' : ''}`}
      {...attributes}
      {...listeners}
      {...props}
    />
  );
};

export const Titlebar = () => {
  const {
    activeTab, setActiveTab, theme, browserTabs, setBrowserTabs,
    activeBrowserTabId, setActiveBrowserTabId, tilingMode, setTilingMode,
    isMultiTabEnabled, autoFocusPlayerOnTabChange, homePage, navigateUrl,
    isQuickOptionsHidden, setIsQuickOptionsHidden,
    autoFocusVideo, setIsFocusedMode
  } = useAppContext();

  const [isPlaying, setIsPlaying] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setBrowserTabs((tabs: any[]) => {
        const oldIndex = tabs.findIndex((t) => t.id === active.id);
        const newIndex = tabs.findIndex((t) => t.id === over.id);

        return arrayMove(tabs, oldIndex, newIndex);
      });
    }
  };

  useEffect(() => {
    const handlePlayState = (e: any) => {
      setIsPlaying(e.detail?.isPlaying);
      if (autoFocusVideo && (!e.detail.tabId || e.detail.tabId === activeBrowserTabId)) {
        setIsFocusedMode(!!e.detail?.isPlaying);
      }
    };
    window.addEventListener('player-play-state', handlePlayState as any);
    return () => window.removeEventListener('player-play-state', handlePlayState as any);
  }, [autoFocusVideo, setIsFocusedMode, activeBrowserTabId]);

  const handleNewTab = () => navigateUrl(homePage || 'https://bingekit.app/home/', true);

  const handleCloseTab = (id: string) => {
    if (browserTabs.length <= 1) return;

    ahk.asyncCall('ClosePlayer', id);

    const idx = browserTabs.findIndex(t => t.id === id);
    const newTabs = browserTabs.filter(t => t.id !== id);
    if (activeBrowserTabId === id && newTabs.length > 0) {
      setActiveBrowserTabId(newTabs[Math.max(0, idx - 1)].id);
    }
    setBrowserTabs(newTabs);
  };

  const handleToggleMute = (tabId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    const idx = browserTabs.findIndex(t => t.id === tabId);
    if (idx >= 0) {
      const newMuteState = !browserTabs[idx].isMuted;

      ahk.asyncCall('MutePlayer', newMuteState ? 1 : 0, tabId);

      const newTabs = [...browserTabs];
      newTabs[idx] = { ...newTabs[idx], isMuted: newMuteState };
      setBrowserTabs(newTabs);
    }
  };

  return (
    <div id="titlebar-region" className={`flex flex-col drag-region select-none border-b ${isMultiTabEnabled ? (activeTab === 'player' ? 'h-[80px]' : 'h-10') : 'h-10'}`}>
      {isMultiTabEnabled && (
        <div className="flex-1 flex w-full items-end pl-3 pt-2">
          <div className="flex items-end gap-[2px] flex-1 overflow-x-auto no-scrollbar">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
              modifiers={[restrictToHorizontalAxis, restrictToParentElement]}
            >
              <SortableContext
                items={browserTabs.map(t => t.id)}
                strategy={horizontalListSortingStrategy}
              >
                {browserTabs.map(tab => (
                  <SortableTab
                    active={activeBrowserTabId === tab.id}
                    key={tab.id}
                    id={tab.id}
                    onClick={() => {
                      setActiveBrowserTabId(tab.id);
                      if (autoFocusPlayerOnTabChange && activeTab !== 'player') {
                        setActiveTab('player');
                      }
                    }}
                    onContextMenu={(e: any) => {
                      e.preventDefault();
                      const screenX = window.screenX + (e.clientX || 0);
                      const screenY = window.screenY + (e.clientY || 0);
                      ahk.call('ShowTabContextMenu', tab.id, screenX, screenY, tab.isMuted === true ? 1 : 0, theme.sidebarBg || '#27272a', theme.mainBg || '#18181b', theme.border || '#3f3f46', theme.textSec || '#a1a1aa', theme.textMain || '#ffffff', browserTabs.length);
                    }}
                    className={`h-[32px] titlebarTab overflow-hidden no-drag max-w-[220px] min-w-[120px] flex-1 px-3 flex items-center justify-between rounded-t-lg transition-colors duration-200 cursor-pointer border border-b-0 relative group ${activeBrowserTabId === tab.id
                      ? 'bg-[var(--theme-sidebar)] border-[color-mix(in_srgb,var(--theme-border)_40%,transparent)] text-[var(--theme-text-main)] shadow-[0_-4px_10px_rgba(0,0,0,0.2)]'
                      : 'bg-[color-mix(in_srgb,var(--theme-text-main)_2%,transparent)] border-transparent text-[var(--theme-titlebar-text)] hover:bg-[color-mix(in_srgb,var(--theme-text-main)_6%,transparent)] hover:text-[var(--theme-text-main)]'
                      }`}
                  >
                    <div className="flex items-center gap-2 truncate opacity-90 pr-2">
                      {tab.isPlaying ? (
                        <div
                          className={`no-drag p-[1px] rounded transition-colors group-hover:bg-indigo-500/20 hover:text-indigo-400 ${tab.isMuted ? 'text-red-400' : 'text-indigo-500'}`}
                          onClick={(e: any) => handleToggleMute(tab.id, e)}
                          onPointerDown={(e: any) => e.stopPropagation()}
                          title={tab.isMuted ? "Unmute Tab" : "Mute Tab"}
                        >
                          {tab.isMuted ? <VolumeX size={14} className="flex-shrink-0" /> : <Music size={14} className="flex-shrink-0 animate-pulse" />}
                        </div>
                      ) : tab.favicon ? (
                        <img src={tab.favicon} alt="" className="w-4 h-4 rounded-sm bg-[color-mix(in_srgb,var(--theme-text-main)_10%,transparent)] flex-shrink-0 pointer-events-none" />
                      ) : (
                        <Globe size={14} className="opacity-70 flex-shrink-0 pointer-events-none" />
                      )}
                      <span className="text-xs truncate font-medium tracking-wide pointer-events-none">{tab.title || tab.url}</span>
                    </div>
                    {browserTabs.length > 1 && (
                      <button
                        className="no-drag p-1 rounded transition-colors opacity-0 group-hover:opacity-100 hover:bg-red-500/20 hover:text-red-400 flex-shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCloseTab(tab.id);
                        }}
                        onPointerDown={(e) => e.stopPropagation()}
                      >
                        <X size={12} strokeWidth={2.5} />
                      </button>
                    )}
                    {activeBrowserTabId === tab.id && (
                      <>
                        <div className="absolute top-0 left-0 right-0 h-[2px] bg-[var(--theme-titlebar-accent)] rounded-t-lg pointer-events-none" style={{ boxShadow: '0 0 10px var(--theme-titlebar-accent)' }} />
                        <div className="absolute -bottom-[1px] left-0 right-0 h-[2px] bg-[var(--theme-sidebar)] pointer-events-none" />
                      </>
                    )}
                  </SortableTab>
                ))}
              </SortableContext>
            </DndContext>
            <div
              className="no-drag h-7 w-8 flex items-center justify-center rounded-lg text-[var(--theme-titlebar-text)] hover:text-[var(--theme-text-main)] hover:bg-[color-mix(in_srgb,var(--theme-text-main)_8%,transparent)] ml-2 mb-1 transition-all cursor-pointer border border-transparent hover:border-[color-mix(in_srgb,var(--theme-border)_20%,transparent)]"
              onClick={handleNewTab}
            >
              <Plus size={16} strokeWidth={2.5} />
            </div>
          </div>

          <div className="flex items-center no-drag ml-auto h-8 self-start -mt-2">
            <TooltipWrapper text="Minimize">
              <button onClick={() => ahk.call('Minimize')} className="px-4 h-[32px] text-zinc-500 hover:bg-zinc-800 transition-colors">
                <Minus size={14} />
              </button>
            </TooltipWrapper>
            <TooltipWrapper text="Maximize">
              <button onClick={() => ahk.call('Maximize')} className="px-4 h-[32px] text-zinc-500 hover:bg-zinc-800 transition-colors">
                <Square size={12} />
              </button>
            </TooltipWrapper>
            <TooltipWrapper text="Close">
              <button onClick={() => ahk.call('Close')} className="px-4 h-[32px] text-zinc-500 hover:text-white hover:bg-red-500/90 transition-colors">
                <X size={14} />
              </button>
            </TooltipWrapper>
          </div>
        </div>
      )}

      {(!isMultiTabEnabled || activeTab === 'player') && (
        <div className={`h-10 flex items-center w-full ${isMultiTabEnabled ? 'multi-tab-toolbar bg-[var(--theme-sidebar)] pl-3 border-t border-[color-mix(in_srgb,var(--theme-border)_20%,transparent)]' : 'pl-5'}`}>
          {(!isMultiTabEnabled || activeTab !== 'player') && (
            <div className={`flex items-center flex-shrink-0 ${activeTab !== 'player' ? 'gap-3 w-48' : 'gap-3 mr-4'}`}>
              <div className="flex items-center gap-2 text-zinc-400 transition-colors">
                <Film size={16} className="" />
                {activeTab !== 'player' && (
                  <span className="text-xs ml-6 font-medium tracking-wider uppercase">BingeKit</span>
                )}
              </div>
            </div>
          )}

          {activeTab === 'player' && (
            <div className="flex-1 ml-2 flex items-center justify-start">
              <UrlBar />
            </div>
          )}

          {!isMultiTabEnabled && (
            <div className="flex items-center no-drag ml-auto">
              {isPlaying && (
                <button title="Pause Media" onClick={() => ahk.call('ToggleMedia')} className="px-5 h-[39px] transition-colors text-indigo-500 hover:text-indigo-400 hover:bg-indigo-500/10">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect>
                  </svg>
                </button>
              )}
              {activeTab === 'player' && (
                <button title="Toggle PiP Mode" onClick={() => ahk.call('TogglePiP')} className="px-5 h-[39px] transition-colors text-zinc-500 hover:text-indigo-400 hover:bg-indigo-500/10">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><rect x="8" y="21" width="8" height="0"></rect><path d="M12 17v4"></path><path d="M16 11h2"></path><path d="M16 7h2"></path></svg>
                </button>
              )}
              {activeTab === 'player' && (
                <TooltipWrapper text={isQuickOptionsHidden ? "Show Quick Menu" : "Hide Quick Menu"}>
                  <button
                    onClick={() => setIsQuickOptionsHidden(!isQuickOptionsHidden)}
                    className={`px-5 h-[39px] transition-colors ${!isQuickOptionsHidden ? 'text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20' : 'text-zinc-500 hover:bg-zinc-800'}`}
                  >
                    <Zap size={14} />
                  </button>
                </TooltipWrapper>
              )}
              <TooltipWrapper text="Minimize">
                <button onClick={() => ahk.call('Minimize')} className="px-5 h-[39px] text-zinc-500 hover:bg-zinc-800 transition-colors">
                  <Minus size={14} />
                </button>
              </TooltipWrapper>
              <TooltipWrapper text="Maximize">
                <button onClick={() => ahk.call('Maximize')} className="px-5 h-[39px] text-zinc-500 hover:bg-zinc-800 transition-colors">
                  <Square size={12} />
                </button>
              </TooltipWrapper>
              <TooltipWrapper text="Close">
                <button onClick={() => ahk.call('Close')} className="px-5 h-[39px] text-zinc-500 hover:text-white hover:bg-red-500/90 transition-colors">
                  <X size={14} />
                </button>
              </TooltipWrapper>
            </div>
          )}

          {isMultiTabEnabled && activeTab === 'player' && (
            <div className="flex items-center no-drag ml-auto">
              {browserTabs.length > 1 && (
                <div className="flex items-center mx-2 gap-1 bg-zinc-900 rounded p-0.5">
                  <TooltipWrapper text="Single View">
                    <button onClick={() => setTilingMode('none')} className={`p-1 rounded ${tilingMode === 'none' ? 'bg-indigo-500/20 text-indigo-400' : 'text-zinc-500 hover:text-zinc-200'}`}><Square size={14} /></button>
                  </TooltipWrapper>
                  <TooltipWrapper text="Split Vertical">
                    <button onClick={() => setTilingMode('split-vt')} className={`p-1 rounded ${tilingMode === 'split-vt' ? 'bg-indigo-500/20 text-indigo-400' : 'text-zinc-500 hover:text-zinc-200'}`}><Columns size={14} /></button>
                  </TooltipWrapper>
                  <TooltipWrapper text="Split Horizontal">
                    <button onClick={() => setTilingMode('split-hz')} className={`p-1 rounded ${tilingMode === 'split-hz' ? 'bg-indigo-500/20 text-indigo-400' : 'text-zinc-500 hover:text-zinc-200'}`}><Rows size={14} /></button>
                  </TooltipWrapper>
                  <TooltipWrapper text="Grid View">
                    <button onClick={() => setTilingMode('grid')} className={`p-1 rounded ${tilingMode === 'grid' ? 'bg-indigo-500/20 text-indigo-400' : 'text-zinc-500 hover:text-zinc-200'}`}><LayoutGrid size={14} /></button>
                  </TooltipWrapper>
                </div>
              )}

              {isPlaying && (
                <button title="Pause Media" onClick={() => ahk.call('ToggleMedia')} className="px-5 h-[39px] transition-colors text-indigo-500 hover:text-indigo-400 hover:bg-indigo-500/10">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect>
                  </svg>
                </button>
              )}
              <button title="Toggle PiP Mode" onClick={() => ahk.call('TogglePiP')} className="px-5 h-[39px] transition-colors text-zinc-500 hover:text-indigo-400 hover:bg-indigo-500/10">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><rect x="8" y="21" width="8" height="0"></rect><path d="M12 17v4"></path><path d="M16 11h2"></path><path d="M16 7h2"></path></svg>
              </button>
              <TooltipWrapper text={isQuickOptionsHidden ? "Show Quick Menu" : "Hide Quick Menu"}>
                <button
                  onClick={() => setIsQuickOptionsHidden(!isQuickOptionsHidden)}
                  className={`px-5 h-[39px] transition-colors ${!isQuickOptionsHidden ? 'text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20' : 'text-zinc-500 hover:bg-zinc-800'}`}
                >
                  <Zap size={14} />
                </button>
              </TooltipWrapper>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
