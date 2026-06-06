'use client';

import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { createClient } from '@/lib/supabase/client';
import { showToast } from '@/components/ui/Toast';
import type { OrderProduct, OrderType, SourceType } from '@/types';

interface OrderFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  sourceType: SourceType;
  sourceId: string;
  sourceName: string;
}

const products: OrderProduct[] = ['AJR Sedan', 'MEN', 'Women', 'Kids', 'Estet'];

export default function OrderForm({
  open,
  onClose,
  onSuccess,
  sourceType,
  sourceId,
  sourceName,
}: OrderFormProps) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    product: 'AJR Sedan' as OrderProduct,
    price: '',
    order_type: 'Hozirgi' as OrderType,
    scheduled_date: '',
    comment: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('orders').insert({
      user_id: user.id,
      source_type: sourceType,
      source_id: sourceId,
      product: form.product,
      price: parseFloat(form.price) || 0,
      order_type: form.order_type,
      scheduled_date: form.order_type === 'Keyinroqi' ? form.scheduled_date || null : null,
      comment: form.comment,
    });

    if (error) {
      showToast('Xatolik yuz berdi', 'error');
    } else {
      // Update lead status if source is lead
      if (sourceType === 'lead') {
        await supabase
          .from('leads')
          .update({ status: 'Buyurtma berilgan' })
          .eq('id', sourceId);
      }
      showToast('Zakaz muvaffaqiyatli qo\'shildi', 'success');
      onSuccess();
      onClose();
      setForm({ product: 'AJR Sedan', price: '', order_type: 'Hozirgi', scheduled_date: '', comment: '' });
    }
    setLoading(false);
  };

  return (
    <Modal open={open} onClose={onClose} title={`Zakaz qo'shish — ${sourceName}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1.5">Mahsulot</label>
          <select
            value={form.product}
            onChange={(e) => setForm({ ...form, product: e.target.value as OrderProduct })}
            className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            {products.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1.5">Narx (so'm)</label>
          <input
            type="number"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            placeholder="0"
            className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1.5">Zakaz turi</label>
          <div className="flex gap-2">
            {(['Hozirgi', 'Keyinroqi'] as OrderType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setForm({ ...form, order_type: t })}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                  form.order_type === t
                    ? 'bg-primary/15 border-primary/30 text-primary'
                    : 'bg-secondary border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {form.order_type === 'Keyinroqi' && (
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">Rejalashtirilgan sana</label>
            <input
              type="datetime-local"
              value={form.scheduled_date}
              onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })}
              className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1.5">Kommentariya</label>
          <textarea
            value={form.comment}
            onChange={(e) => setForm({ ...form, comment: e.target.value })}
            placeholder="Qo'shimcha ma'lumot..."
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
            {loading ? 'Saqlanmoqda...' : 'Saqlash'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
