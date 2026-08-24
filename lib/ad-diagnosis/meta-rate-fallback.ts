import type { MetaDailyWithRates } from "@/lib/creative-changes/types";

/**
 * "count" = exact, computed from a real raw click count (all-clicks or link
 * clicks — both are real counts Meta reports, so this label. means
 * "계산값" in the UI, not an estimate).
 * "raw_metric" = no raw click count was available, so this is rebuilt from
 * Meta's own reported rate column instead ("Meta 원본값" in the UI) — still
 * Meta's real number, not a guess, just not a from-counts recompute.
 * "none" = neither exists; the value is null, never a fabricated 0 ("데이터 없음").
 */
export type MetaRateSource = "count" | "raw_metric" | "none";

export interface MetaRateFallbackResult {
  ctr: number | null;
  ctrSource: MetaRateSource;
  cpc: number | null;
  cpcSource: MetaRateSource;
}

interface Totals {
  spend: number;
  impressions: number;
  clicks: number;
  linkClicks: number;
}

/** Sums (rate% / 100 * denominator) over rows where `rate` is present — the exact implied numerator for those rows. */
function impliedFromRateColumn(
  rows: MetaDailyWithRates[],
  rate: (r: MetaDailyWithRates) => number | null,
  denominator: (r: MetaDailyWithRates) => number
): { implied: number; coveredDenominator: number } {
  const covered = rows.filter((r) => rate(r) !== null && denominator(r) > 0);
  return {
    implied: covered.reduce((sum, r) => sum + (rate(r)! / 100) * denominator(r), 0),
    coveredDenominator: covered.reduce((sum, r) => sum + denominator(r), 0),
  };
}

/** Sums (spend / cost-per-click) over rows where the cost column is present — the exact implied click count for those rows. */
function impliedFromCostColumn(
  rows: MetaDailyWithRates[],
  cost: (r: MetaDailyWithRates) => number | null
): { implied: number; coveredSpend: number } {
  const covered = rows.filter((r) => cost(r) !== null && cost(r)! > 0);
  return {
    implied: covered.reduce((sum, r) => sum + r.spend / cost(r)!, 0),
    coveredSpend: covered.reduce((sum, r) => sum + r.spend, 0),
  };
}

/**
 * Real Meta report exports vary a lot in which columns they include. Some
 * omit the raw click-count column entirely while still including a rate
 * column (CTR/CPC); some only export the "link click" family, not "all
 * clicks". Recomputing CTR/CPC purely from a 0 raw-count would show a false
 * "0.00%"/"—" instead of the real performance Meta already reported.
 *
 * Priority:
 * 1. sum(clicks) > 0            -> exact, from real all-clicks counts.
 * 2. sum(link_clicks) > 0       -> exact, from real link-click counts (still
 *    a real count Meta reports, just the link-click family — this is the
 *    common case for exports that skip the "all clicks" column).
 * 3. raw ctr / link_ctr column  -> reconstruct implied clicks per row from
 *    (rate, impressions) — exact for the rows that have the raw rate.
 * 4. raw cpc / link_cpc column  -> reconstruct implied clicks per row from
 *    (spend, cost-per-click).
 * 5. neither exists             -> null, never a fabricated 0.
 */
export function computeMetaRateFallback(rows: MetaDailyWithRates[], totals: Totals): MetaRateFallbackResult {
  if (totals.clicks > 0) {
    return {
      ctr: totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : null,
      ctrSource: "count",
      cpc: totals.spend / totals.clicks,
      cpcSource: "count",
    };
  }

  if (totals.linkClicks > 0) {
    return {
      ctr: totals.impressions > 0 ? (totals.linkClicks / totals.impressions) * 100 : null,
      ctrSource: "count",
      cpc: totals.spend / totals.linkClicks,
      cpcSource: "count",
    };
  }

  const ctrFromCtr = impliedFromRateColumn(rows, (r) => r.ctr, (r) => r.impressions);
  const ctrFromLinkCtr = impliedFromRateColumn(rows, (r) => r.link_ctr, (r) => r.impressions);
  const bestCtrImplied = ctrFromCtr.coveredDenominator > 0 ? ctrFromCtr : ctrFromLinkCtr;
  const ctr =
    bestCtrImplied.coveredDenominator > 0
      ? (bestCtrImplied.implied / bestCtrImplied.coveredDenominator) * 100
      : null;

  const cpcFromCpc = impliedFromCostColumn(rows, (r) => r.cpc);
  const cpcFromLinkCpc = impliedFromCostColumn(rows, (r) => r.link_cpc);
  const bestCpcImplied = cpcFromCpc.coveredSpend > 0 ? cpcFromCpc : cpcFromLinkCpc;

  let cpc = bestCpcImplied.coveredSpend > 0 && bestCpcImplied.implied > 0
    ? bestCpcImplied.coveredSpend / bestCpcImplied.implied
    : null;
  let cpcSource: MetaRateSource = cpc !== null ? "raw_metric" : "none";

  if (cpc === null && bestCtrImplied.implied > 0) {
    cpc = totals.spend / bestCtrImplied.implied;
    cpcSource = "raw_metric";
  }

  return {
    ctr,
    ctrSource: ctr !== null ? "raw_metric" : "none",
    cpc,
    cpcSource,
  };
}
