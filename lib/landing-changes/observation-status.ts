import { computeObservationProgress, type ObservationProgress } from "@/lib/creative-changes/period";
import { evaluateLandingVerdict, hasSufficientLandingVerdictData } from "@/lib/landing-changes/verdict-rules";
import type { ObservationStatus, VerdictResult } from "@/lib/creative-changes/types";
import type { LandingPeriodMetrics } from "@/lib/landing-changes/types";

export interface LandingObservationEvaluation {
  status: ObservationStatus;
  progress: ObservationProgress;
  verdict: VerdictResult | null;
}

/** GA4-side mirror of lib/creative-changes/observation-status.ts's evaluateObservation. */
export function evaluateLandingObservation(params: {
  changedAt: string;
  comparisonPeriodDays: number;
  before: LandingPeriodMetrics;
  after: LandingPeriodMetrics;
  now?: Date;
}): LandingObservationEvaluation {
  const progress = computeObservationProgress(params.changedAt, params.comparisonPeriodDays, params.now);

  if (!progress.isObservationWindowComplete) {
    return { status: "observing", progress, verdict: null };
  }

  const verdict = evaluateLandingVerdict(params.before, params.after);

  if (!hasSufficientLandingVerdictData(params.after)) {
    return { status: "insufficient_data", progress, verdict };
  }

  if (verdict.verdict === "worsened") return { status: "rollback_review", progress, verdict };
  if (verdict.verdict === "improved") return { status: "winner_confirmed", progress, verdict };
  return { status: "verdict_ready", progress, verdict };
}
