import { aggregateGa4Metrics } from "@/lib/ga4/metrics";
import type { Ga4DailyLike } from "@/lib/ga4/types";

export interface FunnelStage {
  key: "sessions" | "cta" | "form_start" | "form_complete";
  label: string;
  count: number;
  /** Conversion rate from the previous stage, as a percentage. Null for the first stage. */
  stepRatePercent: number | null;
}

export function computeLandingFunnel(rows: Ga4DailyLike[]): FunnelStage[] {
  const metrics = aggregateGa4Metrics(rows);

  return [
    { key: "sessions", label: "세션", count: metrics.totalSessions, stepRatePercent: null },
    { key: "cta", label: "CTA 클릭", count: metrics.totalCtaClicks, stepRatePercent: metrics.ctaRate },
    { key: "form_start", label: "폼 시작", count: metrics.totalFormStarts, stepRatePercent: metrics.formStartRate },
    {
      key: "form_complete",
      label: "폼 완료",
      count: metrics.totalFormCompletes,
      stepRatePercent: metrics.formCompleteRate,
    },
  ];
}
