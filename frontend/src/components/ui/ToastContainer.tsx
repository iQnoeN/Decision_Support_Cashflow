import React from 'react';
import { useToastStore } from '../../store/useToastStore';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { clsx } from 'clsx';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none"
    >
      {toasts.map((toast) => {
        return (
          <div
            key={toast.id}
            role="alert"
            className={clsx(
              'pointer-events-auto flex items-start p-4 rounded-xl shadow-2xl backdrop-blur-lg border transition-all duration-300 animate-slide-up',
              toast.type === 'success' && 'bg-slate-900/90 border-emerald-500/30 text-emerald-400',
              toast.type === 'warning' && 'bg-slate-900/90 border-amber-500/30 text-amber-400',
              toast.type === 'error' && 'bg-slate-900/90 border-rose-500/30 text-rose-400',
              toast.type === 'info' && 'bg-slate-900/90 border-teal-500/30 text-teal-400'
            )}
          >
            <div className="mr-3 mt-0.5 shrink-0">
              {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
              {toast.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-400" />}
              {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-400" />}
              {toast.type === 'info' && <Info className="w-5 h-5 text-teal-400" />}
            </div>

            <div className="flex-1 mr-2">
              <h4 className="text-sm font-semibold text-slate-100">{toast.title}</h4>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">{toast.message}</p>
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-slate-200 transition-colors p-1"
              aria-label="Close notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
