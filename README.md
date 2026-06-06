# 🚀 Sellora Plus CRM

Shaxsiy CRM tizimi — lidlar, mijozlar, zakazlar va follow-uplarni boshqarish uchun.

---

## 📋 Stack

| Qatlam | Texnologiya |
|--------|-------------|
| Frontend | Next.js 14 (App Router) |
| Ma'lumotlar ombori | Supabase (PostgreSQL + Auth + RLS) |
| UI | Tailwind CSS |
| Deploy | Vercel |
| Telegram Bot | Supabase Edge Functions |

---

## ⚡ O'rnatish

### 1. Supabase loyiha yaratish

1. [supabase.com](https://supabase.com) ga kiring → New project
2. Project URL va anon key ni nusxalang
3. **SQL Editor** ga kiring va `supabase/migrations/001_initial_schema.sql` ni ishga tushiring
4. **Authentication → Providers** da Email providerini yoqing
5. **Authentication → Users** da birinchi foydalanuvchi qo'shing:
   - Email: `mz@crm.uz`
   - Password: `mz_crm`
   - ✅ "Auto Confirm User" ni belgilang

### 2. Loyihani klonlash

```bash
git clone https://github.com/sizning-repo/sellora-plus-crm.git
cd sellora-plus-crm
npm install
```

### 3. Environment variables

`.env.local.example` faylini `.env.local` ga nusxalang:

```bash
cp .env.local.example .env.local
```

`.env.local` faylini to'ldiring:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
TELEGRAM_BOT_TOKEN=123456789:AAF...
TELEGRAM_CHAT_ID=123456789
ADMIN_SECRET_KEY=sizning_maxfiy_kalit
```

### 4. Lokal ishga tushirish

```bash
npm run dev
```

`http://localhost:3000` da ochiladi → `/login` ga yo'naltiriladi.

---

## 🚢 Vercel Deploy

1. GitHub ga push qiling
2. [vercel.com](https://vercel.com) → Import Project
3. Environment Variables qo'shing (`.env.local` dagi barcha qiymatlar)
4. Deploy!

---

## 📱 Telegram Bot

### Bot yaratish

1. Telegram da `@BotFather` ga yozing
2. `/newbot` → bot nomini bering
3. Token ni nusxalang → `TELEGRAM_BOT_TOKEN`

### Chat ID olish

1. `@userinfobot` ga `/start` yozing → ID ni nusxalang → `TELEGRAM_CHAT_ID`

### Edge Function deploy

```bash
# Supabase CLI o'rnatish
npm install -g supabase

# Login
supabase login

# Loyiha bilan ulash
supabase link --project-ref YOUR_PROJECT_REF

# Secrets qo'shish
supabase secrets set TELEGRAM_BOT_TOKEN=your_token
supabase secrets set TELEGRAM_CHAT_ID=your_chat_id

# Function deploy
supabase functions deploy daily-reminder
```

### Cron schedule

Supabase Dashboard → Edge Functions → `daily-reminder` → **Schedules** tab:
- Cron expression: `0 4 * * *` (har kuni 04:00 UTC = 09:00 Toshkent)

---

## 🔐 Admin Panel

`/admin` sahifasiga kiring.

- **Admin Kalit** = `.env.local` da `ADMIN_SECRET_KEY` ga qo'ygan qiymat
- Email + Parol bilan yangi foydalanuvchi qo'shing

---

## 📁 Loyiha strukturasi

```
sellora-plus-crm/
├── src/
│   ├── app/
│   │   ├── login/          # Login sahifasi
│   │   ├── dashboard/      # Bosh sahifa + statistika
│   │   ├── leads/          # Lidlar moduli
│   │   ├── clients/        # Mijozlar moduli
│   │   ├── orders/         # Zakazlar moduli
│   │   ├── follow-ups/     # Follow-up moduli
│   │   ├── admin/          # Admin panel
│   │   └── api/            # API routes
│   ├── components/
│   │   ├── ui/             # Modal, Badge, Toast, ConfirmDialog
│   │   ├── layout/         # Sidebar, AppLayout
│   │   └── modules/        # OrderForm, FollowUpForm
│   ├── lib/
│   │   ├── supabase/       # Client + Server
│   │   └── utils.ts        # Yordamchi funksiyalar
│   ├── types/              # TypeScript turlari
│   └── middleware.ts       # Auth yo'naltirish
├── supabase/
│   ├── migrations/         # SQL schema
│   └── functions/          # Edge Functions (Telegram bot)
└── vercel.json
```

---

## 🎨 Modullar

| Sahifa | URL | Tavsif |
|--------|-----|--------|
| Dashboard | `/dashboard` | Statistika + grafik + bugungi reja |
| Lidlar | `/leads` | Yangi so'rovlar — CRUD + filter + qidiruv |
| Mijozlar | `/clients` | Qayta mijozlar — CRUD |
| Zakazlar | `/orders` | Barcha buyurtmalar |
| Follow-ups | `/follow-ups` | Kelishilgan qo'ng'iroqlar |
| Login | `/login` | Kirish sahifasi |
| Admin | `/admin` | Foydalanuvchi qo'shish |

---

## 🛠 Muhim eslatmalar

- Barcha jadvallar **RLS** bilan himoyalangan — har bir foydalanuvchi faqat o'z ma'lumotlarini ko'radi
- `.env.local` faylini hech qachon GitHubga yuklamang (`.gitignore` da bor)
- `ADMIN_SECRET_KEY` ni murakkab qilib belgilang

---

*Sellora Plus CRM v1.0 — 2026*
