import { computeChangePercent } from "@/lib/change-percent";
import type {
  MetricComparisonRow,
  MetricPolarity,
  MetricSection,
  PeriodMetrics,
} from "@/lib/creative-changes/types";

type MetricUnit = "won" | "count" | "percent" | "percent1" | "seconds" | "frequency";

interface MetricDef {
  key: string;
  label: string;
  section: MetricSection;
  polarity: MetricPolarity;
  unit: MetricUnit;
  getValue: (m: PeriodMetrics) => number | null;
  /** Raw event count backing a rate value (video retention rates) — shown alongside the % per spec. */
  getCount?: (m: PeriodMetrics) => number;
  /** False when the sample (e.g. video plays) is too small to trust the rate — forces a "표본 부족" status. */
  getReliable?: (m: PeriodMetrics) => boolean;
}

const METRIC_DEFS: MetricDef[] = [
  // 광고 전달
  { key: "spend", label: "광고비", section: "delivery", polarity: "lower_is_better", unit: "won", getValue: (m) => m.totalSpend },
  { key: "impressions", label: "노출수", section: "delivery", polarity: "higher_is_better", unit: "count", getValue: (m) => m.totalImpressions },
  { key: "reach", label: "도달수(일 합계)", section: "delivery", polarity: "higher_is_better", unit: "count", getValue: (m) => m.totalReach },
  { key: "frequency", label: "평균 빈도(일 평균)", section: "delivery", polarity: "lower_is_better", unit: "frequency", getValue: (m) => m.avgFrequency },
  { key: "cpm", label: "CPM", section: "delivery", polarity: "lower_is_better", unit: "won", getValue: (m) => m.cpm },
  // 클릭
  { key: "clicks", label: "클릭수", section: "click", polarity: "higher_is_better", unit: "count", getValue: (m) => m.totalClicks },
  { key: "linkClicks", label: "링크 클릭수", section: "click", polarity: "higher_is_better", unit: "count", getValue: (m) => m.totalLinkClicks },
  { key: "ctr", label: "CTR", section: "click", polarity: "higher_is_better", unit: "percent", getValue: (m) => m.ctr },
  { key: "linkCtr", label: "링크 CTR", section: "click", polarity: "higher_is_better", unit: "percent", getValue: (m) => m.linkCtr },
  { key: "cpc", label: "CPC", section: "click", polarity: "lower_is_better", unit: "won", getValue: (m) => m.cpc },
  { key: "linkCpc", label: "링크 CPC", section: "click", polarity: "lower_is_better", unit: "won", getValue: (m) => m.linkCpc },
  // 영상
  { key: "avgWatchTime", label: "평균 시청시간", section: "video", polarity: "higher_is_better", unit: "seconds", getValue: (m) => m.avgWatchTime },
  { key: "video3s", label: "3초 재생률", section: "video", polarity: "higher_is_better", unit: "percent1", getValue: (m) => m.video3s.rate, getCount: (m) => m.video3s.count, getReliable: (m) => m.video3s.reliable },
  { key: "video25", label: "25% 도달률", section: "video", polarity: "higher_is_better", unit: "percent1", getValue: (m) => m.video25.rate, getCount: (m) => m.video25.count, getReliable: (m) => m.video25.reliable },
  { key: "video50", label: "50% 도달률", section: "video", polarity: "higher_is_better", unit: "percent1", getValue: (m) => m.video50.rate, getCount: (m) => m.video50.count, getReliable: (m) => m.video50.reliable },
  { key: "video75", label: "75% 도달률", section: "video", polarity: "higher_is_better", unit: "percent1", getValue: (m) => m.video75.rate, getCount: (m) => m.video75.count, getReliable: (m) => m.video75.reliable },
  { key: "video95", label: "95% 도달률", section: "video", polarity: "higher_is_better", unit: "percent1", getValue: (m) => m.video95.rate, getCount: (m) => m.video95.count, getReliable: (m) => m.video95.reliable },
  { key: "video100", label: "완주율", section: "video", polarity: "higher_is_better", unit: "percent1", getValue: (m) => m.video100.rate, getCount: (m) => m.video100.count, getReliable: (m) => m.video100.reliable },
];

/** Changes smaller than this (in relative %) are treated as noise, not a real move. */
const FLAT_THRESHOLD_PERCENT = 5;

function formatValue(unit: MetricUnit, value: number | null, count?: number): string {
  if (value === null) return "—";
  const countSuffix = count !== undefined ? ` (${count.toLocaleString("ko-KR")}건)` : "";
  switch (unit) {
    case "won":
      return `₩${Math.round(value).toLocaleString("ko-KR")}`;
    case "count":
      return Math.round(value).toLocaleString("ko-KR");
    case "percent":
      return `${value.toFixed(2)}%`;
    case "percent1":
      return `${value.toFixed(1)}%${countSuffix}`;
    case "seconds":
      return `${value.toFixed(1)}초`;
    case "frequency":
      return value.toFixed(2);
  }
}

function formatDiff(unit: MetricUnit, before: number | null, after: number | null): string {
  if (before === null || after === null) return "—";
  const diff = after - before;
  const sign = diff > 0 ? "+" : diff < 0 ? "-" : "";
  const abs = Math.abs(diff);
  switch (unit) {
    case "won":
      return `${sign}₩${Math.round(abs).toLocaleString("ko-KR")}`;
    case "count":
      return `${sign}${Math.round(abs).toLocaleString("ko-KR")}`;
    case "percent":
      return `${sign}${abs.toFixed(2)}%p`;
    case "percent1":
      return `${sign}${abs.toFixed(1)}%p`;
    case "seconds":
      return `${sign}${abs.toFixed(1)}초`;
    case "frequency":
      return `${sign}${abs.toFixed(2)}`;
  }
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

export function buildMetricComparisons(before: PeriodMetrics, after: PeriodMetrics): MetricComparisonRow[] {
  // A window with zero meta_daily rows at all must never show as "0" (looks
  // like a real, measured zero) — only a window that has real rows but
  // happens to sum to 0 (e.g. a genuine no-spend day) may show 0.
  const beforeHasRows = before.dayCount > 0;
  const afterHasRows = after.dayCount > 0;

  return METRIC_DEFS.map((def) => {
    const beforeValue = beforeHasRows ? def.getValue(before) : null;
    const afterValue = afterHasRows ? def.getValue(after) : null;
    const beforeCount = def.getCount?.(before);
    const afterCount = def.getCount?.(after);
    const changePercent = computeChangePercent(beforeValue, afterValue);

    // A rate built from too small a sample on either side isn't safe to
    // call "improved"/"worsened" — flag it as insufficient sample instead of
    // trusting whatever direction the noisy percentage happens to point.
    const isUnreliable = def.getReliable ? !def.getReliable(before) || !def.getReliable(after) : false;
    const { status, label: statusLabel } = isUnreliable
      ? { status: "unavailable" as const, label: "표본 부족" }
      : classifyStatus(def.polarity, changePercent);

    return {
      key: def.key,
      label: def.label,
      section: def.section,
      polarity: def.polarity,
      beforeValue,
      afterValue,
      beforeDisplay: formatValue(def.unit, beforeValue, beforeCount),
      afterDisplay: formatValue(def.unit, afterValue, afterCount),
      diffDisplay: formatDiff(def.unit, beforeValue, afterValue),
      changePercent,
      changePercentDisplay:
        changePercent === null ? "—" : `${changePercent > 0 ? "+" : ""}${changePercent.toFixed(1)}%`,
      status,
      statusLabel,
    };
  });
}
