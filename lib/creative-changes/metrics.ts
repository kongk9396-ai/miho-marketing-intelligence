import type { MetaDailyLike, PeriodMetrics, RetentionRate } from "@/lib/creative-changes/types";

function sum(rows: MetaDailyLike[], selector: (row: MetaDailyLike) => number): number {
  return rows.reduce((acc, row) => acc + (selector(row) || 0), 0);
}

function retentionRate(count: number, denominator: number, minReliableDenominator: number): RetentionRate {
  return {
    count,
    rate: denominator > 0 ? (count / denominator) * 100 : null,
    reliable: denominator >= minReliableDenominator,
  };
}

/** video_plays total below this makes a retention rate too noisy to trust. */
export const MIN_VIDEO_PLAYS_FOR_RELIABLE_RATE = 30;

/**
 * Aggregates a period's meta_daily rows into totals and recomputes the
 * derived rate metrics from those totals — never from an average of the
 * per-row rates (that would misweight low-volume days).
 *
 * Frequency is the one exception: Meta's daily `reach` is a per-day unique
 * count, so summing it across days and dividing period impressions by that
 * sum would NOT be a period-level unique reach — it would double-count
 * people active on multiple days, understating true frequency. There is no
 * raw column that would let us recompute a correct period frequency, so we
 * report the plain average of the daily frequency values instead and label
 * it clearly as a daily average, not a recomputed period total.
 *
 * avg_watch_time has the same shape problem (Meta only exports the daily
 * average, no raw total watch time), so it is weighted by that day's
 * video_plays — the closest available approximation to a period average.
 */
export function aggregatePeriodMetrics(rows: MetaDailyLike[]): PeriodMetrics {
  const totalSpend = sum(rows, (r) => r.spend);
  const totalImpressions = sum(rows, (r) => r.impressions);
  const totalReach = sum(rows, (r) => r.reach);
  const totalClicks = sum(rows, (r) => r.clicks);
  const totalLinkClicks = sum(rows, (r) => r.link_clicks);
  const totalVideoPlays = sum(rows, (r) => r.video_plays);

  const frequencyValues = rows.map((r) => r.frequency).filter((v): v is number => v !== null);
  const avgFrequency =
    frequencyValues.length > 0
      ? frequencyValues.reduce((a, b) => a + b, 0) / frequencyValues.length
      : null;

  const watchTimeRows = rows.filter(
    (r): r is MetaDailyLike & { avg_watch_time: number } =>
      r.avg_watch_time !== null && r.video_plays > 0
  );
  const watchTimeWeight = sum(watchTimeRows, (r) => r.video_plays);
  const avgWatchTime =
    watchTimeWeight > 0
      ? watchTimeRows.reduce((acc, r) => acc + r.avg_watch_time * r.video_plays, 0) / watchTimeWeight
      : null;

  return {
    dayCount: rows.length,
    totalSpend,
    totalImpressions,
    totalReach,
    avgFrequency,
    totalClicks,
    totalLinkClicks,
    ctr: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : null,
    linkCtr: totalImpressions > 0 ? (totalLinkClicks / totalImpressions) * 100 : null,
    cpc: totalClicks > 0 ? totalSpend / totalClicks : null,
    linkCpc: totalLinkClicks > 0 ? totalSpend / totalLinkClicks : null,
    cpm: totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : null,
    avgWatchTime,
    totalVideoPlays,
    video3s: retentionRate(sum(rows, (r) => r.video_3s), totalVideoPlays, MIN_VIDEO_PLAYS_FOR_RELIABLE_RATE),
    video25: retentionRate(sum(rows, (r) => r.video_25), totalVideoPlays, MIN_VIDEO_PLAYS_FOR_RELIABLE_RATE),
    video50: retentionRate(sum(rows, (r) => r.video_50), totalVideoPlays, MIN_VIDEO_PLAYS_FOR_RELIABLE_RATE),
    video75: retentionRate(sum(rows, (r) => r.video_75), totalVideoPlays, MIN_VIDEO_PLAYS_FOR_RELIABLE_RATE),
    video95: retentionRate(sum(rows, (r) => r.video_95), totalVideoPlays, MIN_VIDEO_PLAYS_FOR_RELIABLE_RATE),
    video100: retentionRate(sum(rows, (r) => r.video_100), totalVideoPlays, MIN_VIDEO_PLAYS_FOR_RELIABLE_RATE),
  };
}
