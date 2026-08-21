import type { LeadsFunnelStage } from "@/lib/leads-analysis/funnel";

interface LeadsFunnelStagesProps {
  stages: LeadsFunnelStage[];
}

export function LeadsFunnelStages({ stages }: LeadsFunnelStagesProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {stages.map((stage) => (
        <div key={stage.key} className="rounded-lg border border-gray-200 bg-white p-5">
          <p className="text-sm font-medium text-gray-500">{stage.label}</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">{stage.count.toLocaleString("ko-KR")}</p>
          <p className="mt-1 text-xs text-gray-400">
            {stage.stepRatePercent !== null ? `이전 단계 대비 ${stage.stepRatePercent.toFixed(1)}%` : "퍼널 시작"}
          </p>
          {stage.cumulativeRatePercent !== null ? (
            <p className="mt-0.5 text-xs text-gray-400">전체 DB 대비 {stage.cumulativeRatePercent.toFixed(1)}%</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}
