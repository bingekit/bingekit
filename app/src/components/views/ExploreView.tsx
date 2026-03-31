import React, { useState } from 'react';
import { DiscoveryView } from './DiscoveryView';
import { ActivityView } from './ActivityView';
import { Compass, Activity } from 'lucide-react';

export const ExploreView = () => {
  const [activeSubTab, setActiveSubTab] = useState('discovery');

  return (
    <div className="w-full h-full flex flex-col relative bg-transparent">
      <div className="flex border-b border-zinc-800/50 bg-zinc-950/20 px-8 pt-4 gap-6">
        <button
          onClick={() => setActiveSubTab('discovery')}
          className={`pb-3 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
            activeSubTab === 'discovery' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Compass size={16} /> Discovery
        </button>
        <button
          onClick={() => setActiveSubTab('activity')}
          className={`pb-3 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
            activeSubTab === 'activity' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Activity size={16} /> Activity
        </button>
      </div>
      <div className="flex-1 overflow-hidden relative">
        <div className={`absolute inset-0 transition-opacity duration-300 flex flex-col ${activeSubTab === 'discovery' ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none z-0'}`}>
          <DiscoveryView />
        </div>
        <div className={`absolute inset-0 transition-opacity duration-300 flex flex-col ${activeSubTab === 'activity' ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none z-0'}`}>
          <ActivityView />
        </div>
      </div>
    </div>
  );
};
