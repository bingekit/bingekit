import React from 'react';
import { Info } from 'lucide-react';

interface MetadataEditorProps {
  metadata: {
    version?: string;
    updateUrl?: string;
    author?: string;
    description?: string;
    icon?: string;
  };
  onChange: (key: string, value: string) => void;
}

export const MetadataEditor: React.FC<MetadataEditorProps> = ({ metadata, onChange }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-indigo-400 flex items-center gap-2 uppercase tracking-wider">
        <Info size={16} /> Metadata & Information
      </h3>
      <div className="p-5 bg-zinc-900/30 border border-zinc-800/50 rounded-xl space-y-4">
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-zinc-500 mb-1.5">Description</label>
            <input
              type="text" value={metadata.description || ''} placeholder="Short description..."
              onChange={(e) => onChange('description', e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1.5">Author</label>
            <input
              type="text" value={metadata.author || ''} placeholder="Developer name..."
              onChange={(e) => onChange('author', e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-zinc-500 mb-1.5">Version</label>
            <input
              type="text" value={metadata.version || ''} placeholder="1.0.0"
              onChange={(e) => onChange('version', e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 outline-none font-mono"
            />
          </div>
          <div className="col-span-2">
             <label className="block text-xs text-zinc-500 mb-1.5">Update URL (Optional)</label>
             <input
               type="text" value={metadata.updateUrl || ''} placeholder="https://raw.github.../plugin.json"
               onChange={(e) => onChange('updateUrl', e.target.value)}
               className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 outline-none font-mono tracking-tight"
             />
          </div>
        </div>

        <div>
           <label className="block text-xs text-zinc-500 mb-1.5">Custom Icon (SVG / Image URL / Emoji)</label>
           <textarea
             value={metadata.icon || ''} placeholder="<svg>...</svg> or https://site.com/icon.png or 🎬"
             onChange={(e) => onChange('icon', e.target.value)}
             rows={2}
             className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 outline-none font-mono resize-y"
           />
        </div>

      </div>
    </div>
  );
};
