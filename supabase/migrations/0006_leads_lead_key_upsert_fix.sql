-- MIHO Marketing Intelligence — fix leads.lead_key uniqueness for upsert
-- Run this once in the Supabase SQL Editor, after 0005_leads_sync.sql.
--
-- 0005 created leads_lead_key_key as a PARTIAL unique index
-- (`where lead_key is not null`). Postgres's `ON CONFLICT (lead_key)` — what
-- Supabase's `.upsert(rows, { onConflict: "lead_key" })` generates — can
-- only target a real UNIQUE CONSTRAINT (or a non-partial unique index); it
-- cannot infer a partial index, so every sync write failed with
-- "there is no unique or exclusion constraint matching the ON CONFLICT
-- specification". The sync engine always sets lead_key on every row it
-- builds, so a plain (non-partial) unique constraint is equivalent in
-- practice and fixes the upsert.

drop index if exists public.leads_lead_key_key;

alter table public.leads drop constraint if exists leads_lead_key_key;
alter table public.leads add constraint leads_lead_key_key unique (lead_key);
