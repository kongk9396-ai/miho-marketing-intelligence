import "server-only";
import { getGa4LandingTotals, getLeadsCounts, getMetaTotals } from "@/lib/dashboard/repository";

export interface DashboardKpiSummary {
  hasMetaData: boolean;
  hasGa4Data: boolean;

  totalSpend: number;
  /** total clicks / total impressions * 100 — never a per-row average. */
  ctr: number | null;

  totalLeads: number;
  /** totalSpend / totalLeads. Null when there are no leads yet. */
  avgCpa: number | null;

  validLeads: number;
  /** totalSpend / validLeads. Null when there are no valid leads yet. */
  validCpa: number | null;

  bookedLeads: number;

  /** ga4_daily.form_completes / ga4_daily.landing_views * 100. */
  landingConversionRate: number | null;
}

export async function getDashboardKpiSummary(): Promise<DashboardKpiSummary> {
  const [metaTotals, leadsCounts, ga4Totals] = await Promise.all([
    getMetaTotals(),
    getLeadsCounts(),
    getGa4LandingTotals(),
  ]);

  return {
    hasMetaData: metaTotals.rowCount > 0,
    hasGa4Data: ga4Totals.rowCount > 0,

    totalSpend: metaTotals.spend,
    ctr: metaTotals.impressions > 0 ? (metaTotals.clicks / metaTotals.impressions) * 100 : null,

    totalLeads: leadsCounts.total,
    avgCpa: leadsCounts.total > 0 ? metaTotals.spend / leadsCounts.total : null,

    validLeads: leadsCounts.valid,
    validCpa: leadsCounts.valid > 0 ? metaTotals.spend / leadsCounts.valid : null,

    bookedLeads: leadsCounts.booked,

    landingConversionRate:
      ga4Totals.landingViews > 0 ? (ga4Totals.formCompletes / ga4Totals.landingViews) * 100 : null,
  };
}
