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
  Copy,
} from "lucide-react";
import { useAppContext } from "../../context/AppContext";
import { ahk } from "../../lib/ahk";
import { TooltipWrapper } from "../ui/TooltipWrapper";
import { CustomCheckbox } from "../ui/CustomCheckbox";
import { CustomSelect } from "../ui/CustomSelect";
import { SearchConfigEditor } from "./SearchConfigEditor";
import { TagsInput } from "../ui/TagsInput";
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
} from "../../types";

import { MetadataEditor } from "./MetadataEditor";

export const PluginsView = () => {
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
    testSearchQuery,
    setTestSearchQuery,
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

  const [editTab, setEditTab] = React.useState<
    "general" | "auth" | "search" | "media" | "functions" | "metadata"
  >("general");

  const [ideModalData, setIdeModalData] = React.useState<{
    title: string;
    value: string;
    mode: "javascript" | "css";
    onChange: (val: string) => void;
  } | null>(null);

  const [ideTempVal, setIdeTempVal] = React.useState("");

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* Plugins List */}
      <div className="w-1/4 min-w-[250px] border-r border-zinc-800/50 bg-zinc-950/50 p-6 overflow-y-auto no-scrollbar">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-light tracking-tight text-zinc-100 flex items-center gap-2">
              <Puzzle size={20} className="text-indigo-400" /> Site Plugins
            </h2>
            <p className="text-xs text-zinc-500 mt-1">
              Custom site integrations.
            </p>
          </div>
          <button
            onClick={() =>
              setEditingPlugin({ ...DEFAULT_PLUGIN, id: Date.now().toString() })
            }
            className="p-2 text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors"
          >
            <Plus size={18} />
          </button>
        </div>

        <div className="space-y-3">
          {plugins.map((plugin) => (
            <div
              key={plugin.id}
              onClick={() => {
                const safePlugin = {
                  ...DEFAULT_PLUGIN,
                  ...plugin,
                  search: {
                    ...DEFAULT_PLUGIN.search,
                    ...(plugin.search || {}),
                  },
                  additionalSearches: plugin.additionalSearches || [],
                  enabled: plugin.enabled !== false,
                };
                setEditingPlugin(safePlugin);
                setEditTab("general");
              }}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${editingPlugin?.id === plugin.id ? "bg-indigo-500/10 border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.05)]" : "bg-zinc-900/30 border-zinc-800/50 hover:border-zinc-700 hover:bg-zinc-900/50"}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {plugin.icon ? (
                    <div className="w-8 h-8 rounded-lg bg-zinc-800/80 flex items-center justify-center shrink-0 border border-zinc-700/50">
                      {plugin.icon.includes("<svg") ||
                        plugin.icon.includes("http") ? (
                        <div
                          className="w-4 h-4"
                          dangerouslySetInnerHTML={{
                            __html: plugin.icon.includes("<svg")
                              ? plugin.icon
                              : `<img src="${plugin.icon}" class="w-full h-full object-contain" />`,
                          }}
                        />
                      ) : (
                        <span className="text-sm">{plugin.icon}</span>
                      )}
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-zinc-800/80 flex items-center justify-center shrink-0 text-zinc-500 border border-zinc-700/50">
                      <Globe size={14} />
                    </div>
                  )}
                  <div>
                    <h3 className="text-sm font-medium text-zinc-200 leading-tight">
                      {plugin.name}
                    </h3>
                    <p className="text-xs text-zinc-500 mt-0.5 truncate">
                      {plugin.baseUrl.replace("https://", "")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <CustomCheckbox
                    checked={plugin.enabled !== false}
                    onChange={(val) => {
                      const updated = { ...plugin, enabled: val };
                      setPlugins(
                        plugins.map((p) => (p.id === plugin.id ? updated : p)),
                      );
                      const filename = `${updated.name.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_${updated.id}.json`;
                      ahk.call(
                        "SaveSite",
                        filename,
                        JSON.stringify(updated, null, 2),
                      );
                    }}
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deletePlugin(plugin);
                    }}
                    className="text-zinc-600 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {plugins.length === 0 && (
            <div className="text-center py-8 text-sm text-zinc-600">
              No plugins installed.
              <br />
              Create one or import from the sites folder.
            </div>
          )}
        </div>
      </div>

      {/* Plugin Editor */}
      <div className="flex-1 bg-zinc-950 p-6 overflow-y-auto no-scrollbar relative flex flex-col">
        {editingPlugin ? (
          <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-8 sticky top-0 bg-zinc-950 z-10 pb-4 border-b border-zinc-900">
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

            <div className="flex-1 pb-20 overflow-y-auto no-scrollbar pr-4">
              {editTab === "general" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-zinc-500 mb-1.5">
                        Site Name
                      </label>
                      <input
                        type="text"
                        value={editingPlugin.name}
                        onChange={(e) =>
                          updateEditingPlugin("root", "name", e.target.value)
                        }
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-500 mb-1.5">
                        Base URL
                      </label>
                      <input
                        type="text"
                        value={editingPlugin.baseUrl}
                        onChange={(e) =>
                          updateEditingPlugin("root", "baseUrl", e.target.value)
                        }
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 outline-none"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-6 pt-2">
                    <div>
                      <label className="block text-xs text-zinc-500 mb-1.5">
                        Tags (Grouping & Search Targeting)
                      </label>
                      <TagsInput
                        tags={editingPlugin.tags || []}
                        onChange={(newTags) =>
                          updateEditingPlugin("root", "tags", newTags)
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1.5">
                      Network Blockers
                    </label>
                    <TagsInput
                      tags={editingPlugin.networkBlockers || []}
                      onChange={(newTags) =>
                        updateEditingPlugin("root", "networkBlockers", newTags)
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1.5">
                      Inline Script Blockers
                    </label>
                    <TagsInput
                      tags={editingPlugin.inlineBlockers || []}
                      onChange={(newTags) =>
                        updateEditingPlugin("root", "inlineBlockers", newTags)
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1.5">
                      Redirect Blockers
                    </label>
                    <TagsInput
                      tags={editingPlugin.redirectBlockers || []}
                      onChange={(newTags) =>
                        updateEditingPlugin("root", "redirectBlockers", newTags)
                      }
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs text-zinc-500">
                        Custom CSS
                      </label>
                      <button
                        onClick={() => {
                          setIdeTempVal(editingPlugin.customCss || "");
                          setIdeModalData({
                            title: "Custom CSS",
                            value: editingPlugin.customCss || "",
                            mode: "css",
                            onChange: (val) => updateEditingPlugin("root", "customCss", val)
                          });
                        }}
                        className="text-[10px] bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 px-2 py-0.5 rounded transition-colors flex items-center gap-1"
                      >
                        <Code size={12} /> IDE Editor
                      </button>
                    </div>
                    <textarea
                      value={editingPlugin.customCss || ""}
                      onChange={(e) =>
                        updateEditingPlugin("root", "customCss", e.target.value)
                      }
                      rows={4}
                      placeholder="body { background: #000; }"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 outline-none font-mono resize-y"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs text-zinc-500">
                        Custom JS (Runs on load)
                      </label>
                      <button
                        onClick={() => {
                          setIdeTempVal(editingPlugin.customJs || "");
                          setIdeModalData({
                            title: "Custom JS",
                            value: editingPlugin.customJs || "",
                            mode: "javascript",
                            onChange: (val) => updateEditingPlugin("root", "customJs", val)
                          });
                        }}
                        className="text-[10px] bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 px-2 py-0.5 rounded transition-colors flex items-center gap-1"
                      >
                        <Code size={12} /> IDE Editor
                      </button>
                    </div>
                    <textarea
                      value={editingPlugin.customJs || ""}
                      onChange={(e) =>
                        updateEditingPlugin("root", "customJs", e.target.value)
                      }
                      rows={4}
                      placeholder="console.log('Site loaded');"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 outline-none font-mono resize-y"
                    />
                  </div>
                </div>
              )}

              {/* Authentication Flow */}
              {editTab === "auth" && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <h3 className="text-sm font-medium text-indigo-400 flex items-center gap-2 uppercase tracking-wider">
                    <KeyRound size={16} /> Authentication Flow
                  </h3>
                  <div className="p-5 bg-zinc-900/30 border border-zinc-800/50 rounded-xl space-y-4">
                    <div>
                      <label className="block text-xs text-zinc-500 mb-1.5">
                        Login URL
                      </label>
                      <input
                        type="text"
                        value={editingPlugin.auth.loginUrl}
                        placeholder="https://site.com/login"
                        onChange={(e) =>
                          updateEditingPlugin(
                            "auth",
                            "loginUrl",
                            e.target.value,
                          )
                        }
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs text-zinc-500 mb-1.5">
                          Username Selector
                        </label>
                        <input
                          type="text"
                          value={editingPlugin.auth.userSel}
                          placeholder="input[name='user']"
                          onChange={(e) =>
                            updateEditingPlugin(
                              "auth",
                              "userSel",
                              e.target.value,
                            )
                          }
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 outline-none font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-zinc-500 mb-1.5">
                          Password Selector
                        </label>
                        <input
                          type="text"
                          value={editingPlugin.auth.passSel}
                          placeholder="input[name='pass']"
                          onChange={(e) =>
                            updateEditingPlugin(
                              "auth",
                              "passSel",
                              e.target.value,
                            )
                          }
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 outline-none font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-zinc-500 mb-1.5">
                          Submit Selector
                        </label>
                        <input
                          type="text"
                          value={editingPlugin.auth.submitSel}
                          placeholder="button[type='submit']"
                          onChange={(e) =>
                            updateEditingPlugin(
                              "auth",
                              "submitSel",
                              e.target.value,
                            )
                          }
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 outline-none font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Search Parsing */}
              {editTab === "search" && (
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
              )}

              {/* Details Parsing */}
              {editTab === "media" && (
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
              )}

              {/* Player & Styling */}
              {editTab === "functions" && (
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
              )}

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
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-zinc-500">
            <Puzzle size={48} className="mb-4 opacity-20" />
            <p>Select a plugin to edit or create a new one.</p>
          </div>
        )}
      </div>

      {/* IDE Modal */}
      {ideModalData && (
        <Modal
          isOpen={!!ideModalData}
          onClose={() => setIdeModalData(null)}
          title={ideModalData.title}
          width="max-w-4xl"
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

    </div>
  );
};
