import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search } from 'lucide-react';

export interface SelectOption {
  label: string;
  value: string;
}

export interface CustomSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
  searchable?: boolean;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({ options, value, onChange, placeholder = 'Select...', className = '', searchable = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(o => o.value === value);
  const filteredOptions = options.filter(o => o.label.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => {
            setIsOpen(!isOpen);
            if (!isOpen) setSearchQuery('');
        }}
        className="w-full flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 outline-none transition-colors hover:border-zinc-700 h-[38px] cursor-pointer"
      >
        <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown size={14} className={`text-zinc-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl overflow-hidden shadow-black/40">
          {searchable && (
            <div className="p-2 border-b border-zinc-800 flex items-center gap-2 text-zinc-400 bg-zinc-950/50">
                <Search size={14} />
                <input
                    type="text"
                    autoFocus
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search..."
                    className="w-full bg-transparent border-none outline-none text-sm text-zinc-200 placeholder-zinc-600"
                />
            </div>
          )}
          <div className="max-h-60 overflow-y-auto no-scrollbar py-1">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-3 text-sm text-zinc-500 text-center">No results found</div>
            ) : (
                filteredOptions.map((opt) => (
                <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2.5 text-sm flex items-center justify-between hover:bg-zinc-800 transition-colors cursor-pointer ${value === opt.value ? 'bg-indigo-500/10 text-indigo-400' : 'text-zinc-300'}`}
                >
                    <span className="truncate pr-2 block">{opt.label}</span>
                    {value === opt.value && <Check size={14} className="flex-shrink-0" />}
                </button>
                ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
