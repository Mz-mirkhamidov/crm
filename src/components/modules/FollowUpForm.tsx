'use client';

import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { createClient } from '@/lib/supabase/client';
import { showToast } from '@/components/ui/Toast';
import type { SourceType } from '@/types';

interface FollowUpFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  sourceType: SourceType;
  sourceId: string;
  sourceName: string;
}

export default function FollowUpForm({
  open,
  onClose,
  onSuccess,
  sourceType,
  sourceId,
  sourceName,
}: FollowUpFormProps) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    scheduled_at: '',
    note: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('follow_ups').insert({
      user_id: user.id,
      source_type: sourceType,
      source_id: sourceId,
      scheduled_at: form.scheduled_at,
      note: form.note,
      status: 'Kutilmoqda',
    });

    if (error) {
      showToast('Xatolik yuz berdi', 'error');
    } else {
      showToast('Follow-up belgilandi', 'success');
      onSuccess();
      onClose();
      setForm({ scheduled_at: '', note: '' });
    }
    setLoading(false);
  };

  return (
    <Modal open={open} onClose={onClose} title={`Follow-up — ${sourceName}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1.5">
            Sana va soat
          </label>
          <input
            type="datetime-local"
            value={form.scheduled_at}
            onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })}
            required
            className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1.5">Izoh</label>
          <textarea
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
            placeholder="Nima haqida gaplashish..."
            rows={3}
            className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
          />
        </div>

        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-secondary hover:bg-secondary/80 text-foreground rounded-xl py-2.5 text-sm font-medium transition-all"
          >
            Bekor qilish
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white rounded-xl py-2.5 text-sm font-medium transition-all"
          >
            {loading ? 'Saqlanmoqda...' : 'Belgilash'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
