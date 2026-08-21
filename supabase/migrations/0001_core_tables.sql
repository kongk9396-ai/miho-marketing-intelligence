-- MIHO Marketing Intelligence — core schema
-- Run this once in the Supabase SQL Editor (or via `supabase db push`).
--
-- Tables: meta_daily, creative_changes, ga4_daily, leads, analysis_reports
--
-- Access model: all reads/writes go through the server-side service role key
-- (see src equivalents at lib/supabase/server.ts). RLS is enabled on every
-- table with no policies defined, so anon/authenticated roles get no access
-- by default; the service role bypasses RLS entirely. Add scoped policies
-- later if browser-side (anon key) access is ever required.

create extension if not exists pgcrypto;

-- Shared trigger function to keep updated_at current on any UPDATE.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 1. meta_daily — one row per (date, ad) from Meta Ads Manager exports
-- ---------------------------------------------------------------------------
create table if not exists public.meta_daily (
  id uuid primary key default gen_random_uuid(),
  date date not null,

  account_name text,

  campaign_id text,
  campaign_name text,

  adset_id text,
  adset_name text,

  ad_id text not null,
  ad_name text,

  spend numeric(14, 2) not null default 0,
  impressions bigint not null default 0,
  reach bigint not null default 0,
  frequency numeric(10, 4),

  clicks bigint not null default 0,
  link_clicks bigint not null default 0,

  ctr numeric(8, 4),
  link_ctr numeric(8, 4),
  cpc numeric(12, 4),
  link_cpc numeric(12, 4),
  cpm numeric(12, 4),

  video_plays bigint not null default 0,
  video_3s bigint not null default 0,
  video_25 bigint not null default 0,
  video_50 bigint not null default 0,
  video_75 bigint not null default 0,
  video_95 bigint not null default 0,
  video_100 bigint not null default 0,
  avg_watch_time numeric(10, 2),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint meta_daily_date_ad_id_key unique (date, ad_id)
);

comment on table public.meta_daily is 'Daily ad-level performance rows imported from Meta Ads Manager CSV exports.';

create index if not exists meta_daily_date_idx on public.meta_daily (date);
create index if not exists meta_daily_campaign_id_idx on public.meta_daily (campaign_id);
create index if not exists meta_daily_adset_id_idx on public.meta_daily (adset_id);
create index if not exists meta_daily_ad_id_idx on public.meta_daily (ad_id);

drop trigger if exists set_meta_daily_updated_at on public.meta_daily;
create trigger set_meta_daily_updated_at
before update on public.meta_daily
for each row execute function public.set_updated_at();

alter table public.meta_daily enable row level security;

-- ---------------------------------------------------------------------------
-- 2. creative_changes — timeline of creative/budget/targeting changes per ad
-- ---------------------------------------------------------------------------
create table if not exists public.creative_changes (
  id uuid primary key default gen_random_uuid(),
  ad_id text not null,
  ad_name text,
  changed_at timestamptz not null default now(),
  change_type text not null,
  old_version text,
  new_version text,
  memo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint creative_changes_change_type_check check (
    change_type in (
      'video',
      'thumbnail',
      'copy',
      'hook',
      'cta',
      'landing',
      'price',
      'event_text',
      'budget',
      'target',
      'campaign_structure',
      'call_team',
      'other'
    )
  )
);

comment on table public.creative_changes is 'Change history log used to compare before/after performance around a given change.';
comment on column public.creative_changes.change_type is 'One of: video, thumbnail, copy, hook, cta, landing, price, event_text, budget, target, campaign_structure, call_team, other.';

create index if not exists creative_changes_ad_id_idx on public.creative_changes (ad_id);
create index if not exists creative_changes_changed_at_idx on public.creative_changes (changed_at);
create index if not exists creative_changes_change_type_idx on public.creative_changes (change_type);

drop trigger if exists set_creative_changes_updated_at on public.creative_changes;
create trigger set_creative_changes_updated_at
before update on public.creative_changes
for each row execute function public.set_updated_at();

alter table public.creative_changes enable row level security;

-- ---------------------------------------------------------------------------
-- 3. ga4_daily — daily GA4 funnel metrics by source/medium/campaign/content
-- ---------------------------------------------------------------------------
create table if not exists public.ga4_daily (
  id uuid primary key default gen_random_uuid(),
  date date not null,

  source text,
  medium text,
  campaign text,
  content text,

  sessions bigint not null default 0,
  users bigint not null default 0,
  engaged_sessions bigint not null default 0,
  landing_views bigint not null default 0,

  cta_clicks bigint not null default 0,
  form_starts bigint not null default 0,
  form_completes bigint not null default 0,

  avg_engagement_time numeric(10, 2),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.ga4_daily is 'Daily GA4 traffic and on-site engagement metrics, joinable to Meta data via campaign/content (UTM) values.';

create index if not exists ga4_daily_date_idx on public.ga4_daily (date);
create index if not exists ga4_daily_campaign_idx on public.ga4_daily (campaign);
create index if not exists ga4_daily_content_idx on public.ga4_daily (content);

drop trigger if exists set_ga4_daily_updated_at on public.ga4_daily;
create trigger set_ga4_daily_updated_at
before update on public.ga4_daily
for each row execute function public.set_updated_at();

alter table public.ga4_daily enable row level security;

-- ---------------------------------------------------------------------------
-- 4. leads — individual lead/DB records with UTM attribution and pipeline status
-- ---------------------------------------------------------------------------
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,

  procedure text,

  is_valid boolean not null default true,
  consultation_status text,
  booking_status text,
  visit_status text,
  surgery_status text
);

comment on table public.leads is 'Individual lead (DB) records with UTM attribution and consultation/booking/visit/surgery pipeline status.';

create index if not exists leads_created_at_idx on public.leads (created_at);
create index if not exists leads_utm_campaign_idx on public.leads (utm_campaign);
create index if not exists leads_utm_content_idx on public.leads (utm_content);

alter table public.leads enable row level security;

-- ---------------------------------------------------------------------------
-- 5. analysis_reports — generated analysis/report artifacts (daily, weekly, ...)
-- ---------------------------------------------------------------------------
create table if not exists public.analysis_reports (
  id uuid primary key default gen_random_uuid(),
  report_type text not null,
  start_date date not null,
  end_date date not null,

  campaign_name text,
  ad_name text,

  status text not null default 'pending',
  summary text,
  metrics_json jsonb,

  created_at timestamptz not null default now()
);

comment on table public.analysis_reports is 'Generated report/analysis artifacts (daily, weekly, before/after, etc.), with computed metrics stored as JSON.';

create index if not exists analysis_reports_report_type_idx on public.analysis_reports (report_type);
create index if not exists analysis_reports_start_date_idx on public.analysis_reports (start_date);
create index if not exists analysis_reports_end_date_idx on public.analysis_reports (end_date);
create index if not exists analysis_reports_status_idx on public.analysis_reports (status);

alter table public.analysis_reports enable row level security;
