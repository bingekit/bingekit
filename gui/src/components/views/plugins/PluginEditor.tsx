import React from 'react';
import {
  Search, Bookmark, Settings, Minus, Square, X, ChevronLeft,
  ChevronRight, RotateCw, Film, Tv, Play, LayoutGrid, Shield, ShieldOff,
  Plus, Puzzle, Save, Trash2, Download, Upload, KeyRound, Code,
  ListTree, MonitorPlay, Activity, RefreshCw, Bell, Compass, Zap,
  Clock, Folder, Lock, EyeOff, Eye, Globe, Copy, Store,
  DownloadCloud, CheckCircle2, Package
} from 'lucide-react';
import { useAppContext } from '../../../context/AppContext';
import { ahk } from '../../../lib/ahk';
import { TooltipWrapper } from '../../ui/TooltipWrapper';
import { CustomCheckbox } from '../../ui/CustomCheckbox';
import { CustomSelect } from '../../ui/CustomSelect';
import { SearchConfigEditor } from './SearchConfigEditor';
import { TagsInput } from '../../ui/TagsInput';
import { Modal } from '../../ui/Modal';
import _Editor from 'react-simple-code-editor';
const Editor = (_Editor as any).default || _Editor;
import Prism from 'prismjs';
import { PluginGeneralTab } from './tabs/PluginGeneralTab';
import { PluginAuthTab } from './tabs/PluginAuthTab';
import { PluginSearchTab } from './tabs/PluginSearchTab';
import { PluginMediaTab } from './tabs/PluginMediaTab';
import { PluginTrackingTab } from './tabs/PluginTrackingTab';
import { PluginFunctionsTab } from './tabs/PluginFunctionsTab';
import { MetadataEditor } from './MetadataEditor';

let pluginsEditorScrollPos = 0;
let cachedPluginsEditTab: "general" | "auth" | "search" | "media" | "tracking" | "functions" | "metadata" = "general";

export const PluginEditor = () => {
  const {
    editingPlugin,
    setEditingPlugin,
    updateEditingPlugin,
    savePlugin,
    flows,
    testSearchQuery,
    setTestSearchQuery
  } = useAppContext();

  const [editTab, _setEditTab] = React.useState<
    "general" | "auth" | "search" | "media" | "tracking" | "functions" | "metadata"
  >(cachedPluginsEditTab);
  const setEditTab = (val: typeof cachedPluginsEditTab) => { cachedPluginsEditTab = val; _setEditTab(val); };
  
  const [ideModalData, setIdeModalData] = React.useState<{
    title: string;
    value: string;
    mode: "javascript" | "css";
    onChange: (val: string) => void;
  } | null>(null);
  
  const [ideTempVal, setIdeTempVal] = React.useState("");
  
  const editorScrollRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (editorScrollRef.current) editorScrollRef.current.scrollTop = pluginsEditorScrollPos;
  }, [editTab, editingPlugin]);

  if (!editingPlugin) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-zinc-500">
        <Puzzle size={48} className="mb-4 opacity-20" />
        <p>Select a plugin to edit or create a new one.</p>
      </div>
    );
  }

  return (
    <>
<div className="max-w-6xl mx-auto w-full flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-8 pHeader bg-zinc-950 z-10 pb-4 border-b border-zinc-900">
              <div>
                <h2 className="text-2xl font-light tracking-tight text-zinc-100 flex items-center gap-3">
                  {editingPlugin.id ? editingPlugin.name : "New Plugin"}
                </h2>
                <p className="text-sm text-zinc-400 mt-1">
                  {editingPlugin.baseUrl}
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setEditingPlugin(null)}
                  className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={savePlugin}
                  className="flex items-center gap-2 px-6 py-2 text-sm font-medium bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors shadow-lg shadow-indigo-500/20"
                >
                  <Save size={16} /> Save Plugin
                </button>
              </div>
            </div>

            <div className="flex gap-2 border-b border-zinc-800/50 mb-6 overflow-x-auto no-scrollbar shrink-0">
              {[
                { id: "general", label: "General & CSS", icon: Settings },
                { id: "search", label: "Search Targets", icon: Search },
                { id: "media", label: "Media Parsing", icon: ListTree },
                { id: "tracking", label: "Tracking", icon: Activity },
                { id: "auth", label: "Authentication", icon: KeyRound },
                { id: "functions", label: "Custom JS", icon: Code },
                { id: "metadata", label: "Metadata", icon: Puzzle },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = editTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setEditTab(tab.id as any)}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${isActive ? "border-indigo-500 text-indigo-400 bg-indigo-500/5" : "border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/30"}`}
                  >
                    <Icon
                      size={16}
                      className={isActive ? "text-indigo-400" : "text-zinc-600"}
                    />{" "}
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <div
              ref={editorScrollRef}
              onScroll={(e) => pluginsEditorScrollPos = e.currentTarget.scrollTop}
              className="flex-1 pb-20 overflow-y-auto no-scrollbar pr-4"
            >
              {editTab === "general" && <PluginGeneralTab setIdeModalData={setIdeModalData} setIdeTempVal={setIdeTempVal} />}

              {/* Authentication Flow */}
              {editTab === "auth" && <PluginAuthTab setIdeModalData={setIdeModalData} setIdeTempVal={setIdeTempVal} />}

              {/* Search Parsing */}
              {editTab === "search" && <PluginSearchTab setIdeModalData={setIdeModalData} setIdeTempVal={setIdeTempVal} />}

              {/* Details Parsing */}
              {editTab === "media" && <PluginMediaTab setIdeModalData={setIdeModalData} setIdeTempVal={setIdeTempVal} />}

              {/* Tracking Parsing */}
              {editTab === "tracking" && <PluginTrackingTab setIdeModalData={setIdeModalData} setIdeTempVal={setIdeTempVal} />}

              {/* Player & Styling */}
              {editTab === "functions" && <PluginFunctionsTab setIdeModalData={setIdeModalData} setIdeTempVal={setIdeTempVal} />}

              {/* Metadata Tab */}
              {editTab === "metadata" && (
                <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <MetadataEditor
                    metadata={editingPlugin}
                    onChange={(key, val) =>
                      updateEditingPlugin("root", key as any, val)
                    }
                  />
                </div>
              )}
            </div>
          </div>
{/* IDE Modal */}
      {ideModalData && (
        <Modal
          isOpen={!!ideModalData}
          onClose={() => setIdeModalData(null)}
          title={ideModalData.title}
          width="max-w-6xl"
        >
          <div className="flex flex-col h-[70vh]">
            <div className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden font-mono text-sm shadow-inner relative">
              <div className="absolute top-2 right-4 z-10 text-[10px] text-zinc-500 font-bold uppercase tracking-wider bg-zinc-900/80 px-2 py-1 rounded">
                {ideModalData.mode}
              </div>
              <Editor
                value={ideTempVal}
                onValueChange={(code) => setIdeTempVal(code)}
                highlight={(code) => Prism.highlight(
                  code,
                  Prism.languages[ideModalData.mode] || Prism.languages.javascript,
                  ideModalData.mode
                )}
                padding={20}
                className="w-full h-full text-zinc-300 text-[14px] leading-relaxed relative z-0"
                textareaClassName="focus:outline-none"
                style={{ minHeight: '100%', fontFamily: '"Fira Code", "JetBrains Mono", monospace' }}
              />
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setIdeModalData(null)}
                className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  ideModalData.onChange(ideTempVal);
                  setIdeModalData(null);
                }}
                className="px-6 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-indigo-500/20"
              >
                Save Code
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};
