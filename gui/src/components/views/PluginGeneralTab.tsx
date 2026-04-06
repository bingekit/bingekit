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

export const PluginGeneralTab: React.FC<TabProps> = ({ setIdeModalData, setIdeTempVal }) => {
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
                    <label className="block text-xs text-zinc-500 mb-1.5 flex items-center gap-2">
                      Element Blockers (CSS Selectors)
                    </label>
                    <p className="text-[10px] text-zinc-500 mb-2">Comma separated CSS selectors (e.g. <code className="bg-zinc-800 px-1 rounded">iframe, .ad-banner, #popup</code>). Matching elements are instantly removed from the DOM via MutationObserver.</p>
                    <textarea
                      value={editingPlugin.elementBlockers || ""}
                      placeholder="iframe, .ad-container..."
                      onChange={(e) =>
                        updateEditingPlugin(
                          "root",
                          "elementBlockers",
                          e.target.value
                        )
                      }
                      rows={2}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 outline-none font-mono resize-y"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1.5">
                      Site-Specific Blocked Download Extensions
                    </label>
                    <p className="text-[10px] text-zinc-600 mb-2">Block unwanted downloads specifically from this site. (e.g. .exe, .msi, .bat)</p>
                    <TagsInput
                      tags={editingPlugin.blockedExts || []}
                      onChange={(newTags) =>
                        updateEditingPlugin("root", "blockedExts", newTags)
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
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs text-zinc-500">
                        Bot/Captcha Check JS (SmartFetch bypass)
                      </label>
                      <button
                        onClick={() => {
                          setIdeTempVal(editingPlugin.botCheckJs || "");
                          setIdeModalData({
                            title: "Bot Check JS",
                            value: editingPlugin.botCheckJs || "",
                            mode: "javascript",
                            onChange: (val) => updateEditingPlugin("root", "botCheckJs", val)
                          });
                        }}
                        className="text-[10px] bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 px-2 py-0.5 rounded transition-colors flex items-center gap-1"
                      >
                        <Code size={12} /> IDE Editor
                      </button>
                    </div>
                    <p className="text-[10px] text-zinc-600 mb-2">Evaluated regularly in background. Return <code className="bg-zinc-800 px-1 rounded">true</code> if a bot check is detected to auto-reveal the hidden SmartFetch window for manual intervention.</p>
                    <textarea
                      value={editingPlugin.botCheckJs || ""}
                      onChange={(e) =>
                        updateEditingPlugin("root", "botCheckJs", e.target.value)
                      }
                      rows={2}
                      placeholder="return !!document.querySelector('.cf-browser-verification');"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 outline-none font-mono resize-y"
                    />
                  </div>
                </div>
  );
};
