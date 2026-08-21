import type { MetaDailyLike } from "@/lib/creative-changes/types";

export interface DailySeriesPoint {
  date: string;
  ctr: number | null;
  cpc: number | null;
  spend: number;
  video50Rate: number | null;
  completionRate: number | null;
}

/**
 * Per-day chart points. Unlike the period comparison, a single day's own
 * CTR/CPC ratio is a valid same-day figure (no cross-day averaging), so
 * these are computed directly from that day's row.
 */
export function buildDailySeries(rows: MetaDailyLike[]): DailySeriesPoint[] {
  return rows.map((row) => ({
    date: row.date,
    ctr: row.impressions > 0 ? (row.clicks / row.impressions) * 100 : null,
    cpc: row.clicks > 0 ? row.spend / row.clicks : null,
    spend: row.spend,
    video50Rate: row.video_plays > 0 ? (row.video_50 / row.video_plays) * 100 : null,
    completionRate: row.video_plays > 0 ? (row.video_100 / row.video_plays) * 100 : null,
  }));
}
