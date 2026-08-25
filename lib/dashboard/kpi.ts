import "server-only";
import { getGa4LandingTotals, getMetaTotals } from "@/lib/dashboard/repository";
import { getAllLeadsForAnalysis } from "@/lib/leads-analysis/repository";
import { computeLeadsCpaSummary, computeLeadsKpiSummary } from "@/lib/leads-analysis/kpi";
import { computeMetaRateFallback } from "@/lib/ad-diagnosis/meta-rate-fallback";
import type { MetaRateSource } from "@/lib/ad-diagnosis/meta-rate-fallback";

export interface DashboardKpiSummary {
  hasMetaData: boolean;
  hasGa4Data: boolean;
  hasLeadsData: boolean;

  totalSpend: number;
  impressions: number;
  linkClicks: number;
  /**
   * Same priority chain as lib/ad-diagnosis/meta-rate-fallback.ts (raw
   * all-click count -> link-click count -> Meta's own reported rate ->
   * null). Never a per-row average, and never a fabricated 0% when the
   * source export simply didn't populate the raw "clicks (all)" column.
   */
  ctr: number | null;
  ctrSource: MetaRateSource;
  cpc: number | null;
  cpcSource: MetaRateSource;
  /** spend / impressions * 1000. Independent of the click fallback — needs only spend+impressions, both always real. */
  cpm: number | null;

  totalLeads: number;
  /** totalSpend / totalLeads. Null when there are no leads yet. */
  avgCpa: number | null;

  validLeads: number;
  validDbRate: number | null;
  /** totalSpend / validLeads. Null when there are no valid leads yet. */
  validCpa: number | null;

  confirmedBookings: number;
  bookingRate: number | null;
  bookingCpa: number | null;

  /**
   * ga4_daily.form_completes / ga4_daily.landing_views * 100 — only when
   * formCompleteTrackingConnected is true. When form_start events are firing
   * sitewide but form_complete never has, that's a disconnected tracking
   * event, not genuine 0% completion — see formCompleteTrackingConnected.
   */
  landingConversionRate: number | null;
  /** False = GA4 recorded form_start events but zero form_complete events across the whole account. The UI must show "폼 완료 추적 미연결", never "0.00%", when this is false. */
  formCompleteTrackingConnected: boolean;
}

export async function getDashboardKpiSummary(): Promise<DashboardKpiSummary> {
  const [metaTotals, leadsRows, ga4Totals] = await Promise.all([
    getMetaTotals(),
    getAllLeadsForAnalysis(),
    getGa4LandingTotals(),
  ]);

  const hasMetaData = metaTotals.rowCount > 0;
  const leadsKpi = computeLeadsKpiSummary(leadsRows);
  // With no Meta data synced at all, spend is unknown (not zero) — a "₩0"
  // CPA would read as "free acquisition" rather than "no ad spend data yet".
  const leadsCpa = hasMetaData
    ? computeLeadsCpaSummary(metaTotals.spend, leadsKpi)
    : { dbCpa: null, validDbCpa: null, connectedCpa: null, bookingCpa: null, visitedCpa: null };

  // Reuses the exact same fallback chain the ad-diagnosis engine and
  // /ads-analysis/campaigns already use — never reimplemented per page.
  // No per-row rate columns are fetched for this all-time total, so only
  // the first two tiers (raw clicks -> link clicks) apply here; that
  // already covers the real gap (Meta exports that omit "Clicks (all)").
  const rateFallback = computeMetaRateFallback([], {
    spend: metaTotals.spend,
    impressions: metaTotals.impressions,
    clicks: metaTotals.clicks,
    linkClicks: metaTotals.linkClicks,
  });

  const hasGa4Data = ga4Totals.rowCount > 0;
  const formCompleteTrackingConnected = !(ga4Totals.formStarts > 0 && ga4Totals.formCompletes === 0);

  return {
    hasMetaData,
    hasGa4Data,
    hasLeadsData: leadsRows.length > 0,

    totalSpend: metaTotals.spend,
    impressions: metaTotals.impressions,
    linkClicks: metaTotals.linkClicks,
    ctr: rateFallback.ctr,
    ctrSource: rateFallback.ctrSource,
    cpc: rateFallback.cpc,
    cpcSource: rateFallback.cpcSource,
    cpm: metaTotals.impressions > 0 ? (metaTotals.spend / metaTotals.impressions) * 1000 : null,

    totalLeads: leadsKpi.totalDb,
    avgCpa: leadsCpa.dbCpa,

    validLeads: leadsKpi.validDb,
    validDbRate: leadsKpi.validDbRate,
    validCpa: leadsCpa.validDbCpa,

    confirmedBookings: leadsKpi.confirmedBookings,
    bookingRate: leadsKpi.bookingRate,
    bookingCpa: leadsCpa.bookingCpa,

    landingConversionRate:
      hasGa4Data && formCompleteTrackingConnected && ga4Totals.landingViews > 0
        ? (ga4Totals.formCompletes / ga4Totals.landingViews) * 100
        : null,
    formCompleteTrackingConnected,
  };
}
