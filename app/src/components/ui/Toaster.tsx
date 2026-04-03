import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Info } from 'lucide-react';

export type ToastType = 'info' | 'success' | 'error';
export interface ToastEvent {
  id: string;
  message: string;
  type: ToastType;
}

declare global {
  interface Window {
    showToast: (message: string, type?: ToastType) => void;
  }
}

export const Toaster = () => {
  const [toasts, setToasts] = useState<ToastEvent[]>([]);

  useEffect(() => {
    window.showToast = (message: string, type: ToastType = 'info') => {
      const id = Date.now().toString() + Math.random().toString();
      const newToast = { id, message, type };
      
      setToasts(prev => [...prev, newToast]);
      
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 3000);
    };
    
    return () => {
      delete (window as any).showToast;
    };
  }, []);

  return (
    <div className="fixed bottom-4 left-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map(toast => (
        <div key={toast.id} className="animate-in fade-in slide-in-from-bottom-5 duration-300 pointer-events-auto">
          <div className={`
            flex items-center gap-3 px-4 py-3 rounded-lg border shadow-xl backdrop-blur-md max-w-sm
            ${toast.type === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-100' :
              toast.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-100' :
              'bg-zinc-900/90 border-zinc-800 text-zinc-100'}
          `}>
            {toast.type === 'error' && <AlertCircle size={18} className="text-red-400 shrink-0" />}
            {toast.type === 'success' && <CheckCircle size={18} className="text-emerald-400 shrink-0" />}
            {toast.type === 'info' && <Info size={18} className="text-indigo-400 shrink-0" />}
            <span className="text-sm font-medium pr-2 whitespace-pre-wrap">{toast.message}</span>
          </div>
        </div>
      ))}
    </div>
  );
};
