import "server-only";
import { getMetaAdHierarchy, getMetaDailyRawRowsForAds } from "@/lib/creative-changes/repository";
import { aggregatePeriodMetrics } from "@/lib/creative-changes/metrics";
import { getGa4DailyRows, getGa4RowsForCampaignContent } from "@/lib/ga4/repository";
import { aggregateGa4Metrics } from "@/lib/ga4/metrics";
import { resolveUtmForAd } from "@/lib/utm-mapping/resolve";
import { getLeadsForCampaignContent } from "@/lib/leads-analysis/repository";
import { computeLeadsKpiSummary } from "@/lib/leads-analysis/kpi";
import { kstDateOnlyToInstantIso } from "@/lib/leads-analysis/period";
import { computeGroupBenchmark, diagnoseAd } from "@/lib/ad-diagnosis/engine";
import { computeMetaRateFallback } from "@/lib/ad-diagnosis/meta-rate-fallback";
import { summarizeCampaignDiagnosis, type CampaignDiagnosisSummary } from "@/lib/ad-diagnosis/summary";
import { addDaysToDateOnly, toKstDateOnly } from "@/lib/date/kst";
import type {
  AdBenchmarkSample,
  AdDiagnosisAdInput,
  AdDiagnosisResult,
  AdGa4Metrics,
  AdMetaMetrics,
  AdTargetingMetrics,
  OriginalAdReference,
} from "@/lib/ad-diagnosis/types";

export interface CampaignAdDiagnosisGroup {
  campaignName: string;
  summary: CampaignDiagnosisSummary;
  ads: AdDiagnosisResult[];
}

/** Matches an ad name's " - 버전2" / "- 버전 3" style suffix (see spec examples). */
const VERSION_SUFFIX_RE = /\s*-\s*버전\s*\d+\s*$/;

function baseAdName(adName: string | null): string | null {
  if (!adName) return null;
  const base = adName.replace(VERSION_SUFFIX_RE, "").trim();
  return base.length > 0 ? base : null;
}

/**
 * Sitewide check (not scoped to one ad's UTM mapping): does GA4 record any
 * form_complete events at all in this window, anywhere? If form_start fired
 * but form_complete never did, that's the signature of a disconnected
 * tracking event, not universally-zero completions — see
 * AdGa4Metrics.formCompleteTrackingConnected.
 */
export async function checkFormCompleteTrackingConnected(startDate: string, endDate: string): Promise<boolean> {
  const rows = await getGa4DailyRows({ startDate, endDate });
  const agg = aggregateGa4Metrics(rows);
  if (agg.totalFormStarts === 0) return true; // no signal either way — don't claim it's broken
  return agg.totalFormCompletes > 0;
}

async function buildAdInput(
  ad: {
    adId: string;
    adIds: string[];
    adName: string | null;
    campaignName: string | null;
  },
  formCompleteTrackingConnected: boolean
): Promise<AdDiagnosisAdInput> {
  const today = toKstDateOnly(new Date().toISOString());
  const start = addDaysToDateOnly(today, -30);

  const metaRows = await getMetaDailyRawRowsForAds(ad.adIds, start, today);
  const metaAgg = aggregatePeriodMetrics(metaRows);
  const rateFallback = computeMetaRateFallback(metaRows, {
    spend: metaAgg.totalSpend,
    impressions: metaAgg.totalImpressions,
    clicks: metaAgg.totalClicks,
    linkClicks: metaAgg.totalLinkClicks,
  });

  const meta: AdMetaMetrics = {
    spend: metaAgg.totalSpend,
    impressions: metaAgg.totalImpressions,
    reach: metaAgg.totalReach,
    frequency: metaAgg.avgFrequency,
    linkClicks: metaAgg.totalLinkClicks,
    ctr: rateFallback.ctr,
    ctrSource: rateFallback.ctrSource,
    cpc: rateFallback.cpc,
    cpcSource: rateFallback.cpcSource,
    video3s: metaAgg.video3s.count,
    video25: metaAgg.video25.count,
    video50: metaAgg.video50.count,
    video75: metaAgg.video75.count,
    video95: metaAgg.video95.count,
    video100: metaAgg.video100.count,
    videoCompletionRate:
      metaAgg.video3s.count > 0 ? (metaAgg.video100.count / metaAgg.video3s.count) * 100 : null,
  };

  let ga4: AdGa4Metrics | null = null;
  let targeting: AdTargetingMetrics | null = null;

  const resolved = await resolveUtmForAd(ad.campaignName, ad.adName);
  if (resolved) {
    const ga4Rows = await getGa4RowsForCampaignContent(resolved.utmCampaign, resolved.utmContent, {
      startDate: start,
      endDate: today,
    });
    if (ga4Rows.length > 0) {
      const ga4Agg = aggregateGa4Metrics(ga4Rows);
      ga4 = {
        landingSessions: ga4Agg.totalSessions,
        landingPageViews: ga4Agg.totalPageViews,
        ctaClicks: ga4Agg.totalCtaClicks,
        formStarts: ga4Agg.totalFormStarts,
        formCompletes: ga4Agg.totalFormCompletes,
        ctaRate: ga4Agg.ctaRate,
        formStartRate: ga4Agg.formStartRate,
        formCompleteRate: ga4Agg.formCompleteRate,
        landingConversionRate:
          ga4Agg.totalSessions > 0 ? (ga4Agg.totalFormCompletes / ga4Agg.totalSessions) * 100 : null,
        formCompleteTrackingConnected,
      };
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
      targeting = { totalLeads: kpi.totalDb, validLeads: kpi.validDb, validDbRate: kpi.validDbRate };
    }
  }

  return {
    adId: ad.adId,
    adName: ad.adName,
    campaignName: ad.campaignName,
    meta,
    ga4,
    targeting,
    original: null,
  };
}

function costPerLandingPageView(ad: AdDiagnosisAdInput): number | null {
  if (!ad.ga4 || ad.ga4.landingPageViews <= 0) return null;
  return ad.meta.spend / ad.ga4.landingPageViews;
}

/**
 * Meta + GA4 (+ leads) per ad, grouped by campaign, run through the
 * auto-diagnosis engine. Ads are fetched sequentially — one Supabase round
 * trip per ad per source — matching the rest of this app's combined-analysis
 * queries rather than firing dozens of requests at once.
 */
export async function buildAdDiagnosisGroups(adLimit = 30): Promise<CampaignAdDiagnosisGroup[]> {
  const hierarchy = await getMetaAdHierarchy();

  // Group by (campaign_name, ad_name), not raw ad_id: a real-world ad can
  // have more than one ad_id in meta_daily (a temp: hash id from before the
  // "Ad ID" column existed in an export, plus the real Meta ad_id from a
  // later one) — see getMetaDailyRawRowsForAds. Reporting on just one ad_id
  // would silently show only part of that ad's spend/clicks.
  const byIdentity = new Map<
    string,
    { adIds: string[]; adName: string | null; campaignName: string | null }
  >();
  for (const row of hierarchy) {
    const key = `${row.campaignName ?? ""}|||${row.adName ?? ""}`;
    let entry = byIdentity.get(key);
    if (!entry) {
      entry = { adIds: [], adName: row.adName, campaignName: row.campaignName };
      byIdentity.set(key, entry);
    }
    entry.adIds.push(row.adId);
  }

  const identities = [...byIdentity.values()].slice(0, adLimit);

  const today = toKstDateOnly(new Date().toISOString());
  const start = addDaysToDateOnly(today, -30);
  const formCompleteTrackingConnected = await checkFormCompleteTrackingConnected(start, today);

  const perAdInputs: AdDiagnosisAdInput[] = [];
  for (const identity of identities) {
    // Prefer a real Meta ad_id (not the temp: hash) as the display/lookup key.
    const primaryAdId = identity.adIds.find((id) => !id.startsWith("temp:")) ?? identity.adIds[0];
    perAdInputs.push(
      await buildAdInput(
        {
          adId: primaryAdId,
          adIds: identity.adIds,
          adName: identity.adName,
          campaignName: identity.campaignName,
        },
        formCompleteTrackingConnected
      )
    );
  }

  const byCampaign = new Map<string, AdDiagnosisAdInput[]>();
  for (const input of perAdInputs) {
    const key = input.campaignName ?? "(캠페인 미상)";
    if (!byCampaign.has(key)) byCampaign.set(key, []);
    byCampaign.get(key)!.push(input);
  }

  const groups: CampaignAdDiagnosisGroup[] = [];

  for (const [campaignName, campaignAds] of byCampaign) {
    // Non-versioned ads are candidate "originals" for any "- 버전N" sibling in the same campaign.
    const originalsByBaseName = new Map<string, AdDiagnosisAdInput>();
    for (const ad of campaignAds) {
      if (ad.adName && VERSION_SUFFIX_RE.test(ad.adName)) continue;
      const base = baseAdName(ad.adName);
      if (base && !originalsByBaseName.has(base)) originalsByBaseName.set(base, ad);
    }

    const withOriginals: AdDiagnosisAdInput[] = campaignAds.map((ad) => {
      if (!ad.adName || !VERSION_SUFFIX_RE.test(ad.adName)) return ad;
      const base = baseAdName(ad.adName);
      const original = base ? originalsByBaseName.get(base) : undefined;
      if (!original || original.adId === ad.adId) return ad;

      const originalRef: OriginalAdReference = {
        adId: original.adId,
        adName: original.adName,
        ctr: original.meta.ctr,
        cpc: original.meta.cpc,
        costPerLandingPageView: costPerLandingPageView(original),
      };
      return { ...ad, original: originalRef };
    });

    const benchmarkSamples: AdBenchmarkSample[] = withOriginals.map((ad) => ({
      adId: ad.adId,
      ctr: ad.meta.ctr,
      cpc: ad.meta.cpc,
      costPerLandingPageView: costPerLandingPageView(ad),
      landingConversionRate: ad.ga4?.landingConversionRate ?? null,
    }));
    const benchmark = computeGroupBenchmark(benchmarkSamples);

    const results = withOriginals.map((ad) => diagnoseAd(ad, benchmark));
    const summary = summarizeCampaignDiagnosis(campaignName, results);

    groups.push({ campaignName, summary, ads: results });
  }

  groups.sort((a, b) => {
    const spendA = a.ads.reduce((sum, ad) => sum + ad.metrics.spend, 0);
    const spendB = b.ads.reduce((sum, ad) => sum + ad.metrics.spend, 0);
    return spendB - spendA;
  });

  return groups;
}
