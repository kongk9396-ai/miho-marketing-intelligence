-- MIHO Marketing Intelligence — GA4 자동 수집 + UTM 매핑 + 랜딩 퍼널 분석
-- Run this once in the Supabase SQL Editor, after 0001-0003.
--
-- 1) ga4_daily (existing table) — extended with the landing-page-level
--    columns the funnel/combined-analysis views need, plus a unique
--    constraint for upsert de-duplication. No existing column is dropped or
--    renamed, so existing rows are untouched.
-- 2) utm_mappings — explicitly requested table: lets a user manually link a
--    Meta campaign/ad to the UTM values GA4 reports it under, for cases the
--    automatic campaign/content matching misses.
-- 3) ga4_sync_history — one row per GA4 sync attempt, mirroring the role
--    meta_import_history plays for Meta (status for /data/ga4-sync, "마지막
--    오류" persistence). Not explicitly named in the spec, but required
--    infrastructure for that page's stated fields.
--
-- Same access model as prior migrations: RLS enabled, no policies, service
-- role only.

-- ---------------------------------------------------------------------------
-- 1. ga4_daily extensions
-- ---------------------------------------------------------------------------
alter table public.ga4_daily
  add column if not exists landing_page text not null default '(not set)',
  add column if not exists engagement_rate numeric(6, 2),
  add column if not exists avg_session_duration numeric(10, 2),
  add column if not exists page_views bigint not null default 0,
  add column if not exists scroll_depth_events bigint not null default 0,
  add column if not exists key_events bigint not null default 0;

comment on column public.ga4_daily.landing_page is 'GA4 landingPagePlusQueryString for this row; part of the upsert de-duplication key.';
comment on column public.ga4_daily.engagement_rate is 'GA4-reported daily engagementRate (engagedSessions/sessions) for this single row. When aggregating multiple rows, recompute from summed engaged_sessions/sessions — do not average this column.';
comment on column public.ga4_daily.key_events is 'GA4 keyEvents (formerly "conversions") for this row.';

-- Backfill the new NOT NULL default onto any pre-existing rows explicitly,
-- in case they were inserted before this column existed with a literal null.
update public.ga4_daily set landing_page = '(not set)' where landing_page is null;

drop index if exists ga4_daily_dedup_key;
create unique index if not exists ga4_daily_dedup_key
  on public.ga4_daily (date, campaign, content, landing_page);

create index if not exists ga4_daily_landing_page_idx on public.ga4_daily (landing_page);

-- ---------------------------------------------------------------------------
-- 2. utm_mappings
-- ---------------------------------------------------------------------------
create table if not exists public.utm_mappings (
  id uuid primary key default gen_random_uuid(),
  campaign_name text not null,
  ad_name text not null,
  utm_campaign text not null,
  utm_content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint utm_mappings_campaign_ad_key unique (campaign_name, ad_name)
);

comment on table public.utm_mappings is 'Manual overrides linking a Meta campaign/ad to the UTM (campaign, content) values GA4 reports it under, for cases automatic name matching misses.';

create index if not exists utm_mappings_campaign_name_idx on public.utm_mappings (campaign_name);
create index if not exists utm_mappings_ad_name_idx on public.utm_mappings (ad_name);
create index if not exists utm_mappings_utm_campaign_idx on public.utm_mappings (utm_campaign);
create index if not exists utm_mappings_utm_content_idx on public.utm_mappings (utm_content);

drop trigger if exists set_utm_mappings_updated_at on public.utm_mappings;
create trigger set_utm_mappings_updated_at
before update on public.utm_mappings
for each row execute function public.set_updated_at();

alter table public.utm_mappings enable row level security;

-- ---------------------------------------------------------------------------
-- 3. ga4_sync_history
-- ---------------------------------------------------------------------------
create table if not exists public.ga4_sync_history (
  id uuid primary key default gen_random_uuid(),
  sync_date date,
  row_count integer not null default 0,
  inserted_count integer not null default 0,
  updated_count integer not null default 0,
  status text not null check (status in ('success', 'failed')),
  error_message text,
  processed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

comment on table public.ga4_sync_history is 'One row per GA4 sync attempt (manual or cron). Source of truth for the /data/ga4-sync status page.';

create index if not exists ga4_sync_history_processed_at_idx on public.ga4_sync_history (processed_at);
create index if not exists ga4_sync_history_status_idx on public.ga4_sync_history (status);

alter table public.ga4_sync_history enable row level security;
