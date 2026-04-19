# Influence — Influencer Marketing Platform

Connect content creators with brands. Supports English, Spanish, and Korean.

## Stack
- **Frontend**: Next.js 14 + Tailwind CSS
- **Database + Auth**: Supabase (free tier)
- **Hosting**: Vercel (free tier)

## Setup

### 1. Supabase
1. Create project at supabase.com
2. Go to SQL Editor → run `supabase-schema.sql`
3. Enable Google OAuth in Authentication → Providers
4. Copy your project URL and anon key

### 2. Environment
Create `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### 3. Deploy to Vercel
1. Push to GitHub
2. Import in vercel.com
3. Add env variables
4. Deploy!

## Local development
```bash
npm install
npm run dev
```
