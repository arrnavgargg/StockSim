import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

interface NotificationProps {
  message: string | null;
  type?: 'success' | 'error';
  onClose: () => void;
}

export const Notification: React.FC<NotificationProps> = ({
  message,
  type = 'success',
  onClose,
}) => {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose();
    }, 5000);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;

  const isSuccess = type === 'success';

  return (
    <div className="fixed top-20 right-5 z-50 max-w-sm animate-in slide-in-from-top-4 duration-300">
      <div
        className={`p-4 rounded-2xl shadow-2xl border flex items-start gap-3 backdrop-blur-md ${
          isSuccess
            ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-100'
            : 'bg-red-950/90 border-red-500/50 text-red-100'
        }`}
      >
        {isSuccess ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        ) : (
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
        )}
        <div className="flex-1 text-xs font-medium leading-relaxed">{message}</div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1 rounded-lg transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
