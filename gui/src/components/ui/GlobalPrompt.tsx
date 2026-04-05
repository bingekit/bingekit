import React, { useState, useEffect, useRef } from 'react';
import { Modal } from './Modal';
import { MessageSquare } from 'lucide-react';

declare global {
  interface Window {
    showPrompt: (title: string, defaultValue?: string) => Promise<string | null>;
  }
}

export const GlobalPrompt = () => {
  const [req, setReq] = useState<{ title: string; defaultValue: string; resolve: (val: string | null) => void } | null>(null);
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    window.showPrompt = (title: string, defaultValue = '') => {
      return new Promise<string | null>((resolve) => {
        setReq({ title, defaultValue, resolve });
        setValue(defaultValue);
      });
    };
    
    return () => {
      delete (window as any).showPrompt;
    };
  }, []);

  useEffect(() => {
    if (req && inputRef.current) {
      setTimeout(() => {
         inputRef.current?.focus();
      }, 50);
    }
  }, [req]);

  const handleClose = (res: string | null) => {
    if (req) {
      req.resolve(res);
      setReq(null);
    }
  };

  if (!req) return null;

  return (
    <Modal isOpen={!!req} title="Input Required" onClose={() => handleClose(null)}>
      <p className="text-sm text-[var(--theme-text-sec)] mb-4 whitespace-pre-wrap">{req.title}</p>
      
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
           if (e.key === 'Enter') handleClose(value);
        }}
        className="w-full bg-[color-mix(in_srgb,var(--theme-bg)_50%,transparent)] border border-[var(--theme-border)] rounded-lg px-4 py-3 text-sm text-[var(--theme-text-main)] focus:border-indigo-500 outline-none mb-6"
      />
      
      <div className="flex justify-end gap-3 mt-4">
        <button
          onClick={() => handleClose(null)}
          className="px-4 py-2 text-sm font-medium text-[var(--theme-text-sec)] hover:text-[var(--theme-text-main)] transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={() => handleClose(value)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-md transition-colors"
        >
          Submit
        </button>
      </div>
    </Modal>
  );
};
