-- =============================================
-- KREATOR HUB — SCHEMA UPDATE v2
-- Run this in Supabase SQL Editor AFTER the first schema
-- =============================================

-- Add new fields to creator_profiles
alter table public.creator_profiles 
  add column if not exists avatar_url text,
  add column if not exists language text default 'en',
  add column if not exists audience_age_13_17 integer default 0,
  add column if not exists audience_age_18_24 integer default 0,
  add column if not exists audience_age_25_34 integer default 0,
  add column if not exists audience_age_35_44 integer default 0,
  add column if not exists audience_age_45_plus integer default 0,
  add column if not exists audience_gender_female integer default 0,
  add column if not exists audience_gender_male integer default 0,
  add column if not exists audience_top_countries text[] default '{}',
  add column if not exists featured_videos jsonb default '[]',
  add column if not exists instagram_url text,
  add column if not exists tiktok_url text,
  add column if not exists youtube_url text;

-- Add new fields to brand_profiles
alter table public.brand_profiles
  add column if not exists status text default 'active' check (status in ('active', 'suspended')),
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text,
  add column if not exists subscription_status text default 'inactive' check (subscription_status in ('inactive', 'active', 'past_due', 'canceled')),
  add column if not exists subscription_end_date timestamptz,
  add column if not exists created_by_admin boolean default false,
  add column if not exists notes text;

-- Update campaigns table with all new fields
alter table public.campaigns
  add column if not exists campaign_type text default 'paid' check (campaign_type in ('paid', 'gifted', 'both')),
  add column if not exists min_followers integer default 0,
  add column if not exists min_engagement numeric(5,2) default 0,
  add column if not exists deliverable_date date,
  add column if not exists content_guidelines text,
  add column if not exists brand_info text,
  add column if not exists what_creator_gets text,
  add column if not exists target_countries text[] default '{}',
  add column if not exists target_age_groups text[] default '{}',
  add column if not exists required_platforms text[] default '{}';

-- Admin table to track who can access admin panel
create table if not exists public.admin_users (
  id uuid references auth.users on delete cascade primary key,
  created_at timestamptz default now()
);

-- Storage bucket for avatars (run this separately in Storage section)
-- insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true);

-- Storage policy (run after creating bucket)
-- create policy "Avatar images are publicly accessible" on storage.objects for select using (bucket_id = 'avatars');
-- create policy "Users can upload their own avatar" on storage.objects for insert with check (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
-- create policy "Users can update their own avatar" on storage.objects for update using (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);


-- =============================================
-- MESSAGES SYSTEM (add to schema v2)
-- =============================================

create table if not exists public.conversations (
  id uuid default uuid_generate_v4() primary key,
  brand_id uuid references public.profiles on delete cascade not null,
  creator_id uuid references public.profiles on delete cascade not null,
  campaign_id uuid references public.campaigns on delete set null,
  created_at timestamptz default now(),
  unique(brand_id, creator_id, campaign_id)
);

create table if not exists public.messages (
  id uuid default uuid_generate_v4() primary key,
  conversation_id uuid references public.conversations on delete cascade not null,
  sender_id uuid references public.profiles on delete cascade not null,
  content text not null,
  read boolean default false,
  created_at timestamptz default now()
);

alter table public.conversations enable row level security;
alter table public.messages enable row level security;

create policy "Users can see their own conversations"
  on public.conversations for select using (
    auth.uid() = brand_id or auth.uid() = creator_id
  );

create policy "Users can create conversations"
  on public.conversations for insert with check (
    auth.uid() = brand_id or auth.uid() = creator_id
  );

create policy "Users can see messages in their conversations"
  on public.messages for select using (
    conversation_id in (
      select id from public.conversations
      where brand_id = auth.uid() or creator_id = auth.uid()
    )
  );

create policy "Users can send messages in their conversations"
  on public.messages for insert with check (
    auth.uid() = sender_id and
    conversation_id in (
      select id from public.conversations
      where brand_id = auth.uid() or creator_id = auth.uid()
    )
  );

create policy "Users can mark messages as read"
  on public.messages for update using (
    conversation_id in (
      select id from public.conversations
      where brand_id = auth.uid() or creator_id = auth.uid()
    )
  );

-- =============================================
-- SITE SETTINGS TABLE
-- =============================================
create table if not exists public.site_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz default now()
);

alter table public.site_settings enable row level security;

create policy "Settings are public readable"
  on public.site_settings for select using (true);

create policy "Only service role can write settings"
  on public.site_settings for all using (false);

-- Default settings
insert into public.site_settings (key, value) values
  ('brand_name', 'KreatorHub'),
  ('primary_color', '#534AB7'),
  ('contact_email', 'hello@kreatorhub.com'),
  ('subscription_price', '99000'),
  ('subscription_currency', '₩'),
  ('landing_title_en', 'Connect creators with the best brands'),
  ('landing_title_es', 'Conecta creadores con las mejores marcas'),
  ('landing_title_ko', '크리에이터와 최고의 브랜드를 연결하다'),
  ('landing_subtitle_en', 'Find campaigns, apply with your profile and collaborate with brands that need your audience'),
  ('landing_subtitle_es', 'Encuentra campañas, aplica con tu perfil y colabora con empresas que necesitan tu audiencia'),
  ('landing_subtitle_ko', '캠페인을 찾고, 프로필로 지원하고, 당신의 팔로워를 필요로 하는 기업과 협력하세요'),
  ('stat_creators', '2,400+'),
  ('stat_brands', '340+'),
  ('stat_campaigns', '1,200+'),
  ('brands_headline_en', 'Find the right creators for your brand'),
  ('brands_headline_es', 'Encuentra los creadores perfectos para tu marca'),
  ('brands_headline_ko', '브랜드에 맞는 크리에이터를 찾으세요'),
  ('brands_subtitle_en', 'Access thousands of verified influencers across Instagram, TikTok and YouTube'),
  ('brands_subtitle_es', 'Accede a miles de influencers verificados en Instagram, TikTok y YouTube'),
  ('brands_subtitle_ko', 'Instagram, TikTok, YouTube의 수천 명의 인증된 인플루언서에 접근하세요')
on conflict (key) do nothing;
