'use client';

import { useEffect, useState, useCallback } from 'react';
import { Users, ShoppingBag, Phone, Clock, TrendingUp } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import AppLayout from '@/components/layout/AppLayout';
import { ToastContainer } from '@/components/ui/Toast';
import { createClient } from '@/lib/supabase/client';
import { formatPrice, formatDate, isToday } from '@/lib/utils';
import type { DashboardStats } from '@/types';

export default function DashboardPage() {
  const supabase = createClient();
  const [stats, setStats] = useState<DashboardStats>({
    todayLeads: 0,
    totalOrders: 0,
    totalOrdersAmount: 0,
    todayFollowUps: 0,
    todayDeadlineOrders: 0,
    todayFollowUpsList: [],
    todayOrdersList: [],
    last7DaysLeads: [],
  });
  const [loading, setLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Today leads
    const { count: todayLeadsCount } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', todayStart.toISOString())
      .lte('created_at', todayEnd.toISOString());

    // Total orders + amount
    const { data: ordersData } = await supabase
      .from('orders')
      .select('id, price')
      .eq('user_id', user.id);

    const totalOrders = ordersData?.length || 0;
    const totalOrdersAmount = ordersData?.reduce((sum, o) => sum + (o.price || 0), 0) || 0;

    // Today follow-ups
    const { data: followUpsData } = await supabase
      .from('follow_ups')
      .select('*, leads(name, phone), clients(name, phone)')
      .eq('user_id', user.id)
      .eq('status', 'Kutilmoqda')
      .gte('scheduled_at', todayStart.toISOString())
      .lte('scheduled_at', todayEnd.toISOString());

    const todayFollowUps = followUpsData?.map((f) => ({
      ...f,
      source_name: f.source_type === 'lead' ? (f.leads as any)?.name : (f.clients as any)?.name,
      source_phone: f.source_type === 'lead' ? (f.leads as any)?.phone : (f.clients as any)?.phone,
    })) || [];

    // Today deadline orders
    const { data: todayOrders } = await supabase
      .from('orders')
      .select('*, leads(name, phone), clients(name, phone)')
      .eq('user_id', user.id)
      .eq('order_type', 'Keyinroqi')
      .gte('scheduled_date', todayStart.toISOString())
      .lte('scheduled_date', todayEnd.toISOString());

    const todayOrdersList = todayOrders?.map((o) => ({
      ...o,
      source_name: o.source_type === 'lead' ? (o.leads as any)?.name : (o.clients as any)?.name,
      source_phone: o.source_type === 'lead' ? (o.leads as any)?.phone : (o.clients as any)?.phone,
    })) || [];

    // Last 7 days leads chart
    const chartData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const dEnd = new Date(d);
      dEnd.setHours(23, 59, 59, 999);

      const { count } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', d.toISOString())
        .lte('created_at', dEnd.toISOString());

      chartData.push({
        date: d.toLocaleDateString('uz-UZ', { month: 'short', day: 'numeric' }),
        count: count || 0,
      });
    }

    setStats({
      todayLeads: todayLeadsCount || 0,
      totalOrders,
      totalOrdersAmount,
      todayFollowUps: todayFollowUps.length,
      todayDeadlineOrders: todayOrdersList.length,
      todayFollowUpsList: todayFollowUps,
      todayOrdersList,
      last7DaysLeads: chartData,
    });
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const statCards = [
    {
      label: 'Bugungi yangi lidlar',
      value: stats.todayLeads,
      icon: Users,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
    },
    {
      label: 'Umumiy zakazlar',
      value: `${stats.totalOrders} ta · ${formatPrice(stats.totalOrdersAmount)}`,
      icon: ShoppingBag,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
    },
    {
      label: "Bugun qo'ng'iroq",
      value: stats.todayFollowUps,
      icon: Phone,
      color: 'text-red-400',
      bg: 'bg-red-500/10',
      badge: stats.todayFollowUps > 0,
    },
    {
      label: 'Bugun topshirish',
      value: stats.todayDeadlineOrders,
      icon: Clock,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
    },
  ];

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full min-h-[60vh]">
          <div className="text-muted-foreground">Yuklanmoqda...</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <ToastContainer />
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {new Date().toLocaleDateString('uz-UZ', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.label}
                className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4"
              >
                <div className={`w-11 h-11 rounded-xl ${card.bg} flex items-center justify-center shrink-0`}>
                  <Icon size={20} className={card.color} />
                </div>
                <div className="min-w-0">
                  <p className="text-muted-foreground text-xs font-medium truncate">{card.label}</p>
                  <p className="text-foreground font-bold text-lg leading-tight truncate">
                    {card.value}
                    {card.badge && (
                      <span className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold">
                        !
                      </span>
                    )}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Chart + Today's lists */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Chart */}
          <div className="xl:col-span-2 bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp size={18} className="text-primary" />
              <h2 className="font-semibold text-foreground">Oxirgi 7 kun — lidlar</h2>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={stats.last7DaysLeads}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '12px',
                    color: 'hsl(var(--foreground))',
                    fontSize: 12,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))', strokeWidth: 0, r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Lidlar"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Today follow-ups */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Phone size={16} className="text-red-400" />
              <h2 className="font-semibold text-foreground text-sm">Bugungi qo'ng'iroqlar</h2>
              {stats.todayFollowUps > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {stats.todayFollowUps}
                </span>
              )}
            </div>
            {stats.todayFollowUpsList.length === 0 ? (
              <p className="text-muted-foreground text-sm">Bugun qo'ng'iroq yo'q</p>
            ) : (
              <div className="space-y-3">
                {stats.todayFollowUpsList.map((f) => (
                  <div key={f.id} className="bg-secondary rounded-xl px-4 py-3">
                    <p className="font-medium text-foreground text-sm">{f.source_name}</p>
                    <p className="text-muted-foreground text-xs">{f.source_phone}</p>
                    {f.note && <p className="text-muted-foreground text-xs mt-1 truncate">{f.note}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Today orders */}
        {stats.todayOrdersList.length > 0 && (
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock size={16} className="text-amber-400" />
              <h2 className="font-semibold text-foreground text-sm">Bugun topshiriladigan zakazlar</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {stats.todayOrdersList.map((o) => (
                <div key={o.id} className="bg-secondary rounded-xl px-4 py-3">
                  <p className="font-medium text-foreground text-sm">{o.source_name}</p>
                  <p className="text-primary text-xs font-medium">{o.product}</p>
                  <p className="text-muted-foreground text-xs">{formatPrice(o.price)}</p>
                  {o.scheduled_date && (
                    <p className="text-amber-400 text-xs mt-1">{formatDate(o.scheduled_date)}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
