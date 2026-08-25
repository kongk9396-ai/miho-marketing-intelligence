import "server-only";
import { getMetaDailyRowsInRange } from "@/lib/dashboard/repository";
import { aggregatePeriodMetrics } from "@/lib/creative-changes/metrics";
import { computeMetaRateFallback } from "@/lib/ad-diagnosis/meta-rate-fallback";
import { buildRetentionFunnel, type FunnelStage } from "@/lib/video-analysis/funnel";
import { getGa4DailyRows } from "@/lib/ga4/repository";
import { aggregateGa4Metrics, type Ga4PeriodMetrics } from "@/lib/ga4/metrics";
import { getLeadsInRange } from "@/lib/leads-analysis/repository";
import { computeLeadsCpaSummary, computeLeadsKpiSummary, type LeadsCpaSummary, type LeadsKpiSummary } from "@/lib/leads-analysis/kpi";
import { classifyDbProblem, type DbProblemResult } from "@/lib/leads-analysis/problem-classification";
import { kstDateOnlyToInstantIso } from "@/lib/leads-analysis/period";
import { addDaysToDateOnly } from "@/lib/date/kst";
import { computeChangePercent } from "@/lib/change-percent";
import { buildAdDiagnosisGroups } from "@/lib/ad-diagnosis/build";
import { determineBottleneck } from "@/lib/ad-performance-summary/bottleneck";
import {
  buildAdOperationalDecisions,
  OPERATIONAL_RECOMMENDATION_LABELS,
  type AdOperationalDecision,
} from "@/lib/ad-performance-summary/operational-decision";
import { listAdOperationalStatuses, getOffSnapshotsByStatusId } from "@/lib/ad-operations/repository";
import { formatWon, formatCount } from "@/lib/dashboard/format";
import type { PeriodMetrics } from "@/lib/creative-changes/types";
import type { AdDiagnosisStatus } from "@/lib/ad-diagnosis/types";

export interface DailyReportChange {
  label: string;
  detail: string;
}

export interface DailyReportPayload {
  date: string;
  meta: {
    spend: number;
    impressions: number;
    ctr: number | null;
    cpc: number | null;
    cpm: number | null;
  };
  videoFunnel: FunnelStage[];
  ga4: Ga4PeriodMetrics;
  leadsKpi: LeadsKpiSummary;
  leadsCpa: LeadsCpaSummary;
  keyChanges: DailyReportChange[];
  bottleneckHeadline: string;
  adDecisions: { adName: string | null; campaignName: string | null; recommendationLabel: string }[];
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

function buildSummaryText(input: {
  date: string;
  metaMetrics: PeriodMetrics;
  ctr: number | null;
  leadsKpi: LeadsKpiSummary;
  bottleneckHeadline: string;
}): string {
  const { date, metaMetrics, ctr, leadsKpi, bottleneckHeadline } = input;
  if (metaMetrics.totalSpend === 0 && leadsKpi.totalDb === 0) {
    return `${date} 집계된 Meta 광고비/DB 데이터가 없습니다.`;
  }
  const sentences: string[] = [];
  sentences.push(
    `${date} 광고비 ${formatWon(metaMetrics.totalSpend)}, CTR ${ctr !== null ? ctr.toFixed(2) + "%" : "데이터 없음"}, DB ${formatCount(leadsKpi.totalDb)}건(유효 ${formatCount(leadsKpi.validDb)}건)이 발생했습니다.`
  );
  sentences.push(bottleneckHeadline);
  return sentences.join(" ");
}

/** Builds one day's report payload from real data. Does not persist — see lib/reports/repository.ts. */
export async function buildDailyReport(dateKst: string): Promise<DailyReportPayload> {
  const prevDate = addDaysToDateOnly(dateKst, -1);

  const [metaRows, prevMetaRows, ga4Rows, leadsRows, prevLeadsRows] = await Promise.all([
    getMetaDailyRowsInRange(dateKst, dateKst),
    getMetaDailyRowsInRange(prevDate, prevDate),
    getGa4DailyRows({ startDate: dateKst, endDate: dateKst }),
    getLeadsInRange(kstDateOnlyToInstantIso(dateKst), kstDateOnlyToInstantIso(addDaysToDateOnly(dateKst, 1))),
    getLeadsInRange(kstDateOnlyToInstantIso(prevDate), kstDateOnlyToInstantIso(dateKst)),
  ]);

  const metaMetrics = aggregatePeriodMetrics(metaRows);
  const prevMetaMetrics = aggregatePeriodMetrics(prevMetaRows);
  // Same CTR/CPC fallback chain used everywhere else — never reimplemented per report.
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

  const keyChanges: DailyReportChange[] = [];
  const spendChange = computeChangePercent(prevMetaMetrics.totalSpend, metaMetrics.totalSpend);
  if (spendChange !== null) {
    keyChanges.push({
      label: "광고비",
      detail: `전일 대비 ${spendChange >= 0 ? "+" : ""}${spendChange.toFixed(1)}% (${formatWon(prevMetaMetrics.totalSpend)} → ${formatWon(metaMetrics.totalSpend)})`,
    });
  }
  const dbChange = computeChangePercent(prevLeadsKpi.totalDb, leadsKpi.totalDb);
  if (dbChange !== null) {
    keyChanges.push({
      label: "DB",
      detail: `전일 대비 ${dbChange >= 0 ? "+" : ""}${dbChange.toFixed(1)}% (${formatCount(prevLeadsKpi.totalDb)}건 → ${formatCount(leadsKpi.totalDb)}건)`,
    });
  }

  // 병목 판정: 하루치 leads 표본은 너무 작아 최근 7일 롤링 비교로 계산한다 (see lib/reports/daily.ts plan note).
  const today = dateKst;
  const last7Start = addDaysToDateOnly(today, -6);
  const prev7Start = addDaysToDateOnly(today, -13);
  const prev7End = addDaysToDateOnly(today, -7);
  const [last7Rows, prev7Rows, adGroups, adStatuses, offSnapshots] = await Promise.all([
    getLeadsInRange(kstDateOnlyToInstantIso(last7Start), kstDateOnlyToInstantIso(addDaysToDateOnly(today, 1))),
    getLeadsInRange(kstDateOnlyToInstantIso(prev7Start), kstDateOnlyToInstantIso(prev7End)),
    buildAdDiagnosisGroups(),
    listAdOperationalStatuses(),
    getOffSnapshotsByStatusId(),
  ]);
  const last7Kpi = computeLeadsKpiSummary(last7Rows);
  const prev7Kpi = computeLeadsKpiSummary(prev7Rows);
  const dbProblem: DbProblemResult = classifyDbProblem(prev7Kpi, last7Kpi);

  const statusCounts = emptyStatusCounts();
  const allAdResults = adGroups.flatMap((g) => g.ads);
  for (const r of allAdResults) statusCounts[r.status] += 1;
  const bottleneck = determineBottleneck(statusCounts, dbProblem);

  const statusesByKey = new Map(adStatuses.map((s) => [`${s.campaign_name}|||${s.ad_name}`, s]));
  const decisions: AdOperationalDecision[] = buildAdOperationalDecisions(
    allAdResults,
    statusesByKey,
    offSnapshots
  );

  const bottleneckHeadline = `[최근 7일 기준] ${bottleneck.headline}`;
  const summaryText = buildSummaryText({ date: dateKst, metaMetrics, ctr: rateFallback.ctr, leadsKpi, bottleneckHeadline });

  return {
    date: dateKst,
    meta: { spend: metaMetrics.totalSpend, impressions: metaMetrics.totalImpressions, ctr: rateFallback.ctr, cpc: rateFallback.cpc, cpm: metaMetrics.cpm },
    videoFunnel,
    ga4: ga4Metrics,
    leadsKpi,
    leadsCpa,
    keyChanges,
    bottleneckHeadline,
    adDecisions: decisions.map((d) => ({
      adName: d.adName,
      campaignName: d.campaignName,
      recommendationLabel: OPERATIONAL_RECOMMENDATION_LABELS[d.recommendation],
    })),
    summaryText,
  };
}
