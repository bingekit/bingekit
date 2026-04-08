import React, { useEffect, useState, useRef } from 'react';
import { Download, Play, Pause, FileVideo, HardDrive, Trash2, FolderOpen, X, Edit2, Volume2, VolumeX, Maximize, Subtitles, FileIcon } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { ahk } from '../lib/ahk';

let downloadsScrollPos = 0;

const formatDownloadDate = (timeStr: string) => {
  if (!timeStr || timeStr.length < 14) return "";
  const y = timeStr.slice(0, 4);
  const m = timeStr.slice(4, 6);
  const d = timeStr.slice(6, 8);
  return `${y}-${m}-${d}`;
};

const DownloadItem = ({ f, isActive, onPlay, onRename, onDelete, onReveal }: any) => {
  const [duration, setDuration] = useState("");
  const isSub = f.name.match(/\.(vtt|srt|ass)$/i);
  const isMedia = f.name.match(/\.(mp4|mkv|avi|webm|mov|flv|wmv|m4v)$/i);

  useEffect(() => {
    if (!isSub && isMedia) {
      const vid = document.createElement('video');
      vid.src = `http://downloads.localhost/${encodeURIComponent(f.name)}`;
      vid.onloadedmetadata = () => {
        const d = vid.duration;
        if (!isNaN(d) && d > 0) {
          const hours = Math.floor(d / 3600);
          const mins = Math.floor((d % 3600) / 60);
          const secs = Math.floor(d % 60);
          const formatted = hours > 0
            ? `${hours}:${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`
            : `${mins}:${secs < 10 ? '0' : ''}${secs}`;
          setDuration(formatted);
        }
      };
    }
  }, [f.name, isSub]);

  return (
    <div className={`group flex items-center justify-between p-3 rounded-xl border transition-all ${isMedia ? 'cursor-pointer' : ''} ${isActive ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-zinc-900/30 border-zinc-800/50 hover:bg-zinc-900/80 hover:border-zinc-700'}`} onClick={() => { if (isMedia) onPlay(f.path); }}>
      <div className="flex items-center gap-3 min-w-0 pr-4">
        {isSub ? (
          <Subtitles size={14} className="text-zinc-600 shrink-0" />
        ) : isMedia ? (
          <FileVideo size={14} className={isActive ? 'text-indigo-400' : 'text-zinc-500 group-hover:text-zinc-400'} shrink-0 />
        ) : (
          <FileIcon size={14} className="text-zinc-600 shrink-0" />
        )}
        <div className="min-w-0">
          <p className="text-sm text-zinc-300 truncate">{f.name}</p>
          <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-zinc-600">
            <span>{(f.size / 1024 / 1024).toFixed(1)} MB</span>
            <span>•</span>
            <span>{formatDownloadDate(f.time)}</span>
            {duration && (
              <>
                <span>•</span>
                <span>{duration}</span>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={(e) => { e.stopPropagation(); onRename(f); }} className="p-1.5 text-zinc-500 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors" title="Rename File">
          <Edit2 size={14} />
        </button>
        <button onClick={(e) => { e.stopPropagation(); onReveal(f.path); }} className="p-1.5 text-zinc-500 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors" title="Reveal in File Explorer">
          <FolderOpen size={14} />
        </button>
        <button onClick={(e) => { e.stopPropagation(); onDelete(f); }} className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" title="Delete File">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
};

export const DownloadsView = () => {
  const { activeDownloads, downloadsLoc } = useAppContext();
  const [completedFiles, setCompletedFiles] = useState<any[]>([]);
  const [playingFile, setPlayingFile] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showSubtitles, setShowSubtitles] = useState(false);
  const [showSubList, setShowSubList] = useState(false);
  const [showNonMedia, setShowNonMedia] = useState(false);
  const [deletePrompt, setDeletePrompt] = useState<any>(null);
  const [deleteSubsChecked, setDeleteSubsChecked] = useState(true);
  const [renamePrompt, setRenamePrompt] = useState<any>(null);

  const listScrollRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (listScrollRef.current) listScrollRef.current.scrollTop = downloadsScrollPos;
  }, []);

  const toggleSubtitles = () => {
    if (videoRef.current && videoRef.current.textTracks.length > 0) {
      const track = videoRef.current.textTracks[0];
      const nextState = !showSubtitles;
      track.mode = nextState ? 'showing' : 'hidden';
      setShowSubtitles(nextState);
    } else {
      setShowSubtitles(!showSubtitles);
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      setProgress((videoRef.current.currentTime / videoRef.current.duration) * 100);
    }
  };

  const handleSeek = (e: any) => {
    if (videoRef.current) {
      const seekTime = (Number(e.target.value) / 100) * videoRef.current.duration;
      videoRef.current.currentTime = seekTime;
    }
  };

  const getMediaUrls = (fPath: string) => {
    const filename = fPath.split('\\').pop() || "";
    return {
      vid: `http://downloads.localhost/${encodeURIComponent(filename)}`,
      vtt: `http://downloads.localhost/${encodeURIComponent(filename.replace(/\.[^.]+$/, '.vtt'))}`
    };
  };

  const loadFiles = () => {
    try {
      const resp = ahk.call('ListDownloads');
      if (resp) {
        let parsed = JSON.parse(resp);

        // Exclude items that are currently active in our global state to prevent duplication
        setCompletedFiles(parsed);
      }
    } catch (e) { }
  };

  useEffect(() => {
    loadFiles();
    const intv = setInterval(loadFiles, 5000);
    return () => clearInterval(intv);
  }, []);

  const activeIds = Object.keys(activeDownloads).filter(p => activeDownloads[p].state !== 2);

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* File List */}
      <div className="w-1/4 min-w-[250px] border-r border-zinc-800/50 bg-zinc-950/50 p-6 overflow-y-auto no-scrollbar flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-light tracking-tight text-zinc-100 flex items-center gap-2">
              <Download size={20} className="text-indigo-400" /> Downloads
            </h2>
            <p className="text-xs text-zinc-500 mt-1 cursor-pointer hover:text-indigo-400" onClick={() => ahk.call('ExecuteSearch', downloadsLoc, '')}>
              {downloadsLoc || 'No Location Set'} <FolderOpen size={10} className="inline ml-1" />
            </p>
          </div>
        </div>

        <div className="space-y-6 flex-1 flex flex-col">
          {/* Active Downloads */}
          {activeIds.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Downloading ({activeIds.length})</h3>
              <div className="space-y-2">
                {activeIds.map(id => {
                  const dl = activeDownloads[id];
                  const p = dl.total > 0 ? (dl.rcv / dl.total) * 100 : 100;
                  const isIndeterminate = dl.total === 0;
                  return (
                    <div key={id} className="p-3 bg-zinc-900/50 border border-zinc-800/50 rounded-xl relative overflow-hidden">
                      {/* Progress Bar Background */}
                      <div className={`absolute top-0 left-0 h-full bg-indigo-500/10 transition-all duration-300 ${isIndeterminate && !dl.isFFmpeg ? 'animate-pulse w-full' : ''}`} style={{ width: (isIndeterminate && !dl.isFFmpeg) ? '100%' : (dl.isFFmpeg ? '100%' : `${p}%`) }} />

                      <div className="relative z-10 flex items-center justify-between">
                        <div className="flex items-center gap-3 w-full pr-4">
                          <Download size={14} className="text-indigo-400 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm text-zinc-200 truncate">{dl.file}</p>
                            <div className="flex items-center justify-between mt-1">
                              <p className="text-[10px] text-zinc-500">
                                {dl.isFFmpeg
                                  ? <span className="flex items-center gap-2">
                                    <span>{(dl.rcv / 1024 / 1024).toFixed(1)} MB Ripped</span>
                                    {dl.ffmpegTime && <span>• {dl.ffmpegTime}</span>}
                                    {dl.speed && <span className="text-indigo-400/80">• {dl.speed}</span>}
                                  </span>
                                  : isIndeterminate
                                    ? 'Downloading or Muxing...'
                                    : `${(dl.rcv / 1024 / 1024).toFixed(1)} MB / ${(dl.total / 1024 / 1024).toFixed(1)} MB`
                                }
                              </p>
                              {!isIndeterminate && !dl.isFFmpeg && <span className="text-[10px] text-indigo-400 font-medium">{p.toFixed(0)}%</span>}
                              {dl.isFFmpeg && !dl.ffmpegTime && <span className="text-[10px] text-indigo-400 font-medium animate-pulse">Starting...</span>}
                              {dl.isFFmpeg && dl.ffmpegTime && <span className="text-[10px] text-indigo-400 font-medium animate-pulse">Ripping</span>}
                            </div>
                          </div>
                          <button onClick={(e) => { e.stopPropagation(); ahk.call('CancelDownload', id); }} className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors z-20 shrink-0" title="Cancel Download">
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Completed Files */}
          <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Completed ({completedFiles.filter(f => {
                if (activeIds.map(id => activeDownloads[id].path.toLowerCase()).includes(f.path.toLowerCase())) return false;
                const isSub = f.name.match(/\.(vtt|srt|ass)$/i);
                const isMedia = f.name.match(/\.(mp4|mkv|avi|webm|mov|flv|wmv|m4v)$/i);
                if (isSub && !showSubList) return false;
                if (!isSub && !isMedia && !showNonMedia) return false;
                return true;
              }).length})</h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 group/cc cursor-pointer" onClick={() => setShowNonMedia(!showNonMedia)} title="Show other files">
                  <FileIcon size={12} className={showNonMedia ? "text-indigo-400" : "text-zinc-600"} />
                  <div className={`w-6 h-3 rounded-full transition-colors relative flex items-center ${showNonMedia ? 'bg-indigo-500/50' : 'bg-zinc-800'}`}>
                    <div className={`w-2 h-2 bg-white rounded-full transition-all absolute ${showNonMedia ? 'left-[14px]' : 'left-[2px]'}`} />
                  </div>
                </div>
                <div className="flex items-center gap-2 group/cc cursor-pointer" onClick={() => setShowSubList(!showSubList)} title="Show subtitles">
                  <Subtitles size={12} className={showSubList ? "text-indigo-400" : "text-zinc-600"} />
                  <div className={`w-6 h-3 rounded-full transition-colors relative flex items-center ${showSubList ? 'bg-indigo-500/50' : 'bg-zinc-800'}`}>
                    <div className={`w-2 h-2 bg-white rounded-full transition-all absolute ${showSubList ? 'left-[14px]' : 'left-[2px]'}`} />
                  </div>
                </div>
              </div>
            </div>
            <div 
              ref={listScrollRef}
              onScroll={(e) => downloadsScrollPos = e.currentTarget.scrollTop}
              className="space-y-2 flex-1 overflow-y-auto no-scrollbar"
            >
              {completedFiles.filter(f => {
                if (activeIds.map(id => activeDownloads[id].path.toLowerCase()).includes(f.path.toLowerCase())) return false;
                const isSub = f.name.match(/\.(vtt|srt|ass)$/i);
                const isMedia = f.name.match(/\.(mp4|mkv|avi|webm|mov|flv|wmv|m4v)$/i);
                if (isSub && !showSubList) return false;
                if (!isSub && !isMedia && !showNonMedia) return false;
                return true;
              }).length === 0 && (
                <div className="text-center p-8 text-sm text-zinc-600 border border-dashed border-zinc-800/50 rounded-xl">
                  No completed downloads.
                </div>
              )}
              {completedFiles.filter(f => {
                if (activeIds.map(id => activeDownloads[id].path.toLowerCase()).includes(f.path.toLowerCase())) return false;
                const isSub = f.name.match(/\.(vtt|srt|ass)$/i);
                const isMedia = f.name.match(/\.(mp4|mkv|avi|webm|mov|flv|wmv|m4v)$/i);
                if (isSub && !showSubList) return false;
                if (!isSub && !isMedia && !showNonMedia) return false;
                return true;
              }).map(f => (
                <DownloadItem
                  key={f.path}
                  f={f}
                  isActive={playingFile === f.path}
                  onPlay={() => setPlayingFile(f.path)}
                  onRename={(file: any) => setRenamePrompt({ ...file, newName: file.name })}
                  onReveal={(path: any) => ahk.call('RevealPath', path)}
                  onDelete={(file: any) => setDeletePrompt(file)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Embedded Player */}
      <div className="flex-1 bg-zinc-950 flex flex-col relative items-center justify-center p-8 group/player">
        {playingFile ? (() => {
          const { vid, vtt } = getMediaUrls(playingFile);
          return (
            <div className="w-full max-w-5xl aspect-video bg-zinc-950 border border-zinc-800/50 rounded-2xl overflow-hidden shadow-2xl relative">
              <video
                ref={videoRef}
                src={vid}
                crossOrigin="anonymous"
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={() => {
                  if (videoRef.current) setDuration(videoRef.current.duration);
                  setIsPlaying(true);
                  if (videoRef.current) videoRef.current.play();
                }}
                onClick={togglePlay}
                className="w-full h-full object-contain cursor-pointer"
              >
                <track src={vtt} kind="subtitles" srclang="en" label="English" default />
              </video>

              {/* Custom Player Controls UI */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none opacity-0 group-hover/player:opacity-100 transition-opacity flex flex-col justify-end p-6">
                <div className="pointer-events-auto flex flex-col gap-3">
                  {/* Progress Bar */}
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-white font-medium font-mono">{formatTime(currentTime)}</span>
                    <input
                      type="range" min="0" max="100" value={progress || 0} onChange={handleSeek}
                      className="flex-1 h-1.5 bg-zinc-600 rounded-full appearance-none outline-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-emerald-400 [&::-webkit-slider-thumb]:rounded-full hover:[&::-webkit-slider-thumb]:scale-125 transition-transform"
                    />
                    <span className="text-xs text-zinc-400 font-medium font-mono">{formatTime(duration)}</span>
                  </div>

                  {/* Controls Strip */}
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center gap-4">
                      <button onClick={togglePlay} className="text-white hover:text-emerald-400 transition-colors">
                        {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
                      </button>
                      <div className="flex items-center gap-2 group/vol">
                        <button onClick={() => setIsMuted(!isMuted)} className="text-white hover:text-emerald-400 transition-colors">
                          {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
                        </button>
                        <input type="range" min="0" max="1" step="0.05" value={isMuted ? 0 : volume}
                          onChange={(e) => {
                            const v = Number(e.target.value);
                            setVolume(v);
                            if (videoRef.current) videoRef.current.volume = v;
                            if (v > 0) setIsMuted(false);
                          }}
                          className="w-0 group-hover/vol:w-16 opacity-0 group-hover/vol:opacity-100 transition-all origin-left h-1 bg-zinc-600 rounded-full appearance-none outline-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 group/cc">
                        <Subtitles size={18} className={showSubtitles ? "text-emerald-400" : "text-white opacity-50"} />
                        <button
                          onClick={toggleSubtitles}
                          className={`w-8 h-4 rounded-full transition-colors relative flex items-center ${showSubtitles ? 'bg-emerald-500' : 'bg-zinc-600'}`}
                        >
                          <div className={`w-3 h-3 bg-white rounded-full transition-all absolute ${showSubtitles ? 'left-[18px]' : 'left-[2px]'}`} />
                        </button>
                      </div>
                      <button onClick={() => {
                        if (videoRef.current) {
                          if (document.fullscreenElement) document.exitFullscreen();
                          else videoRef.current.parentElement?.requestFullscreen();
                        }
                      }} className="text-white hover:text-emerald-400 transition-colors">
                        <Maximize size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })() : (
          <div className="text-center">
            <div className="w-16 h-16 bg-zinc-900/50 border border-zinc-800/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Play size={24} className="text-zinc-700" />
            </div>
            <h3 className="text-zinc-400 font-medium">No Media Selected</h3>
            <p className="text-sm text-zinc-600 mt-1">Select a completed download to play</p>
          </div>
        )}
      </div>

      {/* Delete/Rename Modals */}
      {deletePrompt && (() => {
        const base = deletePrompt.name.replace(/\.[^/.]+$/, "");
        const hasSubs = completedFiles.some(f => f.name.includes(base) && f.name.match(/\.(vtt|srt)$/i));
        return (
          <div className="fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-sm" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
            <div className="rounded-2xl shadow-2xl w-[400px] overflow-hidden" style={{ backgroundColor: 'var(--theme-surface)', border: '1px solid var(--theme-border)' }}>
              <div className="p-6">
                <h3 className="text-xl font-bold mb-2 tracking-tight" style={{ color: 'var(--theme-textMain)' }}>Delete File?</h3>
                <p className="text-sm mb-6 break-words leading-relaxed" style={{ color: 'var(--theme-textSec)' }}>Are you sure you want to permanently delete <span className="font-medium opacity-90" style={{ color: 'var(--theme-textMain)' }}>{deletePrompt.name}</span>? This action cannot be undone.</p>

                {!deletePrompt.name.match(/\.(vtt|srt)$/i) && hasSubs && (
                  <label className="flex items-center gap-3 mb-2 p-3.5 rounded-xl border cursor-pointer transition-all hover:opacity-100 opacity-80" style={{ borderColor: 'var(--theme-border)', backgroundColor: 'transparent' }}>
                    <div className="w-5 h-5 rounded-md appearance-none border-2 flex items-center justify-center transition-colors shadow-inner" style={{ backgroundColor: deleteSubsChecked ? 'var(--theme-accent)' : 'transparent', borderColor: deleteSubsChecked ? 'var(--theme-accent)' : 'var(--theme-border)' }}>
                      {deleteSubsChecked && <div className="w-2.5 h-2.5 bg-white rounded-sm" />}
                    </div>
                    <input type="checkbox" className="hidden" checked={deleteSubsChecked} onChange={(e) => setDeleteSubsChecked(e.target.checked)} />
                    <span className="text-sm font-medium" style={{ color: 'var(--theme-textMain)' }}>Also delete associated subtitles</span>
                  </label>
                )}
              </div>

              <div className="px-6 py-4 flex items-center justify-end gap-3" style={{ borderTop: '1px solid var(--theme-border)', backgroundColor: 'rgba(0,0,0,0.1)' }}>
                <button onClick={() => setDeletePrompt(null)} className="px-4 py-2 text-sm font-medium transition-colors hover:opacity-100 opacity-60" style={{ color: 'var(--theme-textMain)' }}>Cancel</button>
                <button onClick={() => {
                  ahk.call('DeleteDownload', deletePrompt.path, deleteSubsChecked ? 1 : 0);
                  if (playingFile === deletePrompt.path) setPlayingFile(null);
                  setTimeout(loadFiles, 300);
                  setDeletePrompt(null);
                }} className="px-6 py-2 text-sm font-bold rounded-lg transition-all shadow-lg active:scale-95" style={{ backgroundColor: 'var(--theme-accent)', color: '#fff' }}>Confirm Delete</button>
              </div>
            </div>
          </div>
        );
      })()}

      {renamePrompt && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-sm" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <div className="rounded-2xl shadow-2xl w-[450px] overflow-hidden" style={{ backgroundColor: 'var(--theme-surface)', border: '1px solid var(--theme-border)' }}>
            <div className="p-6">
              <h3 className="text-xl font-bold mb-4 tracking-tight" style={{ color: 'var(--theme-textMain)' }}>Rename File</h3>
              <input
                autoFocus
                type="text"
                value={renamePrompt.newName}
                onChange={(e) => setRenamePrompt({ ...renamePrompt, newName: e.target.value })}
                className="w-full border rounded-xl px-4 py-3 text-sm outline-none shadow-inner transition-colors"
                style={{ backgroundColor: 'transparent', borderColor: 'var(--theme-border)', color: 'var(--theme-textMain)' }}
              />
            </div>
            <div className="px-6 py-4 flex items-center justify-end gap-3" style={{ borderTop: '1px solid var(--theme-border)', backgroundColor: 'rgba(0,0,0,0.1)' }}>
              <button onClick={() => setRenamePrompt(null)} className="px-4 py-2 text-sm font-medium transition-colors hover:opacity-100 opacity-60" style={{ color: 'var(--theme-textMain)' }}>Cancel</button>
              <button onClick={() => {
                if (renamePrompt.newName && renamePrompt.newName !== renamePrompt.name) {
                  ahk.call('RenameDownload', renamePrompt.path, renamePrompt.newName);
                  setTimeout(loadFiles, 300);
                }
                setRenamePrompt(null);
              }} className="px-6 py-2 text-sm font-bold rounded-lg transition-all shadow-lg active:scale-95" style={{ backgroundColor: 'var(--theme-accent)', color: '#fff' }}>Rename</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
