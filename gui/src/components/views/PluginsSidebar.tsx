import React from "react";
import { Puzzle, Store, RefreshCw, Globe, Trash2, Plus } from "lucide-react";
import { useAppContext } from "../../context/AppContext";
import { CustomCheckbox } from "../ui/CustomCheckbox";
import { ahk } from "../../lib/ahk";
import { DEFAULT_PLUGIN } from "../../types";

let pluginsSidebarScrollPos = 0;

interface PluginsSidebarProps {
  viewMode: "editor" | "gallery";
  setViewMode: (mode: "editor" | "gallery") => void;
}

export const PluginsSidebar: React.FC<PluginsSidebarProps> = ({ viewMode, setViewMode }) => {
  const {
    plugins,
    setPlugins,
    editingPlugin,
    setEditingPlugin,
    deletePlugin,
    pluginUpdateCount,
    checkPluginUpdates,
  } = useAppContext();

  const sidebarScrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (sidebarScrollRef.current) sidebarScrollRef.current.scrollTop = pluginsSidebarScrollPos;
  }, [viewMode, editingPlugin]);

  return (
    <div
      ref={sidebarScrollRef}
      onScroll={(e) => (pluginsSidebarScrollPos = e.currentTarget.scrollTop)}
      className="w-1/4 min-w-[250px] border-r border-zinc-800/50 bg-zinc-950/50 p-6 overflow-y-auto no-scrollbar"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-light tracking-tight text-zinc-100 flex items-center gap-2">
            <Puzzle size={20} className="text-indigo-400" /> Site Plugins
          </h2>
          <p className="text-xs text-zinc-500 mt-1">Custom site integrations.</p>
        </div>
        <button
          onClick={() => {
            setEditingPlugin({ ...DEFAULT_PLUGIN, id: Date.now().toString() });
            setViewMode("editor");
          }}
          className="p-2 text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors"
        >
          <Plus size={18} />
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => {
            setViewMode(viewMode === "gallery" ? "editor" : "gallery");
            setEditingPlugin(null);
          }}
          className={`flex-1 py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-sm font-medium transition-all ${
            viewMode === "gallery"
              ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
              : "bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20"
          }`}
        >
          <Store size={16} /> Browse Gallery
          {pluginUpdateCount > 0 && (
            <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">
              {pluginUpdateCount}
            </span>
          )}
        </button>
        <button
          onClick={() => checkPluginUpdates()}
          title="Check for Updates"
          className="w-10 rounded-xl flex items-center justify-center text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 transition-colors shrink-0"
        >
          <RefreshCw size={16} />
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
              // Edit tab state is managed in PluginEditor now
              setViewMode("editor");
            }}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              editingPlugin?.id === plugin.id
                ? "bg-indigo-500/10 border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.05)]"
                : "bg-zinc-900/30 border-zinc-800/50 hover:border-zinc-700 hover:bg-zinc-900/50"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {plugin.icon ? (
                  <div className="w-8 h-8 rounded-lg bg-zinc-900/40 flex items-center justify-center shrink-0 border border-zinc-700/50">
                    {plugin.icon.includes("<svg") || plugin.icon.includes("http") ? (
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
                  <div className="w-8 h-8 rounded-lg bg-zinc-900/40 flex items-center justify-center shrink-0 text-zinc-500 border border-zinc-700/50">
                    <Globe size={14} />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-medium text-zinc-200 leading-tight truncate">
                    {plugin.name}
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5 truncate">
                    {plugin.baseUrl.replace("https://", "")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <CustomCheckbox
                  checked={plugin.enabled !== false}
                  onChange={(val) => {
                    const updated = { ...plugin, enabled: val };
                    setPlugins(plugins.map((p) => (p.id === plugin.id ? updated : p)));
                    const filename = `${updated.name
                      .replace(/[^a-z0-9]/gi, "_")
                      .toLowerCase()}_${updated.id}.json`;
                    ahk.call("SaveSite", filename, JSON.stringify(updated, null, 2));
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
  );
};
