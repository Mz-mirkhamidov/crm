// Supabase Edge Function: daily-reminder
// Deploy: supabase functions deploy daily-reminder
// Cron: Every day at 09:00 Tashkent time (UTC+5 = 04:00 UTC)
// supabase.toml: [functions.daily-reminder] schedule = "0 4 * * *"

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')!;
const TELEGRAM_CHAT_ID = Deno.env.get('TELEGRAM_CHAT_ID')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

async function sendTelegramMessage(text: string) {
  await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text,
      parse_mode: 'HTML',
    }),
  });
}

Deno.serve(async () => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  // Get all users
  const { data: users } = await supabase.auth.admin.listUsers();

  for (const user of users?.users || []) {
    const userId = user.id;

    // Today follow-ups
    const { data: followUps } = await supabase
      .from('follow_ups')
      .select('*, leads(name, phone), clients(name, phone)')
      .eq('user_id', userId)
      .eq('status', 'Kutilmoqda')
      .gte('scheduled_at', todayStart.toISOString())
      .lte('scheduled_at', todayEnd.toISOString());

    // Today deadline orders
    const { data: deadlineOrders } = await supabase
      .from('orders')
      .select('*, leads(name, phone), clients(name, phone)')
      .eq('user_id', userId)
      .eq('order_type', 'Keyinroqi')
      .gte('scheduled_date', todayStart.toISOString())
      .lte('scheduled_date', todayEnd.toISOString());

    const hasAnything = (followUps?.length || 0) > 0 || (deadlineOrders?.length || 0) > 0;

    if (!hasAnything) {
      await sendTelegramMessage(
        `✅ <b>Bugun uchun rejalashtirilgan ish yo'q.</b>\n\nYaxshi kun! 🌟`
      );
      continue;
    }

    let message = `🌅 <b>Sellora Plus — Bugungi reja</b>\n\n`;

    // Follow-ups
    if (followUps && followUps.length > 0) {
      message += `📞 <b>Bugun ${followUps.length} ta qo'ng'iroq:</b>\n`;
      for (const f of followUps) {
        const name = f.source_type === 'lead' ? f.leads?.name : f.clients?.name;
        const phone = f.source_type === 'lead' ? f.leads?.phone : f.clients?.phone;
        const time = new Date(f.scheduled_at).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
        message += `  • ${name} (${phone}) — ${time}\n`;
        if (f.note) message += `    💬 ${f.note}\n`;
      }
      message += '\n';
    }

    // Deadline orders
    if (deadlineOrders && deadlineOrders.length > 0) {
      message += `📦 <b>Bugun ${deadlineOrders.length} ta zakaz topshiriladi:</b>\n`;
      for (const o of deadlineOrders) {
        const name = o.source_type === 'lead' ? o.leads?.name : o.clients?.name;
        const time = o.scheduled_date
          ? new Date(o.scheduled_date).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })
          : '';
        message += `  • ${name} — ${o.product}${time ? ', ' + time : ''}\n`;
      }
    }

    await sendTelegramMessage(message);
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
