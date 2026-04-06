import React, { useState, useEffect } from 'react';
import { Lock, Plus, Save, Trash2, KeyRound } from 'lucide-react';
import { useAppContext } from '../../../../context/AppContext';
import { ahk } from '../../../../lib/ahk';
import { Modal } from '../../../ui/Modal';
import { CustomSelect } from '../../../ui/CustomSelect';
import { addCredentialDB, deleteCredentialDB } from '../../../../lib/db';

export const SettingsPrivacyTab = () => {
  const {
    showCredModal, setShowCredModal,
    credentials, setCredentials,
    newCred, setNewCred,
    history, setHistory,
    isHistoryEnabled, setIsHistoryEnabled,
    plugins
  } = useAppContext();

  const [workspaces, setWorkspaces] = useState<string[]>([]);
  const [currentWs, setCurrentWs] = useState<string>('default');
  const [showWsModal, setShowWsModal] = useState(false);
  const [newWsName, setNewWsName] = useState('');

  useEffect(() => {
    try {
      const wsStr = ahk.call('ListWorkspaces');
      if (wsStr) {
        setWorkspaces(wsStr.split('|').filter(Boolean));
      } else {
        setWorkspaces(['default']);
      }
      const activeWs = ahk.call('GetCurrentWorkspace');
      if (activeWs) {
        setCurrentWs(activeWs);
      }
    } catch {
      setWorkspaces(['default']);
    }
  }, []);

  return (
    <>
      <div className="space-y-6 animate-in fade-in duration-300">
            <h3 className="text-xl font-medium text-[var(--theme-text-main)] mb-6 hidden md:block">Privacy & Data Management</h3>

            <div className="p-5 bg-[color-mix(in_srgb,var(--theme-text-main)_2%,transparent)] border border-[color-mix(in_srgb,var(--theme-border)_50%,transparent)] rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-medium text-[var(--theme-text-main)] flex items-center gap-2"><Lock size={16} className="text-[var(--theme-accent)]" /> Credential Manager</h3>
                  <p className="text-xs text-[var(--theme-text-sec)] mt-1">Manage logins for external sites (Auto-Login bypass).</p>
                </div>
                <button
                  onClick={() => setShowCredModal(true)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-[color-mix(in_srgb,var(--theme-accent)_20%,transparent)] text-[var(--theme-accent)] hover:bg-[color-mix(in_srgb,var(--theme-accent)_30%,transparent)] rounded-lg text-xs font-medium transition-colors"
                >
                  <Plus size={14} /> Add New
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                  {credentials.map(c => (
                    <div key={c.id} className="group relative flex justify-between items-center p-3.5 bg-[color-mix(in_srgb,var(--theme-text-main)_3%,transparent)] hover:bg-[color-mix(in_srgb,var(--theme-text-main)_6%,transparent)] border border-[color-mix(in_srgb,var(--theme-border)_50%,transparent)] rounded-xl transition-all">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-8 h-8 rounded bg-[color-mix(in_srgb,var(--theme-text-main)_5%,transparent)] flex items-center justify-center flex-shrink-0 text-[var(--theme-text-sec)]">
                          <KeyRound size={14} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[var(--theme-text-main)] truncate">{c.domain}</p>
                          <p className="text-xs text-[var(--theme-text-sec)] truncate">{c.username}</p>
                        </div>
                      </div>
                      <button
                        onClick={async () => {
                          await deleteCredentialDB(c.id);
                          setCredentials(credentials.filter(x => x.id !== c.id));
                        }}
                        className="opacity-0 group-hover:opacity-100 text-[var(--theme-text-sec)] hover:text-red-500 transition-all p-1.5 bg-[color-mix(in_srgb,var(--theme-text-main)_5%,transparent)] rounded-lg"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
                {credentials.length === 0 && (
                  <div className="text-xs text-[var(--theme-text-sec)] italic py-6 text-center bg-[color-mix(in_srgb,var(--theme-text-main)_2%,transparent)] rounded-xl border border-[color-mix(in_srgb,var(--theme-border)_30%,transparent)]">
                    <Lock size={24} className="mx-auto mb-2 opacity-20" />
                    No credentials saved.
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4 pt-4">
              <h3 className="text-sm font-medium text-[var(--theme-text-main)] flex items-center gap-2 uppercase tracking-wider"><Save size={16} className="text-[var(--theme-accent)]" /> System Cache & History</h3>

              <div className="p-5 bg-[color-mix(in_srgb,var(--theme-text-main)_2%,transparent)] border border-[color-mix(in_srgb,var(--theme-border)_50%,transparent)] rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-[var(--theme-text-main)]">History Tracking</h3>
                    <p className="text-xs text-[var(--theme-text-sec)] mt-1">Record sites visited and your activity locally.</p>
                  </div>
                  <button
                    onClick={() => setIsHistoryEnabled(!isHistoryEnabled)}
                    className={`w-12 h-6 rounded-full transition-colors relative ${isHistoryEnabled ? 'bg-emerald-500' : 'bg-[color-mix(in_srgb,var(--theme-text-main)_15%,transparent)]'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${isHistoryEnabled ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-[color-mix(in_srgb,var(--theme-border)_50%,transparent)] mt-4">
                  <div>
                    <h3 className="text-sm font-medium text-[var(--theme-text-main)]">Clear History</h3>
                    <p className="text-xs text-[var(--theme-text-sec)] mt-1">Deletes all recorded URLs.</p>
                  </div>
                  <button onClick={async () => { if (await (window as any).showConfirm('Clear browsing history?')) { setHistory([]); } }} className="px-3 py-1.5 bg-red-500/10 text-red-500 rounded hover:bg-red-500/20 text-xs font-medium transition-colors border border-red-500/20">Clear History</button>
                </div>
              </div>

              <div className="p-5 bg-[color-mix(in_srgb,var(--theme-text-main)_2%,transparent)] border border-[color-mix(in_srgb,var(--theme-border)_50%,transparent)] rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-[var(--theme-text-main)]">Active Workspace</h3>
                    <p className="text-xs text-[var(--theme-text-sec)] mt-1">You are currently using an isolated workspace save folder.</p>
                  </div>
                  <div className="flex gap-2 items-center">
                    <div className="w-[180px]">
                      <CustomSelect
                        options={workspaces.map(w => ({ value: w, label: w }))}
                        value={currentWs}
                        onChange={(val) => {
                          if (val) ahk.call('RestartWorkspace', val);
                        }}
                        searchable
                      />
                    </div>
                    <button onClick={() => setShowWsModal(true)} className="px-3 py-1.5 bg-[color-mix(in_srgb,var(--theme-accent)_20%,transparent)] text-[var(--theme-accent)] rounded hover:bg-[color-mix(in_srgb,var(--theme-accent)_30%,transparent)] text-xs font-medium transition-colors flex items-center gap-1">
                      <Plus size={14} /> New
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-5 bg-[color-mix(in_srgb,var(--theme-text-main)_2%,transparent)] border border-[color-mix(in_srgb,var(--theme-border)_50%,transparent)] rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-[var(--theme-text-main)]">Clear Runtime Data</h3>
                    <p className="text-xs text-[var(--theme-text-sec)] mt-1">Deletes all system cached objects created by plugins or scripts.</p>
                  </div>
                  <button
                    onClick={async () => {
                      if (await (window as any).showConfirm('Are you sure you want to clear all system cache?')) {
                        ahk.call('CacheClear');
                      }
                    }}
                    className="px-4 py-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 text-sm font-medium rounded-lg transition-colors border border-red-500/20"
                  >
                    Clear Cache
                  </button>
                </div>
              </div>
            </div>
          </div>

      <Modal isOpen={showCredModal} onClose={() => { setShowCredModal(false); setNewCred({ domain: '', username: '', password: '' }); }} title="Add Credential">
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-[var(--theme-text-sec)] mb-1.5">Domain or Plugin</label>
            <div className="flex gap-2 mb-2">
              <div className="flex-1 min-w-0">
                <CustomSelect
                  searchable
                  value=""
                  onChange={(val) => {
                    if (val) {
                      try { setNewCred({ ...newCred, domain: new URL(val).hostname }) } catch { setNewCred({ ...newCred, domain: val }) }
                    }
                  }}
                  options={[
                    { value: '', label: 'Select a known site...' },
                    ...plugins.map(p => ({ value: p.baseUrl, label: `${p.name} (${p.baseUrl})` }))
                  ]}
                />
              </div>
            </div>
            <input
              type="text" placeholder="Or type domain (e.g. netflix.com)"
              value={newCred.domain} onChange={e => setNewCred({ ...newCred, domain: e.target.value })}
              className="w-full bg-[color-mix(in_srgb,var(--theme-text-main)_3%,transparent)] border border-[color-mix(in_srgb,var(--theme-text-main)_15%,transparent)] rounded-lg px-3 py-2 text-sm text-[var(--theme-text-main)] focus:border-[var(--theme-accent)] outline-none placeholder:text-[var(--theme-text-sec)]"
            />
          </div>
          <div>
            <label className="block text-xs text-[var(--theme-text-sec)] mb-1.5">Username / Email</label>
            <input
              type="text" placeholder="user@email.com"
              value={newCred.username} onChange={e => setNewCred({ ...newCred, username: e.target.value })}
              className="w-full bg-[color-mix(in_srgb,var(--theme-text-main)_3%,transparent)] border border-[color-mix(in_srgb,var(--theme-text-main)_15%,transparent)] rounded-lg px-3 py-2 text-sm text-[var(--theme-text-main)] focus:border-[var(--theme-accent)] outline-none placeholder:text-[var(--theme-text-sec)]"
            />
          </div>
          <div>
            <label className="block text-xs text-[var(--theme-text-sec)] mb-1.5">Password</label>
            <input
              type="password" placeholder="••••••••"
              value={newCred.password} onChange={e => setNewCred({ ...newCred, password: e.target.value })}
              className="w-full bg-[color-mix(in_srgb,var(--theme-text-main)_3%,transparent)] border border-[color-mix(in_srgb,var(--theme-text-main)_15%,transparent)] rounded-lg px-3 py-2 text-sm text-[var(--theme-text-main)] focus:border-[var(--theme-accent)] outline-none placeholder:text-[var(--theme-text-sec)]"
            />
          </div>

          <div className="mt-6 flex justify-end pt-4 border-t border-[color-mix(in_srgb,var(--theme-border)_50%,transparent)]">
            <button
              onClick={async () => {
                if (newCred.domain && newCred.username && newCred.password) {
                  const encrypted = await ahk.asyncCall('EncryptCredential', newCred.password);
                  const credItem = {
                    id: Date.now().toString(),
                    domain: newCred.domain,
                    username: newCred.username,
                    passwordBase64: encrypted
                  };
                  await addCredentialDB(credItem);
                  setCredentials([...credentials, credItem]);
                  setNewCred({ domain: '', username: '', password: '' });
                  setShowCredModal(false);
                }
              }}
              className="px-4 py-2 bg-[var(--theme-accent)] hover:bg-[color-mix(in_srgb,var(--theme-accent)_80%,white)] text-white rounded-lg text-sm font-medium transition-colors w-full"
            >
              Save Credential
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showWsModal} onClose={() => { setShowWsModal(false); setNewWsName(''); }} title="Create New Workspace">
        <div className="space-y-4">
          <p className="text-xs text-[var(--theme-text-sec)]">A workspace perfectly isolates all your plugins, flows, bookmarks, and settings locally into a new directory.</p>
          <div>
            <label className="block text-xs text-[var(--theme-text-main)] mb-1.5">Workspace Name</label>
            <input
              type="text" value={newWsName} onChange={e => setNewWsName(e.target.value)}
              placeholder="e.g. testing-env, dev, clean-slate" autoFocus
              className="w-full bg-[color-mix(in_srgb,var(--theme-text-main)_3%,transparent)] border border-[color-mix(in_srgb,var(--theme-text-main)_15%,transparent)] rounded-lg px-3 py-2 text-sm text-[var(--theme-text-main)] focus:border-[var(--theme-accent)] outline-none"
              onKeyDown={e => {
                if (e.key === 'Enter' && newWsName.trim()) {
                  ahk.call('CreateWorkspace', newWsName.trim());
                  ahk.call('RestartWorkspace', newWsName.trim());
                }
              }}
            />
          </div>
          <div className="flex gap-3 justify-end pt-4 border-t border-[color-mix(in_srgb,var(--theme-border)_50%,transparent)] mt-4">
            <button onClick={() => { setShowWsModal(false); setNewWsName(''); }} className="px-4 py-2 text-sm font-medium text-[var(--theme-text-sec)] hover:text-[var(--theme-text-main)] transition-colors">Cancel</button>
            <button onClick={() => {
              if (newWsName.trim()) {
                ahk.call('CreateWorkspace', newWsName.trim());
                ahk.call('RestartWorkspace', newWsName.trim());
              }
            }} className="px-4 py-2 text-sm font-medium bg-[var(--theme-accent)] text-white rounded-lg transition-colors">Create & Switch</button>
          </div>
        </div>
      </Modal>
    </>
  );
};
