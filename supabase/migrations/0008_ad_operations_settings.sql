-- MIHO Marketing Intelligence — 광고 운영 종합 보고: 설정값 테이블
-- Run this once in the Supabase SQL Editor, after 0001-0007.
--
-- These tables hold values a human types in — official start dates, planned
-- budgets, and each ad's real on/off status — never inferred or guessed from
-- meta_daily/ga4_daily. No existing table is altered or dropped.
--
-- 1) ad_account_settings   — singleton (id=1), overall Meta official start date + planned budget.
-- 2) campaign_settings     — per-campaign official start date + planned budget.
-- 3) ad_operational_status — per-ad current real status (ACTIVE/PAUSED/OFF/TESTING), user-set only.
-- 4) ad_off_snapshots      — performance snapshot captured at the moment an ad is set to OFF.
-- 5) landing_changes       — landing-page change history, the GA4-side mirror of creative_changes.
--
-- Same access model as prior migrations: RLS enabled, no policies, service role only.

-- ---------------------------------------------------------------------------
-- 1. ad_account_settings — singleton row (id always 1)
-- ---------------------------------------------------------------------------
create table if not exists public.ad_account_settings (
  id integer primary key default 1,
  official_start_date date,
  planned_monthly_budget numeric(14, 2),
  planned_daily_budget numeric(14, 2),
  updated_at timestamptz not null default now(),

  constraint ad_account_settings_singleton check (id = 1)
);

comment on table public.ad_account_settings is 'Singleton row holding the user-entered official Meta ad account start date and planned budget. Never derived from meta_daily.';
comment on column public.ad_account_settings.official_start_date is 'User-entered official start date. When null, the UI must fall back to displaying only "데이터 기준 최초 집행일" (from meta_daily) and must never treat that as the official date.';

drop trigger if exists set_ad_account_settings_updated_at on public.ad_account_settings;
create trigger set_ad_account_settings_updated_at
before update on public.ad_account_settings
for each row execute function public.set_updated_at();

alter table public.ad_account_settings enable row level security;

-- ---------------------------------------------------------------------------
-- 2. campaign_settings — per-campaign official start date + planned budget
-- ---------------------------------------------------------------------------
create table if not exists public.campaign_settings (
  id uuid primary key default gen_random_uuid(),
  campaign_name text not null,
  campaign_id text,
  official_start_date date,
  planned_daily_budget numeric(14, 2),
  planned_monthly_budget numeric(14, 2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint campaign_settings_campaign_name_key unique (campaign_name)
);

comment on table public.campaign_settings is 'Per-campaign user-entered official start date and planned budget. Keyed by campaign_name (not campaign_id) since older meta_daily rows can have a blank campaign_id.';
comment on column public.campaign_settings.campaign_id is 'Reference only, populated when available — campaign_name is the actual join key.';

drop trigger if exists set_campaign_settings_updated_at on public.campaign_settings;
create trigger set_campaign_settings_updated_at
before update on public.campaign_settings
for each row execute function public.set_updated_at();

create index if not exists campaign_settings_campaign_name_idx on public.campaign_settings (campaign_name);

alter table public.campaign_settings enable row level security;

-- ---------------------------------------------------------------------------
-- 3. ad_operational_status — current real status per ad, user-set only
-- ---------------------------------------------------------------------------
create table if not exists public.ad_operational_status (
  id uuid primary key default gen_random_uuid(),
  campaign_name text not null,
  ad_name text not null,
  ad_id text,
  status text not null check (status in ('ACTIVE', 'PAUSED', 'OFF', 'TESTING')),
  status_changed_at date not null default current_date,
  reason text,
  memo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint ad_operational_status_campaign_ad_key unique (campaign_name, ad_name)
);

comment on table public.ad_operational_status is 'The ad''s real current operating status, as recorded by a human. Distinct from the auto-diagnosis engine''s OFF_REVIEW/SCALE_REVIEW recommendation (lib/ad-diagnosis) — the system never writes to this table on its own.';

drop trigger if exists set_ad_operational_status_updated_at on public.ad_operational_status;
create trigger set_ad_operational_status_updated_at
before update on public.ad_operational_status
for each row execute function public.set_updated_at();

create index if not exists ad_operational_status_campaign_name_idx on public.ad_operational_status (campaign_name);
create index if not exists ad_operational_status_status_idx on public.ad_operational_status (status);

alter table public.ad_operational_status enable row level security;

-- ---------------------------------------------------------------------------
-- 4. ad_off_snapshots — performance snapshot at the moment of OFF
-- ---------------------------------------------------------------------------
create table if not exists public.ad_off_snapshots (
  id uuid primary key default gen_random_uuid(),
  ad_operational_status_id uuid references public.ad_operational_status (id) on delete cascade,
  campaign_name text,
  ad_name text,

  spend numeric(14, 2),
  ctr numeric(8, 4),
  cpc numeric(12, 4),
  video_100_rate numeric(8, 4),
  landing_conversion_rate numeric(8, 4),

  db_count integer,
  valid_db_count integer,
  confirmed_bookings integer,

  snapshot_at timestamptz not null default now()
);

comment on table public.ad_off_snapshots is 'Real metrics captured at the instant an ad''s status was set to OFF, so a later report can say "OFF 전 CPC was X". db_count/valid_db_count/confirmed_bookings are null (never 0) when this ad''s leads could not be attributed via UTM.';

create index if not exists ad_off_snapshots_ad_operational_status_id_idx on public.ad_off_snapshots (ad_operational_status_id);

alter table public.ad_off_snapshots enable row level security;

-- ---------------------------------------------------------------------------
-- 5. landing_changes — landing-page change history (mirrors creative_changes)
-- ---------------------------------------------------------------------------
create table if not exists public.landing_changes (
  id uuid primary key default gen_random_uuid(),
  landing_name text not null,
  landing_page_pattern text,
  linked_campaign_name text,
  changed_at timestamptz not null default now(),
  change_type text not null check (
    change_type in ('layout', 'copy', 'cta', 'price', 'structure', 'other')
  ),
  old_version text,
  new_version text,
  memo text,
  comparison_period_days integer not null default 5,
  forced boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint landing_changes_comparison_period_days_check check (comparison_period_days > 0)
);

comment on table public.landing_changes is 'Landing-page change history — the GA4-side mirror of creative_changes. Before/after comparisons are computed live from ga4_daily on each page view, not persisted.';
comment on column public.landing_changes.landing_page_pattern is 'ILIKE pattern matched against ga4_daily.landing_page. Null means "compare all GA4 rows" (sitewide before/after).';
comment on column public.landing_changes.linked_campaign_name is 'Optional campaign link (user-selected at registration) used to filter leads.utm_campaign for DB/valid-DB/booking before-after. Null means DB comparison is not shown ("귀속 불가"), never guessed.';

drop trigger if exists set_landing_changes_updated_at on public.landing_changes;
create trigger set_landing_changes_updated_at
before update on public.landing_changes
for each row execute function public.set_updated_at();

create index if not exists landing_changes_changed_at_idx on public.landing_changes (changed_at);
create index if not exists landing_changes_linked_campaign_name_idx on public.landing_changes (linked_campaign_name);

alter table public.landing_changes enable row level security;

-- ---------------------------------------------------------------------------
-- 6. analysis_reports (existing table, from 0001) — add a de-dup key so
--    daily/weekly report generation can upsert ("같은 날 재생성 시 덮어쓰기")
--    instead of accumulating duplicate rows for the same period.
-- ---------------------------------------------------------------------------
alter table public.analysis_reports
  drop constraint if exists analysis_reports_type_period_key;
alter table public.analysis_reports
  add constraint analysis_reports_type_period_key unique (report_type, start_date, end_date);
