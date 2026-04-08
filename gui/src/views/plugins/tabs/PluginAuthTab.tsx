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

export const PluginAuthTab: React.FC<TabProps> = ({ setIdeModalData, setIdeTempVal }) => {
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
                        placeholder="https://site.com/login OR /login"
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
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs text-zinc-500">
                          Dynamic Login URL JS (Optional)
                        </label>
                        <button
                          onClick={() => {
                            setIdeTempVal(editingPlugin.auth.loginUrlJs || "");
                            setIdeModalData({
                              title: "Dynamic Login URL JS",
                              value: editingPlugin.auth.loginUrlJs || "",
                              mode: "javascript",
                              onChange: (val) => updateEditingPlugin("auth", "loginUrlJs", val)
                            });
                          }}
                          className="text-[10px] bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 px-2 py-0.5 rounded transition-colors flex items-center gap-1"
                        >
                          <Code size={12} /> IDE Editor
                        </button>
                      </div>
                      <p className="text-[10px] text-zinc-500 mb-2">Evaluates on Base URL to dynamically return a login URL (useful if login URLs change often). e.g. <code className="bg-zinc-800 px-1 rounded">return document.querySelector('#login-link').href;</code></p>
                      <textarea
                        value={editingPlugin.auth.loginUrlJs || ""}
                        placeholder="return 'https://...';"
                        onChange={(e) =>
                          updateEditingPlugin(
                            "auth",
                            "loginUrlJs",
                            e.target.value,
                          )
                        }
                        rows={2}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 outline-none font-mono resize-y"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs text-zinc-500">
                          Check Auth JS (Returns true if logged in)
                        </label>
                        <button
                          onClick={() => {
                            setIdeTempVal(editingPlugin.auth.checkAuthJs || "");
                            setIdeModalData({
                              title: "Check Auth JS",
                              value: editingPlugin.auth.checkAuthJs || "",
                              mode: "javascript",
                              onChange: (val) => updateEditingPlugin("auth", "checkAuthJs", val)
                            });
                          }}
                          className="text-[10px] bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 px-2 py-0.5 rounded transition-colors flex items-center gap-1"
                        >
                          <Code size={12} /> IDE Editor
                        </button>
                      </div>
                      <textarea
                        value={editingPlugin.auth.checkAuthJs || ""}
                        placeholder="return !!document.querySelector('.user-profile');"
                        onChange={(e) =>
                          updateEditingPlugin(
                            "auth",
                            "checkAuthJs",
                            e.target.value,
                          )
                        }
                        rows={2}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 outline-none font-mono resize-y"
                      />
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <CustomCheckbox
                        checked={!!editingPlugin.auth.checkAuthOnSearch}
                        onChange={(c) =>
                          updateEditingPlugin("auth", "checkAuthOnSearch", c)
                        }
                      />
                      <div className="flex flex-col">
                        <label className="text-xs text-zinc-300">
                          Check Login Status from Search URL
                        </label>
                        <span className="text-[10px] text-zinc-500">
                           If enabled, avoids a separate pre-flight background fetch request to the base URL and evaluates the above Javascript directly on the requested Search URL.
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs text-zinc-500">
                          Custom Login JS Override
                        </label>
                        <button
                          onClick={() => {
                            setIdeTempVal(editingPlugin.auth.customLoginJs || "");
                            setIdeModalData({
                              title: "Custom Login JS",
                              value: editingPlugin.auth.customLoginJs || "",
                              mode: "javascript",
                              onChange: (val) => updateEditingPlugin("auth", "customLoginJs", val)
                            });
                          }}
                          className="text-[10px] bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 px-2 py-0.5 rounded transition-colors flex items-center gap-1"
                        >
                          <Code size={12} /> IDE Editor
                        </button>
                      </div>
                      <p className="text-[10px] text-zinc-500 mb-2">Bypasses default selectors. Receives <code className="bg-zinc-800 px-1 rounded">{'{username}'}</code> and <code className="bg-zinc-800 px-1 rounded">{'{password}'}</code> placeholders in code.</p>
                      <textarea
                        value={editingPlugin.auth.customLoginJs || ""}
                        placeholder={`document.querySelector('#u').value = '{username}';\ndocument.querySelector('#p').value = '{password}';\ndocument.querySelector('#btn').click();`}
                        onChange={(e) =>
                          updateEditingPlugin(
                            "auth",
                            "customLoginJs",
                            e.target.value,
                          )
                        }
                        rows={4}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 outline-none font-mono resize-y"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-500 mb-1.5 flex items-center gap-2">
                        Captcha / Bot Verification Selector
                      </label>
                      <p className="text-[10px] text-zinc-500 mb-2">CSS Selector. If present during login, the hidden SmartFetch browser will automatically show so the user can manually solve it.</p>
                      <input
                        type="text"
                        value={editingPlugin.auth.captchaSel || ""}
                        placeholder="#captcha, .g-recaptcha"
                        onChange={(e) =>
                          updateEditingPlugin(
                            "auth",
                            "captchaSel",
                            e.target.value,
                          )
                        }
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-500 mb-1.5 flex items-center gap-2">
                        Interstitial Bypass Selector (Optional)
                      </label>
                      <p className="text-[10px] text-zinc-500 mb-2">CSS Selector for buttons like "Not Now" or "Skip" to bypass OAUTH ad-screens. E.g. <code className="bg-zinc-800 px-1 rounded">#skip-button</code>. Adds to default heuristics.</p>
                      <input
                        type="text"
                        value={editingPlugin.auth.skipSel || ""}
                        placeholder="a#skip, button.dismiss..."
                        onChange={(e) =>
                          updateEditingPlugin(
                            "auth",
                            "skipSel",
                            e.target.value,
                          )
                        }
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 outline-none font-mono"
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
  );
};
