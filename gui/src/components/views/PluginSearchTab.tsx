import React from 'react';
import {
  Search, Bookmark, Settings, Minus, Square, X, ChevronLeft,
  ChevronRight, RotateCw, Film, Tv, Play, LayoutGrid, Shield, ShieldOff,
  Plus, Puzzle, Save, Trash2, Download, Upload, KeyRound, Code,
  ListTree, MonitorPlay, Activity, RefreshCw, Bell, Compass, Zap,
  Clock, Folder, Lock, EyeOff, Eye, Globe, Copy, Store,
  DownloadCloud, CheckCircle2, Package
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { TooltipWrapper } from '../ui/TooltipWrapper';
import { CustomCheckbox } from '../ui/CustomCheckbox';
import { CustomSelect } from '../ui/CustomSelect';
import { SearchConfigEditor } from './SearchConfigEditor';
import { TagsInput } from '../ui/TagsInput';

interface TabProps {
  setIdeModalData: (data: any) => void;
  setIdeTempVal: (val: string) => void;
}

export const PluginSearchTab: React.FC<TabProps> = ({ setIdeModalData, setIdeTempVal }) => {
  const {
    editingPlugin,
    setEditingPlugin,
    updateEditingPlugin,
    flows,
    testSearchQuery,
    setTestSearchQuery
  } = useAppContext();

  if (!editingPlugin) return null;

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-theme-accent flex items-center gap-2 uppercase tracking-wider">
                      <Search size={16} /> Search Parsing
                    </h3>
                    <SearchConfigEditor
                      config={editingPlugin.search}
                      onChange={(key, val) =>
                        updateEditingPlugin("search", key, val)
                      }
                      flows={flows}
                      testSearchQuery={testSearchQuery}
                      setTestSearchQuery={setTestSearchQuery}
                      baseUrl={editingPlugin.baseUrl}
                    />
                  </div>

                  {/* Additional Searches */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-emerald-400 flex items-center gap-2 uppercase tracking-wider">
                        <Search size={16} /> Additional Search Methods
                      </h3>
                      <button
                        onClick={() => {
                          const newId = Date.now().toString();
                          const newSearch = {
                            id: newId,
                            name: "New Search",
                            tags: [],
                            urlFormat: "",
                            itemSel: "",
                            titleSel: "",
                            linkSel: "",
                            imgSel: "",
                            yearSel: "",
                            typeSel: "",
                          };
                          updateEditingPlugin("root", "additionalSearches", [
                            ...(editingPlugin.additionalSearches || []),
                            newSearch,
                          ]);
                        }}
                        className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded hover:bg-emerald-500/30 flex items-center gap-1"
                      >
                        <Plus size={14} /> Add Search Method
                      </button>
                    </div>

                    <div className="space-y-4">
                      {(editingPlugin.additionalSearches || []).map(
                        (searchMethod, idx) => (
                          <div
                            key={searchMethod.id}
                            className="p-5 bg-zinc-900/30 border border-zinc-800/50 hover:border-theme-accent/30 transition-colors rounded-xl space-y-4"
                          >
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1 grid grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-xs text-zinc-500 mb-1.5">
                                    Method Name / Label
                                  </label>
                                  <input
                                    type="text"
                                    value={searchMethod.name}
                                    placeholder="e.g. Movies Search"
                                    onChange={(e) => {
                                      const arr = [
                                        ...editingPlugin.additionalSearches!,
                                      ];
                                      arr[idx].name = e.target.value;
                                      updateEditingPlugin(
                                        "root",
                                        "additionalSearches",
                                        arr,
                                      );
                                    }}
                                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-theme-accent outline-none"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs text-zinc-500 mb-1.5">
                                    Tags (Dashboard Filter)
                                  </label>
                                  <TagsInput
                                    tags={searchMethod.tags || []}
                                    onChange={(newTags) => {
                                      const arr = [
                                        ...editingPlugin.additionalSearches!,
                                      ];
                                      arr[idx].tags = newTags;
                                      updateEditingPlugin(
                                        "root",
                                        "additionalSearches",
                                        arr,
                                      );
                                    }}
                                  />
                                </div>
                              </div>
                              <div className="flex flex-col ml-4 gap-2 shrink-0">
                                <button
                                  onClick={() => {
                                    const newId = Date.now().toString();
                                    const arr = [
                                      ...editingPlugin.additionalSearches!,
                                    ];
                                    const cloned = JSON.parse(
                                      JSON.stringify(searchMethod),
                                    );
                                    cloned.id = newId;
                                    cloned.name = `${cloned.name} (Copy)`;
                                    arr.splice(idx + 1, 0, cloned);
                                    updateEditingPlugin(
                                      "root",
                                      "additionalSearches",
                                      arr,
                                    );
                                  }}
                                  className="p-2 text-zinc-500 hover:text-theme-accent hover:bg-theme-accent/10 rounded-lg transition-colors"
                                >
                                  <Copy size={16} />
                                </button>
                                <button
                                  onClick={() => {
                                    const arr =
                                      editingPlugin.additionalSearches!.filter(
                                        (_, i) => i !== idx,
                                      );
                                    updateEditingPlugin(
                                      "root",
                                      "additionalSearches",
                                      arr,
                                    );
                                  }}
                                  className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>

                            <div className="pt-4 border-t border-zinc-800/50">
                              <SearchConfigEditor
                                config={searchMethod}
                                onChange={(key, val) => {
                                  setEditingPlugin((prev: any) => {
                                    if (!prev || !prev.additionalSearches)
                                      return prev;
                                    const arr = [...prev.additionalSearches];
                                    arr[idx] = { ...arr[idx], [key]: val };
                                    return { ...prev, additionalSearches: arr };
                                  });
                                }}
                                flows={flows}
                                testSearchQuery={testSearchQuery}
                                setTestSearchQuery={setTestSearchQuery}
                                baseUrl={editingPlugin.baseUrl}
                              />
                            </div>
                          </div>
                        ),
                      )}
                      {(!editingPlugin.additionalSearches ||
                        editingPlugin.additionalSearches.length === 0) && (
                          <div className="text-center p-8 border border-dashed border-zinc-800 rounded-xl text-zinc-500 text-sm">
                            No additional search methods defined.
                          </div>
                        )}
                    </div>
                  </div>
                </div>
  );
};
