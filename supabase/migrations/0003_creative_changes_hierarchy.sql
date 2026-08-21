-- MIHO Marketing Intelligence — 소재 변경 이력 + 전후 비교 분석
-- Run this once in the Supabase SQL Editor, after 0001 and 0002.
--
-- Extends creative_changes (already created in 0001) with:
--   - campaign/ad set identifiers, so a change registration captures the
--     full hierarchy the user picked (not just the ad), and so the conflict
--     check in section 3 of the spec can match on "same campaign or ad".
--   - comparison_period_days, the user-configurable before/after window
--     (default 5, or 3/5/7/custom) used to compute observation status.
--   - forced, recording whether the user registered this change despite an
--     active-observation conflict warning (audit trail for section 3).
--
-- No new tables — before/after comparisons are computed live from
-- meta_daily + creative_changes on each page view, not persisted.

alter table public.creative_changes
  add column if not exists campaign_id text,
  add column if not exists campaign_name text,
  add column if not exists adset_id text,
  add column if not exists adset_name text,
  add column if not exists comparison_period_days integer not null default 5,
  add column if not exists forced boolean not null default false;

alter table public.creative_changes
  drop constraint if exists creative_changes_comparison_period_days_check;
alter table public.creative_changes
  add constraint creative_changes_comparison_period_days_check check (comparison_period_days > 0);

comment on column public.creative_changes.comparison_period_days is 'Length (in days) of the before/after comparison window. Default 5; UI offers 3/5/7/custom.';
comment on column public.creative_changes.forced is 'True if the user registered this change despite an active-observation conflict warning for the same ad/campaign.';

create index if not exists creative_changes_campaign_id_idx on public.creative_changes (campaign_id);
