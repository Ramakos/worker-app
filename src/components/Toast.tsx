/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  title: string;
  message?: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (title: string, message?: string, type?: ToastType, duration?: number) => void;
  toast: {
    success: (title: string, message?: string, duration?: number) => void;
    error: (title: string, message?: string, duration?: number) => void;
    info: (title: string, message?: string, duration?: number) => void;
    warning: (title: string, message?: string, duration?: number) => void;
  };
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (title: string, message?: string, type: ToastType = 'info', duration = 4000) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev.slice(-3), { id, title, message, type }]); // Keep last 4 max

      if (duration > 0) {
        setTimeout(() => {
          dismiss(id);
        }, duration);
      }
    },
    [dismiss]
  );

  const toastHelpers = {
    success: useCallback((title: string, message?: string, duration?: number) => {
      showToast(title, message, 'success', duration);
    }, [showToast]),
    error: useCallback((title: string, message?: string, duration = 5000) => {
      showToast(title, message, 'error', duration);
    }, [showToast]),
    info: useCallback((title: string, message?: string, duration?: number) => {
      showToast(title, message, 'info', duration);
    }, [showToast]),
    warning: useCallback((title: string, message?: string, duration = 4500) => {
      showToast(title, message, 'warning', duration);
    }, [showToast]),
  };

  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />;
      case 'info':
        return <Info className="w-5 h-5 text-primary" />;
    }
  };

  const getBadgeStyle = (type: ToastType) => {
    switch (type) {
      case 'success':
        return 'bg-emerald-500/10 border-emerald-500/20';
      case 'error':
        return 'bg-destructive/10 border-destructive/20';
      case 'warning':
        return 'bg-amber-500/10 border-amber-500/20';
      case 'info':
        return 'bg-primary/10 border-primary/20';
    }
  };

  return (
    <ToastContext.Provider value={{ showToast, toast: toastHelpers }}>
      {children}
      <div
        aria-live="polite"
        className="fixed top-4 inset-x-3 sm:inset-x-auto sm:right-4 z-[9999] flex flex-col gap-2.5 max-w-md pointer-events-none"
      >
        {toasts.map((item) => (
          <div
            key={item.id}
            role="status"
            className="pointer-events-auto flex items-start gap-3 p-3.5 rounded-2xl bg-card/95 backdrop-blur-md border border-border/80 shadow-xl shadow-black/10 transition-all transform animate-in slide-in-from-top-3 fade-in duration-250"
          >
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${getBadgeStyle(
                item.type
              )}`}
            >
              {getIcon(item.type)}
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              <h4 className="text-xs sm:text-sm font-bold text-foreground leading-tight">
                {item.title}
              </h4>
              {item.message && (
                <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 leading-snug">
                  {item.message}
                </p>
              )}
            </div>
            <button
              onClick={() => dismiss(item.id)}
              className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted transition-colors shrink-0 -mr-1 -mt-0.5"
              aria-label="Close notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
