import React from 'react';
import {
  Search, Bookmark, Settings, Minus, Square, X, ChevronLeft,
  ChevronRight, RotateCw, Film, Tv, Play, LayoutGrid, Shield, ShieldOff,
  Plus, Puzzle, Save, Trash2, Download, Upload, KeyRound, Code,
  ListTree, MonitorPlay, Activity, RefreshCw, Bell, Compass, Zap,
  Clock, Folder, Lock, EyeOff, Eye, Globe, Copy, Store,
  DownloadCloud, CheckCircle2, Package, ChevronDown
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { ahk } from '../../lib/ahk';
import { TooltipWrapper } from '../../components/ui/TooltipWrapper';
import { CustomCheckbox } from '../../components/ui/CustomCheckbox';
import { CustomSelect } from '../../components/ui/CustomSelect';
import { SearchConfigEditor } from './SearchConfigEditor';
import { TagsInput } from '../../components/ui/TagsInput';
import { Modal } from '../../components/ui/Modal';
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
    setTestSearchQuery,
    isPluginDirty,
    pluginBaselineStr,
    setPluginBaselineStr
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

  const [showSaveOptions, setShowSaveOptions] = React.useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = React.useState(false);

  // Sync baseline right after explicit save to clear dirty state
  const handleExplicitSave = (closeEditor: boolean) => {
    savePlugin(closeEditor);
  };

  React.useEffect(() => {
    if (autoSaveEnabled && editingPlugin && isPluginDirty) {
      const timer = setTimeout(() => {
        savePlugin(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [editingPlugin, autoSaveEnabled, isPluginDirty]);

  // Sync baseline right after explicit save to clear dirty state


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
              {isPluginDirty && !autoSaveEnabled && (
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] uppercase font-bold tracking-wider rounded-full self-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /> Unsaved
                </div>
              )}
              {autoSaveEnabled && (
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] uppercase font-bold tracking-wider rounded-full self-center">
                  <CheckCircle2 size={10} /> Auto-Saving
                </div>
              )}
            </h2>
            <p className="text-sm text-zinc-400 mt-1">
              {editingPlugin.baseUrl}
            </p>
          </div>
          <div className="flex gap-3 relative">
            <button
              onClick={() => setEditingPlugin(null)}
              className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              Cancel
            </button>
            <div className="relative inline-flex flex-col items-stretch isolate">
              <div className="flex items-stretch rounded-lg shadow-lg shadow-indigo-500/20 overflow-visible z-10 transition-transform active:scale-[0.98]">
                <button
                  onClick={() => handleExplicitSave(false)}
                  className="flex items-center gap-2 px-5 py-2 text-sm font-medium bg-indigo-500 hover:bg-indigo-600 text-white rounded-l-lg transition-colors border-r border-indigo-600/50"
                >
                  <Save size={16} /> Save
                </button>
                <button
                  onClick={() => setShowSaveOptions(!showSaveOptions)}
                  className="flex items-center px-2 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-r-lg transition-colors"
                >
                  <ChevronDown size={16} className={`transition-transform duration-200 ${showSaveOptions ? "rotate-180" : ""}`} />
                </button>
              </div>

              {showSaveOptions && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowSaveOptions(false)} />
                  <div className="absolute top-12 right-0 w-48 bg-[var(--theme-surface)] border border-[var(--theme-border)] rounded-xl shadow-2xl z-50 overflow-hidden animate-in slide-in-from-top-2 duration-200">
                    <button
                      onClick={() => {
                        handleExplicitSave(true);
                        setShowSaveOptions(false);
                      }}
                      className="w-full text-left px-4 py-3 text-sm text-zinc-200 hover:bg-zinc-900/30 transition-colors border-b border-zinc-800/50 flex items-center gap-2"
                    >
                      <Save size={14} className="text-indigo-400" /> Save & Close
                    </button>
                    <button
                      onClick={() => {
                        setAutoSaveEnabled(!autoSaveEnabled);
                        setShowSaveOptions(false);
                      }}
                      className="w-full text-left px-4 py-3 text-sm text-zinc-200 hover:bg-zinc-900/30 transition-colors flex items-center gap-2"
                    >
                      {autoSaveEnabled ? <Square size={14} className="text-zinc-500" /> : <CustomCheckbox checked={autoSaveEnabled} onChange={() => { }} />} Toggle Auto-Save
                    </button>
                  </div>
                </>
              )}
            </div>
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
