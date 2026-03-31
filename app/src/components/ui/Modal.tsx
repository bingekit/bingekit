import React from 'react';
import { X } from 'lucide-react';

export const Modal = ({ isOpen, onClose, title, children, width }: { isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode, width?: string }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[color-mix(in_srgb,var(--theme-bg)_80%,transparent)] backdrop-blur-sm p-4" onClick={onClose}>
      <div className={`bg-[var(--theme-surface)] border border-[color-mix(in_srgb,var(--theme-text)_10%,transparent)] rounded-2xl w-full ${width || 'max-w-lg'} shadow-2xl relative flex flex-col max-h-[90vh]`} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-[color-mix(in_srgb,var(--theme-text)_10%,transparent)]">
          <h2 className="text-lg font-medium text-[var(--theme-text)]">{title}</h2>
          <button onClick={onClose} className="text-[color-mix(in_srgb,var(--theme-text)_50%,transparent)] hover:text-[var(--theme-text)] transition-colors p-1 rounded-lg hover:bg-[color-mix(in_srgb,var(--theme-text)_10%,transparent)]"><X size={18} /></button>
        </div>
        <div className="p-5 overflow-y-auto no-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};
