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

export const PluginTrackingTab: React.FC<TabProps> = ({ setIdeModalData, setIdeTempVal }) => {
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
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-medium text-emerald-400 flex items-center gap-2 uppercase tracking-wider">
                        <Activity size={16} /> Advanced Tracking Flows
                      </h3>
                      <button onClick={() => {
                        const flows = [...(editingPlugin.trackingFlows || [])];
                        flows.push({ id: 'flow_' + Date.now(), name: 'New Tracking Flow' });
                        updateEditingPlugin("root", "trackingFlows", flows);
                      }} className="bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 px-3 py-1 rounded-full text-xs transition-colors flex items-center gap-2">
                        <Plus size={14} /> Add Flow
                      </button>
                    </div>

                    {(editingPlugin.trackingFlows || []).map((flow, flowIdx) => (
                      <div key={flowIdx} className="p-5 bg-zinc-900/30 border border-zinc-800/50 rounded-xl space-y-4 relative group">
                        <button onClick={() => {
                          const flows = [...(editingPlugin.trackingFlows || [])];
                          flows.splice(flowIdx, 1);
                          updateEditingPlugin("root", "trackingFlows", flows);
                        }} className="absolute top-4 right-4 text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Trash2 size={16} />
                        </button>

                        <div className="grid grid-cols-4 gap-4 border-b border-zinc-800/50 pb-4">
                          <div>
                            <label className="block text-xs text-zinc-500 mb-1.5 flex justify-between">
                              <span>Flow ID</span>
                            </label>
                            <input type="text" value={flow.id || ""} onChange={(e) => {
                              const flows = [...(editingPlugin.trackingFlows || [])];
                              flows[flowIdx] = { ...flow, id: e.target.value };
                              updateEditingPlugin("root", "trackingFlows", flows);
                            }} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-emerald-500 outline-none" />
                          </div>
                          <div>
                            <label className="block text-xs text-zinc-500 mb-1.5">Flow Name</label>
                            <input type="text" value={flow.name || ""} onChange={(e) => {
                              const flows = [...(editingPlugin.trackingFlows || [])];
                              flows[flowIdx] = { ...flow, name: e.target.value };
                              updateEditingPlugin("root", "trackingFlows", flows);
                            }} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-emerald-500 outline-none" />
                          </div>
                          <div>
                            <div className="flex flex-col mb-1.5">
                              <label className="text-xs text-zinc-500">URL Pattern ({'{id}'})</label>
                              <span className="text-[9px] text-zinc-600">Template for custom tracking</span>
                            </div>
                            <input type="text" value={flow.urlPattern || ""} onChange={(e) => {
                              const flows = [...(editingPlugin.trackingFlows || [])];
                              flows[flowIdx] = { ...flow, urlPattern: e.target.value };
                              updateEditingPlugin("root", "trackingFlows", flows);
                            }} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-emerald-500 outline-none" placeholder="e.g. site.com/show/{id} OR /show/{id}" title="When a user tracks an `{id}`, the `{id}` parameter is cleanly injected into this full URL" />
                          </div>
                          <div>
                            <div className="flex flex-col mb-1.5">
                              <label className="text-xs text-zinc-500">Auto-Detect URL Regex</label>
                              <span className="text-[9px] text-zinc-600">Regex to match this media</span>
                            </div>
                            <input type="text" value={flow.urlRegex || ""} onChange={(e) => {
                              const flows = [...(editingPlugin.trackingFlows || [])];
                              flows[flowIdx] = { ...flow, urlRegex: e.target.value };
                              updateEditingPlugin("root", "trackingFlows", flows);
                            }} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-emerald-500 outline-none font-mono" placeholder="leave blank for default" title="Used to auto-detect if an unknown URL matches this specific Tracking Flow layout" />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs text-zinc-500 mb-1.5">List Selector</label>
                            <input type="text" value={flow.listSel || ""} placeholder=".episodes-list"
                              onChange={(e) => {
                                const flows = [...(editingPlugin.trackingFlows || [])];
                                flows[flowIdx] = { ...flow, listSel: e.target.value };
                                updateEditingPlugin("root", "trackingFlows", flows);
                              }}
                              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-emerald-500 outline-none font-mono" />
                          </div>
                          <div>
                            <label className="block text-xs text-zinc-500 mb-1.5">Episode Item Selector</label>
                            <input type="text" value={flow.itemSel || ""} placeholder=".ep-item"
                              onChange={(e) => {
                                const flows = [...(editingPlugin.trackingFlows || [])];
                                flows[flowIdx] = { ...flow, itemSel: e.target.value };
                                updateEditingPlugin("root", "trackingFlows", flows);
                              }}
                              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-emerald-500 outline-none font-mono" />
                          </div>
                        </div>

                        {[
                          { key: 'idExtractJs', label: 'ID Extract JS', placeholder: "return el.getAttribute('data-id');" },
                          { key: 'titleExtractJs', label: 'Title Extract JS', placeholder: "return el.textContent;" },
                          { key: 'urlExtractJs', label: 'URL Extract JS', placeholder: "return el.href;" },
                          { key: 'statusExtractJs', label: 'Status Extract JS', placeholder: "return 'released';" },
                        ].map(field => (
                          <div key={field.key}>
                            <div className="flex items-center justify-between mb-1.5">
                              <label className="block text-xs text-zinc-500">{field.label} (Executes on `el` element)</label>
                              <button onClick={() => {
                                const val = (flow as any)[field.key] || "";
                                setIdeTempVal(val);
                                setIdeModalData({
                                  title: field.label,
                                  value: val,
                                  mode: "javascript",
                                  onChange: (newVal) => {
                                    const flows = [...(editingPlugin.trackingFlows || [])];
                                    flows[flowIdx] = { ...flows[flowIdx], [field.key]: newVal };
                                    updateEditingPlugin("root", "trackingFlows", flows);
                                  }
                                });
                              }} className="text-[10px] bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 px-2 py-0.5 rounded transition-colors flex items-center gap-1">
                                <Code size={12} /> IDE Editor
                              </button>
                            </div>
                            <textarea
                              value={(flow as any)[field.key] || ""}
                              onChange={(e) => {
                                const flows = [...(editingPlugin.trackingFlows || [])];
                                flows[flowIdx] = { ...flows[flowIdx], [field.key]: e.target.value };
                                updateEditingPlugin("root", "trackingFlows", flows);
                              }}
                              rows={2} placeholder={field.placeholder}
                              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-emerald-500 outline-none font-mono resize-y"
                            />
                          </div>
                        ))}
                      </div>
                    ))}
                    {(!editingPlugin.trackingFlows || editingPlugin.trackingFlows.length === 0) && (
                      <div className="text-center py-8 text-zinc-500 text-sm border border-dashed border-zinc-800 rounded-xl">
                        No tracking flows configured. Add one to enable episode tracking for this plugin!
                      </div>
                    )}
                  </div>
                </div>
  );
};
