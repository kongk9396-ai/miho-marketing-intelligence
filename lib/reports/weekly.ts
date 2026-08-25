import "server-only";
import { getMetaCampaignDailyRowsInRange, getMetaDailyRowsInRange } from "@/lib/dashboard/repository";
import { aggregatePeriodMetrics } from "@/lib/creative-changes/metrics";
import { computeMetaRateFallback } from "@/lib/ad-diagnosis/meta-rate-fallback";
import { buildRetentionFunnel, type FunnelStage } from "@/lib/video-analysis/funnel";
import { getGa4DailyRows } from "@/lib/ga4/repository";
import { aggregateGa4Metrics, type Ga4PeriodMetrics } from "@/lib/ga4/metrics";
import { getLeadsInRange } from "@/lib/leads-analysis/repository";
import { computeLeadsCpaSummary, computeLeadsKpiSummary, type LeadsCpaSummary, type LeadsKpiSummary } from "@/lib/leads-analysis/kpi";
import { classifyDbProblem } from "@/lib/leads-analysis/problem-classification";
import { kstDateOnlyToInstantIso } from "@/lib/leads-analysis/period";
import { addDaysToDateOnly, diffDaysBetweenDateOnly, toKstDateOnly } from "@/lib/date/kst";
import { buildAdDiagnosisGroups } from "@/lib/ad-diagnosis/build";
import { determineBottleneck } from "@/lib/ad-performance-summary/bottleneck";
import { mapToOperationalRecommendation } from "@/lib/ad-performance-summary/operational-decision";
import { listCreativeChanges } from "@/lib/creative-changes/repository";
import { listLandingChanges } from "@/lib/landing-changes/repository";
import { getMostRecentCompletedWeek, type WeekRange } from "@/lib/reports/period";
import { formatWon, formatCount } from "@/lib/dashboard/format";
import type { AdDiagnosisStatus } from "@/lib/ad-diagnosis/types";

export interface WeeklyCampaignSummary {
  campaignName: string;
  spend: number;
  ctr: number | null;
  cpc: number | null;
}

export interface WeeklyReportPayload {
  period: WeekRange;
  meta: { spend: number; dailyAvgSpend: number; ctr: number | null; cpc: number | null; cpm: number | null };
  videoFunnel: FunnelStage[];
  ga4: Ga4PeriodMetrics;
  leadsKpi: LeadsKpiSummary;
  leadsCpa: LeadsCpaSummary;
  campaigns: WeeklyCampaignSummary[];
  creativeChangesThisWeek: number;
  landingChangesThisWeek: number;
  topEfficientAd: { adName: string | null; campaignName: string | null; ctr: number | null; cpc: number | null } | null;
  offReviewAds: { adName: string | null; campaignName: string | null }[];
  bottleneckHeadline: string;
  nextActions: string[];
  summaryText: string;
}

function emptyStatusCounts(): Record<AdDiagnosisStatus, number> {
  return {
    HEALTHY: 0,
    CREATIVE_PROBLEM: 0,
    LANDING_PROBLEM: 0,
    FORM_PROBLEM: 0,
    TARGETING_PROBLEM: 0,
    INSUFFICIENT_DATA: 0,
  };
}

/** Builds one week's report payload from real data (Monday-Sunday KST). Does not persist. */
export async function buildWeeklyReport(todayKst: string): Promise<WeeklyReportPayload> {
  const period = getMostRecentCompletedWeek(todayKst);
  const dayCount = diffDaysBetweenDateOnly(period.start, period.end) + 1;

  const prevWeekStart = addDaysToDateOnly(period.start, -dayCount);

  const [metaRows, campaignRows, ga4Rows, leadsRows, prevLeadsRows, adGroups, creativeChanges, landingChanges] =
    await Promise.all([
      getMetaDailyRowsInRange(period.start, period.end),
      getMetaCampaignDailyRowsInRange(period.start, period.end),
      getGa4DailyRows({ startDate: period.start, endDate: period.end }),
      getLeadsInRange(kstDateOnlyToInstantIso(period.start), kstDateOnlyToInstantIso(addDaysToDateOnly(period.end, 1))),
      getLeadsInRange(kstDateOnlyToInstantIso(prevWeekStart), kstDateOnlyToInstantIso(period.start)),
      buildAdDiagnosisGroups(),
      listCreativeChanges(200),
      listLandingChanges(200),
    ]);

  const metaMetrics = aggregatePeriodMetrics(metaRows);
  const rateFallback = computeMetaRateFallback([], {
    spend: metaMetrics.totalSpend,
    impressions: metaMetrics.totalImpressions,
    clicks: metaMetrics.totalClicks,
    linkClicks: metaMetrics.totalLinkClicks,
  });
  const videoFunnel = buildRetentionFunnel(metaMetrics);
  const ga4Metrics = aggregateGa4Metrics(ga4Rows);
  const leadsKpi = computeLeadsKpiSummary(leadsRows);
  const prevLeadsKpi = computeLeadsKpiSummary(prevLeadsRows);
  const leadsCpa = computeLeadsCpaSummary(metaMetrics.totalSpend, leadsKpi);

  const byCampaign = new Map<string, typeof campaignRows>();
  for (const row of campaignRows) {
    const key = row.campaign_name ?? "(캠페인 미상)";
    if (!byCampaign.has(key)) byCampaign.set(key, []);
    byCampaign.get(key)!.push(row);
  }
  const campaigns: WeeklyCampaignSummary[] = [...byCampaign.entries()]
    .map(([campaignName, rows]) => {
      const m = aggregatePeriodMetrics(rows);
      return { campaignName, spend: m.totalSpend, ctr: m.ctr, cpc: m.cpc };
    })
    .sort((a, b) => b.spend - a.spend);

  const creativeChangesThisWeek = creativeChanges.filter((c) => {
    const d = toKstDateOnly(c.changed_at);
    return d >= period.start && d <= period.end;
  }).length;
  const landingChangesThisWeek = landingChanges.filter((c) => {
    const d = toKstDateOnly(c.changed_at);
    return d >= period.start && d <= period.end;
  }).length;

  const allAdResults = adGroups.flatMap((g) => g.ads);
  const statusCounts = emptyStatusCounts();
  for (const r of allAdResults) statusCounts[r.status] += 1;
  const dbProblem = classifyDbProblem(prevLeadsKpi, leadsKpi);
  const bottleneck = determineBottleneck(statusCounts, dbProblem);
  const bottleneckHeadline = bottleneck.headline;

  const judgable = allAdResults.filter((r) => r.status !== "INSUFFICIENT_DATA");
  const topEfficient = judgable
    .filter((r) => mapToOperationalRecommendation(r) === "SCALE_REVIEW" || mapToOperationalRecommendation(r) === "KEEP")
    .sort((a, b) => (b.metrics.ctr ?? 0) - (a.metrics.ctr ?? 0))[0];
  const offReview = allAdResults.filter((r) => mapToOperationalRecommendation(r) === "OFF_REVIEW");

  const nextActions: string[] = [];
  if (offReview.length > 0) {
    nextActions.push(
      `OFF 검토: ${offReview.slice(0, 3).map((r) => r.adName ?? r.adId).join(", ")}${offReview.length > 3 ? ` 외 ${offReview.length - 3}건` : ""}`
    );
  }
  if (bottleneck.category !== "HEALTHY" && bottleneck.category !== "INSUFFICIENT_DATA") {
    nextActions.push(`병목 개선: ${bottleneck.headline}`);
  }
  if (nextActions.length === 0) {
    nextActions.push("현재 뚜렷한 조치가 필요한 항목이 없습니다. 현행 유지하며 관찰하세요.");
  }

  const summaryText =
    metaMetrics.totalSpend === 0 && leadsKpi.totalDb === 0
      ? `${period.start} ~ ${period.end} 집계된 Meta 광고비/DB 데이터가 없습니다.`
      : `${period.start} ~ ${period.end} 주간 광고비 ${formatWon(metaMetrics.totalSpend)}, DB ${formatCount(leadsKpi.totalDb)}건(유효 ${formatCount(leadsKpi.validDb)}건, 예약 ${formatCount(leadsKpi.confirmedBookings)}건)이 발생했습니다. ${bottleneckHeadline}`;

  return {
    period,
    meta: {
      spend: metaMetrics.totalSpend,
      dailyAvgSpend: dayCount > 0 ? metaMetrics.totalSpend / dayCount : 0,
      ctr: rateFallback.ctr,
      cpc: rateFallback.cpc,
      cpm: metaMetrics.cpm,
    },
    videoFunnel,
    ga4: ga4Metrics,
    leadsKpi,
    leadsCpa,
    campaigns,
    creativeChangesThisWeek,
    landingChangesThisWeek,
    topEfficientAd: topEfficient
      ? { adName: topEfficient.adName, campaignName: topEfficient.campaignName, ctr: topEfficient.metrics.ctr, cpc: topEfficient.metrics.cpc }
      : null,
    offReviewAds: offReview.map((r) => ({ adName: r.adName, campaignName: r.campaignName })),
    bottleneckHeadline,
    nextActions,
    summaryText,
  };
}

export async function buildCustomPeriodReport(start: string, end: string): Promise<WeeklyReportPayload> {
  const period: WeekRange = { start, end };
  const dayCount = diffDaysBetweenDateOnly(period.start, period.end) + 1;
  const prevWeekStart = addDaysToDateOnly(period.start, -dayCount);

  const [metaRows, campaignRows, ga4Rows, leadsRows, prevLeadsRows, adGroups, creativeChanges, landingChanges] =
    await Promise.all([
      getMetaDailyRowsInRange(period.start, period.end),
      getMetaCampaignDailyRowsInRange(period.start, period.end),
      getGa4DailyRows({ startDate: period.start, endDate: period.end }),
      getLeadsInRange(
        kstDateOnlyToInstantIso(period.start),
        kstDateOnlyToInstantIso(addDaysToDateOnly(period.end, 1))
      ),
      getLeadsInRange(
        kstDateOnlyToInstantIso(prevWeekStart),
        kstDateOnlyToInstantIso(period.start)
      ),
      buildAdDiagnosisGroups(),
      listCreativeChanges(200),
      listLandingChanges(200),
    ]);

  const metaMetrics = aggregatePeriodMetrics(metaRows);

  const rateFallback = computeMetaRateFallback([], {
    spend: metaMetrics.totalSpend,
    impressions: metaMetrics.totalImpressions,
    clicks: metaMetrics.totalClicks,
    linkClicks: metaMetrics.totalLinkClicks,
  });

  const videoFunnel = buildRetentionFunnel(metaMetrics);
  const ga4Metrics = aggregateGa4Metrics(ga4Rows);
  const leadsKpi = computeLeadsKpiSummary(leadsRows);
  const prevLeadsKpi = computeLeadsKpiSummary(prevLeadsRows);
  const leadsCpa = computeLeadsCpaSummary(metaMetrics.totalSpend, leadsKpi);

  const byCampaign = new Map<string, typeof campaignRows>();

  for (const row of campaignRows) {
    const key = row.campaign_name ?? "(캠페인 미상)";
    if (!byCampaign.has(key)) byCampaign.set(key, []);
    byCampaign.get(key)!.push(row);
  }

  const campaigns: WeeklyCampaignSummary[] = [...byCampaign.entries()]
    .map(([campaignName, rows]) => {
      const m = aggregatePeriodMetrics(rows);
      return {
        campaignName,
        spend: m.totalSpend,
        ctr: m.ctr,
        cpc: m.cpc,
      };
    })
    .sort((a, b) => b.spend - a.spend);

  const creativeChangesThisWeek = creativeChanges.filter((c) => {
    const d = toKstDateOnly(c.changed_at);
    return d >= period.start && d <= period.end;
  }).length;

  const landingChangesThisWeek = landingChanges.filter((c) => {
    const d = toKstDateOnly(c.changed_at);
    return d >= period.start && d <= period.end;
  }).length;

  const allAdResults = adGroups.flatMap((g) => g.ads);

  const statusCounts = emptyStatusCounts();
  for (const r of allAdResults) statusCounts[r.status] += 1;

  const dbProblem = classifyDbProblem(prevLeadsKpi, leadsKpi);
  const bottleneck = determineBottleneck(statusCounts, dbProblem);
  const bottleneckHeadline = bottleneck.headline;

  const judgable = allAdResults.filter((r) => r.status !== "INSUFFICIENT_DATA");

  const topEfficient = judgable
    .filter(
      (r) =>
        mapToOperationalRecommendation(r) === "SCALE_REVIEW" ||
        mapToOperationalRecommendation(r) === "KEEP"
    )
    .sort((a, b) => (b.metrics.ctr ?? 0) - (a.metrics.ctr ?? 0))[0];

  const offReview = allAdResults.filter(
    (r) => mapToOperationalRecommendation(r) === "OFF_REVIEW"
  );

  const nextActions: string[] = [];

  if (offReview.length > 0) {
    nextActions.push(
      `OFF 검토: ${offReview
        .slice(0, 3)
        .map((r) => r.adName ?? r.adId)
        .join(", ")}${offReview.length > 3 ? ` 외 ${offReview.length - 3}건` : ""}`
    );
  }

  if (
    bottleneck.category !== "HEALTHY" &&
    bottleneck.category !== "INSUFFICIENT_DATA"
  ) {
    nextActions.push(`병목 개선: ${bottleneck.headline}`);
  }

  if (nextActions.length === 0) {
    nextActions.push(
      "현재 뚜렷한 조치가 필요한 항목이 없습니다. 현행 유지하며 관찰하세요."
    );
  }

  const summaryText =
    metaMetrics.totalSpend === 0 && leadsKpi.totalDb === 0
      ? `${period.start} ~ ${period.end} 집계된 Meta 광고비/DB 데이터가 없습니다.`
      : `${period.start} ~ ${period.end} 광고비 ${formatWon(
          metaMetrics.totalSpend
        )}, DB ${formatCount(leadsKpi.totalDb)}건(유효 ${formatCount(
          leadsKpi.validDb
        )}건, 예약 ${formatCount(
          leadsKpi.confirmedBookings
        )}건)이 발생했습니다. ${bottleneckHeadline}`;

  return {
    period,
    meta: {
      spend: metaMetrics.totalSpend,
      dailyAvgSpend: dayCount > 0 ? metaMetrics.totalSpend / dayCount : 0,
      ctr: rateFallback.ctr,
      cpc: rateFallback.cpc,
      cpm: metaMetrics.cpm,
    },
    videoFunnel,
    ga4: ga4Metrics,
    leadsKpi,
    leadsCpa,
    campaigns,
    creativeChangesThisWeek,
    landingChangesThisWeek,
    topEfficientAd: topEfficient
      ? {
          adName: topEfficient.adName,
          campaignName: topEfficient.campaignName,
          ctr: topEfficient.metrics.ctr,
          cpc: topEfficient.metrics.cpc,
        }
      : null,
    offReviewAds: offReview.map((r) => ({
      adName: r.adName,
      campaignName: r.campaignName,
    })),
    bottleneckHeadline,
    nextActions,
    summaryText,
  };
}
