'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

export function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3500);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg text-sm font-medium',
        type === 'success'
          ? 'bg-emerald-500/15 border-emerald-500/20 text-emerald-400'
          : 'bg-red-500/15 border-red-500/20 text-red-400'
      )}
    >
      {type === 'success' ? <CheckCircle size={16} /> : <XCircle size={16} />}
      <span className="text-foreground">{message}</span>
      <button onClick={onClose} className="ml-auto">
        <X size={14} />
      </button>
    </div>
  );
}

interface ToastState {
  id: number;
  message: string;
  type: 'success' | 'error';
}

let toastId = 0;
let globalSetToasts: React.Dispatch<React.SetStateAction<ToastState[]>> | null = null;

export function showToast(message: string, type: 'success' | 'error' = 'success') {
  if (globalSetToasts) {
    const id = ++toastId;
    globalSetToasts((prev) => [...prev, { id, message, type }]);
  }
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastState[]>([]);
  globalSetToasts = setToasts;

  const remove = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 max-w-sm">
      {toasts.map((t) => (
        <Toast key={t.id} message={t.message} type={t.type} onClose={() => remove(t.id)} />
      ))}
    </div>
  );
}
