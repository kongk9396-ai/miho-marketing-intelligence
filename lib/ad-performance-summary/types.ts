import type { MetricComparisonRow, VerdictResult } from "@/lib/creative-changes/types";
import type { AdDiagnosisStatus } from "@/lib/ad-diagnosis/types";
import type { CampaignAdDiagnosisGroup } from "@/lib/ad-diagnosis/build";
import type { FunnelStage, VideoHookMetrics } from "@/lib/video-analysis/funnel";
import type { AdVideoFunnelSummary } from "@/lib/ad-performance-summary/ad-video-comparison";
import type { FullFunnelStage } from "@/lib/ad-performance-summary/full-funnel";
import type { AdOperationalDecision } from "@/lib/ad-performance-summary/operational-decision";
import type { TodayConclusion } from "@/lib/ad-performance-summary/today-conclusion";
import type { BudgetSummary } from "@/lib/ad-operations/budget";
import type { AnalysisReportRecord } from "@/lib/reports/types";
import type { LandingPeriodMetrics } from "@/lib/landing-changes/types";

export interface TimelineSummary {
  firstAdDate: string | null;
  lastAdDate: string | null;
  totalAdDays: number;
}

export interface SpendSummary {
  totalSpend: number;
  /** Average daily spend over the trailing window — the "current pace", not the all-time average. */
  recentDailyAvgSpend: number | null;
  recentDailyAvgWindowDays: number;
  /** recentDailyAvgSpend * 30 — always an estimate, never treated as a commitment. */
  projected30DaySpend: number | null;
}

export interface DbPerformanceSummary {
  totalDb: number;
  validDb: number;
  validDbRate: number | null;
  confirmedBookings: number;
  dbCpa: number | null;
  validDbCpa: number | null;
  bookingCpa: number | null;
}

export interface BookingSuccessRates {
  /** confirmedBookings / totalDb. Null (never 0%) when totalDb is 0. */
  totalToBookingRate: number | null;
  /** confirmedBookings / validDb. Null (never 0%) when validDb is 0. */
  validToBookingRate: number | null;
}

export interface ChangeMeta {
  id: string;
  adName: string | null;
  campaignName: string | null;
  changeTypeLabel: string;
  changedAt: string;
  memo: string | null;
}

export interface CreativeChangeSection {
  available: boolean;
  change: ChangeMeta | null;
  comparisons: MetricComparisonRow[] | null;
  verdict: VerdictResult | null;
  /** Rule-based 1-2 sentence summary (spec section 10) — never AI-generated. */
  reportLine: string;
  /** true only if this ad's UTM resolves AND matched leads exist for both before/after windows. */
  dbAttributionAvailable: boolean;
  dbBefore: { totalLeads: number; validLeads: number; confirmedBookings: number } | null;
  dbAfter: { totalLeads: number; validLeads: number; confirmedBookings: number } | null;
}

export interface LandingChangeSection {
  available: boolean;
  change: ChangeMeta | null;
  ga4AttributionAvailable: boolean;
  before: LandingPeriodMetrics | null;
  after: LandingPeriodMetrics | null;
  verdict: VerdictResult | null;
  /** Rule-based 1-2 sentence summary (spec section 12) — never AI-generated. */
  reportLine: string;
  /** true only when this ad's UTM resolves AND matched leads exist for both windows. */
  dbAttributionAvailable: boolean;
  dbBefore: { totalLeads: number; validLeads: number; confirmedBookings: number } | null;
  dbAfter: { totalLeads: number; validLeads: number; confirmedBookings: number } | null;
}

export interface LandingChangeHistoryItem {
  id: string;
  landingName: string;
  changedAt: string;
  changeTypeLabel: string;
  oldVersion: string | null;
  newVersion: string | null;
  memo: string | null;
  linkedCampaignNames: string[];

  beforePeriod: {
    start: string;
    end: string;
    dayCount: number;
  } | null;

  afterPeriod: {
    start: string;
    end: string;
    dayCount: number;
  } | null;

  beforeDb: {
    totalDb: number;
    validDb: number;
    confirmedBookings: number;
    dailyAvgDb: number;
    bookingRate: number | null;
  } | null;

  afterDb: {
    totalDb: number;
    validDb: number;
    confirmedBookings: number;
    dailyAvgDb: number;
    bookingRate: number | null;
  } | null;
}
export type BottleneckCategory =
  | "CREATIVE"
  | "LANDING"
  | "FORM"
  | "DB_QUALITY"
  | "CONSULTATION_BOOKING"
  | "INSUFFICIENT_DATA"
  | "HEALTHY";

export interface BottleneckDiagnosis {
  category: BottleneckCategory;
  headline: string;
  reasons: string[];
  adDiagnosisCounts: Record<AdDiagnosisStatus, number>;
}

export interface AccountOperatingSummary {
  officialStartDate: string | null;
  dataFirstDate: string | null;
  operatingDayCount: number | null;
  /** 전체 Meta 집행비 — 모든 캠페인 포함 (참고용). */
  budget: BudgetSummary;
  /** 신규 캠페인 집행비 — 장기 상시 운영 캠페인 제외. 표시용 필터일 뿐 원본 데이터는 그대로 유지된다. */
  newCampaignBudget: BudgetSummary;
  excludedCampaignNames: string[];
}

export interface CampaignDbRollup {
  available: boolean;
  totalDb: number | null;
  confirmedBookings: number | null;
}

export interface CampaignReportSummary {
  campaignName: string;
  officialStartDate: string | null;
  dataFirstDate: string | null;
  operatingDayCount: number | null;
  budget: BudgetSummary;
  spend: number;
  ctr: number | null;
  cpc: number | null;
  cpm: number | null;
  videoMaxDropoffLabel: string | null;
  adCount: number;
  diagnosisSummaryText: string;
  db: CampaignDbRollup;
}

export interface DbAttributionSummary {
  totalDb: number;
  /** Leads with a non-null utm_campaign — attribution to a specific ad/campaign is possible (even if the exact ad no longer matches, resolution is at least attempted). */
  attributedCount: number;
  /** Leads with no utm_campaign at all — legacy DB from before UTM collection, or same-day/same-time entries with no basis to 1:1 match; attribution withheld, never guessed. */
  heldBackCount: number;
}

export interface RecentReportsSection {
  daily: AnalysisReportRecord | null;
  weekly: AnalysisReportRecord | null;
}

export interface DailyPerformancePoint {
  date: string;
  spend: number;
  db: number;
  validDb: number;
  bookings: number;
  cpa: number | null;
}

export interface AdPerformanceSummary {
  dailyPerformance: DailyPerformancePoint[];
  todayConclusion: TodayConclusion;
  account: AccountOperatingSummary;
  timeline: TimelineSummary;
  spend: SpendSummary;
  db: DbPerformanceSummary;
  dbAttribution: DbAttributionSummary;
  bookingRates: BookingSuccessRates;
  adComparison: AdOperationalDecision[];
  videoFunnel: FunnelStage[];
  videoHook: VideoHookMetrics;
  videoMaxDropoffLabel: string | null;
  videoInterpretation: string;
  /** Per-ad 25/50/75/95/100 retention funnels — includes excluded (legacy) ads flagged via `excluded`, never dropped silently. */
  adVideoFunnels: AdVideoFunnelSummary[];
  creativeChange: CreativeChangeSection;
  landingChange: LandingChangeSection;
  landingChangeHistory: LandingChangeHistoryItem[];
  fullFunnel: FullFunnelStage[];
  adDiagnosisGroups: CampaignAdDiagnosisGroup[];
  campaigns: CampaignReportSummary[];
  bottleneck: BottleneckDiagnosis;
  recentReports: RecentReportsSection;
  reportHeadline: string;
  roasNote: string;
}

