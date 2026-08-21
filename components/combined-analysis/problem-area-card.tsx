import { StatusBadge, type StatusVariant } from "@/components/ui/status-badge";
import type { ProblemAreaEstimate } from "@/lib/combined-analysis/problem-summary";
import type { ProblemClassification } from "@/lib/combined-analysis/types";

const CLASSIFICATION_LABELS: Record<ProblemClassification, string> = {
  creative_problem: "광고 소재 문제 가능성",
  landing_problem: "랜딩 문제 가능성",
  both_problem: "광고+랜딩 동시 문제",
  insufficient_data: "데이터 부족",
  no_issue: "문제 없음",
};

const CLASSIFICATION_VARIANT: Record<ProblemClassification, StatusVariant> = {
  creative_problem: "danger",
  landing_problem: "warning",
  both_problem: "danger",
  insufficient_data: "neutral",
  no_issue: "success",
};

interface ProblemAreaCardProps {
  items: ProblemAreaEstimate[];
}

export function ProblemAreaCard({ items }: ProblemAreaCardProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <p className="text-sm font-semibold text-gray-900">문제 구간 추정</p>
      {items.length === 0 ? (
        <p className="mt-2 text-sm text-gray-400">현재 감지된 문제 구간이 없습니다.</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {items.map(({ adId, adName, result }) => (
            <li key={adId}>
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm font-medium text-gray-900">{adName ?? adId}</p>
                <StatusBadge
                  label={CLASSIFICATION_LABELS[result.classification]}
                  variant={CLASSIFICATION_VARIANT[result.classification]}
                />
              </div>
              <p className="mt-0.5 text-sm text-gray-700">{result.headline}</p>
              <ul className="mt-1 list-inside list-disc text-xs text-gray-500">
                {result.reasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
