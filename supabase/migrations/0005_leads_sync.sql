-- MIHO Marketing Intelligence — DB(리드) Google Sheet 동기화
-- Run this once in the Supabase SQL Editor, after 0001-0004.
--
-- Google Sheet is the source of truth; public.leads is an analysis replica
-- kept in sync from it. This migration:
--   1) extends leads with the fields the sync engine and funnel analysis
--      need, without touching any existing column's name or type;
--   2) tightens consultation_status / booking_status / visit_status with
--      explicit CHECK constraints matching the standard internal status
--      values (see lib/leads-sync/status-mapping.ts) — this removes the
--      "booking_status IS NOT NULL means booked" guess the dashboard used
--      before real sync existed;
--   3) adds leads_sheet_configs (which sheet tabs to read + optional column
--      overrides) and leads_sync_history (one row per sync run, mirroring
--      ga4_sync_history's role for the /data/leads-sync status page).
--
-- Explicitly NOT stored anywhere in this schema: patient name, birth date,
-- phone number (raw), or free-text consultation notes. The sync engine
-- reads phone only transiently in memory to compute lead_key and never
-- writes it to any table or log.

-- ---------------------------------------------------------------------------
-- 1. leads — new columns
-- ---------------------------------------------------------------------------
alter table public.leads
  add column if not exists lead_key text,
  add column if not exists source_row_number integer,
  add column if not exists applied_at timestamptz,
  add column if not exists preferred_visit_at timestamptz,
  add column if not exists outcome_status text,
  add column if not exists consultant text,
  add column if not exists landing_name text,
  add column if not exists invalid_reason text,
  add column if not exists consultation_connected_at timestamptz,
  add column if not exists booking_confirmed_at timestamptz,
  add column if not exists visited_at timestamptz,
  add column if not exists source text,
  add column if not exists synced_at timestamptz;

comment on column public.leads.lead_key is 'Stable dedup key: the sheet''s own row id if configured, otherwise sha256(applied_at + normalized phone + utm_campaign + utm_content). Never derived from anything else stored in this table.';
comment on column public.leads.source_row_number is 'Row number within its source sheet at last sync, for traceability only — not part of the dedup key (rows can move).';
comment on column public.leads.applied_at is '"신청날짜" from the sheet — the business event date, distinct from created_at (this row''s insert time). Funnel/KPI queries use this.';
comment on column public.leads.preferred_visit_at is '"내원희망날짜" from the sheet.';
comment on column public.leads.outcome_status is 'Normalized "최종 결과": confirmed | invalid | cancelled | pending | other. Drives is_valid and (with consultation_status) booking_status.';
comment on column public.leads.consultant is '"담당자" — staff name, not patient PII.';
comment on column public.leads.landing_name is 'Raw landing/유입 column value when the sheet does not cleanly separate utm_source/medium/campaign/content.';
comment on column public.leads.invalid_reason is 'Raw "최종 결과" text when outcome_status = invalid, for context.';
comment on column public.leads.source is 'Which configured sheet this row came from (see leads_sheet_configs.sheet_name).';
comment on column public.leads.synced_at is 'When this row was last written by the sync engine.';

-- Backfill before tightening existing columns to NOT NULL — defensive even
-- though this table is empty at the time this migration is authored.
update public.leads set consultation_status = 'new' where consultation_status is null;
update public.leads set booking_status = 'none' where booking_status is null;
update public.leads set visit_status = 'none' where visit_status is null;

alter table public.leads
  alter column consultation_status set default 'new',
  alter column consultation_status set not null,
  alter column booking_status set default 'none',
  alter column booking_status set not null,
  alter column visit_status set default 'none',
  alter column visit_status set not null;

alter table public.leads drop constraint if exists leads_consultation_status_check;
alter table public.leads add constraint leads_consultation_status_check
  check (consultation_status in ('new', 'booked', 'connected', 'unreachable', 'callback', 'rejected', 'invalid', 'other'));

alter table public.leads drop constraint if exists leads_booking_status_check;
alter table public.leads add constraint leads_booking_status_check
  check (booking_status in ('none', 'pending', 'confirmed', 'cancelled'));

alter table public.leads drop constraint if exists leads_visit_status_check;
alter table public.leads add constraint leads_visit_status_check
  check (visit_status in ('none', 'scheduled', 'visited', 'cancelled', 'no_show'));

alter table public.leads drop constraint if exists leads_outcome_status_check;
alter table public.leads add constraint leads_outcome_status_check
  check (outcome_status is null or outcome_status in ('confirmed', 'invalid', 'cancelled', 'pending', 'other'));

drop index if exists leads_lead_key_key;
create unique index leads_lead_key_key on public.leads (lead_key) where lead_key is not null;

create index if not exists leads_applied_at_idx on public.leads (applied_at);
create index if not exists leads_outcome_status_idx on public.leads (outcome_status);
create index if not exists leads_consultation_status_idx on public.leads (consultation_status);
create index if not exists leads_booking_status_idx on public.leads (booking_status);
create index if not exists leads_source_idx on public.leads (source);

-- ---------------------------------------------------------------------------
-- 2. leads_sheet_configs — which sheet tabs to read
-- ---------------------------------------------------------------------------
create table if not exists public.leads_sheet_configs (
  id uuid primary key default gen_random_uuid(),
  sheet_name text not null,
  procedure_label text,
  enabled boolean not null default true,
  -- Canonical field -> actual header text override, for sheets whose
  -- headers don't match the built-in alias list. e.g. {"applied_at": "접수일자"}
  column_overrides jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint leads_sheet_configs_sheet_name_key unique (sheet_name)
);

comment on table public.leads_sheet_configs is 'User-configurable list of Google Sheet tabs to sync, each optionally tagged with a procedure label and per-sheet column header overrides. Powers the /data/leads-sync "매핑 설정" UI.';

drop trigger if exists set_leads_sheet_configs_updated_at on public.leads_sheet_configs;
create trigger set_leads_sheet_configs_updated_at
before update on public.leads_sheet_configs
for each row execute function public.set_updated_at();

alter table public.leads_sheet_configs enable row level security;

-- ---------------------------------------------------------------------------
-- 3. leads_sync_history — one row per sync run
-- ---------------------------------------------------------------------------
create table if not exists public.leads_sync_history (
  id uuid primary key default gen_random_uuid(),

  row_count integer not null default 0,
  inserted_count integer not null default 0,
  updated_count integer not null default 0,
  skipped_count integer not null default 0,
  error_count integer not null default 0,

  status text not null check (status in ('success', 'partial', 'failed')),
  error_message text,

  processed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

comment on table public.leads_sync_history is 'One row per Google Sheet -> leads sync attempt (manual or cron). Source of truth for the /data/leads-sync status page and DB data-freshness.';

create index if not exists leads_sync_history_processed_at_idx on public.leads_sync_history (processed_at);
create index if not exists leads_sync_history_status_idx on public.leads_sync_history (status);

alter table public.leads_sync_history enable row level security;
