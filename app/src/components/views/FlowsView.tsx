import React from "react";
import {
  Search,
  Bookmark,
  Settings,
  Minus,
  Square,
  X,
  ChevronLeft,
  ChevronRight,
  RotateCw,
  Film,
  Tv,
  Play,
  LayoutGrid,
  Shield,
  ShieldOff,
  Plus,
  Puzzle,
  Save,
  Trash2,
  Download,
  Upload,
  KeyRound,
  Code,
  ListTree,
  MonitorPlay,
  Activity,
  RefreshCw,
  Bell,
  Compass,
  Zap,
  Clock,
  Folder,
  Lock,
  EyeOff,
  Eye,
  Globe,
} from "lucide-react";
import { useAppContext } from "../../context/AppContext";
import { ahk } from "../../lib/ahk";
import { TooltipWrapper } from "../ui/TooltipWrapper";
import { CustomCheckbox } from "../ui/CustomCheckbox";
import { TagsInput } from "../ui/TagsInput";
import { CustomSelect } from "../ui/CustomSelect";
import { Modal } from "../ui/Modal";
import Editor from "react-simple-code-editor";
import Prism from "prismjs";
import {
  DEFAULT_PLUGIN,
  SitePlugin,
  CustomFlow,
  Userscript,
  FollowedItem,
  BookmarkItem,
  WatchLaterItem,
  CredentialItem,
  FlowStep,
} from "../../types";

import { MetadataEditor } from "./MetadataEditor";

let cachedFlowsEditTab: "general" | "steps" | "metadata" = "general";

export const FlowsView = () => {
  const {
    url,
    setUrl,
    inputUrl,
    setInputUrl,
    isAdblockEnabled,
    setIsAdblockEnabled,
    urlBarMode,
    setUrlBarMode,
    theme,
    setTheme,
    bookmarks,
    setBookmarks,
    selectedBookmarks,
    setSelectedBookmarks,
    followedItems,
    setFollowedItems,
    isCheckingUpdates,
    setIsCheckingUpdates,
    plugins,
    setPlugins,
    editingPlugin,
    setEditingPlugin,
    testSearchUrl,
    setTestSearchUrl,
    testSearchResults,
    setTestSearchResults,
    isTestingSearch,
    setIsTestingSearch,
    flows,
    setFlows,
    editingFlow,
    setEditingFlow,
    userscripts,
    setUserscripts,
    editingUserscriptId,
    setEditingUserscriptId,
    activeTab,
    setActiveTab,
    multiSearchQuery,
    setMultiSearchQuery,
    searchResults,
    setSearchResults,
    isSearching,
    setIsSearching,
    watchLater,
    setWatchLater,
    credentials,
    setCredentials,
    newCred,
    setNewCred,
    bookmarkSearchQuery,
    setBookmarkSearchQuery,
    editingBookmarkId,
    setEditingBookmarkId,
    showCredModal,
    setShowCredModal,
    searchParamMode,
    setSearchParamMode,
    isQuickOptionsHidden,
    setIsQuickOptionsHidden,
    playerRef,
    savePlugin,
    deletePlugin,
    updateEditingPlugin,
    fetchTitleForUrl,
    runFlow,
    checkForUpdates,
    handleNavigate,
    loadPlugins,
  } = useAppContext();

  const [editTab, _setEditTab] = React.useState<
    "general" | "steps" | "metadata"
  >(cachedFlowsEditTab);
  const setEditTab = (val: typeof cachedFlowsEditTab) => { cachedFlowsEditTab = val; _setEditTab(val); };

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* Flows List */}
      <div className="w-1/4 min-w-[250px] border-r border-zinc-800/50 bg-zinc-950/50 p-6 overflow-y-auto no-scrollbar">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-light tracking-tight text-zinc-100 flex items-center gap-2">
              <ListTree size={20} className="text-indigo-400" /> Custom Flows
            </h2>
            <p className="text-xs text-zinc-500 mt-1">
              Automate site interactions.
            </p>
          </div>
          <button
            onClick={() => {
              const newFlow = {
                id: Date.now().toString(),
                name: "New Flow",
                description: "",
                steps: [],
                enabled: true,
              };
              const newFlows = [...flows, newFlow];
              setFlows(newFlows);
              ahk.call(
                "SaveFlow",
                `flow_${newFlow.id}.json`,
                JSON.stringify(newFlow, null, 2),
              );
              setEditingFlow(newFlow);
            }}
            className="p-2 text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors"
          >
            <Plus size={18} />
          </button>
        </div>
        <div className="space-y-2">
          {flows.map((flow) => (
            <div
              key={flow.id}
              onClick={() => setEditingFlow(flow)}
              className={`p-4 rounded-xl cursor-pointer transition-all duration-200 border ${editingFlow?.id === flow.id ? "bg-indigo-500/10 border-indigo-500/30" : "bg-zinc-900/50 border-zinc-800/50 hover:bg-zinc-900 hover:border-zinc-700"}`}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  {flow.icon ? (
                    <div className="w-6 h-6 rounded bg-zinc-800/80 flex items-center justify-center shrink-0 border border-zinc-700/50">
                      {flow.icon.includes("<svg") ||
                        flow.icon.includes("http") ? (
                        <div
                          className="w-3 h-3"
                          dangerouslySetInnerHTML={{
                            __html: flow.icon.includes("<svg")
                              ? flow.icon
                              : `<img src="${flow.icon}" class="w-full h-full object-contain" />`,
                          }}
                        />
                      ) : (
                        <span className="text-[10px]">{flow.icon}</span>
                      )}
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded bg-zinc-800/80 flex items-center justify-center shrink-0 text-zinc-500 border border-zinc-700/50">
                      <ListTree size={12} />
                    </div>
                  )}
                  <h3
                    className={`font-medium text-sm truncate ${editingFlow?.id === flow.id ? "text-indigo-400" : "text-zinc-200"}`}
                  >
                    {flow.name}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <CustomCheckbox
                    checked={flow.enabled !== false}
                    onChange={(val) => {
                      const updated = { ...flow, enabled: val };
                      setFlows(
                        flows.map((f) => (f.id === flow.id ? updated : f)),
                      );
                      ahk.call(
                        "SaveFlow",
                        `flow_${flow.id}.json`,
                        JSON.stringify(updated, null, 2),
                      );
                    }}
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const newFlows = flows.filter((f) => f.id !== flow.id);
                      setFlows(newFlows);
                      ahk.call("DeleteFlow", `flow_${flow.id}.json`);
                      if (editingFlow?.id === flow.id) setEditingFlow(null);
                    }}
                    className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <p className="text-xs text-zinc-500 truncate">
                {flow.description || "No description"}
              </p>
              <div className="mt-3 flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-wider font-medium text-zinc-600 bg-zinc-900 px-2 py-0.5 rounded-full border border-zinc-800">
                  {flow.steps.length} Steps
                </span>
              </div>
            </div>
          ))}
          {flows.length === 0 && (
            <div className="text-center p-8 border border-dashed border-zinc-800 rounded-xl text-zinc-500 text-sm">
              No flows created yet.
            </div>
          )}
        </div>
      </div>

      {/* Flow Editor */}
      <div className="flex-1 bg-zinc-950 p-6 overflow-y-auto no-scrollbar">
        {editingFlow ? (
          <div className="max-w-3xl mx-auto space-y-8 pb-20">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-light tracking-tight text-zinc-100">
                Edit Flow
              </h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={async () => {
                    await runFlow(editingFlow);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-sm font-medium transition-colors"
                >
                  <Play size={16} /> Run Flow
                </button>
                <button
                  onClick={() => {
                    const updatedFlows = flows.map((f) =>
                      f.id === editingFlow.id ? editingFlow : f,
                    );
                    setFlows(updatedFlows);
                    ahk.call(
                      "SaveFlow",
                      `flow_${editingFlow.id}.json`,
                      JSON.stringify(editingFlow, null, 2),
                    );
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm font-medium transition-colors shadow-[0_0_15px_rgba(99,102,241,0.3)]"
                >
                  <Save size={16} /> Save Flow
                </button>
              </div>
            </div>

            <div className="flex gap-2 border-b border-zinc-800/50 mb-6 overflow-x-auto no-scrollbar shrink-0">
              {[
                { id: "general", label: "General Info", icon: Settings },
                { id: "steps", label: "Flow Steps", icon: ListTree },
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

            <div className="flex-1 pb-20 overflow-y-auto no-scrollbar pr-4">
              {/* Basic Info */}
              {editTab === "general" && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="p-5 bg-zinc-900/30 border border-zinc-800/50 rounded-xl space-y-4">
                    <div>
                      <label className="block text-xs text-zinc-500 mb-1.5">
                        Flow Name
                      </label>
                      <input
                        type="text"
                        value={editingFlow.name}
                        onChange={(e) =>
                          setEditingFlow({
                            ...editingFlow,
                            name: e.target.value,
                          })
                        }
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-500 mb-1.5">
                        Description
                      </label>
                      <input
                        type="text"
                        value={editingFlow.description}
                        onChange={(e) =>
                          setEditingFlow({
                            ...editingFlow,
                            description: e.target.value,
                          })
                        }
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-500 mb-1.5">
                        Flow Variables / Inputs (Press Enter to add)
                      </label>
                      <TagsInput
                        tags={editingFlow.variables || []}
                        onChange={(newTags) =>
                          setEditingFlow({ ...editingFlow, variables: newTags })
                        }
                      />
                      <p className="text-[10px] text-zinc-600 mt-1">
                        These variables will be injected when called by Plugins
                        or other Flows (e.g. {"{query}"} or {"{url}"}).
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Steps */}
              {editTab === "steps" && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-indigo-400 flex items-center gap-2 uppercase tracking-wider">
                      <ListTree size={16} /> Flow Steps
                    </h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          const newStep: FlowStep = {
                            id: Date.now().toString(),
                            type: "RawFetchHTML",
                            params: { url: "" },
                          };
                          setEditingFlow({
                            ...editingFlow,
                            steps: [...editingFlow.steps, newStep],
                          });
                        }}
                        className="text-xs bg-indigo-500/20 text-indigo-400 px-2 py-1 rounded hover:bg-indigo-500/30 flex items-center gap-1"
                      >
                        <Plus size={14} /> Add Step
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4 relative">
                    {editingFlow.steps.map((step, idx) => (
                      <div
                        key={step.id}
                        className="relative z-10 p-5 bg-zinc-900/50 border border-zinc-800/80 rounded-xl shadow-lg"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-mono text-zinc-400">
                              {idx + 1}
                            </div>
                            <div className="w-[200px]">
                              <CustomSelect
                                options={[
                                  {
                                    value: "RawFetchHTML",
                                    label: "[App] Fetch Raw HTML (Background)",
                                  },
                                  {
                                    value: "parseHtml",
                                    label: "[App] Parse HTML Context",
                                  },
                                  {
                                    value: "pluginAction",
                                    label: "[App] Run Plugin Action",
                                  },
                                  {
                                    value: "smartSearch",
                                    label: "[App] Search (Aggregated)",
                                  },
                                  {
                                    value: "callFlow",
                                    label: "[App] Call Flow",
                                  },
                                  {
                                    value: "callPlugin",
                                    label: "[App] Call Search Plugin",
                                  },
                                  {
                                    value: "navigate",
                                    label: "[Player] Navigate URL",
                                  },
                                  {
                                    value: "inject",
                                    label: "[Player] Inject JS/CSS",
                                  },
                                  {
                                    value: "smartFetch",
                                    label: "[Hidden] SmartFetch (Plugin Rules)",
                                  },
                                  {
                                    value: "customSmartFetch",
                                    label:
                                      "[Hidden] Custom SmartFetch (JS Script)",
                                  },
                                  {
                                    value: "wait",
                                    label: "[Flow] Wait (Delay)",
                                  },
                                  {
                                    value: "waitForElement",
                                    label: "[Player] Wait for Element",
                                  },
                                  {
                                    value: "interact",
                                    label: "[Player] Interact (Click/Type)",
                                  },
                                ]}
                                value={step.type}
                                onChange={(val) => {
                                  const newSteps = [...editingFlow.steps];
                                  newSteps[idx].type = val as any;
                                  newSteps[idx].params = {}; // Reset params on type change
                                  setEditingFlow({
                                    ...editingFlow,
                                    steps: newSteps,
                                  });
                                }}
                              />
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              const newSteps = editingFlow.steps.filter(
                                (_, i) => i !== idx,
                              );
                              setEditingFlow({
                                ...editingFlow,
                                steps: newSteps,
                              });
                            }}
                            className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        {/* Step Params Editor based on Type */}
                        <div className="pl-9 space-y-3">
                          {step.type === "RawFetchHTML" && (
                            <div>
                              <label className="block text-xs text-zinc-500 mb-1.5">
                                URL
                              </label>
                              <input
                                type="text"
                                value={step.params.url || ""}
                                placeholder="https://..."
                                onChange={(e) => {
                                  const newSteps = [...editingFlow.steps];
                                  newSteps[idx].params.url = e.target.value;
                                  setEditingFlow({
                                    ...editingFlow,
                                    steps: newSteps,
                                  });
                                }}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 outline-none font-mono"
                              />
                            </div>
                          )}
                          {step.type === "parseHtml" && (
                            <div>
                              <label className="block text-xs text-zinc-500 mb-1.5">
                                CSS Selector
                              </label>
                              <input
                                type="text"
                                value={step.params.selector || ""}
                                placeholder=".item > a"
                                onChange={(e) => {
                                  const newSteps = [...editingFlow.steps];
                                  newSteps[idx].params.selector =
                                    e.target.value;
                                  setEditingFlow({
                                    ...editingFlow,
                                    steps: newSteps,
                                  });
                                }}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 outline-none font-mono"
                              />
                            </div>
                          )}
                          {step.type === "pluginAction" && (
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-xs text-zinc-500 mb-1.5">
                                  Plugin ID
                                </label>
                                <CustomSelect
                                  options={plugins.map((p) => ({
                                    label: p.name,
                                    value: p.id,
                                  }))}
                                  value={step.params.pluginId || ""}
                                  onChange={(val) => {
                                    const newSteps = [...editingFlow.steps];
                                    newSteps[idx].params.pluginId = val;
                                    setEditingFlow({
                                      ...editingFlow,
                                      steps: newSteps,
                                    });
                                  }}
                                  placeholder="Select Plugin..."
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-zinc-500 mb-1.5">
                                  Action Name
                                </label>
                                <input
                                  type="text"
                                  value={step.params.actionName || ""}
                                  placeholder="e.g. fetchCastDetails"
                                  onChange={(e) => {
                                    const newSteps = [...editingFlow.steps];
                                    newSteps[idx].params.actionName =
                                      e.target.value;
                                    setEditingFlow({
                                      ...editingFlow,
                                      steps: newSteps,
                                    });
                                  }}
                                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 outline-none font-mono"
                                />
                              </div>
                            </div>
                          )}
                          {step.type === "navigate" && (
                            <div>
                              <label className="block text-xs text-zinc-500 mb-1.5">
                                URL
                              </label>
                              <input
                                type="text"
                                value={step.params.url || ""}
                                placeholder="https://..."
                                onChange={(e) => {
                                  const newSteps = [...editingFlow.steps];
                                  newSteps[idx].params.url = e.target.value;
                                  setEditingFlow({
                                    ...editingFlow,
                                    steps: newSteps,
                                  });
                                }}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 outline-none font-mono"
                              />
                            </div>
                          )}
                          {step.type === "inject" && (
                            <div>
                              <label className="block text-xs text-zinc-500 mb-1.5">
                                JavaScript Code
                              </label>
                              <textarea
                                value={step.params.code || ""}
                                onChange={(e) => {
                                  const newSteps = [...editingFlow.steps];
                                  newSteps[idx].params.code = e.target.value;
                                  setEditingFlow({
                                    ...editingFlow,
                                    steps: newSteps,
                                  });
                                }}
                                rows={4}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:border-indigo-500 outline-none font-mono resize-y"
                              />
                            </div>
                          )}
                          {step.type === "extract" && (
                            <div>
                              <label className="block text-xs text-zinc-500 mb-1.5">
                                Extraction Rules (JSON)
                              </label>
                              <textarea
                                value={step.params.rules || ""}
                                placeholder='{"title": ".title", "link": "a@href"}'
                                onChange={(e) => {
                                  const newSteps = [...editingFlow.steps];
                                  newSteps[idx].params.rules = e.target.value;
                                  setEditingFlow({
                                    ...editingFlow,
                                    steps: newSteps,
                                  });
                                }}
                                rows={4}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:border-indigo-500 outline-none font-mono resize-y"
                              />
                            </div>
                          )}

                          {/* Smart Steps */}
                          {step.type === "smartFetch" && (
                            <div className="space-y-3">
                              <div>
                                <label className="block text-xs text-zinc-500 mb-1.5">
                                  Target Plugin / Configuration
                                </label>
                                <CustomSelect
                                  options={plugins.map((p) => ({
                                    label: p.name,
                                    value: p.id,
                                  }))}
                                  value={step.params.pluginId || ""}
                                  onChange={(val) => {
                                    const newSteps = [...editingFlow.steps];
                                    newSteps[idx].params.pluginId = val;
                                    setEditingFlow({
                                      ...editingFlow,
                                      steps: newSteps,
                                    });
                                  }}
                                  placeholder="Which site rules to apply..."
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-zinc-500 mb-1.5">
                                  URL Target (Can use variables)
                                </label>
                                <input
                                  type="text"
                                  value={step.params.url || ""}
                                  placeholder="https://..."
                                  onChange={(e) => {
                                    const newSteps = [...editingFlow.steps];
                                    newSteps[idx].params.url = e.target.value;
                                    setEditingFlow({
                                      ...editingFlow,
                                      steps: newSteps,
                                    });
                                  }}
                                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 outline-none font-mono"
                                />
                              </div>
                            </div>
                          )}
                          {step.type === "smartSearch" && (
                            <div className="space-y-3">
                              <div>
                                <label className="block text-xs text-zinc-500 mb-1.5">
                                  Multi-Search Engine Query (e.g. {"{query}"})
                                </label>
                                <input
                                  type="text"
                                  value={step.params.query || ""}
                                  placeholder="{query}"
                                  onChange={(e) => {
                                    const newSteps = [...editingFlow.steps];
                                    newSteps[idx].params.query = e.target.value;
                                    setEditingFlow({
                                      ...editingFlow,
                                      steps: newSteps,
                                    });
                                  }}
                                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 outline-none font-mono"
                                />
                              </div>
                            </div>
                          )}

                          {step.type === "wait" && (
                            <div>
                              <label className="block text-xs text-zinc-500 mb-1.5">
                                Wait Time (ms)
                              </label>
                              <input
                                type="text"
                                value={step.params.ms || ""}
                                placeholder="1500"
                                onChange={(e) => {
                                  const newSteps = [...editingFlow.steps];
                                  newSteps[idx].params.ms = e.target.value;
                                  setEditingFlow({
                                    ...editingFlow,
                                    steps: newSteps,
                                  });
                                }}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 outline-none font-mono"
                              />
                            </div>
                          )}

                          {step.type === "waitForElement" && (
                            <div>
                              <label className="block text-xs text-zinc-500 mb-1.5">
                                CSS Selector to Wait For
                              </label>
                              <input
                                type="text"
                                value={step.params.selector || ""}
                                placeholder=".movie-player"
                                onChange={(e) => {
                                  const newSteps = [...editingFlow.steps];
                                  newSteps[idx].params.selector =
                                    e.target.value;
                                  setEditingFlow({
                                    ...editingFlow,
                                    steps: newSteps,
                                  });
                                }}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 outline-none font-mono"
                              />
                            </div>
                          )}

                          {step.type === "interact" && (
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-xs text-zinc-500 mb-1.5">
                                  CSS Selector
                                </label>
                                <input
                                  type="text"
                                  value={step.params.selector || ""}
                                  placeholder=".play-btn"
                                  onChange={(e) => {
                                    const newSteps = [...editingFlow.steps];
                                    newSteps[idx].params.selector =
                                      e.target.value;
                                    setEditingFlow({
                                      ...editingFlow,
                                      steps: newSteps,
                                    });
                                  }}
                                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 outline-none font-mono"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-zinc-500 mb-1.5">
                                  Action
                                </label>
                                <CustomSelect
                                  options={[
                                    { value: "click", label: "Click" },
                                    {
                                      value: "setValue",
                                      label: "Set Text/Value",
                                    },
                                  ]}
                                  value={step.params.actionType || "click"}
                                  onChange={(val) => {
                                    const newSteps = [...editingFlow.steps];
                                    newSteps[idx].params.actionType = val;
                                    setEditingFlow({
                                      ...editingFlow,
                                      steps: newSteps,
                                    });
                                  }}
                                />
                              </div>
                              {step.params.actionType === "setValue" && (
                                <div className="col-span-2">
                                  <label className="block text-xs text-zinc-500 mb-1.5">
                                    Value
                                  </label>
                                  <input
                                    type="text"
                                    value={step.params.value || ""}
                                    placeholder="Text to type..."
                                    onChange={(e) => {
                                      const newSteps = [...editingFlow.steps];
                                      newSteps[idx].params.value =
                                        e.target.value;
                                      setEditingFlow({
                                        ...editingFlow,
                                        steps: newSteps,
                                      });
                                    }}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 outline-none font-mono"
                                  />
                                </div>
                              )}
                            </div>
                          )}

                          {step.type === "customSmartFetch" && (
                            <div className="space-y-3">
                              <div>
                                <label className="block text-xs text-zinc-500 mb-1.5">
                                  Target URL (Can use variables)
                                </label>
                                <input
                                  type="text"
                                  value={step.params.url || ""}
                                  placeholder="https://..."
                                  onChange={(e) => {
                                    const newSteps = [...editingFlow.steps];
                                    newSteps[idx].params.url = e.target.value;
                                    setEditingFlow({
                                      ...editingFlow,
                                      steps: newSteps,
                                    });
                                  }}
                                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 outline-none font-mono"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-zinc-500 mb-1.5">
                                  Evaluation Script (Returns Data)
                                </label>
                                <textarea
                                  value={step.params.code || ""}
                                  placeholder="return Array.from(document.querySelectorAll('a')).map(a => a.href);"
                                  onChange={(e) => {
                                    const newSteps = [...editingFlow.steps];
                                    newSteps[idx].params.code = e.target.value;
                                    setEditingFlow({
                                      ...editingFlow,
                                      steps: newSteps,
                                    });
                                  }}
                                  rows={5}
                                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:border-indigo-500 outline-none font-mono resize-y"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                    {/* Connecting lines */}
                    {editingFlow.steps.length > 1 && (
                      <div className="absolute left-8 top-8 bottom-8 w-px bg-zinc-800 z-0"></div>
                    )}

                    {editingFlow.steps.length === 0 && (
                      <div className="text-center p-8 border border-dashed border-zinc-800 rounded-xl text-zinc-500 text-sm">
                        No steps added yet. Click "Add Step" to begin.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Metadata Tab */}
              {editTab === "metadata" && (
                <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <MetadataEditor
                    metadata={editingFlow}
                    onChange={(key, val) => {
                      setEditingFlow({ ...editingFlow, [key]: val });
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-zinc-500">
            <ListTree size={48} className="mb-4 opacity-20" />
            <p>Select a flow to edit or create a new one.</p>
          </div>
        )}
      </div>
    </div>
  );
};
