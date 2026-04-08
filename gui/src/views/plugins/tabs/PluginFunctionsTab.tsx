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
import { TooltipWrapper } from '../../../components/ui/TooltipWrapper';
import { CustomCheckbox } from '../../../components/ui/CustomCheckbox';
import { CustomSelect } from '../../../components/ui/CustomSelect';
import { SearchConfigEditor } from '../SearchConfigEditor';
import { TagsInput } from '../../../components/ui/TagsInput';

interface TabProps {
  setIdeModalData: (data: any) => void;
  setIdeTempVal: (val: string) => void;
}

export const PluginFunctionsTab: React.FC<TabProps> = ({ setIdeModalData, setIdeTempVal }) => {
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
                    <h3 className="text-sm font-medium text-indigo-400 flex items-center gap-2 uppercase tracking-wider">
                      <MonitorPlay size={16} /> Player & Focus
                    </h3>
                    <div className="p-5 bg-zinc-900/30 border border-zinc-800/50 rounded-xl space-y-4">
                      <div>
                        <label className="block text-xs text-zinc-500 mb-1.5">
                          Player Element Selector
                        </label>
                        <input
                          type="text"
                          value={editingPlugin.player.playerSel}
                          placeholder="video#main-player, iframe.video-frame"
                          onChange={(e) =>
                            updateEditingPlugin(
                              "player",
                              "playerSel",
                              e.target.value,
                            )
                          }
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 outline-none font-mono"
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="block text-xs text-zinc-500">
                            Custom Focus CSS (Injected on load)
                          </label>
                          <button
                            onClick={() => {
                              setIdeTempVal(editingPlugin.player.focusCss || "");
                              setIdeModalData({
                                title: "Custom Focus CSS",
                                value: editingPlugin.player.focusCss || "",
                                mode: "css",
                                onChange: (val) => updateEditingPlugin("player", "focusCss", val)
                              });
                            }}
                            className="text-[10px] bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 px-2 py-0.5 rounded transition-colors flex items-center gap-1"
                          >
                            <Code size={12} /> IDE Editor
                          </button>
                        </div>
                        <textarea
                          value={editingPlugin.player.focusCss || ""}
                          onChange={(e) =>
                            updateEditingPlugin(
                              "player",
                              "focusCss",
                              e.target.value,
                            )
                          }
                          rows={4}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 outline-none font-mono resize-none"
                        />
                        <p className="text-xs text-zinc-600 mt-2">
                          Use this CSS to force the player to fill the screen
                          and hide site navigation.
                        </p>
                      </div>
                      <div className="pt-2 border-t border-zinc-800/50">
                        <label className="block text-xs text-zinc-500 mb-1.5 font-medium">Ignore Video URLs (Optional)</label>
                        <input
                          type="text"
                          value={editingPlugin.player.ignoreVideoUrls || ''}
                          placeholder="e.g. youtube.com, trailer.mp4 (comma separated)"
                          onChange={e => updateEditingPlugin('player', 'ignoreVideoUrls', e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 outline-none font-mono tracking-wide"
                        />
                        <p className="text-[10px] text-zinc-600 mt-1">If the video or its iframe URL contains any of these strings, watch progress will not be tracked.</p>
                      </div>
                      <div>
                        <label className="block text-xs text-zinc-500 mb-1.5 font-medium">Ignore Video CSS (Optional)</label>
                        <input
                          type="text"
                          value={editingPlugin.player.ignoreVideoCSS || ''}
                          placeholder="e.g. video.trailer-player, .ad-video"
                          onChange={e => updateEditingPlugin('player', 'ignoreVideoCSS', e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 outline-none font-mono tracking-wide"
                        />
                        <p className="text-[10px] text-zinc-600 mt-1">Any video element matching this selector will not be tracked for watch progress.</p>
                      </div>
                    </div>
                  </div>

                  {/* Custom Functions */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-indigo-400 flex items-center gap-2 uppercase tracking-wider">
                        <Code size={16} /> Custom Functions
                      </h3>
                      <button
                        onClick={() => {
                          const newFuncs = [
                            ...(editingPlugin.customFunctions || []),
                            {
                              name: "newFunction",
                              description: "",
                              code: "function newFunction(html) {\n  return null;\n}",
                            },
                          ];
                          setEditingPlugin({
                            ...editingPlugin,
                            customFunctions: newFuncs,
                          });
                        }}
                        className="text-xs bg-indigo-500/20 text-indigo-400 px-2 py-1 rounded hover:bg-indigo-500/30 flex items-center gap-1"
                      >
                        <Plus size={14} /> Add Function
                      </button>
                    </div>
                    <div className="space-y-4">
                      {(editingPlugin.customFunctions || []).map(
                        (func, idx) => (
                          <div
                            key={idx}
                            className="p-5 bg-zinc-900/30 border border-zinc-800/50 rounded-xl space-y-4"
                          >
                            <div className="flex justify-between items-start gap-4">
                              <div className="flex-1 space-y-4">
                                <div>
                                  <label className="block text-xs text-zinc-500 mb-1.5">
                                    Function Name
                                  </label>
                                  <input
                                    type="text"
                                    value={func.name}
                                    placeholder="e.g. fetchCastDetails"
                                    onChange={(e) => {
                                      const newFuncs = [
                                        ...editingPlugin.customFunctions,
                                      ];
                                      newFuncs[idx].name = e.target.value;
                                      setEditingPlugin({
                                        ...editingPlugin,
                                        customFunctions: newFuncs,
                                      });
                                    }}
                                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 outline-none font-mono"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs text-zinc-500 mb-1.5">
                                    Description
                                  </label>
                                  <input
                                    type="text"
                                    value={func.description}
                                    placeholder="What does this do?"
                                    onChange={(e) => {
                                      const newFuncs = [
                                        ...editingPlugin.customFunctions,
                                      ];
                                      newFuncs[idx].description =
                                        e.target.value;
                                      setEditingPlugin({
                                        ...editingPlugin,
                                        customFunctions: newFuncs,
                                      });
                                    }}
                                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 outline-none"
                                  />
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  const newFuncs =
                                    editingPlugin.customFunctions.filter(
                                      (_, i) => i !== idx,
                                    );
                                  setEditingPlugin({
                                    ...editingPlugin,
                                    customFunctions: newFuncs,
                                  });
                                }}
                                className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                            <div>
                              <div className="flex items-center justify-between mb-1.5">
                                <label className="block text-xs text-zinc-500">
                                  JavaScript Code
                                </label>
                                <button
                                  onClick={() => {
                                    setIdeTempVal(func.code || "");
                                    setIdeModalData({
                                      title: `Function: ${func.name}`,
                                      value: func.code || "",
                                      mode: "javascript",
                                      onChange: (val) => {
                                        const newFuncs = [...editingPlugin.customFunctions!];
                                        newFuncs[idx].code = val;
                                        setEditingPlugin({
                                          ...editingPlugin,
                                          customFunctions: newFuncs,
                                        });
                                      }
                                    });
                                  }}
                                  className="text-[10px] bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 px-2 py-0.5 rounded transition-colors flex items-center gap-1"
                                >
                                  <Code size={12} /> IDE Editor
                                </button>
                              </div>
                              <textarea
                                value={func.code}
                                onChange={(e) => {
                                  const newFuncs = [
                                    ...editingPlugin.customFunctions!,
                                  ];
                                  newFuncs[idx].code = e.target.value;
                                  setEditingPlugin({
                                    ...editingPlugin,
                                    customFunctions: newFuncs,
                                  });
                                }}
                                rows={6}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:border-indigo-500 outline-none font-mono resize-y"
                              />
                            </div>
                          </div>
                        ),
                      )}
                      {(!editingPlugin.customFunctions ||
                        editingPlugin.customFunctions.length === 0) && (
                          <div className="text-center p-8 border border-dashed border-zinc-800 rounded-xl text-zinc-500 text-sm">
                            No custom functions defined.
                          </div>
                        )}
                    </div>
                  </div>
                </div>
  );
};
