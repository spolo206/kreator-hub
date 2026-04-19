-- =============================================
-- KREATOR HUB — SUPABASE SCHEMA v2
-- Run this in your Supabase SQL Editor
-- =============================================

create extension if not exists "uuid-ossp";

-- ---- PROFILES ----
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  role text not null check (role in ('creator', 'brand', 'admin')),
  avatar_url text,
  created_at timestamptz default now()
);

-- ---- CREATOR PROFILES ----
create table if not exists public.creator_profiles (
  id uuid references public.profiles on delete cascade primary key,
  handle text,
  bio text,
  location text,
  language text default 'en',
  categories text[] default '{}',
  instagram_url text,
  tiktok_url text,
  youtube_url text,
  instagram_followers integer default 0,
  tiktok_followers integer default 0,
  youtube_followers integer default 0,
  engagement_rate numeric(5,2) default 0,
  -- Audience demographics
  audience_age_13_17 integer default 0,
  audience_age_18_24 integer default 0,
  audience_age_25_34 integer default 0,
  audience_age_35_44 integer default 0,
  audience_age_45_plus integer default 0,
  audience_gender_male integer default 0,
  audience_gender_female integer default 0,
  audience_top_countries text[] default '{}',
  audience_screenshot_url text,
  -- Best content
  video_links text[] default '{}',
  is_visible boolean default true,
  updated_at timestamptz default now()
);

-- ---- BRAND PROFILES ----
create table if not exists public.brand_profiles (
  id uuid references public.profiles on delete cascade primary key,
  company_name text,
  website text,
  industry text,
  description text,
  -- Subscription
  stripe_customer_id text,
  stripe_subscription_id text,
  subscription_status text default 'inactive' check (subscription_status in ('inactive', 'active', 'cancelled', 'past_due')),
  subscription_started_at timestamptz,
  -- Admin approval
  approved_by_admin boolean default false,
  approved_at timestamptz,
  updated_at timestamptz default now()
);

-- ---- CAMPAIGNS ----
create table if not exists public.campaigns (
  id uuid default uuid_generate_v4() primary key,
  brand_id uuid references public.profiles on delete cascade not null,
  -- Multilingual titles/descriptions
  title_en text not null,
  title_es text,
  title_ko text,
  description_en text,
  description_es text,
  description_ko text,
  -- Category & type
  category text not null,
  campaign_type text default 'paid' check (campaign_type in ('paid', 'gifted', 'paid_and_gifted')),
  -- Budget & compensation
  budget_min integer,
  budget_max integer,
  product_description text,
  -- Requirements
  min_followers integer default 0,
  min_engagement numeric(5,2) default 0,
  required_platforms text[] default '{}',
  preferred_locations text[] default '{}',
  preferred_languages text[] default '{}',
  preferred_categories text[] default '{}',
  -- Dates
  application_deadline date,
  deliverable_deadline date,
  -- Content guidelines
  content_guidelines text,
  dos text,
  donts text,
  -- Brand info
  brand_info text,
  hashtags text[] default '{}',
  -- Meta
  spots integer default 1,
  status text default 'active' check (status in ('active', 'paused', 'closed')),
  created_at timestamptz default now()
);

-- ---- APPLICATIONS ----
create table if not exists public.applications (
  id uuid default uuid_generate_v4() primary key,
  campaign_id uuid references public.campaigns on delete cascade not null,
  creator_id uuid references public.profiles on delete cascade not null,
  message text,
  proposed_rate integer,
  status text default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz default now(),
  unique(campaign_id, creator_id)
);

-- =============================================
-- RLS
-- =============================================
alter table public.profiles enable row level security;
alter table public.creator_profiles enable row level security;
alter table public.brand_profiles enable row level security;
alter table public.campaigns enable row level security;
alter table public.applications enable row level security;

-- Drop existing policies if re-running
drop policy if exists "Public profiles are viewable by everyone" on public.profiles;
drop policy if exists "Users can insert their own profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;
drop policy if exists "Creator profiles are public" on public.creator_profiles;
drop policy if exists "Creators can insert their profile" on public.creator_profiles;
drop policy if exists "Creators can update their profile" on public.creator_profiles;
drop policy if exists "Brand profiles are public" on public.brand_profiles;
drop policy if exists "Brands can insert their profile" on public.brand_profiles;
drop policy if exists "Brands can update their profile" on public.brand_profiles;
drop policy if exists "Campaigns are public" on public.campaigns;
drop policy if exists "Brands can create campaigns" on public.campaigns;
drop policy if exists "Brands can update their campaigns" on public.campaigns;
drop policy if exists "Brands can delete their campaigns" on public.campaigns;
drop policy if exists "Creators can create applications" on public.applications;
drop policy if exists "Creators can read their own applications" on public.applications;
drop policy if exists "Brands can update application status" on public.applications;

create policy "Public profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users can insert their own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update their own profile" on public.profiles for update using (auth.uid() = id);

create policy "Creator profiles are public" on public.creator_profiles for select using (true);
create policy "Creators can insert their profile" on public.creator_profiles for insert with check (auth.uid() = id);
create policy "Creators can update their profile" on public.creator_profiles for update using (auth.uid() = id);

create policy "Brand profiles are public" on public.brand_profiles for select using (true);
create policy "Brands can insert their profile" on public.brand_profiles for insert with check (auth.uid() = id);
create policy "Brands can update their profile" on public.brand_profiles for update using (auth.uid() = id);

create policy "Campaigns are public" on public.campaigns for select using (true);
create policy "Brands can create campaigns" on public.campaigns for insert with check (auth.uid() = brand_id);
create policy "Brands can update their campaigns" on public.campaigns for update using (auth.uid() = brand_id);
create policy "Brands can delete their campaigns" on public.campaigns for delete using (auth.uid() = brand_id);

create policy "Creators can create applications" on public.applications for insert with check (auth.uid() = creator_id);
create policy "Creators can read their own applications" on public.applications for select using (
  auth.uid() = creator_id or
  auth.uid() in (select brand_id from public.campaigns where id = campaign_id)
);
create policy "Brands can update application status" on public.applications for update using (
  auth.uid() in (select brand_id from public.campaigns where id = campaign_id)
);

-- =============================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- =============================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id, new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'creator')
  );
  if coalesce(new.raw_user_meta_data->>'role', 'creator') = 'creator' then
    insert into public.creator_profiles (id) values (new.id);
  else
    insert into public.brand_profiles (id, company_name)
    values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''));
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
