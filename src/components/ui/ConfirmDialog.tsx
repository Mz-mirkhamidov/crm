'use client';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  loading?: boolean;
}

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = "O'chirishni tasdiqlang",
  message = "Bu amalni qaytarib bo'lmaydi. Davom etasizmi?",
  loading = false,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-card border border-border rounded-2xl shadow-2xl p-6">
        <h3 className="font-semibold text-foreground mb-2">{title}</h3>
        <p className="text-muted-foreground text-sm mb-6">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-secondary hover:bg-secondary/80 text-foreground rounded-xl py-2.5 text-sm font-medium transition-all"
          >
            Bekor qilish
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 bg-destructive hover:bg-destructive/90 disabled:opacity-50 text-white rounded-xl py-2.5 text-sm font-medium transition-all"
          >
            {loading ? "O'chirilmoqda..." : "O'chirish"}
          </button>
        </div>
      </div>
    </div>
  );
}
