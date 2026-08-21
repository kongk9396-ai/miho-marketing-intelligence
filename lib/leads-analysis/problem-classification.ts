import { computeChangePercent } from "@/lib/change-percent";
import type { LeadsKpiSummary } from "@/lib/leads-analysis/kpi";

/** Deterministic, code-configured rules — no AI/LLM. Adjust as thresholds calibrate. */
export const DB_PROBLEM_THRESHOLDS = {
  /** Below this many DB in the "after" period, there isn't enough signal to judge anything. */
  minDbForJudgment: 10,
  /** |change| below this is treated as "정상" (no real move) for an upstream stage. */
  stableBandPercent: 10,
  /** A rate change at or below this counts as a "급락". */
  rateDropAtMost: -15,
};

export type DbProblemClassification =
  | "lead_quality_problem"
  | "consultation_connection_problem"
  | "booking_conversion_problem"
  | "insufficient_data"
  | "no_issue";

export interface DbProblemResult {
  classification: DbProblemClassification;
  headline: string;
  reasons: string[];
}

function formatRateChange(label: string, value: number | null): string {
  if (value === null) return `${label} 데이터 없음`;
  const sign = value >= 0 ? "+" : "";
  return `${label} ${sign}${value.toFixed(1)}%`;
}

/**
 * Walks the funnel from the top: DB 수 → 유효 DB율 → 상담 연결률 → 예약률,
 * and reports the *first* stage (closest to the top of the funnel) where an
 * otherwise-stable upstream metric is paired with a real drop, matching the
 * spec's ordering (유입 품질 문제 앞에 상담 연결 문제를 보고하면 잘못된
 * 진단이 된다 — 원인에 가장 가까운 단계부터 확인).
 */
export function classifyDbProblem(before: LeadsKpiSummary, after: LeadsKpiSummary): DbProblemResult {
  const t = DB_PROBLEM_THRESHOLDS;

  if (after.totalDb < t.minDbForJudgment) {
    return {
      classification: "insufficient_data",
      headline: "판단을 위한 데이터가 부족합니다.",
      reasons: [`DB ${after.totalDb.toLocaleString("ko-KR")}건`],
    };
  }

  const dbCountChange = computeChangePercent(before.totalDb, after.totalDb);
  const validRateChange = computeChangePercent(before.validDbRate, after.validDbRate);
  const connectedRateChange = computeChangePercent(before.connectedRate, after.connectedRate);
  const bookingRateChange = computeChangePercent(before.bookingRate, after.bookingRate);

  const isStable = (change: number | null) => change === null || Math.abs(change) < t.stableBandPercent;
  const isDropped = (change: number | null) => change !== null && change <= t.rateDropAtMost;

  if (isStable(dbCountChange) && isDropped(validRateChange)) {
    return {
      classification: "lead_quality_problem",
      headline: "유입 품질 또는 메시지 불일치 가능성이 있습니다.",
      reasons: [formatRateChange("DB 수", dbCountChange), formatRateChange("유효 DB율", validRateChange)],
    };
  }

  if (isStable(validRateChange) && isDropped(connectedRateChange)) {
    return {
      classification: "consultation_connection_problem",
      headline: "상담 연결 단계 점검이 필요합니다.",
      reasons: [formatRateChange("유효 DB율", validRateChange), formatRateChange("상담 연결률", connectedRateChange)],
    };
  }

  if (isStable(connectedRateChange) && isDropped(bookingRateChange)) {
    return {
      classification: "booking_conversion_problem",
      headline: "상담/예약 전환 단계 점검이 필요합니다.",
      reasons: [formatRateChange("상담 연결률", connectedRateChange), formatRateChange("예약률", bookingRateChange)],
    };
  }

  return {
    classification: "no_issue",
    headline: "뚜렷한 문제 신호가 없습니다.",
    reasons: [
      formatRateChange("유효 DB율", validRateChange),
      formatRateChange("상담 연결률", connectedRateChange),
      formatRateChange("예약률", bookingRateChange),
    ],
  };
}
