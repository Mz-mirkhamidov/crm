'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Search, Eye, Pencil, Trash2, ShoppingBag, Phone, X } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import OrderForm from '@/components/modules/OrderForm';
import FollowUpForm from '@/components/modules/FollowUpForm';
import { ToastContainer, showToast } from '@/components/ui/Toast';
import { createClient } from '@/lib/supabase/client';
import { formatDate } from '@/lib/utils';
import type { Client } from '@/types';

export default function ClientsPage() {
  const supabase = createClient();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [addOpen, setAddOpen] = useState(false);
  const [editClient, setEditClient] = useState<Client | null>(null);
  const [viewClient, setViewClient] = useState<Client | null>(null);
  const [deleteClient, setDeleteClient] = useState<Client | null>(null);
  const [orderClient, setOrderClient] = useState<Client | null>(null);
  const [followUpClient, setFollowUpClient] = useState<Client | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const emptyForm = { name: '', phone: '', address: '', comment: '' };
  const [form, setForm] = useState(emptyForm);
  const [formLoading, setFormLoading] = useState(false);

  const loadClients = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('clients')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    let filtered = data || [];
    if (search) {
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.phone.includes(search)
      );
    }
    setClients(filtered);
    setLoading(false);
  }, [supabase, search]);

  useEffect(() => { loadClients(); }, [loadClients]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (editClient) {
      const { error } = await supabase.from('clients').update({ ...form, updated_at: new Date().toISOString() }).eq('id', editClient.id);
      if (error) { showToast('Xatolik', 'error'); } else { showToast('Mijoz yangilandi'); setEditClient(null); loadClients(); }
    } else {
      const { error } = await supabase.from('clients').insert({ ...form, user_id: user.id });
      if (error) { showToast('Xatolik', 'error'); } else { showToast('Mijoz qo\'shildi'); setAddOpen(false); loadClients(); }
    }
    setForm(emptyForm);
    setFormLoading(false);
  };

  const handleDelete = async () => {
    if (!deleteClient) return;
    setDeleteLoading(true);
    await supabase.from('clients').delete().eq('id', deleteClient.id);
    showToast("Mijoz o'chirildi");
    setDeleteClient(null);
    setDeleteLoading(false);
    loadClients();
  };

  const ClientForm = ({ onClose }: { onClose: () => void }) => (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-muted-foreground mb-1.5">Ism *</label>
        <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="To'liq ism" className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1.5">Telefon</label>
          <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+998..." className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
        </div>
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1.5">Manzil</label>
          <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Shahar / tuman" className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-muted-foreground mb-1.5">Kommentariya</label>
        <textarea value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} rows={3} placeholder="Tarix, eslatma..." className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
      </div>
      <div className="flex gap-3 pt-1">
        <button type="button" onClick={onClose} className="flex-1 bg-secondary hover:bg-secondary/80 text-foreground rounded-xl py-2.5 text-sm font-medium transition-all">Bekor qilish</button>
        <button type="submit" disabled={formLoading} className="flex-1 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white rounded-xl py-2.5 text-sm font-medium transition-all">{formLoading ? 'Saqlanmoqda...' : 'Saqlash'}</button>
      </div>
    </form>
  );

  return (
    <AppLayout>
      <ToastContainer />
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Mijozlar</h1>
            <p className="text-muted-foreground text-sm mt-0.5">{clients.length} ta natija</p>
          </div>
          <button onClick={() => { setForm(emptyForm); setAddOpen(true); }} className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white rounded-xl px-4 py-2.5 text-sm font-medium transition-all">
            <Plus size={16} /> Yangi mijoz
          </button>
        </div>

        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Ism yoki telefon..." className="w-full bg-card border border-border rounded-xl pl-9 pr-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm" />
          </div>
          {search && (
            <button onClick={() => setSearch('')} className="flex items-center gap-1.5 bg-card border border-border hover:bg-secondary rounded-xl px-3 py-2.5 text-muted-foreground text-sm transition-all">
              <X size={14} /> Tozalash
            </button>
          )}
        </div>

        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Yuklanmoqda...</div>
          ) : clients.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">Hech qanday mijoz topilmadi</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Ism</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Telefon</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden sm:table-cell">Manzil</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden lg:table-cell">Sana</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">Amallar</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map((client) => (
                    <tr key={client.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-foreground">{client.name}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{client.phone}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground hidden sm:table-cell">{client.address}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground hidden lg:table-cell">{formatDate(client.created_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <button onClick={() => setViewClient(client)} className="p-1.5 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground transition-colors"><Eye size={15} /></button>
                          <button onClick={() => { setForm({ name: client.name, phone: client.phone, address: client.address, comment: client.comment }); setEditClient(client); }} className="p-1.5 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground transition-colors"><Pencil size={15} /></button>
                          <button onClick={() => setOrderClient(client)} className="p-1.5 hover:bg-primary/10 rounded-lg text-muted-foreground hover:text-primary transition-colors"><ShoppingBag size={15} /></button>
                          <button onClick={() => setFollowUpClient(client)} className="p-1.5 hover:bg-secondary rounded-lg text-muted-foreground hover:text-amber-400 transition-colors"><Phone size={15} /></button>
                          <button onClick={() => setDeleteClient(client)} className="p-1.5 hover:bg-destructive/10 rounded-lg text-muted-foreground hover:text-destructive transition-colors"><Trash2 size={15} /></button>
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

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Yangi mijoz qo'shish"><ClientForm onClose={() => setAddOpen(false)} /></Modal>
      <Modal open={!!editClient} onClose={() => setEditClient(null)} title="Mijozni tahrirlash"><ClientForm onClose={() => setEditClient(null)} /></Modal>

      {viewClient && (
        <Modal open={!!viewClient} onClose={() => setViewClient(null)} title={viewClient.name}>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-muted-foreground">Telefon</p><p className="text-sm font-medium text-foreground">{viewClient.phone || '—'}</p></div>
              <div><p className="text-xs text-muted-foreground">Manzil</p><p className="text-sm font-medium text-foreground">{viewClient.address || '—'}</p></div>
              <div className="col-span-2"><p className="text-xs text-muted-foreground">Kommentariya</p><p className="text-sm text-foreground mt-1">{viewClient.comment || '—'}</p></div>
              <div><p className="text-xs text-muted-foreground">Qo'shilgan</p><p className="text-sm text-foreground">{formatDate(viewClient.created_at)}</p></div>
            </div>
          </div>
        </Modal>
      )}

      <ConfirmDialog open={!!deleteClient} onClose={() => setDeleteClient(null)} onConfirm={handleDelete} loading={deleteLoading} message={`"${deleteClient?.name}" mijozini o'chirishni tasdiqlaysizmi?`} />

      {orderClient && <OrderForm open={!!orderClient} onClose={() => setOrderClient(null)} onSuccess={loadClients} sourceType="client" sourceId={orderClient.id} sourceName={orderClient.name} />}
      {followUpClient && <FollowUpForm open={!!followUpClient} onClose={() => setFollowUpClient(null)} onSuccess={loadClients} sourceType="client" sourceId={followUpClient.id} sourceName={followUpClient.name} />}
    </AppLayout>
  );
}
