import { computeObservationProgress, type ObservationProgress } from "@/lib/creative-changes/period";
import { evaluateVerdict, hasSufficientVerdictData } from "@/lib/creative-changes/verdict-rules";
import type { ObservationStatus, PeriodMetrics, VerdictResult } from "@/lib/creative-changes/types";

export interface ObservationEvaluation {
  status: ObservationStatus;
  progress: ObservationProgress;
  verdict: VerdictResult | null;
}

export function evaluateObservation(params: {
  changedAt: string;
  comparisonPeriodDays: number;
  before: PeriodMetrics;
  after: PeriodMetrics;
  now?: Date;
}): ObservationEvaluation {
  const progress = computeObservationProgress(params.changedAt, params.comparisonPeriodDays, params.now);

  if (!progress.isObservationWindowComplete) {
    return { status: "observing", progress, verdict: null };
  }

  const verdict = evaluateVerdict(params.before, params.after);

  if (!hasSufficientVerdictData(params.after)) {
    return { status: "insufficient_data", progress, verdict };
  }

  if (verdict.verdict === "worsened") return { status: "rollback_review", progress, verdict };
  if (verdict.verdict === "improved") return { status: "winner_confirmed", progress, verdict };
  return { status: "verdict_ready", progress, verdict };
}
