import "server-only";
import { getMetaAdHierarchy, getMetaDailyRawRowsForAds } from "@/lib/creative-changes/repository";
import { aggregatePeriodMetrics } from "@/lib/creative-changes/metrics";
import { computeMetaRateFallback } from "@/lib/ad-diagnosis/meta-rate-fallback";
import { resolveUtmForAd } from "@/lib/utm-mapping/resolve";
import { getGa4RowsForCampaignContent } from "@/lib/ga4/repository";
import { aggregateGa4Metrics } from "@/lib/ga4/metrics";
import { getLeadsForCampaignContent } from "@/lib/leads-analysis/repository";
import { computeLeadsKpiSummary } from "@/lib/leads-analysis/kpi";
import { kstDateOnlyToInstantIso } from "@/lib/leads-analysis/period";
import { addDaysToDateOnly, toKstDateOnly } from "@/lib/date/kst";
import type { AdOffSnapshotInput } from "@/lib/ad-operations/types";

/**
 * Real trailing-30-day metrics for one ad, captured at the moment its status
 * is set to OFF. Every field is null (never a fabricated 0) when its source
 * couldn't be resolved — no Meta rows for this ad identity, no UTM mapping,
 * or no matched leads.
 */
export async function buildOffSnapshotMetrics(
  campaignName: string,
  adName: string
): Promise<Omit<AdOffSnapshotInput, "ad_operational_status_id">> {
  const hierarchy = await getMetaAdHierarchy();
  const adIds = hierarchy
    .filter((row) => row.campaignName === campaignName && row.adName === adName)
    .map((row) => row.adId);

  const today = toKstDateOnly(new Date().toISOString());
  const start = addDaysToDateOnly(today, -30);

  let spend: number | null = null;
  let ctr: number | null = null;
  let cpc: number | null = null;
  let video100Rate: number | null = null;
  let landingConversionRate: number | null = null;
  let dbCount: number | null = null;
  let validDbCount: number | null = null;
  let confirmedBookings: number | null = null;

  if (adIds.length > 0) {
    const metaRows = await getMetaDailyRawRowsForAds(adIds, start, today);
    const metaAgg = aggregatePeriodMetrics(metaRows);
    const rateFallback = computeMetaRateFallback(metaRows, {
      spend: metaAgg.totalSpend,
      impressions: metaAgg.totalImpressions,
      clicks: metaAgg.totalClicks,
      linkClicks: metaAgg.totalLinkClicks,
    });
    spend = metaAgg.totalSpend;
    ctr = rateFallback.ctr;
    cpc = rateFallback.cpc;
    video100Rate = metaAgg.video3s.count > 0 ? (metaAgg.video100.count / metaAgg.video3s.count) * 100 : null;
  }

  const resolved = await resolveUtmForAd(campaignName, adName);
  if (resolved) {
    const ga4Rows = await getGa4RowsForCampaignContent(resolved.utmCampaign, resolved.utmContent, {
      startDate: start,
      endDate: today,
    });
    if (ga4Rows.length > 0) {
      const ga4Agg = aggregateGa4Metrics(ga4Rows);
      landingConversionRate =
        ga4Agg.totalSessions > 0 ? (ga4Agg.totalFormCompletes / ga4Agg.totalSessions) * 100 : null;
    }

    const startIso = kstDateOnlyToInstantIso(start);
    const endIsoExclusive = kstDateOnlyToInstantIso(addDaysToDateOnly(today, 1));
    const leadRows = await getLeadsForCampaignContent(
      resolved.utmCampaign,
      resolved.utmContent,
      startIso,
      endIsoExclusive
    );
    if (leadRows.length > 0) {
      const kpi = computeLeadsKpiSummary(leadRows);
      dbCount = kpi.totalDb;
      validDbCount = kpi.validDb;
      confirmedBookings = kpi.confirmedBookings;
    }
  }

  return {
    campaign_name: campaignName,
    ad_name: adName,
    spend,
    ctr,
    cpc,
    video_100_rate: video100Rate,
    landing_conversion_rate: landingConversionRate,
    db_count: dbCount,
    valid_db_count: validDbCount,
    confirmed_bookings: confirmedBookings,
  };
}
