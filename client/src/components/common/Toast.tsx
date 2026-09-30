import React from 'react';
import { useParking } from '../../context/ParkingContext';
import { CheckCircle2, AlertTriangle, AlertOctagon, Info, X } from 'lucide-react';
import { clsx } from 'clsx';

export const ToastContainer = () => {
  const { toasts, dismissToast } = useParking();

  if (toasts.length === 0) return null;

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />,
    error: <AlertOctagon className="w-5 h-5 text-rose-600 shrink-0" />,
    info: <Info className="w-5 h-5 text-sky-600 shrink-0" />,
  };

  const borders = {
    success: 'border-l-4 border-l-emerald-500 bg-white',
    warning: 'border-l-4 border-l-amber-500 bg-white',
    error: 'border-l-4 border-l-rose-500 bg-white',
    info: 'border-l-4 border-l-sky-500 bg-white',
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map(t => (
        <div
          key={t.id}
          className={clsx(
            'pointer-events-auto flex items-start gap-3 p-4 rounded-xl border border-slate-200/90 shadow-xl transition-all',
            borders[t.type]
          )}
        >
          {icons[t.type]}
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold text-slate-900">{t.title}</h4>
            {t.message && <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{t.message}</p>}
          </div>
          <button
            onClick={() => dismissToast(t.id)}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
