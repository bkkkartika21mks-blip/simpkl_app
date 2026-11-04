import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastContextType {
  showToast: (type: ToastType, title: string, message?: string) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback(
    (type: ToastType, title: string, message?: string) => {
      const id = Date.now().toString() + Math.random().toString(36).substr(2, 4);
      setToasts(prev => [...prev, { id, type, title, message }]);

      setTimeout(() => {
        removeToast(id);
      }, 5000);
    },
    [removeToast]
  );

  const success = useCallback((title: string, message?: string) => showToast('success', title, message), [showToast]);
  const error = useCallback((title: string, message?: string) => showToast('error', title, message), [showToast]);
  const warning = useCallback((title: string, message?: string) => showToast('warning', title, message), [showToast]);
  const info = useCallback((title: string, message?: string) => showToast('info', title, message), [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, success, error, warning, info }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-3 max-w-md w-full px-4 pointer-events-none">
        {toasts.map(toast => {
          let borderClass = 'border-emerald-500 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100';
          let icon = <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />;

          if (toast.type === 'error') {
            borderClass = 'border-rose-500 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100';
            icon = <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />;
          } else if (toast.type === 'warning') {
            borderClass = 'border-amber-500 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100';
            icon = <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />;
          } else if (toast.type === 'info') {
            borderClass = 'border-teal-500 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100';
            icon = <Info className="w-5 h-5 text-teal-500 flex-shrink-0" />;
          }

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border-l-4 shadow-lg shadow-slate-200/50 dark:shadow-black/50 border border-slate-200 dark:border-slate-800 transition-all transform translate-y-0 opacity-100`}
            >
              <div className="pt-0.5">{icon}</div>
              <div className="flex-1 text-sm">
                <p className="font-semibold">{toast.title}</p>
                {toast.message && <p className="text-slate-500 dark:text-slate-400 mt-0.5">{toast.message}</p>}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1"
                aria-label="Tutup notifikasi"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
};
