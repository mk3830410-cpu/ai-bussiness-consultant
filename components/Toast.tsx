import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle2, Info, AlertTriangle, AlertCircle, X, Copy, Download } from 'lucide-react';

export type ToastType = 'success' | 'info' | 'warning' | 'error';

export interface ToastItem {
  id: string;
  message: ReactNode;
  type: ToastType;
  icon?: 'copy' | 'download' | 'check' | 'default';
  duration?: number;
}

interface ToastContextType {
  showToast: (message: ReactNode, type?: ToastType, icon?: 'copy' | 'download' | 'check' | 'default', duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (
      message: string,
      type: ToastType = 'info',
      icon: 'copy' | 'download' | 'check' | 'default' = 'default',
      duration: number = 3200
    ) => {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const newToast: ToastItem = { id, message, type, icon, duration };

      setToasts((prev) => [...prev.slice(-3), newToast]); // Keep up to 4 active toasts

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      <div 
        id="toast-container" 
        className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            id={`toast-${toast.id}`}
            role="alert"
            className={`pointer-events-auto flex items-center justify-between p-3.5 rounded-xl shadow-2xl border backdrop-blur-md transition-all duration-300 transform translate-y-0 animate-in fade-in slide-in-from-bottom-3 ${
              toast.type === 'success'
                ? 'bg-gray-850/95 bg-gray-900 border-emerald-500/40 text-gray-100 shadow-emerald-950/40'
                : toast.type === 'error'
                ? 'bg-gray-900 border-rose-500/40 text-gray-100 shadow-rose-950/40'
                : toast.type === 'warning'
                ? 'bg-gray-900 border-amber-500/40 text-gray-100 shadow-amber-950/40'
                : 'bg-gray-900 border-indigo-500/40 text-gray-100 shadow-indigo-950/40'
            }`}
          >
            <div className="flex items-center gap-3 pr-2">
              <div className="flex-shrink-0">
                {toast.icon === 'copy' ? (
                  <div className="p-1 rounded-lg bg-indigo-500/20 text-indigo-400">
                    <Copy size={18} />
                  </div>
                ) : toast.icon === 'download' ? (
                  <div className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400">
                    <Download size={18} />
                  </div>
                ) : toast.type === 'success' ? (
                  <div className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400">
                    <CheckCircle2 size={18} />
                  </div>
                ) : toast.type === 'error' ? (
                  <div className="p-1 rounded-lg bg-rose-500/20 text-rose-400">
                    <AlertCircle size={18} />
                  </div>
                ) : toast.type === 'warning' ? (
                  <div className="p-1 rounded-lg bg-amber-500/20 text-amber-400">
                    <AlertTriangle size={18} />
                  </div>
                ) : (
                  <div className="p-1 rounded-lg bg-indigo-500/20 text-indigo-400">
                    <Info size={18} />
                  </div>
                )}
              </div>
              <div className="text-sm font-medium text-gray-200 leading-snug">{toast.message}</div>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-gray-400 hover:text-white p-1 rounded-md hover:bg-gray-800 transition-colors flex-shrink-0"
              aria-label="Close notification"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
