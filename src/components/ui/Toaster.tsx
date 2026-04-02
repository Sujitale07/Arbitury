'use client';

import { useNotificationStore } from '@/stores';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { useEffect } from 'react';

const ICONS = {
  success: <CheckCircle size={16} className="text-green" />,
  error: <AlertCircle size={16} className="text-red" />,
  warning: <AlertTriangle size={16} className="text-yellow" />,
  info: <Info size={16} className="text-blue" />,
};

export function Toaster() {
  const { notifications, dismiss } = useNotificationStore();

  return (
    <div className="fixed bottom-4 right-4 z-[200] flex flex-col gap-2 w-80 pointer-events-none">
      {notifications.map((n) => (
        <Toast key={n.id} notification={n} onDismiss={() => dismiss(n.id)} />
      ))}
    </div>
  );
}

function Toast({ notification: n, onDismiss }: { notification: any; onDismiss: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 5000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className="pointer-events-auto bg-surface border border-border rounded-lg shadow-lg overflow-hidden animate-slide-in">
      <div className="flex items-start gap-3 p-3">
        <div className="mt-0.5">{ICONS[n.type as keyof typeof ICONS]}</div>
        <div className="flex-1">
          <div className="text-xs font-semibold">{n.title}</div>
          {n.message && <div className="text-[11px] text-text-3 mt-0.5 leading-relaxed">{n.message}</div>}
        </div>
        <button 
          onClick={onDismiss}
          className="text-text-3 hover:text-text transition-colors"
        >
          <X size={14} />
        </button>
      </div>
      <div className="h-1 bg-border-2 w-full">
         <div 
           className="h-full bg-primary origin-left animate-progress"
           style={{ animationDuration: '5000ms' }}
         />
      </div>
    </div>
  );
}
