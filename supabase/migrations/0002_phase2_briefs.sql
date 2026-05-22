-- ============================================================================
-- Hollywood — Phase 2 (Idea Agent) — Briefs schema
-- Migration: 0002_phase2_briefs.sql
--
-- Adds: generation_sessions (one row per generation call), briefs (one row per
-- generated idea), brief_comments (free-form feedback). RLS enabled on all
-- three with the same Phase 1/2 authenticated-only model.
--
-- Reuses public.handle_updated_at() created in 0001_initial_schema.sql.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. generation_sessions — groups the ideas produced by a single agent call
-- ----------------------------------------------------------------------------
create table public.generation_sessions (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands (id) on delete cascade,
  user_id uuid references public.profiles (id),
  occasion text,                      -- e.g. 'Día de las Madres'
  objective text not null check (objective in ('awareness', 'promotion', 'event', 'engagement')),
  num_ideas_requested int not null check (num_ideas_requested between 1 and 15),
  format_preferences text[],          -- e.g. {'post','story','carousel'}
  extra_notes text,
  status text not null default 'running' check (status in ('running', 'completed', 'failed')),
  error_message text,                 -- populated when status = 'failed'
  total_cost_usd numeric(10, 6) default 0 check (total_cost_usd >= 0),
  started_at timestamptz default now(),
  completed_at timestamptz,
  updated_at timestamptz default now()
);

create index generation_sessions_brand_id_idx on public.generation_sessions (brand_id);
create index generation_sessions_user_id_idx on public.generation_sessions (user_id);
create index generation_sessions_status_idx on public.generation_sessions (status);

create trigger generation_sessions_set_updated_at
  before update on public.generation_sessions
  for each row execute function public.handle_updated_at();


-- ----------------------------------------------------------------------------
-- 2. briefs — one generated idea. brand_id is denormalized from the session
--    on purpose, so listing briefs by brand is a direct query (no join).
-- ----------------------------------------------------------------------------
create table public.briefs (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.generation_sessions (id) on delete cascade,
  brand_id uuid not null references public.brands (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  rejection_reason text,
  -- Creative content
  concept text not null,
  headline text not null,
  copy_body text not null,
  cta text,
  hashtags text[] default '{}',
  -- Format: [{ "type": "post", "dimensions": "1080x1080" }]
  format_suggestions jsonb default '[]'::jsonb,
  -- Visual brief for Phase 3: image description, text position, colors
  visual_brief jsonb,
  -- References to stock_assets the agent suggested
  suggested_stock_ids uuid[] default '{}',
  -- Traceability / debugging
  model_used text not null,
  tokens_input int,
  tokens_output int,
  cost_usd numeric(10, 6) check (cost_usd >= 0),
  raw_prompt text,                    -- exact prompt sent (debugging)
  raw_response text,                  -- raw model response (debugging)
  created_by uuid references public.profiles (id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index briefs_session_id_idx on public.briefs (session_id);
create index briefs_brand_id_idx on public.briefs (brand_id);
create index briefs_status_idx on public.briefs (status);
create index briefs_created_by_idx on public.briefs (created_by);
create index briefs_hashtags_idx on public.briefs using gin (hashtags);

create trigger briefs_set_updated_at
  before update on public.briefs
  for each row execute function public.handle_updated_at();


-- ----------------------------------------------------------------------------
-- 3. brief_comments — free-form feedback on a brief
-- ----------------------------------------------------------------------------
create table public.brief_comments (
  id uuid primary key default gen_random_uuid(),
  brief_id uuid not null references public.briefs (id) on delete cascade,
  user_id uuid not null references public.profiles (id),
  body text not null,
  created_at timestamptz default now()
);

create index brief_comments_brief_id_idx on public.brief_comments (brief_id);
create index brief_comments_user_id_idx on public.brief_comments (user_id);


-- ============================================================================
-- Row Level Security
--
-- Phase 1/2 model: any authenticated user can read and write everything.
-- Role-based access (admin/member) will be enforced in a later phase.
-- The anon role gets NO access (no policies = denied).
-- ============================================================================

-- ---- generation_sessions ----
alter table public.generation_sessions enable row level security;

create policy "generation_sessions_select_authenticated" on public.generation_sessions
  for select to authenticated using (true);
create policy "generation_sessions_insert_authenticated" on public.generation_sessions
  for insert to authenticated with check (true);
create policy "generation_sessions_update_authenticated" on public.generation_sessions
  for update to authenticated using (true) with check (true);
create policy "generation_sessions_delete_authenticated" on public.generation_sessions
  for delete to authenticated using (true);

-- ---- briefs ----
alter table public.briefs enable row level security;

create policy "briefs_select_authenticated" on public.briefs
  for select to authenticated using (true);
create policy "briefs_insert_authenticated" on public.briefs
  for insert to authenticated with check (true);
create policy "briefs_update_authenticated" on public.briefs
  for update to authenticated using (true) with check (true);
create policy "briefs_delete_authenticated" on public.briefs
  for delete to authenticated using (true);

-- ---- brief_comments ----
alter table public.brief_comments enable row level security;

create policy "brief_comments_select_authenticated" on public.brief_comments
  for select to authenticated using (true);
create policy "brief_comments_insert_authenticated" on public.brief_comments
  for insert to authenticated with check (true);
create policy "brief_comments_update_authenticated" on public.brief_comments
  for update to authenticated using (true) with check (true);
create policy "brief_comments_delete_authenticated" on public.brief_comments
  for delete to authenticated using (true);
