import React, { useState } from 'react';
import { X } from 'lucide-react';

export const TagsInput = ({ tags = [], onChange }: { tags: string[], onChange: (tags: string[]) => void }) => {
  const [input, setInput] = useState('');

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = input.trim().replace(/^,|,$/g, '');
      if (val && !tags.includes(val)) {
        onChange([...tags, val]);
      }
      setInput('');
    } else if (e.key === 'Backspace' && !input && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5 w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 focus-within:border-indigo-500 transition-colors cursor-text min-h-[38px]" onClick={(e) => (e.currentTarget.querySelector('input') as HTMLInputElement)?.focus()}>
      {tags.map((tag, i) => (
        <span key={i} className="flex items-center gap-1 bg-zinc-800 text-zinc-300 text-xs px-2 py-0.5 rounded-md">
          {tag}
          <button type="button" onClick={() => onChange(tags.filter((_, idx) => idx !== i))} className="hover:text-red-400">
            <X size={12} />
          </button>
        </span>
      ))}
      <input
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={tags.length === 0 ? "Enter tags..." : ""}
        className="flex-1 min-w-[80px] bg-transparent border-none text-sm text-zinc-200 outline-none p-0 focus:ring-0"
      />
    </div>
  );
};
