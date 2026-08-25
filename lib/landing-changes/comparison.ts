import { computeChangePercent } from "@/lib/change-percent";
import type { MetricComparisonRow, MetricPolarity } from "@/lib/creative-changes/types";
import type { LandingPeriodMetrics } from "@/lib/landing-changes/types";

type MetricUnit = "count" | "percent";

interface MetricDef {
  key: string;
  label: string;
  polarity: MetricPolarity;
  unit: MetricUnit;
  getValue: (m: LandingPeriodMetrics) => number | null;
}

/** section is reused as "click" purely so ComparisonTable (built for creative-changes) renders these under one existing section heading without a new component. */
const METRIC_DEFS: MetricDef[] = [
  { key: "landingViews", label: "랜딩 조회수", polarity: "higher_is_better", unit: "count", getValue: (m) => m.landingViews },
  { key: "ctaClicks", label: "CTA 클릭수", polarity: "higher_is_better", unit: "count", getValue: (m) => m.ctaClicks },
  { key: "ctaRate", label: "CTA 전환율", polarity: "higher_is_better", unit: "percent", getValue: (m) => m.ctaRate },
  { key: "landingToCtaDropoff", label: "랜딩→CTA 이탈률", polarity: "lower_is_better", unit: "percent", getValue: (m) => m.landingToCtaDropoffRate },
  { key: "formStarts", label: "폼 시작수", polarity: "higher_is_better", unit: "count", getValue: (m) => m.formStarts },
  { key: "formStartRate", label: "폼 시작률", polarity: "higher_is_better", unit: "percent", getValue: (m) => m.formStartRate },
  { key: "ctaToFormStartDropoff", label: "CTA→폼시작 이탈률", polarity: "lower_is_better", unit: "percent", getValue: (m) => m.ctaToFormStartDropoffRate },
  { key: "formCompletes", label: "폼 완료수", polarity: "higher_is_better", unit: "count", getValue: (m) => m.formCompletes },
  { key: "formCompleteRate", label: "폼 완료율", polarity: "higher_is_better", unit: "percent", getValue: (m) => m.formCompleteRate },
];

/** Changes smaller than this (in relative %) are treated as noise, not a real move — same convention as lib/creative-changes/comparison.ts. */
const FLAT_THRESHOLD_PERCENT = 5;

function formatValue(unit: MetricUnit, value: number | null): string {
  if (value === null) return "—";
  return unit === "percent" ? `${value.toFixed(1)}%` : Math.round(value).toLocaleString("ko-KR");
}

function formatDiff(unit: MetricUnit, before: number | null, after: number | null): string {
  if (before === null || after === null) return "—";
  const diff = after - before;
  const sign = diff > 0 ? "+" : diff < 0 ? "-" : "";
  const abs = Math.abs(diff);
  return unit === "percent" ? `${sign}${abs.toFixed(1)}%p` : `${sign}${Math.round(abs).toLocaleString("ko-KR")}`;
}

function classifyStatus(
  polarity: MetricPolarity,
  changePercent: number | null
): { status: MetricComparisonRow["status"]; label: string } {
  if (changePercent === null) return { status: "unavailable", label: "—" };
  if (Math.abs(changePercent) < FLAT_THRESHOLD_PERCENT) return { status: "flat", label: "유지" };
  const isGoodDirection = polarity === "higher_is_better" ? changePercent > 0 : changePercent < 0;
  return isGoodDirection ? { status: "improved", label: "개선" } : { status: "worsened", label: "악화" };
}

export function buildLandingMetricComparisons(
  before: LandingPeriodMetrics,
  after: LandingPeriodMetrics,
  /** False = form_start fired sitewide but form_complete never did — a disconnected tracking event. The formCompleteRate row must show "추적 미연결", never "0.0%", when this is false. */
  formCompleteTrackingConnected = true
): MetricComparisonRow[] {
  // A window with zero GA4 rows must never show as "0" (looks like a real
  // measured zero) — only a window with real rows that happens to sum to 0 may.
  const beforeHasRows = before.dayCount > 0;
  const afterHasRows = after.dayCount > 0;

  return METRIC_DEFS.map((def) => {
    const beforeValue = beforeHasRows ? def.getValue(before) : null;
    const afterValue = afterHasRows ? def.getValue(after) : null;
    const changePercent = computeChangePercent(beforeValue, afterValue);
    const { status, label: statusLabel } = classifyStatus(def.polarity, changePercent);

    if (def.key === "formCompleteRate" && !formCompleteTrackingConnected) {
      return {
        key: def.key,
        label: def.label,
        section: "click" as const,
        polarity: def.polarity,
        beforeValue: null,
        afterValue: null,
        beforeDisplay: "추적 미연결",
        afterDisplay: "추적 미연결",
        diffDisplay: "—",
        changePercent: null,
        changePercentDisplay: "—",
        status: "unavailable" as const,
        statusLabel: "추적 미연결",
      };
    }

    return {
      key: def.key,
      label: def.label,
      section: "click",
      polarity: def.polarity,
      beforeValue,
      afterValue,
      beforeDisplay: formatValue(def.unit, beforeValue),
      afterDisplay: formatValue(def.unit, afterValue),
      diffDisplay: formatDiff(def.unit, beforeValue, afterValue),
      changePercent,
      changePercentDisplay: changePercent === null ? "—" : `${changePercent > 0 ? "+" : ""}${changePercent.toFixed(1)}%`,
      status,
      statusLabel,
    };
  });
}
