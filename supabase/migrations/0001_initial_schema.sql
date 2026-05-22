-- ============================================================================
-- Hollywood — Phase 1 (Brand Vault) — Initial schema
-- Migration: 0001_initial_schema.sql
--
-- Creates: profiles, brands, brand_identities, brand_logos, stock_assets,
--          brand_references. Enables RLS on all of them with authenticated-only
--          policies. Adds a trigger to auto-create a profile on signup, an
--          updated_at trigger, and three private Storage buckets with policies.
--
-- NOTE: gen_random_uuid() is built into Postgres on Supabase (no extension
--       needed).
-- ============================================================================


-- ----------------------------------------------------------------------------
-- Shared helper: keep updated_at in sync on every UPDATE
-- ----------------------------------------------------------------------------
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- ----------------------------------------------------------------------------
-- 1. profiles — extends auth.users
-- ----------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  avatar_url text,
  role text not null default 'member' check (role in ('admin', 'member')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();


-- ----------------------------------------------------------------------------
-- 2. brands — clients / projects
-- ----------------------------------------------------------------------------
create table public.brands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  industry text,                      -- e.g. 'hospitality', 'restaurant', 'retail'
  description text,
  created_by uuid references public.profiles (id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger brands_set_updated_at
  before update on public.brands
  for each row execute function public.handle_updated_at();

create index brands_created_by_idx on public.brands (created_by);


-- ----------------------------------------------------------------------------
-- 3. brand_identities — visual identity of each brand (one per brand)
-- ----------------------------------------------------------------------------
create table public.brand_identities (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null unique references public.brands (id) on delete cascade,
  -- Palette as JSONB: [{ "name": "primary", "hex": "#E84C24", "usage": "CTA, headlines" }]
  color_palette jsonb default '[]'::jsonb,
  -- Typography: [{ "family": "Inter", "usage": "body", "weights": [400, 600] }]
  typography jsonb default '[]'::jsonb,
  voice_description text,
  voice_examples_good text[],
  voice_examples_bad text[],
  dos text[],
  donts text[],
  notes text,
  updated_at timestamptz default now()
);

create trigger brand_identities_set_updated_at
  before update on public.brand_identities
  for each row execute function public.handle_updated_at();


-- ----------------------------------------------------------------------------
-- 4. brand_logos — multiple logo versions per brand
-- ----------------------------------------------------------------------------
create table public.brand_logos (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands (id) on delete cascade,
  variant text not null,              -- 'primary', 'horizontal', 'isotype', 'mono-light', 'mono-dark'
  storage_path text not null,         -- path in Supabase Storage
  file_format text,                   -- 'svg', 'png', 'pdf'
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index brand_logos_brand_id_idx on public.brand_logos (brand_id);

create trigger brand_logos_set_updated_at
  before update on public.brand_logos
  for each row execute function public.handle_updated_at();


-- ----------------------------------------------------------------------------
-- 5. stock_assets — image stock
-- ----------------------------------------------------------------------------
create table public.stock_assets (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands (id) on delete cascade,
  storage_path text not null,
  title text,
  description text,
  category text,                      -- 'lobby', 'room', 'food', 'exterior', 'people', 'detail', 'other'
  tags text[] default '{}',
  width int,
  height int,
  file_size_bytes bigint,
  mime_type text,
  uploaded_by uuid references public.profiles (id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index stock_assets_brand_id_idx on public.stock_assets (brand_id);
create index stock_assets_category_idx on public.stock_assets (category);
create index stock_assets_tags_idx on public.stock_assets using gin (tags);
create index stock_assets_uploaded_by_idx on public.stock_assets (uploaded_by);

create trigger stock_assets_set_updated_at
  before update on public.stock_assets
  for each row execute function public.handle_updated_at();


-- ----------------------------------------------------------------------------
-- 6. brand_references — past pieces / inspiration
-- ----------------------------------------------------------------------------
create table public.brand_references (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands (id) on delete cascade,
  storage_path text,
  external_url text,
  title text,
  notes text,
  performance_notes text,             -- 'did it work? why?'
  is_good_example boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index brand_references_brand_id_idx on public.brand_references (brand_id);

create trigger brand_references_set_updated_at
  before update on public.brand_references
  for each row execute function public.handle_updated_at();


-- ============================================================================
-- Auto-create a profile row when a new auth.users record is created.
-- SECURITY DEFINER + empty search_path is the Supabase-recommended secure
-- pattern (prevents search_path hijacking); all objects are fully qualified.
-- ============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ============================================================================
-- Row Level Security
--
-- Policy model for Phase 1 (internal use): any authenticated user can read and
-- write everything. Roles (admin/member) will be enforced in a later phase.
-- The anon role gets NO access (no policies = denied).
-- ============================================================================

-- ---- profiles ----
alter table public.profiles enable row level security;

create policy "profiles_select_authenticated" on public.profiles
  for select to authenticated using (true);
create policy "profiles_insert_authenticated" on public.profiles
  for insert to authenticated with check (true);
create policy "profiles_update_authenticated" on public.profiles
  for update to authenticated using (true) with check (true);
create policy "profiles_delete_authenticated" on public.profiles
  for delete to authenticated using (true);

-- ---- brands ----
alter table public.brands enable row level security;

create policy "brands_select_authenticated" on public.brands
  for select to authenticated using (true);
create policy "brands_insert_authenticated" on public.brands
  for insert to authenticated with check (true);
create policy "brands_update_authenticated" on public.brands
  for update to authenticated using (true) with check (true);
create policy "brands_delete_authenticated" on public.brands
  for delete to authenticated using (true);

-- ---- brand_identities ----
alter table public.brand_identities enable row level security;

create policy "brand_identities_select_authenticated" on public.brand_identities
  for select to authenticated using (true);
create policy "brand_identities_insert_authenticated" on public.brand_identities
  for insert to authenticated with check (true);
create policy "brand_identities_update_authenticated" on public.brand_identities
  for update to authenticated using (true) with check (true);
create policy "brand_identities_delete_authenticated" on public.brand_identities
  for delete to authenticated using (true);

-- ---- brand_logos ----
alter table public.brand_logos enable row level security;

create policy "brand_logos_select_authenticated" on public.brand_logos
  for select to authenticated using (true);
create policy "brand_logos_insert_authenticated" on public.brand_logos
  for insert to authenticated with check (true);
create policy "brand_logos_update_authenticated" on public.brand_logos
  for update to authenticated using (true) with check (true);
create policy "brand_logos_delete_authenticated" on public.brand_logos
  for delete to authenticated using (true);

-- ---- stock_assets ----
alter table public.stock_assets enable row level security;

create policy "stock_assets_select_authenticated" on public.stock_assets
  for select to authenticated using (true);
create policy "stock_assets_insert_authenticated" on public.stock_assets
  for insert to authenticated with check (true);
create policy "stock_assets_update_authenticated" on public.stock_assets
  for update to authenticated using (true) with check (true);
create policy "stock_assets_delete_authenticated" on public.stock_assets
  for delete to authenticated using (true);

-- ---- brand_references ----
alter table public.brand_references enable row level security;

create policy "brand_references_select_authenticated" on public.brand_references
  for select to authenticated using (true);
create policy "brand_references_insert_authenticated" on public.brand_references
  for insert to authenticated with check (true);
create policy "brand_references_update_authenticated" on public.brand_references
  for update to authenticated using (true) with check (true);
create policy "brand_references_delete_authenticated" on public.brand_references
  for delete to authenticated using (true);


-- ============================================================================
-- Storage buckets (all private) + policies
--
-- Buckets are private (public = false), so objects are only reachable through
-- an authenticated client or a signed URL. The policies below grant any
-- authenticated user full access to objects in these three buckets.
-- ============================================================================
insert into storage.buckets (id, name, public)
values
  ('logos', 'logos', false),
  ('stock', 'stock', false),
  ('references', 'references', false)
on conflict (id) do nothing;

-- storage.objects already has RLS enabled by Supabase; we just add policies.
--
-- Phase 1 model: any authenticated user can access all buckets. Refactor when
-- role-based access is introduced in a later phase.
create policy "storage_select_authenticated" on storage.objects
  for select to authenticated
  using (bucket_id in ('logos', 'stock', 'references'));

create policy "storage_insert_authenticated" on storage.objects
  for insert to authenticated
  with check (bucket_id in ('logos', 'stock', 'references'));

create policy "storage_update_authenticated" on storage.objects
  for update to authenticated
  using (bucket_id in ('logos', 'stock', 'references'))
  with check (bucket_id in ('logos', 'stock', 'references'));

create policy "storage_delete_authenticated" on storage.objects
  for delete to authenticated
  using (bucket_id in ('logos', 'stock', 'references'));
