'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Search, Eye, Pencil, Trash2, ShoppingBag, Phone, X } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import OrderForm from '@/components/modules/OrderForm';
import FollowUpForm from '@/components/modules/FollowUpForm';
import { ToastContainer, showToast } from '@/components/ui/Toast';
import { createClient } from '@/lib/supabase/client';
import { formatDate, cn } from '@/lib/utils';
import type { Lead, LeadStatus, Tag } from '@/types';

const DEFAULT_TAGS: Tag[] = ['AJR', 'Estet', 'Excel'];
const STATUSES: LeadStatus[] = ['Yangi', "Ko'rib chiqilmoqda", 'Kelishildi', 'Rad etildi', 'Buyurtma berilgan'];

const statusVariant = (s: LeadStatus) => {
  if (s === 'Yangi') return 'info';
  if (s === "Ko'rib chiqilmoqda") return 'warning';
  if (s === 'Kelishildi') return 'success';
  if (s === 'Rad etildi') return 'danger';
  if (s === 'Buyurtma berilgan') return 'purple';
  return 'default';
};

export default function LeadsPage() {
  const supabase = createClient();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterTag, setFilterTag] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [customTags, setCustomTags] = useState<string[]>([]);

  // Modals
  const [addOpen, setAddOpen] = useState(false);
  const [editLead, setEditLead] = useState<Lead | null>(null);
  const [viewLead, setViewLead] = useState<Lead | null>(null);
  const [deleteLead, setDeleteLead] = useState<Lead | null>(null);
  const [orderLead, setOrderLead] = useState<Lead | null>(null);
  const [followUpLead, setFollowUpLead] = useState<Lead | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Form
  const emptyForm = { name: '', phone: '', address: '', tag: 'AJR' as Tag, status: 'Yangi' as LeadStatus, comment: '' };
  const [form, setForm] = useState(emptyForm);
  const [formLoading, setFormLoading] = useState(false);
  const [newTag, setNewTag] = useState('');

  const allTags = [...DEFAULT_TAGS, ...customTags];

  const loadLeads = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    let query = supabase
      .from('leads')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (filterTag) query = query.eq('tag', filterTag);
    if (filterStatus) query = query.eq('status', filterStatus);

    const { data } = await query;
    let filtered = data || [];

    if (search) {
      filtered = filtered.filter(
        (l) =>
          l.name.toLowerCase().includes(search.toLowerCase()) ||
          l.phone.includes(search)
      );
    }

    setLeads(filtered);
    setLoading(false);
  }, [supabase, filterTag, filterStatus, search]);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (editLead) {
      const { error } = await supabase.from('leads').update({ ...form, updated_at: new Date().toISOString() }).eq('id', editLead.id);
      if (error) { showToast('Xatolik', 'error'); } else { showToast('Lid yangilandi'); setEditLead(null); loadLeads(); }
    } else {
      const { error } = await supabase.from('leads').insert({ ...form, user_id: user.id });
      if (error) { showToast('Xatolik', 'error'); } else { showToast('Lid qo\'shildi'); setAddOpen(false); loadLeads(); }
    }
    setForm(emptyForm);
    setFormLoading(false);
  };

  const handleDelete = async () => {
    if (!deleteLead) return;
    setDeleteLoading(true);
    await supabase.from('leads').delete().eq('id', deleteLead.id);
    showToast("Lid o'chirildi");
    setDeleteLead(null);
    setDeleteLoading(false);
    loadLeads();
  };

  const LeadForm = ({ onClose }: { onClose: () => void }) => (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-sm font-medium text-muted-foreground mb-1.5">Ism *</label>
          <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="To'liq ism" className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
        </div>
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1.5">Telefon</label>
          <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+998..." className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
        </div>
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1.5">Manzil</label>
          <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Shahar / tuman" className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
        </div>
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1.5">Teg</label>
          <div className="flex gap-2">
            <select value={form.tag} onChange={(e) => setForm({ ...form, tag: e.target.value })} className="flex-1 bg-secondary border border-border rounded-xl px-3 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
              {allTags.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1.5">Holat</label>
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as LeadStatus })} className="w-full bg-secondary border border-border rounded-xl px-3 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-muted-foreground mb-1.5">Kommentariya</label>
          <textarea value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} rows={3} placeholder="Erkin yozuv..." className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
        </div>
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
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Lidlar</h1>
            <p className="text-muted-foreground text-sm mt-0.5">{leads.length} ta natija</p>
          </div>
          <button onClick={() => { setForm(emptyForm); setAddOpen(true); }} className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white rounded-xl px-4 py-2.5 text-sm font-medium transition-all">
            <Plus size={16} /> Yangi lid
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Ism yoki telefon..." className="w-full bg-card border border-border rounded-xl pl-9 pr-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm" />
          </div>
          <select value={filterTag} onChange={(e) => setFilterTag(e.target.value)} className="bg-card border border-border rounded-xl px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm">
            <option value="">Barcha teglar</option>
            {allTags.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="bg-card border border-border rounded-xl px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm">
            <option value="">Barcha holatlar</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          {(filterTag || filterStatus || search) && (
            <button onClick={() => { setFilterTag(''); setFilterStatus(''); setSearch(''); }} className="flex items-center gap-1.5 bg-card border border-border hover:bg-secondary rounded-xl px-3 py-2.5 text-muted-foreground text-sm transition-all">
              <X size={14} /> Tozalash
            </button>
          )}
        </div>

        {/* Table */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Yuklanmoqda...</div>
          ) : leads.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">Hech qanday lid topilmadi</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Ism</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Telefon</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden sm:table-cell">Manzil</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden md:table-cell">Teg</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Holat</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden lg:table-cell">Sana</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">Amallar</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => (
                    <tr key={lead.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-foreground">{lead.name}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{lead.phone}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground hidden sm:table-cell">{lead.address}</td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="bg-secondary px-2.5 py-0.5 rounded-full text-xs text-foreground">{lead.tag}</span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={statusVariant(lead.status as LeadStatus)}>{lead.status}</Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground hidden lg:table-cell">{formatDate(lead.created_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <button onClick={() => setViewLead(lead)} className="p-1.5 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground transition-colors" title="Ko'rish"><Eye size={15} /></button>
                          <button onClick={() => { setForm({ name: lead.name, phone: lead.phone, address: lead.address, tag: lead.tag, status: lead.status as LeadStatus, comment: lead.comment }); setEditLead(lead); }} className="p-1.5 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground transition-colors" title="Tahrirlash"><Pencil size={15} /></button>
                          <button onClick={() => setOrderLead(lead)} className="p-1.5 hover:bg-primary/10 rounded-lg text-muted-foreground hover:text-primary transition-colors" title="Zakaz berdi"><ShoppingBag size={15} /></button>
                          <button onClick={() => setFollowUpLead(lead)} className="p-1.5 hover:bg-secondary rounded-lg text-muted-foreground hover:text-amber-400 transition-colors" title="Follow-up"><Phone size={15} /></button>
                          <button onClick={() => setDeleteLead(lead)} className="p-1.5 hover:bg-destructive/10 rounded-lg text-muted-foreground hover:text-destructive transition-colors" title="O'chirish"><Trash2 size={15} /></button>
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

      {/* Add modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Yangi lid qo'shish">
        <LeadForm onClose={() => setAddOpen(false)} />
      </Modal>

      {/* Edit modal */}
      <Modal open={!!editLead} onClose={() => setEditLead(null)} title="Lidni tahrirlash">
        <LeadForm onClose={() => setEditLead(null)} />
      </Modal>

      {/* View modal */}
      {viewLead && (
        <Modal open={!!viewLead} onClose={() => setViewLead(null)} title={viewLead.name} size="lg">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-muted-foreground">Telefon</p><p className="text-sm font-medium text-foreground">{viewLead.phone || '—'}</p></div>
              <div><p className="text-xs text-muted-foreground">Manzil</p><p className="text-sm font-medium text-foreground">{viewLead.address || '—'}</p></div>
              <div><p className="text-xs text-muted-foreground">Teg</p><p className="text-sm font-medium text-foreground">{viewLead.tag}</p></div>
              <div><p className="text-xs text-muted-foreground">Holat</p><Badge variant={statusVariant(viewLead.status as LeadStatus)}>{viewLead.status}</Badge></div>
              <div className="col-span-2"><p className="text-xs text-muted-foreground">Kommentariya</p><p className="text-sm text-foreground mt-1">{viewLead.comment || '—'}</p></div>
              <div><p className="text-xs text-muted-foreground">Qo'shilgan</p><p className="text-sm text-foreground">{formatDate(viewLead.created_at)}</p></div>
            </div>
          </div>
        </Modal>
      )}

      {/* Confirm delete */}
      <ConfirmDialog
        open={!!deleteLead}
        onClose={() => setDeleteLead(null)}
        onConfirm={handleDelete}
        loading={deleteLoading}
        message={`"${deleteLead?.name}" lidini o'chirishni tasdiqlaysizmi?`}
      />

      {/* Order form */}
      {orderLead && (
        <OrderForm
          open={!!orderLead}
          onClose={() => setOrderLead(null)}
          onSuccess={loadLeads}
          sourceType="lead"
          sourceId={orderLead.id}
          sourceName={orderLead.name}
        />
      )}

      {/* Follow-up form */}
      {followUpLead && (
        <FollowUpForm
          open={!!followUpLead}
          onClose={() => setFollowUpLead(null)}
          onSuccess={loadLeads}
          sourceType="lead"
          sourceId={followUpLead.id}
          sourceName={followUpLead.name}
        />
      )}
    </AppLayout>
  );
}
