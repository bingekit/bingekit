import React, { useState } from 'react';
import { PluginsView } from './PluginsView';
import { FlowsView } from './FlowsView';
import { UserscriptsView } from './UserscriptsView';
import { Puzzle, ListTree, Code } from 'lucide-react';

export const ExtensionsView = () => {
  const [activeSubTab, setActiveSubTab] = useState('plugins');

  return (
    <div className="w-full h-full flex flex-col relative bg-transparent">
      <div className="flex border-b border-zinc-800/50 bg-zinc-950/20 px-8 pt-4 gap-6">
        <button
          onClick={() => setActiveSubTab('plugins')}
          className={`pb-3 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
            activeSubTab === 'plugins' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Puzzle size={16} /> Site Plugins
        </button>
        <button
          onClick={() => setActiveSubTab('flows')}
          className={`pb-3 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
            activeSubTab === 'flows' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <ListTree size={16} /> Flows
        </button>
        <button
          onClick={() => setActiveSubTab('userscripts')}
          className={`pb-3 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
            activeSubTab === 'userscripts' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Code size={16} /> Userscripts
        </button>
      </div>
      <div className="flex-1 overflow-hidden relative">
        <div className={`absolute inset-0 transition-opacity duration-300 flex flex-col ${activeSubTab === 'plugins' ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none z-0'}`}>
          <PluginsView />
        </div>
        <div className={`absolute inset-0 transition-opacity duration-300 flex flex-col ${activeSubTab === 'flows' ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none z-0'}`}>
          <FlowsView />
        </div>
        <div className={`absolute inset-0 transition-opacity duration-300 flex flex-col ${activeSubTab === 'userscripts' ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none z-0'}`}>
          <UserscriptsView />
        </div>
      </div>
    </div>
  );
};
