import React from "react";
import { Store, Globe, RefreshCw, Square, Puzzle, DownloadCloud, CheckCircle2, Package } from "lucide-react";
import { useAppContext } from "../../context/AppContext";
import { ahk } from "../../lib/ahk";
import { RepoManifest, RepoPack } from "../../types";

let pluginsGalleryScrollPos = 0;

export const PluginGallery: React.FC = () => {
  const { pluginRepoUrl, plugins, loadPlugins } = useAppContext();
  
  const [repoData, setRepoData] = React.useState<RepoManifest | null>(null);
  const [isRepoLoading, setIsRepoLoading] = React.useState(false);
  const [installingItems, setInstallingItems] = React.useState<string[]>([]);
  const [repoTab, setRepoTab] = React.useState<"plugins" | "packs">("plugins");
  
  const galleryScrollRef = React.useRef<HTMLDivElement>(null);

  const loadRepo = () => {
    if (!pluginRepoUrl) return;
    setIsRepoLoading(true);
    setTimeout(() => {
      try {
        const result = ahk.call("RawFetchHTML", pluginRepoUrl);
        if (result) {
          setRepoData(JSON.parse(result));
        }
      } catch (e) {
        console.error("Failed to load repo:", e);
      }
      setIsRepoLoading(false);
    }, 100);
  };

  React.useEffect(() => {
    if (!repoData) {
      loadRepo();
    }
  }, [pluginRepoUrl]);

  React.useEffect(() => {
    if (galleryScrollRef.current) galleryScrollRef.current.scrollTop = pluginsGalleryScrollPos;
  }, []);

  const handleInstallPluginZip = (zipUrl: string, itemId: string) => {
    setInstallingItems((prev) => [...prev, itemId]);
    setTimeout(() => {
      const success = ahk.call("InstallExtensionZip", zipUrl, "sites");
      if (success === "true" || success === true || success === 1) {
        loadPlugins();
      } else {
        (window as any).showToast("Failed to install plugin from: " + zipUrl, "error");
      }
      setInstallingItems((prev) => prev.filter((i) => i !== itemId));
    }, 100);
  };

  const handleInstallPack = (pack: RepoPack) => {
    if (!repoData) return;
    setInstallingItems((prev) => [...prev, pack.id]);
    setTimeout(() => {
      let failCount = 0;
      pack.plugins.forEach(pId => {
        const rp = repoData.plugins.find(p => p.id === pId);
        if (rp && rp.zipUrl) {
          const success = ahk.call("InstallExtensionZip", rp.zipUrl, "sites");
          if (success !== "true" && success !== true && success !== 1) {
            failCount++;
          }
        }
      });
      if (failCount > 0) (window as any).showToast("Failed to install " + failCount + " plugins from pack.", "error");
      loadPlugins();
      setInstallingItems((prev) => prev.filter((i) => i !== pack.id));
    }, 100);
  };

  return (
    <div className="max-w-6xl mx-auto w-full flex-1 flex flex-col animate-in fade-in zoom-in-95 duration-300">
      <div className="flex items-center justify-between mb-8 pHeader bg-zinc-950 z-10 pb-4 border-b border-zinc-900">
        <div>
          <h2 className="text-3xl font-light tracking-tight text-white flex items-center gap-3">
            <Store size={28} className="text-indigo-400" /> BingeKit Plugin Gallery
          </h2>
          <p className="text-sm text-zinc-400 mt-1.5 flex items-center gap-2">
            <Globe size={14} /> Fetching from: <span className="font-mono text-zinc-500">{pluginRepoUrl || 'about:config'}</span>
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={loadRepo}
            className="p-2 text-zinc-400 hover:text-zinc-200 transition-colors bg-zinc-900 rounded-lg"
            title="Refresh Repository"
          >
            <RefreshCw size={18} className={isRepoLoading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      <div className="flex gap-2 border-b border-zinc-800/50 mb-6 overflow-x-auto no-scrollbar shrink-0">
        <button
          onClick={() => setRepoTab("plugins")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${repoTab === "plugins" ? "border-indigo-500 text-indigo-400 bg-indigo-500/5" : "border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/30"}`}
        >
          <Puzzle size={16} /> Individual Plugins
        </button>
        <button
          onClick={() => setRepoTab("packs")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${repoTab === "packs" ? "border-indigo-500 text-indigo-400 bg-indigo-500/5" : "border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/30"}`}
        >
          <Package size={16} /> Plugin Packs
        </button>
      </div>

      <div
        ref={galleryScrollRef}
        onScroll={(e) => pluginsGalleryScrollPos = e.currentTarget.scrollTop}
        className="flex-1 pb-20 overflow-y-auto no-scrollbar pr-4"
      >
        {isRepoLoading && !repoData ? (
          <div className="flex flex-col items-center justify-center py-20 text-indigo-400">
            <RefreshCw size={32} className="animate-spin mb-4" />
            <p>Loading Repository Manifest...</p>
          </div>
        ) : !repoData ? (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
            <Square size={48} className="mb-4 opacity-20" />
            <p>Failed to load repository manifest. Check URL in about:config or your network.</p>
          </div>
        ) : repoTab === "plugins" ? (
          <div className="grid grid-cols-2 gap-4">
            {repoData.plugins?.map(p => {
              const localMatch = plugins.find(lp => lp.id === p.id);
              const isInstalled = !!localMatch;
              const hasUpdateUrl = !!p.zipUrl;
              const canUpdate = isInstalled && hasUpdateUrl && localMatch.version && p.version && localMatch.version !== p.version;
              const isInstalling = installingItems.includes(p.id);

              return (
                <div key={p.id} className="p-5 bg-zinc-900/40 border border-zinc-800 rounded-2xl flex flex-col hover:border-indigo-500/50 hover:bg-zinc-900/80 transition-all shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl bg-zinc-900/40 flex items-center justify-center shrink-0 border border-zinc-700/50 shadow-inner overflow-hidden">
                      {p.icon && p.icon.includes("<svg") ? (
                        <div className="w-8 h-8 text-zinc-300" dangerouslySetInnerHTML={{ __html: p.icon }} />
                      ) : p.icon && p.icon.includes("http") ? (
                        <img src={p.icon} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Puzzle size={24} className="text-zinc-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
                        {p.name}
                        {isInstalled && <span className="px-1.5 py-0.5 bg-green-500/10 text-green-400 rounded text-[10px] uppercase font-bold tracking-wider">Installed</span>}
                      </h3>
                      <p className="text-xs text-indigo-300 mt-1 tracking-wide font-medium">{p.id} • v{p.version}</p>
                    </div>
                    <div>
                      {isInstalling ? (
                        <button disabled className="bg-indigo-500/20 text-indigo-400 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
                          <RefreshCw size={16} className="animate-spin" /> Installing...
                        </button>
                      ) : canUpdate ? (
                        <button onClick={() => p.zipUrl && handleInstallPluginZip(p.zipUrl, p.id)} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all">
                          <DownloadCloud size={16} /> Update (v{p.version})
                        </button>
                      ) : !isInstalled ? (
                        <button onClick={() => p.zipUrl && handleInstallPluginZip(p.zipUrl, p.id)} className="bg-white hover:bg-zinc-200 text-black px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all">
                          <DownloadCloud size={16} /> Install
                        </button>
                      ) : (
                        <button disabled className="bg-zinc-800/50 text-zinc-500 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 border border-zinc-700/50">
                          <CheckCircle2 size={16} /> Up to Date
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-zinc-400 mt-4 leading-relaxed line-clamp-2">{p.description}</p>
                  <div className="mt-auto pt-4 flex items-center gap-2">
                    {p.tags?.map(t => <span key={t} className="text-[10px] bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-full border border-zinc-700/50">{t}</span>)}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="space-y-4">
            {repoData.packs?.map(pack => {
              const isInstalling = installingItems.includes(pack.id);
              return (
                <div key={pack.id} className="p-6 bg-gradient-to-br from-indigo-500/10 to-transparent border border-indigo-500/20 rounded-2xl flex items-center justify-between gap-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                  <div className="flex-1 relative z-10">
                    <h3 className="text-lg font-bold text-indigo-300 flex items-center gap-2 mb-1">
                      <Package size={20} /> {pack.name}
                    </h3>
                    <p className="text-sm text-zinc-400 mb-3">{pack.description}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {pack.plugins.map(pId => {
                        const rp = repoData.plugins.find(p => p.id === pId);
                        return <span key={pId} className="text-[10px] bg-indigo-500/10 text-indigo-200 px-2 py-1 rounded-md border border-indigo-500/20">{rp?.name || pId}</span>
                      })}
                    </div>
                  </div>
                  <div className="relative z-10 shrink-0">
                    {isInstalling ? (
                      <button disabled className="bg-indigo-500/20 text-indigo-400 px-6 py-3 rounded-xl text-sm font-bold flex items-center gap-2">
                        <RefreshCw size={18} className="animate-spin" /> Installing Pack...
                      </button>
                    ) : (
                      <button onClick={() => handleInstallPack(pack)} className="bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 px-6 py-3 rounded-xl text-sm font-bold flex items-center gap-2 transition-transform hover:scale-105 active:scale-95">
                        <DownloadCloud size={18} /> Install Pack
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  );
};
