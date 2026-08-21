-- MIHO Marketing Intelligence — Meta 이메일 자동 수집
-- Run this once in the Supabase SQL Editor, after 0001_core_tables.sql.
--
-- 1) meta_import_history — explicitly requested table: tracks every manual
--    upload / Gmail-collected attachment (or a Gmail run that found nothing),
--    used for de-duplication and for the /data/meta-sync status page.
-- 2) gmail_credentials    — singleton row holding the Gmail OAuth refresh
--    token, needed so the Gmail connection survives redeploys. Not explicitly
--    requested by name, but required infrastructure for section 3 ("Gmail
--    연결 상태" / "연결 테스트").
-- 3) meta_sync_settings   — singleton row holding the user-configurable
--    collection settings from section 5 (subject keywords, lookback window,
--    allowed extensions, auto-sync on/off).
--
-- Same access model as 0001: RLS enabled, no policies, service role only.

-- ---------------------------------------------------------------------------
-- 1. meta_import_history
-- ---------------------------------------------------------------------------
create table if not exists public.meta_import_history (
  id uuid primary key default gen_random_uuid(),

  source_type text not null check (source_type in ('manual', 'gmail')),

  -- Gmail-only identifiers, used for hard de-duplication. Null for manual
  -- uploads and for 'no_new_reports' run-level entries (no attachment).
  message_id text,
  attachment_id text,

  -- Null only for a 'no_new_reports' run-level entry (no file was found).
  file_name text,
  file_hash text,

  report_start_date date,
  report_end_date date,

  row_count integer not null default 0,
  inserted_count integer not null default 0,
  updated_count integer not null default 0,
  skipped_count integer not null default 0,

  status text not null check (
    status in ('success', 'partial', 'failed', 'duplicate', 'unsupported', 'no_new_reports')
  ),
  error_message text,

  processed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

comment on table public.meta_import_history is 'One row per processed Meta report attachment (manual or Gmail), plus run-level no_new_reports entries. Source of truth for de-duplication and the /data/meta-sync status page.';
comment on column public.meta_import_history.status is 'success | partial (some rows skipped) | failed | duplicate | unsupported (file type) | no_new_reports (not an error).';

-- Hard idempotency guarantee at the data layer: the same Gmail attachment
-- can never be recorded twice, even under a racing/duplicate cron run. This
-- is a plain (non-partial) unique index — Postgres treats each NULL as
-- distinct for uniqueness purposes, so manual uploads and the run-level
-- 'no_new_reports' entries (both message_id and attachment_id null) are
-- unaffected and can repeat freely. Only real (message_id, attachment_id)
-- pairs are deduplicated, and the app upserts on this key so a row that
-- previously failed can be retried and overwritten in place.
create unique index if not exists meta_import_history_message_attachment_key
  on public.meta_import_history (message_id, attachment_id);

create index if not exists meta_import_history_source_type_idx on public.meta_import_history (source_type);
create index if not exists meta_import_history_processed_at_idx on public.meta_import_history (processed_at);
create index if not exists meta_import_history_status_idx on public.meta_import_history (status);
create index if not exists meta_import_history_file_hash_idx
  on public.meta_import_history (file_hash)
  where file_hash is not null;

alter table public.meta_import_history enable row level security;

-- ---------------------------------------------------------------------------
-- 2. gmail_credentials — singleton row (id always 1)
-- ---------------------------------------------------------------------------
create table if not exists public.gmail_credentials (
  id integer primary key default 1,
  email_address text,
  access_token text,
  refresh_token text not null,
  token_expiry timestamptz,
  scope text,
  connected_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint gmail_credentials_singleton check (id = 1)
);

comment on table public.gmail_credentials is 'Singleton row holding the Gmail OAuth refresh/access token for the one connected mailbox. Server-only access.';

drop trigger if exists set_gmail_credentials_updated_at on public.gmail_credentials;
create trigger set_gmail_credentials_updated_at
before update on public.gmail_credentials
for each row execute function public.set_updated_at();

alter table public.gmail_credentials enable row level security;

-- ---------------------------------------------------------------------------
-- 3. meta_sync_settings — singleton row (id always 1)
-- ---------------------------------------------------------------------------
create table if not exists public.meta_sync_settings (
  id integer primary key default 1,
  subject_keywords text[] not null default array['MIHO Meta Daily', 'Meta 광고 보고서'],
  lookback_hours integer not null default 48,
  allowed_extensions text[] not null default array['csv', 'xlsx'],
  auto_sync_enabled boolean not null default false,
  updated_at timestamptz not null default now(),

  constraint meta_sync_settings_singleton check (id = 1)
);

comment on table public.meta_sync_settings is 'Singleton row holding the user-configurable Meta email collection settings (subject keywords, lookback window, allowed extensions, auto-sync toggle).';

drop trigger if exists set_meta_sync_settings_updated_at on public.meta_sync_settings;
create trigger set_meta_sync_settings_updated_at
before update on public.meta_sync_settings
for each row execute function public.set_updated_at();

alter table public.meta_sync_settings enable row level security;

insert into public.meta_sync_settings (id, subject_keywords, lookback_hours, allowed_extensions, auto_sync_enabled)
values (1, array['MIHO Meta Daily', 'Meta 광고 보고서'], 48, array['csv', 'xlsx'], false)
on conflict (id) do nothing;
