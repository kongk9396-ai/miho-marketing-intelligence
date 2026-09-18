import "server-only";
import {
  getMetaCampaignDailyRowsInRange,
  getMetaDailyRowsInRange,
  getMetaDateRange,
  getMetaTotals,
} from "@/lib/dashboard/repository";
import { aggregatePeriodMetrics } from "@/lib/creative-changes/metrics";
import { computeMetaRateFallback } from "@/lib/ad-diagnosis/meta-rate-fallback";
import { buildRetentionFunnel, buildVideoHookMetrics, buildRetentionInterpretation, findMaxDropoffLabel } from "@/lib/video-analysis/funnel";
import { buildAdVideoFunnels } from "@/lib/ad-performance-summary/ad-video-comparison";
import { getGa4DailyRows } from "@/lib/ga4/repository";
import { aggregateGa4Metrics } from "@/lib/ga4/metrics";
import { getAllLeadsForAnalysis, getLeadsForCampaignContent } from "@/lib/leads-analysis/repository";
import { computeLeadsCpaSummary, computeLeadsKpiSummary } from "@/lib/leads-analysis/kpi";
import { classifyDbProblem } from "@/lib/leads-analysis/problem-classification";
import { kstDateOnlyToInstantIso } from "@/lib/leads-analysis/period";
import { addDaysToDateOnly, toKstDateOnly } from "@/lib/date/kst";
import { computeComparisonPeriods } from "@/lib/creative-changes/period";
import { buildMetricComparisons } from "@/lib/creative-changes/comparison";
import { getMetaDailyRowsForAd, listCreativeChanges } from "@/lib/creative-changes/repository";
import { CHANGE_TYPE_LABELS } from "@/lib/creative-changes/change-type-labels";
import { evaluateObservation } from "@/lib/creative-changes/observation-status";
import { buildCreativeChangeReportLine } from "@/lib/creative-changes/report-text";
import { resolveUtmForAd } from "@/lib/utm-mapping/resolve";
import { buildAdDiagnosisGroups } from "@/lib/ad-diagnosis/build";
import {
  getAdAccountSettings,
  getOffSnapshotsByStatusId,
  listAdOperationalStatuses,
  listCampaignSettings,
} from "@/lib/ad-operations/repository";
import { computeOperatingDaySummary } from "@/lib/ad-operations/operating-days";
import { computeBudgetSummary } from "@/lib/ad-operations/budget";
import { buildAdOperationalDecisions } from "@/lib/ad-performance-summary/operational-decision";
import { buildTodayConclusion } from "@/lib/ad-performance-summary/today-conclusion";
import { buildFullFunnel } from "@/lib/ad-performance-summary/full-funnel";
import { determineBottleneck } from "@/lib/ad-performance-summary/bottleneck";
import { buildReportHeadline } from "@/lib/ad-performance-summary/report-text";
import {
  getGa4RowsForLandingChange,
  getLeadsForLinkedCampaign,
  listLandingChanges,
  resolveUtmCampaignsForCampaignName,
} from "@/lib/landing-changes/repository";
import { aggregateLandingPeriodMetrics } from "@/lib/landing-changes/metrics";
import { LANDING_CHANGE_TYPE_LABELS } from "@/lib/landing-changes/change-type-labels";
import { evaluateLandingObservation } from "@/lib/landing-changes/observation-status";
import { buildLandingChangeReportLine } from "@/lib/landing-changes/report-text";
import { listAnalysisReports } from "@/lib/reports/repository";
import type { LeadAnalysisRow } from "@/lib/leads-analysis/types";
import type { AdDiagnosisStatus } from "@/lib/ad-diagnosis/types";
import type {
  AdPerformanceSummary,
  CampaignReportSummary,
  ChangeMeta,
  CreativeChangeSection,
  LandingChangeSection,
} from "@/lib/ad-performance-summary/types";

const REPORT_WINDOW_DAYS = 30;

/**
 * Long-running campaigns operated before the August comparison period
 * started — excluded from "신규 캠페인" efficiency/spend figures (never
 * from the "전체 Meta 집행비" total, which always includes everything).
 * A display-time filter only; no data is deleted or hidden elsewhere.
 */
const EXCLUDED_FROM_NEW_CAMPAIGN_COMPARISON = ["0515 정근화 나레이션"];

function dbSnapshotFromLeads(rows: LeadAnalysisRow[]): { totalLeads: number; validLeads: number; confirmedBookings: number } {
  const kpi = computeLeadsKpiSummary(rows);
  return { totalLeads: kpi.totalDb, validLeads: kpi.validDb, confirmedBookings: kpi.confirmedBookings };
}

async function buildCreativeChangeSection(): Promise<CreativeChangeSection> {
  const [latest] = await listCreativeChanges(1);
  if (!latest) {
    return {
      available: false,
      change: null,
      comparisons: null,
      verdict: null,
      reportLine: "아직 등록된 소재 변경 이력이 없습니다.",
      dbAttributionAvailable: false,
      dbBefore: null,
      dbAfter: null,
    };
  }

  const change: ChangeMeta = {
    id: latest.id,
    adName: latest.ad_name,
    campaignName: latest.campaign_name,
    changeTypeLabel: CHANGE_TYPE_LABELS[latest.change_type],
    changedAt: latest.changed_at,
    memo: latest.memo,
  };

  const periods = computeComparisonPeriods(latest.changed_at, latest.comparison_period_days);
  const [beforeRows, afterRows] = await Promise.all([
    getMetaDailyRowsForAd(latest.ad_id, periods.before.start, periods.before.end),
    getMetaDailyRowsForAd(latest.ad_id, periods.after.start, periods.after.end),
  ]);
  const beforeMetrics = aggregatePeriodMetrics(beforeRows);
  const afterMetrics = aggregatePeriodMetrics(afterRows);
  const comparisons = buildMetricComparisons(beforeMetrics, afterMetrics);
  const evaluation = evaluateObservation({
    changedAt: latest.changed_at,
    comparisonPeriodDays: latest.comparison_period_days,
    before: beforeMetrics,
    after: afterMetrics,
  });
  const reportLine = buildCreativeChangeReportLine({
    changedAtKst: toKstDateOnly(latest.changed_at),
    before: beforeMetrics,
    after: afterMetrics,
    hasSufficientData: evaluation.status !== "observing" && evaluation.status !== "insufficient_data",
    comparisonPeriodDays: latest.comparison_period_days,
    isObservationWindowComplete: evaluation.progress.isObservationWindowComplete,
  });

  const resolved = await resolveUtmForAd(latest.campaign_name, latest.ad_name);
  if (!resolved) {
    return {
      available: true,
      change,
      comparisons,
      verdict: evaluation.verdict,
      reportLine,
      dbAttributionAvailable: false,
      dbBefore: null,
      dbAfter: null,
    };
  }

  // 랜딩 변경 효과는 UTM이 아니라 실제 leads 원본 DB로 계산
  const allLandingLeads = await getAllLeadsForAnalysis();

  // 최신 변경 직전의 변경일을 가져와 중간 기간만 비교
  const landingChangesForDb = await listLandingChanges(2);
  const previousLandingChange = landingChangesForDb[1] ?? null;

  const latestLandingDate = toKstDateOnly(latest.changed_at);

  const previousLandingDate = previousLandingChange
    ? toKstDateOnly(previousLandingChange.changed_at)
    : null;

  const yesterday = addDaysToDateOnly(
    toKstDateOnly(new Date().toISOString()),
    -1
  );

  const dbBeforeStart = previousLandingDate
    ? addDaysToDateOnly(previousLandingDate, 1)
    : periods.before.start;

  const dbBeforeEnd = addDaysToDateOnly(latestLandingDate, -1);
  const dbAfterStart = addDaysToDateOnly(latestLandingDate, 1);
  const dbAfterEnd = yesterday;

  const dbBeforeRows = allLandingLeads.filter((lead: LeadAnalysisRow) => {
    const appliedDate = toKstDateOnly(lead.applied_at);
    return appliedDate >= dbBeforeStart && appliedDate <= dbBeforeEnd;
  });

  const dbAfterRows = allLandingLeads.filter((lead: LeadAnalysisRow) => {
    const appliedDate = toKstDateOnly(lead.applied_at);
    return appliedDate >= dbAfterStart && appliedDate <= dbAfterEnd;
  });
  const dbAttributionAvailable = dbBeforeRows.length > 0 || dbAfterRows.length > 0;

  return {
    available: true,
    change,
    comparisons,
    verdict: evaluation.verdict,
    reportLine,
    dbAttributionAvailable,
    dbBefore: dbAttributionAvailable ? dbSnapshotFromLeads(dbBeforeRows) : null,
    dbAfter: dbAttributionAvailable ? dbSnapshotFromLeads(dbAfterRows) : null,
  };
}

async function buildLandingChangeSection(): Promise<LandingChangeSection> {
  const [latest] = await listLandingChanges(1);
  if (!latest) {
    return {
      available: false,
      change: null,
      ga4AttributionAvailable: false,
      before: null,
      after: null,
      verdict: null,
      reportLine: "아직 등록된 랜딩 변경 이력이 없습니다.",
      dbAttributionAvailable: false,
      dbBefore: null,
      dbAfter: null,
    };
  }

  const change: ChangeMeta = {
    id: latest.id,
    adName: latest.landing_name,
    campaignName: latest.linked_campaign_name,
    changeTypeLabel: LANDING_CHANGE_TYPE_LABELS[latest.change_type],
    changedAt: latest.changed_at,
    memo: latest.memo,
  };

  const periods = computeComparisonPeriods(latest.changed_at, latest.comparison_period_days);
  const [beforeRows, afterRows] = await Promise.all([
    getGa4RowsForLandingChange(latest.landing_page_pattern, periods.before.start, periods.before.end),
    getGa4RowsForLandingChange(latest.landing_page_pattern, periods.after.start, periods.after.end),
  ]);
  const ga4AttributionAvailable = beforeRows.length > 0 || afterRows.length > 0;
  const beforeMetrics = aggregateLandingPeriodMetrics(beforeRows);
  const afterMetrics = aggregateLandingPeriodMetrics(afterRows);
  const before = ga4AttributionAvailable ? beforeMetrics : null;
  const after = ga4AttributionAvailable ? afterMetrics : null;

  const evaluation = evaluateLandingObservation({
    changedAt: latest.changed_at,
    comparisonPeriodDays: latest.comparison_period_days,
    before: beforeMetrics,
    after: afterMetrics,
  });
  const reportLine = buildLandingChangeReportLine({
    changedAtKst: toKstDateOnly(latest.changed_at),
    before: beforeMetrics,
    after: afterMetrics,
    hasSufficientData: evaluation.status !== "observing" && evaluation.status !== "insufficient_data",
    comparisonPeriodDays: latest.comparison_period_days,
    isObservationWindowComplete: evaluation.progress.isObservationWindowComplete,
  });

  const [dbBeforeRows, dbAfterRows] = await Promise.all([
    getLeadsForLinkedCampaign(latest.linked_campaign_name, kstDateOnlyToInstantIso(periods.before.start), kstDateOnlyToInstantIso(addDaysToDateOnly(periods.before.end, 1))),
    getLeadsForLinkedCampaign(latest.linked_campaign_name, kstDateOnlyToInstantIso(periods.after.start), kstDateOnlyToInstantIso(addDaysToDateOnly(periods.after.end, 1))),
  ]);
  const dbAttributionAvailable = dbBeforeRows !== null && dbAfterRows !== null;

  return {
    available: true,
    change,
    ga4AttributionAvailable,
    before,
    after,
    verdict: evaluation.verdict,
    reportLine,
    dbAttributionAvailable,
    dbBefore: dbAttributionAvailable ? dbSnapshotFromLeads(dbBeforeRows!) : null,
    dbAfter: dbAttributionAvailable ? dbSnapshotFromLeads(dbAfterRows!) : null,
  };
}

/**
 * Single entry point assembling the whole /report screen from real data
 * only. Every sub-piece is reused from an existing module (ad-diagnosis,
 * creative-changes, landing-changes, video-analysis, leads-analysis, ga4,
 * ad-operations) — this function's own job is orchestration and shaping,
 * not new business rules.
 */
export async function buildAdPerformanceSummary(): Promise<AdPerformanceSummary> {
  const today = toKstDateOnly(new Date().toISOString());
  const windowStart = addDaysToDateOnly(today, -REPORT_WINDOW_DAYS);

  const [
    metaTotals,
    metaDateRange,
    accountSettings,
    campaignSettingsList,
    adStatuses,
    offSnapshots,
    allLeads,
    adGroups,
    windowMetaRows,
    windowCampaignRows,
    windowGa4Rows,
    creativeChange,
    landingChange,
    recentDaily,
    recentWeekly,
  ] = await Promise.all([
    getMetaTotals(),
    getMetaDateRange(),
    getAdAccountSettings(),
    listCampaignSettings(),
    listAdOperationalStatuses(),
    getOffSnapshotsByStatusId(),
    getAllLeadsForAnalysis(),
    buildAdDiagnosisGroups(),
    getMetaDailyRowsInRange(windowStart, today),
    getMetaCampaignDailyRowsInRange(windowStart, today),
    getGa4DailyRows({ startDate: windowStart, endDate: today }),
    buildCreativeChangeSection(),
    buildLandingChangeSection(),
    listAnalysisReports("daily", 1),
    listAnalysisReports("weekly", 1),
  ]);

  // --- 계정 운영 요약 (섹션 1, 3) ---
  const officialStartDate = accountSettings?.official_start_date ?? null;
  const operating = computeOperatingDaySummary(officialStartDate, metaDateRange.firstDate, today);
  const budget = computeBudgetSummary({
    plannedMonthlyBudget: accountSettings?.planned_monthly_budget ?? null,
    plannedDailyBudget: accountSettings?.planned_daily_budget ?? null,
    actualTotalSpend: metaTotals.spend,
    actualDataDayCount: metaDateRange.distinctDayCount,
  });

  // "신규 캠페인" 집행비: 8월 이전부터 상시 운영된 장기 광고(정근화 나레이션)를
  // 제외한 실적. 토글/DB 저장 없이 이 요약을 만들 때만 적용하는 표시용 필터 —
  // 원본 meta_daily/campaign_settings는 그대로 둔다. "전체 Meta 집행비"는
  // 위 budget(제외 없음)을 그대로 참고용으로 함께 보여준다.
  const newCampaignRows = windowCampaignRows.filter(
    (r) => !EXCLUDED_FROM_NEW_CAMPAIGN_COMPARISON.includes(r.campaign_name ?? "")
  );
  const newCampaignMetrics = aggregatePeriodMetrics(newCampaignRows);
  // 신규 캠페인 계획 일예산 = 제외 대상이 아닌 캠페인들의 등록된 계획 일예산 합.
  // 개별 캠페인 계획은 /settings/ad-operations(campaign_settings)에 사용자가 등록한 값 그대로 사용 — 추측하지 않는다.
  const newCampaignPlannedDailyBudgets = campaignSettingsList
    .filter((c) => !EXCLUDED_FROM_NEW_CAMPAIGN_COMPARISON.includes(c.campaign_name) && c.planned_daily_budget !== null)
    .map((c) => c.planned_daily_budget as number);
  const newCampaignPlannedDailyBudget =
    newCampaignPlannedDailyBudgets.length > 0 ? newCampaignPlannedDailyBudgets.reduce((a, b) => a + b, 0) : null;
  const newCampaignBudget = computeBudgetSummary({
    plannedMonthlyBudget: newCampaignPlannedDailyBudget !== null ? newCampaignPlannedDailyBudget * 30 : null,
    plannedDailyBudget: newCampaignPlannedDailyBudget,
    actualTotalSpend: newCampaignMetrics.totalSpend,
    actualDataDayCount: new Set(newCampaignRows.map((r) => r.date)).size,
  });

  // --- DB/예약 (섹션 6, 19) ---
  const leadsKpi = computeLeadsKpiSummary(allLeads);
  const leadsCpa = computeLeadsCpaSummary(metaTotals.spend, leadsKpi);
  const utmAttributedCount = allLeads.filter((l) => l.utm_campaign !== null).length;
  const dbAttribution = {
    totalDb: allLeads.length,
    attributedCount: utmAttributedCount,
    heldBackCount: allLeads.length - utmAttributedCount,
  };

  // --- 광고별 비교/운영 판정 (섹션 13, 14) ---
  const allAdResults = adGroups.flatMap((g) => g.ads);
  const statusesByKey = new Map(adStatuses.map((s) => [`${s.campaign_name}|||${s.ad_name}`, s]));
  const adComparison = buildAdOperationalDecisions(allAdResults, statusesByKey, offSnapshots);
  const todayConclusion = buildTodayConclusion(adComparison);

  // --- 영상 시청 퍼널 (섹션 5, 최근 30일 사이트 전체) ---
  const windowMetaMetrics = aggregatePeriodMetrics(windowMetaRows);
  const videoFunnel = buildRetentionFunnel(windowMetaMetrics);
  const videoHook = buildVideoHookMetrics(windowMetaMetrics);
  const videoMaxDropoffLabel = findMaxDropoffLabel(videoFunnel);
  const videoInterpretation = buildRetentionInterpretation(videoFunnel);
  const adVideoFunnels = buildAdVideoFunnels(allAdResults, EXCLUDED_FROM_NEW_CAMPAIGN_COMPARISON);

  // --- 전체 퍼널 (섹션 7) ---
  const windowGa4Metrics = aggregateGa4Metrics(windowGa4Rows);
  const fullFunnel = buildFullFunnel({
    hasMetaData: windowMetaRows.length > 0,
    metaImpressions: windowMetaMetrics.totalImpressions,
    metaVideoPlays3s: windowMetaMetrics.video3s.count,
    metaLinkClicks: windowMetaMetrics.totalLinkClicks,
    hasGa4Data: windowGa4Rows.length > 0,
    ga4LandingViews: windowGa4Metrics.totalPageViews,
    ga4CtaClicks: windowGa4Metrics.totalCtaClicks,
    ga4FormStarts: windowGa4Metrics.totalFormStarts,
    hasLeadsData: allLeads.length > 0,
    totalDb: leadsKpi.totalDb,
    validDb: leadsKpi.validDb,
    confirmedBookings: leadsKpi.confirmedBookings,
  });

  // --- 캠페인별 상세 (섹션 20) ---
  const campaignSettingsByName = new Map(campaignSettingsList.map((c) => [c.campaign_name, c]));
  const campaignRowsByName = new Map<string, typeof windowCampaignRows>();
  for (const row of windowCampaignRows) {
    const key = row.campaign_name ?? "(캠페인 미상)";
    if (!campaignRowsByName.has(key)) campaignRowsByName.set(key, []);
    campaignRowsByName.get(key)!.push(row);
  }

  const campaigns: CampaignReportSummary[] = await Promise.all(
    adGroups.map(async (group): Promise<CampaignReportSummary> => {
      const setting = campaignSettingsByName.get(group.campaignName);
      const rows = campaignRowsByName.get(group.campaignName) ?? [];
      const metrics = aggregatePeriodMetrics(rows);
      // Same CTR/CPC fallback chain as everywhere else (raw clicks -> link
      // clicks -> Meta's own rate -> null) — never a per-page reimplementation.
      const rateFallback = computeMetaRateFallback([], {
        spend: metrics.totalSpend,
        impressions: metrics.totalImpressions,
        clicks: metrics.totalClicks,
        linkClicks: metrics.totalLinkClicks,
      });
      const campaignOperating = computeOperatingDaySummary(setting?.official_start_date ?? null, null, today);
      const campaignBudget = computeBudgetSummary({
        plannedMonthlyBudget: setting?.planned_monthly_budget ?? null,
        plannedDailyBudget: setting?.planned_daily_budget ?? null,
        actualTotalSpend: metrics.totalSpend,
        actualDataDayCount: new Set(rows.map((r) => r.date)).size,
      });

      const utmCampaigns = await resolveUtmCampaignsForCampaignName(group.campaignName);
      const campaignLeads = allLeads.filter((l) => l.utm_campaign !== null && utmCampaigns.includes(l.utm_campaign));
      const dbAvailable = campaignLeads.length > 0;
      const campaignKpi = dbAvailable ? computeLeadsKpiSummary(campaignLeads) : null;

      return {
        campaignName: group.campaignName,
        officialStartDate: setting?.official_start_date ?? null,
        dataFirstDate: null,
        operatingDayCount: campaignOperating.operatingDayCount,
        budget: campaignBudget,
        spend: metrics.totalSpend,
        ctr: rateFallback.ctr,
        cpc: rateFallback.cpc,
        cpm: metrics.cpm,
        videoMaxDropoffLabel: findMaxDropoffLabel(buildRetentionFunnel(metrics)),
        adCount: group.ads.length,
        diagnosisSummaryText: group.summary.summaryText,
        db: {
          available: dbAvailable,
          totalDb: campaignKpi?.totalDb ?? null,
          confirmedBookings: campaignKpi?.confirmedBookings ?? null,
        },
      };
    })
  );

  // --- 종합 병목 (섹션 17, 18) — leads는 최근 7일 vs 직전 7일로 판정 ---
  // Compared as parsed timestamps, not raw strings — Supabase-returned
  // timestamptz text and kstDateOnlyToInstantIso's toISOString() output can
  // differ in offset notation/precision, so lexicographic string comparison
  // is not safe here.
  const last7StartMs = new Date(kstDateOnlyToInstantIso(addDaysToDateOnly(today, -6))).getTime();
  const prev7StartMs = new Date(kstDateOnlyToInstantIso(addDaysToDateOnly(today, -13))).getTime();
  const todayEndMs = new Date(kstDateOnlyToInstantIso(addDaysToDateOnly(today, 1))).getTime();
  const last7Leads = allLeads.filter((l) => {
    const t = new Date(l.applied_at).getTime();
    return t >= last7StartMs && t < todayEndMs;
  });
  const prev7Leads = allLeads.filter((l) => {
    const t = new Date(l.applied_at).getTime();
    return t >= prev7StartMs && t < last7StartMs;
  });
  const dbProblem = classifyDbProblem(computeLeadsKpiSummary(prev7Leads), computeLeadsKpiSummary(last7Leads));

  const statusCounts: Record<AdDiagnosisStatus, number> = {
    HEALTHY: 0,
    CREATIVE_PROBLEM: 0,
    LANDING_PROBLEM: 0,
    FORM_PROBLEM: 0,
    TARGETING_PROBLEM: 0,
    INSUFFICIENT_DATA: 0,
  };
  for (const r of allAdResults) statusCounts[r.status] += 1;
  const bottleneck = determineBottleneck(statusCounts, dbProblem);

  // --- 일별 광고비 / DB / CPA ---
  // Meta 원본 일별 행과 실제 leads 원본을 날짜(KST) 기준으로 집계한다.
  const dailySpendMap = new Map<string, number>();

  for (const row of windowMetaRows) {
    dailySpendMap.set(
      row.date,
      (dailySpendMap.get(row.date) ?? 0) + Number(row.spend ?? 0)
    );
  }

  const dailyLeadMap = new Map<string, typeof allLeads>();

  for (const lead of allLeads) {
    const date = toKstDateOnly(lead.applied_at);

    if (date < windowStart || date > today) {
      continue;
    }

    const rows = dailyLeadMap.get(date) ?? [];
    rows.push(lead);
    dailyLeadMap.set(date, rows);
  }

  const dailyPerformance = [];
  for (
    let date = windowStart;
    date <= today;
    date = addDaysToDateOnly(date, 1)
  ) {
    const spend = dailySpendMap.get(date) ?? 0;
    const dayLeads = dailyLeadMap.get(date) ?? [];
    const dayKpi = computeLeadsKpiSummary(dayLeads);

    dailyPerformance.push({
      date,
      spend,
      db: dayKpi.totalDb,
      validDb: dayKpi.validDb,
      bookings: dayKpi.confirmedBookings,
      cpa: dayKpi.totalDb > 0 ? spend / dayKpi.totalDb : null,
    });
  }

  const reportHeadline = buildReportHeadline({
    officialStartDate,
    operatingDayCount: operating.operatingDayCount,
    firstAdDate: metaDateRange.firstDate,
    totalSpend: metaTotals.spend,
    hasSpendData: metaTotals.rowCount > 0,
    actualDailyAvgSpend: budget.actualDailyAvgSpend,
    projected30DaySpend: budget.projected30DaySpend,
    totalDb: leadsKpi.totalDb,
    validDb: leadsKpi.validDb,
    confirmedBookings: leadsKpi.confirmedBookings,
    validToBookingRate: leadsKpi.bookingRate,
  });

  return {
    dailyPerformance,
    todayConclusion,
    account: {
      officialStartDate,
      dataFirstDate: metaDateRange.firstDate,
      operatingDayCount: operating.operatingDayCount,
      budget,
      newCampaignBudget,
      excludedCampaignNames: EXCLUDED_FROM_NEW_CAMPAIGN_COMPARISON,
    },
    timeline: {
      firstAdDate: metaDateRange.firstDate,
      lastAdDate: metaDateRange.lastDate,
      totalAdDays: metaDateRange.distinctDayCount,
    },
    spend: {
      totalSpend: metaTotals.spend,
      recentDailyAvgSpend: budget.actualDailyAvgSpend,
      recentDailyAvgWindowDays: metaDateRange.distinctDayCount,
      projected30DaySpend: budget.projected30DaySpend,
    },
    db: {
      totalDb: leadsKpi.totalDb,
      validDb: leadsKpi.validDb,
      validDbRate: leadsKpi.validDbRate,
      confirmedBookings: leadsKpi.confirmedBookings,
      dbCpa: leadsCpa.dbCpa,
      validDbCpa: leadsCpa.validDbCpa,
      bookingCpa: leadsCpa.bookingCpa,
    },
    dbAttribution,
    bookingRates: {
      totalToBookingRate: leadsKpi.totalDb > 0 ? (leadsKpi.confirmedBookings / leadsKpi.totalDb) * 100 : null,
      validToBookingRate: leadsKpi.bookingRate,
    },
    adComparison,
    videoFunnel,
    videoHook,
    videoMaxDropoffLabel,
    videoInterpretation,
    adVideoFunnels,
    creativeChange,
    landingChange,
    landingChangeHistory: landingChange.available && landingChange.change
      ? [
          {
            id: landingChange.change.id,
            landingName: landingChange.change.adName ?? "랜딩페이지",
            changedAt: landingChange.change.changedAt,
            changeTypeLabel: landingChange.change.changeTypeLabel,
            oldVersion: null,
            newVersion: null,
            memo: null,
            linkedCampaignNames: [],
            beforePeriod: landingChange.dbBefore
              ? {
                  start: "",
                  end: "",
                  dayCount: 1,
                }
              : null,
            afterPeriod: landingChange.dbAfter
              ? {
                  start: "",
                  end: "",
                  dayCount: 1,
                }
              : null,
            beforeDb: landingChange.dbBefore
              ? {
                  totalDb: landingChange.dbBefore.totalLeads,
                  validDb: landingChange.dbBefore.validLeads,
                  confirmedBookings: landingChange.dbBefore.confirmedBookings,
                  dailyAvgDb: landingChange.dbBefore.totalLeads,
                  bookingRate:
                    landingChange.dbBefore.totalLeads > 0
                      ? (landingChange.dbBefore.confirmedBookings /
                          landingChange.dbBefore.totalLeads) *
                        100
                      : null,
                }
              : null,
            afterDb: landingChange.dbAfter
              ? {
                  totalDb: landingChange.dbAfter.totalLeads,
                  validDb: landingChange.dbAfter.validLeads,
                  confirmedBookings: landingChange.dbAfter.confirmedBookings,
                  dailyAvgDb: landingChange.dbAfter.totalLeads,
                  bookingRate:
                    landingChange.dbAfter.totalLeads > 0
                      ? (landingChange.dbAfter.confirmedBookings /
                          landingChange.dbAfter.totalLeads) *
                        100
                      : null,
                }
              : null,
          },
        ]
      : [],
    fullFunnel,
    adDiagnosisGroups: adGroups,
    campaigns,
    bottleneck,
    recentReports: { daily: recentDaily[0] ?? null, weekly: recentWeekly[0] ?? null },
    reportHeadline,
    roasNote: "매출 데이터 연동 후 ROAS 분석 예정",
  };
}








