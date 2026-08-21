import { CircleCheckBig, CircleX, Info } from "lucide-react";
import { StatusBadge, type StatusVariant } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";
import type { VerdictResult, VerdictType } from "@/lib/creative-changes/types";

interface VerdictPanelProps {
  verdict: VerdictResult | null;
  isObserving: boolean;
}

const VERDICT_LABELS: Record<VerdictType, string> = {
  improved: "성과 개선",
  worsened: "악화 가능성 높음",
  neutral: "판정 가능",
  insufficient_data: "데이터 부족",
};

const VERDICT_STYLES: Record<VerdictType, { variant: StatusVariant; icon: typeof Info; color: string }> = {
  improved: { variant: "success", icon: CircleCheckBig, color: "text-green-600" },
  worsened: { variant: "danger", icon: CircleX, color: "text-red-600" },
  neutral: { variant: "info", icon: Info, color: "text-blue-600" },
  insufficient_data: { variant: "neutral", icon: Info, color: "text-gray-500" },
};

export function VerdictPanel({ verdict, isObserving }: VerdictPanelProps) {
  if (isObserving || !verdict) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <p className="text-sm font-medium text-gray-500">판정 결과</p>
        <p className="mt-2 text-sm text-gray-600">
          아직 관찰 기간이 끝나지 않았습니다. 관찰이 완료되면 판정 결과가 표시됩니다.
        </p>
      </div>
    );
  }

  const style = VERDICT_STYLES[verdict.verdict];
  const Icon = style.icon;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-500">판정 결과</p>
        <StatusBadge label={VERDICT_LABELS[verdict.verdict]} variant={style.variant} />
      </div>

      <div className="mt-3 flex items-start gap-2">
        <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", style.color)} strokeWidth={2} />
        <p className="text-base font-semibold text-gray-900">{verdict.headline}</p>
      </div>

      {verdict.reasons.length > 0 ? (
        <div className="mt-3">
          <p className="text-xs font-medium text-gray-500">근거</p>
          <ul className="mt-1 list-inside list-disc space-y-0.5 text-sm text-gray-700">
            {verdict.reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-3 rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-700">
        <p className="text-xs font-medium text-gray-500">권장</p>
        <p className="mt-0.5">{verdict.recommendation}</p>
      </div>

      <p className="mt-3 text-xs text-gray-400">
        광고 소재 지표 기준 판정입니다. 실제 DB 전환 성과 확인이 필요합니다.
      </p>
    </div>
  );
}
