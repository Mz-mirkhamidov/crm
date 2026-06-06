'use client';

import { useEffect, useState, useCallback } from 'react';
import { CheckCircle, Trash2, Clock, AlertCircle } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import Badge from '@/components/ui/Badge';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { ToastContainer, showToast } from '@/components/ui/Toast';
import { createClient } from '@/lib/supabase/client';
import { formatDate, isToday, isPast } from '@/lib/utils';
import type { FollowUp } from '@/types';

export default function FollowUpsPage() {
  const supabase = createClient();
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'pending' | 'done'>('pending');
  const [deleteItem, setDeleteItem] = useState<FollowUp | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadFollowUps = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('follow_ups')
      .select(`*, leads(name, phone), clients(name, phone)`)
      .eq('user_id', user.id)
      .eq('status', tab === 'pending' ? 'Kutilmoqda' : 'Bajarildi')
      .order('scheduled_at', { ascending: true });

    const mapped = (data || []).map((f) => ({
      ...f,
      source_name: f.source_type === 'lead' ? f.leads?.name : f.clients?.name,
      source_phone: f.source_type === 'lead' ? f.leads?.phone : f.clients?.phone,
    }));

    setFollowUps(mapped);
    setLoading(false);
  }, [supabase, tab]);

  useEffect(() => { loadFollowUps(); }, [loadFollowUps]);

  const markDone = async (id: string) => {
    await supabase.from('follow_ups').update({ status: 'Bajarildi', updated_at: new Date().toISOString() }).eq('id', id);
    showToast('Bajarildi deb belgilandi');
    loadFollowUps();
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    setDeleteLoading(true);
    await supabase.from('follow_ups').delete().eq('id', deleteItem.id);
    showToast("Follow-up o'chirildi");
    setDeleteItem(null);
    setDeleteLoading(false);
    loadFollowUps();
  };

  const todayItems = followUps.filter((f) => isToday(f.scheduled_at));
  const overdueItems = followUps.filter((f) => isPast(f.scheduled_at) && !isToday(f.scheduled_at));
  const upcomingItems = followUps.filter((f) => !isPast(f.scheduled_at) && !isToday(f.scheduled_at));

  const FollowUpCard = ({ f }: { f: FollowUp }) => {
    const todayItem = isToday(f.scheduled_at);
    const overdue = isPast(f.scheduled_at) && !isToday(f.scheduled_at);

    return (
      <div className={`bg-card border rounded-2xl p-4 flex items-start gap-4 transition-all ${
        todayItem ? 'border-red-500/30 bg-red-500/5' :
        overdue ? 'border-amber-500/30 bg-amber-500/5' :
        'border-border'
      }`}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-foreground">{f.source_name || '—'}</p>
            {todayItem && <Badge variant="danger">Bugun</Badge>}
            {overdue && <Badge variant="warning">Kechikkan</Badge>}
            <span className="text-xs text-muted-foreground capitalize ml-auto">{f.source_type === 'lead' ? 'Lid' : 'Mijoz'}</span>
          </div>
          <p className="text-sm text-muted-foreground">{f.source_phone}</p>
          {f.note && <p className="text-sm text-foreground/80 mt-1">{f.note}</p>}
          <div className="flex items-center gap-1.5 mt-2">
            <Clock size={13} className="text-muted-foreground" />
            <p className="text-xs text-muted-foreground">{formatDate(f.scheduled_at)}</p>
          </div>
        </div>
        {tab === 'pending' && (
          <div className="flex flex-col gap-2">
            <button
              onClick={() => markDone(f.id)}
              className="p-2 hover:bg-emerald-500/10 rounded-xl text-muted-foreground hover:text-emerald-400 transition-colors"
              title="Bajarildi"
            >
              <CheckCircle size={18} />
            </button>
            <button
              onClick={() => setDeleteItem(f)}
              className="p-2 hover:bg-destructive/10 rounded-xl text-muted-foreground hover:text-destructive transition-colors"
              title="O'chirish"
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}
        {tab === 'done' && (
          <button
            onClick={() => setDeleteItem(f)}
            className="p-2 hover:bg-destructive/10 rounded-xl text-muted-foreground hover:text-destructive transition-colors"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>
    );
  };

  return (
    <AppLayout>
      <ToastContainer />
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Follow-ups</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Kelishilgan qo'ng'iroq va uchrashuvlar</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-secondary p-1 rounded-xl w-fit">
          <button onClick={() => setTab('pending')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'pending' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
            Kutilmoqda {tab === 'pending' && followUps.length > 0 && <span className="ml-1.5 bg-primary text-white text-xs px-1.5 py-0.5 rounded-full">{followUps.length}</span>}
          </button>
          <button onClick={() => setTab('done')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'done' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>Bajarildi</button>
        </div>

        {loading ? (
          <div className="text-center text-muted-foreground py-10">Yuklanmoqda...</div>
        ) : followUps.length === 0 ? (
          <div className="text-center text-muted-foreground py-10 bg-card border border-border rounded-2xl">
            {tab === 'pending' ? 'Kutilayotgan follow-uplar yo\'q' : 'Bajarilgan follow-uplar yo\'q'}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Today */}
            {tab === 'pending' && todayItems.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle size={16} className="text-red-400" />
                  <h2 className="text-sm font-semibold text-foreground">Bugun ({todayItems.length})</h2>
                </div>
                <div className="space-y-3">{todayItems.map((f) => <FollowUpCard key={f.id} f={f} />)}</div>
              </div>
            )}

            {/* Overdue */}
            {tab === 'pending' && overdueItems.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Clock size={16} className="text-amber-400" />
                  <h2 className="text-sm font-semibold text-foreground">Kechikkan ({overdueItems.length})</h2>
                </div>
                <div className="space-y-3">{overdueItems.map((f) => <FollowUpCard key={f.id} f={f} />)}</div>
              </div>
            )}

            {/* Upcoming */}
            {tab === 'pending' && upcomingItems.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Clock size={16} className="text-muted-foreground" />
                  <h2 className="text-sm font-semibold text-foreground">Rejalashtirilgan ({upcomingItems.length})</h2>
                </div>
                <div className="space-y-3">{upcomingItems.map((f) => <FollowUpCard key={f.id} f={f} />)}</div>
              </div>
            )}

            {/* Done list */}
            {tab === 'done' && (
              <div className="space-y-3">{followUps.map((f) => <FollowUpCard key={f.id} f={f} />)}</div>
            )}
          </div>
        )}
      </div>

      <ConfirmDialog open={!!deleteItem} onClose={() => setDeleteItem(null)} onConfirm={handleDelete} loading={deleteLoading} message="Bu follow-upni o'chirishni tasdiqlaysizmi?" />
    </AppLayout>
  );
}
