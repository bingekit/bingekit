import React from 'react';

export const CustomCheckbox = ({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) => (
  <button
    type="button"
    onClick={(e) => { e.stopPropagation(); onChange(!checked); }}
    className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${checked ? 'bg-indigo-500 border-indigo-500 text-white' : 'bg-zinc-900 border-zinc-700 hover:border-zinc-500'}`}
  >
    {checked && <svg viewBox="0 0 14 14" fill="none" className="w-3 h-3 stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7l3 3 5-5" /></svg>}
  </button>
);
