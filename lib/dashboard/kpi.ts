import "server-only";
import { getGa4LandingTotals, getMetaTotals } from "@/lib/dashboard/repository";
import { getAllLeadsForAnalysis } from "@/lib/leads-analysis/repository";
import { computeLeadsCpaSummary, computeLeadsKpiSummary } from "@/lib/leads-analysis/kpi";

export interface DashboardKpiSummary {
  hasMetaData: boolean;
  hasGa4Data: boolean;
  hasLeadsData: boolean;

  totalSpend: number;
  /** total clicks / total impressions * 100 — never a per-row average. */
  ctr: number | null;

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

  /** ga4_daily.form_completes / ga4_daily.landing_views * 100. */
  landingConversionRate: number | null;
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

  return {
    hasMetaData,
    hasGa4Data: ga4Totals.rowCount > 0,
    hasLeadsData: leadsRows.length > 0,

    totalSpend: metaTotals.spend,
    ctr: metaTotals.impressions > 0 ? (metaTotals.clicks / metaTotals.impressions) * 100 : null,

    totalLeads: leadsKpi.totalDb,
    avgCpa: leadsCpa.dbCpa,

    validLeads: leadsKpi.validDb,
    validDbRate: leadsKpi.validDbRate,
    validCpa: leadsCpa.validDbCpa,

    confirmedBookings: leadsKpi.confirmedBookings,
    bookingRate: leadsKpi.bookingRate,
    bookingCpa: leadsCpa.bookingCpa,

    landingConversionRate:
      ga4Totals.landingViews > 0 ? (ga4Totals.formCompletes / ga4Totals.landingViews) * 100 : null,
  };
}
