-- MIHO Marketing Intelligence — Meta CSV rows without a real Ad ID
-- Run this once in the Supabase SQL Editor, after 0001-0006.
--
-- ad_id is no longer a required CSV column (see lib/meta/header-aliases.ts).
-- When a row has no real Ad ID, the parser generates a stable temp id from
-- campaign_name + adset_name + ad_name and flags it here so it's never
-- confused with a real Meta ad id downstream.

alter table public.meta_daily
  add column if not exists is_temp_ad_id boolean not null default false;

comment on column public.meta_daily.is_temp_ad_id is 'True when ad_id is a generated sha256-based stand-in (campaign_name+adset_name+ad_name) because the source file had no real Ad ID for this row.';
