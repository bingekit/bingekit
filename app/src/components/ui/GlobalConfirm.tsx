import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { AlertTriangle } from 'lucide-react';

declare global {
  interface Window {
    showConfirm: (message: string, title?: string) => Promise<boolean>;
  }
}

export const GlobalConfirm = () => {
  const [req, setReq] = useState<{ message: string; title: string; resolve: (val: boolean) => void } | null>(null);

  useEffect(() => {
    window.showConfirm = (message: string, title = 'Confirm Action') => {
      return new Promise<boolean>((resolve) => {
        setReq({ message, title, resolve });
      });
    };
    
    return () => {
      delete (window as any).showConfirm;
    };
  }, []);

  const handleClose = (res: boolean) => {
    if (req) {
      req.resolve(res);
      setReq(null);
    }
  };

  if (!req) return null;

  return (
    <Modal isOpen={!!req} title={req.title} onClose={() => handleClose(false)}>
      <div className="flex items-start gap-4 mb-2 mt-2">
        <div className="p-3 bg-red-500/10 rounded-2xl text-red-400 shrink-0 shadow-inner overflow-hidden border border-red-500/20">
          <AlertTriangle size={24} />
        </div>
        <div className="pt-2 flex-1">
          <p className="text-[var(--theme-text-main)] text-sm leading-relaxed whitespace-pre-wrap">{req.message}</p>
        </div>
      </div>
      
      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[color-mix(in_srgb,var(--theme-border)_50%,transparent)]">
        <button
          autoFocus
          onClick={() => handleClose(false)}
          className="px-5 py-2 text-sm font-medium text-[var(--theme-text-sec)] hover:text-[var(--theme-text-main)] transition-colors bg-[color-mix(in_srgb,var(--theme-bg)_50%,transparent)] hover:bg-[color-mix(in_srgb,var(--theme-bg)_80%,transparent)] rounded-lg border border-[var(--theme-border)]"
        >
          Cancel
        </button>
        <button
          onClick={() => handleClose(true)}
          className="px-5 py-2 bg-red-500/90 hover:bg-red-500 text-white text-sm font-bold tracking-wide rounded-lg transition-colors shadow-[0_0_15px_rgba(239,68,68,0.2)] hover:shadow-[0_0_20px_rgba(239,68,68,0.4)]"
        >
          Confirm
        </button>
      </div>
    </Modal>
  );
};
