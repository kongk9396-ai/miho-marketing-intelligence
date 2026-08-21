import { StatusBadge, type StatusVariant } from "@/components/ui/status-badge";
import type { DbProblemClassification, DbProblemResult } from "@/lib/leads-analysis/problem-classification";

const CLASSIFICATION_VARIANT: Record<DbProblemClassification, StatusVariant> = {
  lead_quality_problem: "warning",
  consultation_connection_problem: "warning",
  booking_conversion_problem: "warning",
  insufficient_data: "neutral",
  no_issue: "success",
};

const CLASSIFICATION_LABELS: Record<DbProblemClassification, string> = {
  lead_quality_problem: "유입 품질 문제 가능성",
  consultation_connection_problem: "상담 연결 점검 필요",
  booking_conversion_problem: "상담/예약 전환 점검 필요",
  insufficient_data: "데이터 부족",
  no_issue: "문제 없음",
};

interface DbProblemCardProps {
  result: DbProblemResult;
}

export function DbProblemCard({ result }: DbProblemCardProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-900">문제 구간 자동 분류</p>
        <StatusBadge label={CLASSIFICATION_LABELS[result.classification]} variant={CLASSIFICATION_VARIANT[result.classification]} />
      </div>
      <p className="mt-2 text-sm text-gray-700">{result.headline}</p>
      {result.reasons.length > 0 ? (
        <ul className="mt-2 list-inside list-disc text-xs text-gray-500">
          {result.reasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      ) : null}
      <p className="mt-3 text-xs text-gray-400">직전 동일 길이 기간과 비교한 규칙 기반 판정입니다.</p>
    </div>
  );
}
