import { StatusBadge, type StatusVariant } from "@/components/ui/status-badge";
import type { AdDiagnosisAction, AdDiagnosisResult, AdDiagnosisStatus, MetaRateSource } from "@/lib/ad-diagnosis/types";

const STATUS_LABELS: Record<AdDiagnosisStatus, string> = {
  HEALTHY: "정상",
  CREATIVE_PROBLEM: "소재 문제",
  LANDING_PROBLEM: "랜딩 문제",
  FORM_PROBLEM: "폼 문제",
  TARGETING_PROBLEM: "타겟팅 문제",
  INSUFFICIENT_DATA: "데이터 부족",
};

const STATUS_VARIANT: Record<AdDiagnosisStatus, StatusVariant> = {
  HEALTHY: "success",
  CREATIVE_PROBLEM: "danger",
  LANDING_PROBLEM: "warning",
  FORM_PROBLEM: "warning",
  TARGETING_PROBLEM: "warning",
  INSUFFICIENT_DATA: "neutral",
};

const ACTION_LABELS: Record<AdDiagnosisAction, string> = {
  SCALE: "확장(SCALE)",
  KEEP: "유지(KEEP)",
  WATCH: "관찰(WATCH)",
  OFF: "중단(OFF)",
};

const ACTION_VARIANT: Record<AdDiagnosisAction, StatusVariant> = {
  SCALE: "success",
  KEEP: "info",
  WATCH: "warning",
  OFF: "danger",
};

function formatPercent(value: number | null, digits = 2): string {
  return value === null ? "—" : `${value.toFixed(digits)}%`;
}

/** GA4-sourced rates: null means no GA4 data mapped, never "0%". */
function formatGa4Percent(value: number | null, digits = 1): string {
  return value === null ? "GA4 데이터 없음" : `${value.toFixed(digits)}%`;
}

function formatWon(value: number | null): string {
  return value === null ? "—" : `₩${Math.round(value).toLocaleString("ko-KR")}`;
}

function formatCount(value: number | null): string {
  return value === null ? "—" : value.toLocaleString("ko-KR");
}

/** Meta 클릭 원본 카운트가 없어 Meta 자체 리포트 비율값(CTR/CPC)을 그대로 사용한 경우에만 표시. */
function rateSourceNote(source: MetaRateSource): string | null {
  return source === "raw_metric" ? "Meta 원본값" : null;
}

interface AdDiagnosisCardProps {
  result: AdDiagnosisResult;
}

export function AdDiagnosisCard({ result }: AdDiagnosisCardProps) {
  const m = result.metrics;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-gray-900">{result.adName ?? result.adId}</p>
          <p className="text-xs text-gray-400">{result.campaignName ?? "—"}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <StatusBadge label={STATUS_LABELS[result.status]} variant={STATUS_VARIANT[result.status]} />
          <StatusBadge label={ACTION_LABELS[result.action]} variant={ACTION_VARIANT[result.action]} />
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-xs sm:grid-cols-4">
        <div>
          <dt className="text-gray-400">지출</dt>
          <dd className="font-medium text-gray-900">{formatWon(m.spend)}</dd>
        </div>
        <div>
          <dt className="text-gray-400">CTR</dt>
          <dd className="font-medium text-gray-900">{formatPercent(m.ctr)}</dd>
          {rateSourceNote(m.ctrSource) ? (
            <dd className="text-[10px] text-amber-600">{rateSourceNote(m.ctrSource)}</dd>
          ) : null}
        </div>
        <div>
          <dt className="text-gray-400">CPC</dt>
          <dd className="font-medium text-gray-900">{formatWon(m.cpc)}</dd>
          {rateSourceNote(m.cpcSource) ? (
            <dd className="text-[10px] text-amber-600">{rateSourceNote(m.cpcSource)}</dd>
          ) : null}
        </div>
        <div>
          <dt className="text-gray-400">랜딩 페이지 조회</dt>
          <dd className="font-medium text-gray-900">{formatCount(m.landingPageViews)}</dd>
        </div>
        <div>
          <dt className="text-gray-400">랜딩 조회당 비용</dt>
          <dd className="font-medium text-gray-900">{formatWon(m.costPerLandingPageView)}</dd>
        </div>
        <div>
          <dt className="text-gray-400">CTA 전환율</dt>
          <dd className="font-medium text-gray-900">{formatGa4Percent(m.ctaRate)}</dd>
        </div>
        <div>
          <dt className="text-gray-400">폼 시작률</dt>
          <dd className="font-medium text-gray-900">{formatGa4Percent(m.formStartRate)}</dd>
        </div>
        <div>
          <dt className="text-gray-400">최종 전환율</dt>
          <dd className="font-medium text-gray-900">
            {m.formCompleteTrackingConnected ? formatGa4Percent(m.landingConversionRate) : "폼 완료 추적 미연결"}
          </dd>
        </div>
      </dl>

      {result.reasons.length > 0 ? (
        <div className="mt-4">
          <p className="text-xs font-semibold text-gray-500">근거</p>
          <ul className="mt-1 list-inside list-disc text-xs text-gray-600">
            {result.reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {result.recommendations.length > 0 ? (
        <div className="mt-3">
          <p className="text-xs font-semibold text-gray-500">추천</p>
          <ul className="mt-1 list-inside list-disc text-xs text-gray-600">
            {result.recommendations.map((rec) => (
              <li key={rec}>{rec}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
