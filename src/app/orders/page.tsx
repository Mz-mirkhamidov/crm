'use client';

import { useEffect, useState, useCallback } from 'react';
import { Pencil, Trash2, X, Calendar } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { ToastContainer, showToast } from '@/components/ui/Toast';
import { createClient } from '@/lib/supabase/client';
import { formatDate, formatPrice } from '@/lib/utils';
import type { Order, OrderProduct, OrderType } from '@/types';

const products: OrderProduct[] = ['AJR Sedan', 'MEN', 'Women', 'Kids', 'Estet'];

export default function OrdersPage() {
  const supabase = createClient();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterProduct, setFilterProduct] = useState('');
  const [filterType, setFilterType] = useState('');
  const [tab, setTab] = useState<'all' | 'upcoming'>('all');

  const [editOrder, setEditOrder] = useState<Order | null>(null);
  const [deleteOrder, setDeleteOrder] = useState<Order | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [editForm, setEditForm] = useState({ product: '' as OrderProduct, price: '', order_type: '' as OrderType, scheduled_date: '', comment: '' });
  const [editLoading, setEditLoading] = useState(false);

  const loadOrders = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('orders')
      .select(`*, leads(name, phone), clients(name, phone)`)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    let filtered = (data || []).map((o) => ({
      ...o,
      source_name: o.source_type === 'lead' ? o.leads?.name : o.clients?.name,
      source_phone: o.source_type === 'lead' ? o.leads?.phone : o.clients?.phone,
    }));

    if (filterProduct) filtered = filtered.filter((o) => o.product === filterProduct);
    if (filterType) filtered = filtered.filter((o) => o.order_type === filterType);
    if (tab === 'upcoming') filtered = filtered.filter((o) => o.order_type === 'Keyinroqi');

    setOrders(filtered);
    setLoading(false);
  }, [supabase, filterProduct, filterType, tab]);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  const handleDelete = async () => {
    if (!deleteOrder) return;
    setDeleteLoading(true);
    await supabase.from('orders').delete().eq('id', deleteOrder.id);
    showToast("Zakaz o'chirildi");
    setDeleteOrder(null);
    setDeleteLoading(false);
    loadOrders();
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editOrder) return;
    setEditLoading(true);
    const { error } = await supabase.from('orders').update({
      product: editForm.product,
      price: parseFloat(editForm.price) || 0,
      order_type: editForm.order_type,
      scheduled_date: editForm.order_type === 'Keyinroqi' ? editForm.scheduled_date || null : null,
      comment: editForm.comment,
      updated_at: new Date().toISOString(),
    }).eq('id', editOrder.id);
    if (error) { showToast('Xatolik', 'error'); } else { showToast('Zakaz yangilandi'); setEditOrder(null); loadOrders(); }
    setEditLoading(false);
  };

  return (
    <AppLayout>
      <ToastContainer />
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Zakazlar</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{orders.length} ta natija</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-secondary p-1 rounded-xl w-fit">
          <button onClick={() => setTab('all')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'all' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>Barchasi</button>
          <button onClick={() => setTab('upcoming')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${tab === 'upcoming' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}><Calendar size={14} /> Keyinroqi</button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <select value={filterProduct} onChange={(e) => setFilterProduct(e.target.value)} className="bg-card border border-border rounded-xl px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm">
            <option value="">Barcha mahsulotlar</option>
            {products.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="bg-card border border-border rounded-xl px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm">
            <option value="">Barcha turlar</option>
            <option value="Hozirgi">Hozirgi</option>
            <option value="Keyinroqi">Keyinroqi</option>
          </select>
          {(filterProduct || filterType) && (
            <button onClick={() => { setFilterProduct(''); setFilterType(''); }} className="flex items-center gap-1.5 bg-card border border-border hover:bg-secondary rounded-xl px-3 py-2.5 text-muted-foreground text-sm transition-all">
              <X size={14} /> Tozalash
            </button>
          )}
        </div>

        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Yuklanmoqda...</div>
          ) : orders.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">Hech qanday zakaz topilmadi</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Mijoz</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Mahsulot</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Narx</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden sm:table-cell">Turi</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden md:table-cell">Manba</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden lg:table-cell">Sana</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">Amallar</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-foreground">{order.source_name || '—'}</p>
                        <p className="text-xs text-muted-foreground">{order.source_phone}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="bg-primary/10 text-primary text-xs font-medium px-2.5 py-1 rounded-full">{order.product}</span>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-foreground">{formatPrice(order.price)}</td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <Badge variant={order.order_type === 'Hozirgi' ? 'success' : 'warning'}>{order.order_type}</Badge>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-xs text-muted-foreground capitalize">{order.source_type === 'lead' ? 'Lid' : 'Mijoz'}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground hidden lg:table-cell">
                        {order.order_type === 'Keyinroqi' && order.scheduled_date
                          ? <span className="text-amber-400">{formatDate(order.scheduled_date)}</span>
                          : formatDate(order.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <button
                            onClick={() => {
                              setEditForm({ product: order.product, price: String(order.price), order_type: order.order_type, scheduled_date: order.scheduled_date || '', comment: order.comment });
                              setEditOrder(order);
                            }}
                            className="p-1.5 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                          ><Pencil size={15} /></button>
                          <button onClick={() => setDeleteOrder(order)} className="p-1.5 hover:bg-destructive/10 rounded-lg text-muted-foreground hover:text-destructive transition-colors"><Trash2 size={15} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Edit modal */}
      <Modal open={!!editOrder} onClose={() => setEditOrder(null)} title="Zakazni tahrirlash">
        <form onSubmit={handleEdit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">Mahsulot</label>
            <select value={editForm.product} onChange={(e) => setEditForm({ ...editForm, product: e.target.value as OrderProduct })} className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
              {products.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">Narx (so'm)</label>
            <input type="number" value={editForm.price} onChange={(e) => setEditForm({ ...editForm, price: e.target.value })} className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">Zakaz turi</label>
            <div className="flex gap-2">
              {(['Hozirgi', 'Keyinroqi'] as OrderType[]).map((t) => (
                <button key={t} type="button" onClick={() => setEditForm({ ...editForm, order_type: t })} className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all border ${editForm.order_type === t ? 'bg-primary/15 border-primary/30 text-primary' : 'bg-secondary border-border text-muted-foreground hover:text-foreground'}`}>{t}</button>
              ))}
            </div>
          </div>
          {editForm.order_type === 'Keyinroqi' && (
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">Sana</label>
              <input type="datetime-local" value={editForm.scheduled_date} onChange={(e) => setEditForm({ ...editForm, scheduled_date: e.target.value })} className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">Kommentariya</label>
            <textarea value={editForm.comment} onChange={(e) => setEditForm({ ...editForm, comment: e.target.value })} rows={2} className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={() => setEditOrder(null)} className="flex-1 bg-secondary hover:bg-secondary/80 text-foreground rounded-xl py-2.5 text-sm font-medium transition-all">Bekor qilish</button>
            <button type="submit" disabled={editLoading} className="flex-1 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white rounded-xl py-2.5 text-sm font-medium transition-all">{editLoading ? 'Saqlanmoqda...' : 'Saqlash'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteOrder} onClose={() => setDeleteOrder(null)} onConfirm={handleDelete} loading={deleteLoading} message={`Bu zakazni o'chirishni tasdiqlaysizmi?`} />
    </AppLayout>
  );
}
