import "server-only";
import { getMetaDailyRowsForAd, listCreativeChanges } from "@/lib/creative-changes/repository";
import { computeComparisonPeriods, computeObservationProgress } from "@/lib/creative-changes/period";
import { aggregatePeriodMetrics } from "@/lib/creative-changes/metrics";
import { evaluateObservation } from "@/lib/creative-changes/observation-status";
import { computeChangePercent } from "@/lib/change-percent";
import type { CreativeChangeRecord, ObservationStatus } from "@/lib/creative-changes/types";

export interface ObservingChangeSummary {
  change: CreativeChangeRecord;
  daysElapsed: number;
  periodDays: number;
}

export interface RecentChangeImpactSummary {
  change: CreativeChangeRecord;
  status: ObservationStatus;
  ctrChangePercent: number | null;
  cpcChangePercent: number | null;
}

export interface LatestChangeCtrComparison {
  change: CreativeChangeRecord;
  beforeCtr: number | null;
  afterCtr: number | null;
  changePercent: number | null;
}

/** "현재 관찰 중인 변경" dashboard card data. */
export async function getObservingChanges(limit = 5): Promise<ObservingChangeSummary[]> {
  const changes = await listCreativeChanges(50);
  const now = new Date();
  const observing: ObservingChangeSummary[] = [];

  for (const change of changes) {
    const progress = computeObservationProgress(change.changed_at, change.comparison_period_days, now);
    if (!progress.isObservationWindowComplete) {
      observing.push({ change, daysElapsed: progress.daysElapsedCapped, periodDays: progress.periodDays });
      if (observing.length >= limit) break;
    }
  }

  return observing;
}

/** "최근 변경 영향" dashboard card data — most recently concluded observations. */
export async function getRecentChangeImpacts(limit = 5): Promise<RecentChangeImpactSummary[]> {
  const changes = await listCreativeChanges(50);
  const now = new Date();
  const results: RecentChangeImpactSummary[] = [];

  for (const change of changes) {
    const progress = computeObservationProgress(change.changed_at, change.comparison_period_days, now);
    if (!progress.isObservationWindowComplete) continue;

    const periods = computeComparisonPeriods(change.changed_at, change.comparison_period_days);
    const [beforeRows, afterRows] = await Promise.all([
      getMetaDailyRowsForAd(change.ad_id, periods.before.start, periods.before.end),
      getMetaDailyRowsForAd(change.ad_id, periods.after.start, periods.after.end),
    ]);

    const before = aggregatePeriodMetrics(beforeRows);
    const after = aggregatePeriodMetrics(afterRows);
    const evaluation = evaluateObservation({
      changedAt: change.changed_at,
      comparisonPeriodDays: change.comparison_period_days,
      before,
      after,
      now,
    });

    results.push({
      change,
      status: evaluation.status,
      ctrChangePercent: computeChangePercent(before.ctr, after.ctr),
      cpcChangePercent: computeChangePercent(before.cpc, after.cpc),
    });

    if (results.length >= limit) break;
  }

  return results;
}

/**
 * "최근 소재 교체 후 CTR" dashboard card data — the single most recent
 * change, regardless of whether its observation window has finished (unlike
 * getRecentChangeImpacts). Before/after CTR is whatever real meta_daily rows
 * exist for those windows; an incomplete after-period just yields fewer
 * days of real data, never a fabricated number.
 */
export async function getLatestChangeCtrComparison(): Promise<LatestChangeCtrComparison | null> {
  const [latest] = await listCreativeChanges(1);
  if (!latest) return null;

  const periods = computeComparisonPeriods(latest.changed_at, latest.comparison_period_days);
  const [beforeRows, afterRows] = await Promise.all([
    getMetaDailyRowsForAd(latest.ad_id, periods.before.start, periods.before.end),
    getMetaDailyRowsForAd(latest.ad_id, periods.after.start, periods.after.end),
  ]);

  const before = aggregatePeriodMetrics(beforeRows);
  const after = aggregatePeriodMetrics(afterRows);

  return {
    change: latest,
    beforeCtr: before.ctr,
    afterCtr: after.ctr,
    changePercent: computeChangePercent(before.ctr, after.ctr),
  };
}
