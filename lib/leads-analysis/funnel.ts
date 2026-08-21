import { computeLeadsKpiSummary } from "@/lib/leads-analysis/kpi";
import type { LeadAnalysisRow } from "@/lib/leads-analysis/types";

export interface LeadsFunnelStage {
  key: "total" | "valid" | "connected" | "booked" | "visited";
  label: string;
  count: number;
  /** vs the immediately previous stage. Null for the first stage or when the previous stage is 0. */
  stepRatePercent: number | null;
  /** vs the very first stage (전체 DB). Null when 전체 DB is 0. */
  cumulativeRatePercent: number | null;
}

function rate(count: number, denominator: number): number | null {
  return denominator > 0 ? (count / denominator) * 100 : null;
}

export function computeLeadsFunnel(rows: LeadAnalysisRow[]): LeadsFunnelStage[] {
  const kpi = computeLeadsKpiSummary(rows);

  const stageCounts: { key: LeadsFunnelStage["key"]; label: string; count: number }[] = [
    { key: "total", label: "DB", count: kpi.totalDb },
    { key: "valid", label: "유효 DB", count: kpi.validDb },
    { key: "connected", label: "상담 연결", count: kpi.connected },
    { key: "booked", label: "예약 확정", count: kpi.confirmedBookings },
    { key: "visited", label: "내원", count: kpi.visited },
  ];

  return stageCounts.map((stage, i) => ({
    ...stage,
    stepRatePercent: i === 0 ? null : rate(stage.count, stageCounts[i - 1].count),
    cumulativeRatePercent: rate(stage.count, kpi.totalDb),
  }));
}
