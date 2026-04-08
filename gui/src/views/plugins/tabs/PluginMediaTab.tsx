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

export const PluginMediaTab: React.FC<TabProps> = ({ setIdeModalData, setIdeTempVal }) => {
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
                      <ListTree size={16} /> Details Parsing
                    </h3>
                    <div className="p-5 bg-zinc-900/30 border border-zinc-800/50 rounded-xl space-y-4">
                      <div className="flex items-center gap-3 mb-4 pb-4 border-b border-zinc-800/50">
                        <CustomCheckbox
                          checked={!!editingPlugin.details.delegateFlowId}
                          onChange={(val) => {
                            if (val) {
                              updateEditingPlugin("root", "details", {
                                ...editingPlugin.details,
                                delegateFlowId: flows[0]?.id || "",
                                delegateFlowInputs: {},
                              });
                            } else {
                              const {
                                delegateFlowId,
                                delegateFlowInputs,
                                ...rest
                              } = editingPlugin.details;
                              updateEditingPlugin("root", "details", rest);
                            }
                          }}
                        />
                        <span className="text-sm font-medium text-indigo-400">
                          Delegate fetching explicit details to a Custom Flow
                        </span>
                      </div>

                      {editingPlugin.details.delegateFlowId ? (
                        <div className="space-y-4 p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-lg">
                          <div>
                            <label className="block text-xs text-indigo-300 mb-1.5">
                              Target Flow
                            </label>
                            <CustomSelect
                              searchable
                              options={flows.map((f) => ({
                                label: f.name,
                                value: f.id,
                              }))}
                              value={editingPlugin.details.delegateFlowId}
                              onChange={(val) =>
                                updateEditingPlugin(
                                  "details",
                                  "delegateFlowId",
                                  val,
                                )
                              }
                            />
                          </div>
                          {(() => {
                            const selectedFlow = flows.find(
                              (f) =>
                                f.id === editingPlugin.details.delegateFlowId,
                            );
                            if (
                              !selectedFlow ||
                              !selectedFlow.variables ||
                              selectedFlow.variables.length === 0
                            ) {
                              return (
                                <div className="text-xs text-zinc-500 pt-2">
                                  This flow does not accept any variables.
                                </div>
                              );
                            }
                            return (
                              <div className="pt-2 border-t border-indigo-500/20 space-y-3">
                                <label className="block text-xs text-indigo-300 mb-1.5">
                                  Map Context Variables
                                </label>
                                {selectedFlow.variables.map((v) => {
                                  const valStr =
                                    editingPlugin.details.delegateFlowInputs?.[
                                    v
                                    ] || "";
                                  const isSel = valStr.startsWith("selector:");
                                  const isJs = valStr.startsWith("js:");
                                  const type = isSel
                                    ? "selector"
                                    : isJs
                                      ? "js"
                                      : "string";
                                  const cleanVal = isSel
                                    ? valStr.substring(9)
                                    : isJs
                                      ? valStr.substring(3)
                                      : valStr;

                                  return (
                                    <div
                                      key={v}
                                      className="flex gap-2 items-start"
                                    >
                                      <span className="text-xs text-zinc-400 w-1/4 truncate font-mono mt-2">
                                        {v}
                                      </span>
                                      <div className="flex-1 flex flex-col gap-2">
                                        <select
                                          className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1.5 text-xs text-zinc-200 outline-none hover:border-zinc-700 transition-colors"
                                          value={type}
                                          onChange={(e) => {
                                            const newType = e.target.value;
                                            const prefix =
                                              newType === "selector"
                                                ? "selector:"
                                                : newType === "js"
                                                  ? "js:"
                                                  : "";
                                            const inputs = {
                                              ...(editingPlugin.details
                                                .delegateFlowInputs || {}),
                                            };
                                            inputs[v] = prefix + cleanVal;
                                            updateEditingPlugin(
                                              "root",
                                              "details",
                                              {
                                                ...editingPlugin.details,
                                                delegateFlowInputs: inputs,
                                              },
                                            );
                                          }}
                                        >
                                          <option value="string">
                                            String / Native (e.g. {"{url}"})
                                          </option>
                                          <option value="selector">
                                            CSS Selector (on current page)
                                          </option>
                                          <option value="js">
                                            JavaScript (evaluated on page)
                                          </option>
                                        </select>
                                        <input
                                          type="text"
                                          placeholder={
                                            type === "selector"
                                              ? "img.poster@src"
                                              : type === "js"
                                                ? "return document.title;"
                                                : "{url}"
                                          }
                                          value={cleanVal}
                                          onChange={(e) => {
                                            const prefix =
                                              type === "selector"
                                                ? "selector:"
                                                : type === "js"
                                                  ? "js:"
                                                  : "";
                                            const inputs = {
                                              ...(editingPlugin.details
                                                .delegateFlowInputs || {}),
                                            };
                                            inputs[v] = prefix + e.target.value;
                                            updateEditingPlugin(
                                              "root",
                                              "details",
                                              {
                                                ...editingPlugin.details,
                                                delegateFlowInputs: inputs,
                                              },
                                            );
                                          }}
                                          className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1.5 text-xs text-zinc-200 focus:border-indigo-500 outline-none font-mono"
                                        />
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          })()}
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs text-zinc-500 mb-1.5">
                              Title Selector
                            </label>
                            <input
                              type="text"
                              value={editingPlugin.details.titleSel}
                              placeholder="h1.title"
                              onChange={(e) =>
                                updateEditingPlugin(
                                  "details",
                                  "titleSel",
                                  e.target.value,
                                )
                              }
                              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 outline-none font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-zinc-500 mb-1.5">
                              Description Selector
                            </label>
                            <input
                              type="text"
                              value={editingPlugin.details.descSel}
                              placeholder=".description"
                              onChange={(e) =>
                                updateEditingPlugin(
                                  "details",
                                  "descSel",
                                  e.target.value,
                                )
                              }
                              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 outline-none font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-zinc-500 mb-1.5">
                              Cast Selector
                            </label>
                            <input
                              type="text"
                              value={editingPlugin.details.castSel}
                              placeholder=".cast-list > li"
                              onChange={(e) =>
                                updateEditingPlugin(
                                  "details",
                                  "castSel",
                                  e.target.value,
                                )
                              }
                              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 outline-none font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-zinc-500 mb-1.5">
                              Rating Selector
                            </label>
                            <input
                              type="text"
                              value={editingPlugin.details.ratingSel}
                              placeholder=".rating"
                              onChange={(e) =>
                                updateEditingPlugin(
                                  "details",
                                  "ratingSel",
                                  e.target.value,
                                )
                              }
                              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 outline-none font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-zinc-500 mb-1.5">
                              Poster Selector
                            </label>
                            <input
                              type="text"
                              value={editingPlugin.details.posterSel}
                              placeholder="img.main-poster"
                              onChange={(e) =>
                                updateEditingPlugin(
                                  "details",
                                  "posterSel",
                                  e.target.value,
                                )
                              }
                              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 outline-none font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-zinc-500 mb-1.5">
                              Similar Shows Selector
                            </label>
                            <input
                              type="text"
                              value={editingPlugin.details.similarSel}
                              placeholder=".similar-items > a"
                              onChange={(e) =>
                                updateEditingPlugin(
                                  "details",
                                  "similarSel",
                                  e.target.value,
                                )
                              }
                              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 outline-none font-mono"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Media Parsing */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-indigo-400 flex items-center gap-2 uppercase tracking-wider">
                      <ListTree size={16} /> Media Structure
                    </h3>
                    <div className="p-5 bg-zinc-900/30 border border-zinc-800/50 rounded-xl space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-zinc-500 mb-1.5">
                            Season Selector
                          </label>
                          <input
                            type="text"
                            value={editingPlugin.media.seasonSel}
                            placeholder=".season-list > li"
                            onChange={(e) =>
                              updateEditingPlugin(
                                "media",
                                "seasonSel",
                                e.target.value,
                              )
                            }
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 outline-none font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-zinc-500 mb-1.5">
                            Episode Selector
                          </label>
                          <input
                            type="text"
                            value={editingPlugin.media.epSel}
                            placeholder=".episodes > a"
                            onChange={(e) =>
                              updateEditingPlugin(
                                "media",
                                "epSel",
                                e.target.value,
                              )
                            }
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 outline-none font-mono"
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="block text-xs text-zinc-500">
                            Deep Scan JS Ripper (Overrides Selectors)
                          </label>
                          <button
                            onClick={() => {
                              setIdeTempVal(editingPlugin.media.deepJs || "");
                              setIdeModalData({
                                title: "Deep Scan JS Ripper",
                                value: editingPlugin.media.deepJs || "",
                                mode: "javascript",
                                onChange: (val) => updateEditingPlugin("media", "deepJs", val)
                              });
                            }}
                            className="text-[10px] bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 px-2 py-0.5 rounded transition-colors flex items-center gap-1"
                          >
                            <Code size={12} /> IDE Editor
                          </button>
                        </div>
                        <textarea
                          value={editingPlugin.media.deepJs || ""}
                          onChange={(e) =>
                            updateEditingPlugin(
                              "media",
                              "deepJs",
                              e.target.value,
                            )
                          }
                          rows={4}
                          placeholder="function rip() { return [{ title: 'Ep 1', href: 'url' }]; } return rip();"
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:border-indigo-500 outline-none font-mono resize-y"
                        />
                        <p className="text-xs text-zinc-600 mt-1">
                          If provided, this evaluates when a Dashboard Deep Scan
                          precisely matches this show. Must return:{" "}
                          <code>{`[{ title, href }]`}</code>.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
  );
};
