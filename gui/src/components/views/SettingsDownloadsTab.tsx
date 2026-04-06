import React from 'react';
import { Download } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { ahk } from '../../lib/ahk';
import { TagsInput } from '../ui/TagsInput';

export const SettingsDownloadsTab = () => {
  const { downloadsLoc, downloadsTemp, ffmpegStatusApp, setFfmpegStatusApp, blockedExts, setBlockedExts } = useAppContext();

  return (
    <>
      <div className="space-y-6 animate-in fade-in duration-300">
            <h3 className="text-xl font-medium text-[var(--theme-text-main)] mb-6 hidden md:block">Downloads & Media</h3>

            <div className="p-5 bg-[color-mix(in_srgb,var(--theme-text-main)_2%,transparent)] border border-[color-mix(in_srgb,var(--theme-border)_50%,transparent)] rounded-2xl space-y-5">
              <h3 className="text-sm font-medium text-[var(--theme-text-main)] flex items-center gap-2"><Download size={16} className="text-[var(--theme-accent)]" /> Storage Paths</h3>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-[var(--theme-text-main)]">Downloads Folder</h4>
                  <p className="text-xs text-[var(--theme-text-sec)] mt-1 cursor-pointer hover:text-[var(--theme-accent)] transition-colors truncate max-w-[300px] md:max-w-md" onClick={() => { try { ahk.call('PromptSelectFolder', 'downloadsLoc'); } catch (e) { } }}>{downloadsLoc || 'Not Set'}</p>
                </div>
                <button type="button" onClick={() => { try { ahk.call('PromptSelectFolder', 'downloadsLoc'); } catch (e) { } }} className="px-4 py-2 bg-[color-mix(in_srgb,var(--theme-text-main)_8%,transparent)] text-[var(--theme-text-main)] rounded-lg text-xs hover:bg-[color-mix(in_srgb,var(--theme-text-main)_12%,transparent)] transition-colors">Change</button>
              </div>

              <div className="flex items-center justify-between mt-4">
                <div>
                  <h4 className="text-sm font-medium text-[var(--theme-text-main)]">Temporary Muxing Location</h4>
                  <p className="text-xs text-[var(--theme-text-sec)] mt-1 cursor-pointer hover:text-[var(--theme-accent)] transition-colors truncate max-w-[300px] md:max-w-md" onClick={() => { try { ahk.call('PromptSelectFolder', 'downloadsTemp'); } catch (e) { } }}>{downloadsTemp || 'Not Set'}</p>
                </div>
                <button type="button" onClick={() => { try { ahk.call('PromptSelectFolder', 'downloadsTemp'); } catch (e) { } }} className="px-4 py-2 bg-[color-mix(in_srgb,var(--theme-text-main)_8%,transparent)] text-[var(--theme-text-main)] rounded-lg text-xs hover:bg-[color-mix(in_srgb,var(--theme-text-main)_12%,transparent)] transition-colors">Change</button>
              </div>
            </div>

            <div className="p-5 bg-[color-mix(in_srgb,var(--theme-text-main)_2%,transparent)] border border-[color-mix(in_srgb,var(--theme-border)_50%,transparent)] rounded-2xl flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-[var(--theme-text-main)]">FFmpeg Stream Engine</h4>
                <div className="flex items-center gap-2 mt-1">
                  <div className={`w-2 h-2 rounded-full ${ffmpegStatusApp === 'installed' ? 'bg-emerald-500' : (ffmpegStatusApp === 'missing' ? 'bg-red-500' : 'bg-yellow-500 animate-pulse')}`} />
                  <p className="text-xs text-[var(--theme-text-sec)]">{ffmpegStatusApp === 'installed' ? 'Installed and ready' : (ffmpegStatusApp === 'missing' ? 'Not installed' : 'Checking...')}</p>
                </div>
              </div>
              <button type="button" onClick={() => { try { ahk.call('EnsureFFmpeg', true); setTimeout(() => setFfmpegStatusApp(ahk.call('CheckFFmpegStatus') || 'missing'), 3000); } catch (e) { } }} className="px-4 py-2 bg-[color-mix(in_srgb,var(--theme-text-main)_8%,transparent)] text-[var(--theme-text-main)] rounded-lg text-xs hover:bg-[color-mix(in_srgb,var(--theme-text-main)_12%,transparent)] transition-colors">
                {ffmpegStatusApp === 'installed' ? 'Reinstall' : 'Install FFmpeg'}
              </button>
            </div>

            <div className="p-5 bg-[color-mix(in_srgb,var(--theme-text-main)_2%,transparent)] border border-[color-mix(in_srgb,var(--theme-border)_50%,transparent)] rounded-2xl">
              <label className="block text-sm font-medium text-[var(--theme-text-main)] mb-1.5">Global Blocked Extensions</label>
              <p className="text-xs text-[var(--theme-text-sec)] mb-4">These extensions will be blocked regardless of site. (e.g. .exe, .msi, .bat)</p>
              <TagsInput tags={blockedExts} onChange={setBlockedExts} />
            </div>
          </div>
    </>
  );
};
