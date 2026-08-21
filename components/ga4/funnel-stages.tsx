import type { FunnelStage } from "@/lib/ga4/funnel";

interface FunnelStagesProps {
  stages: FunnelStage[];
}

export function FunnelStages({ stages }: FunnelStagesProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stages.map((stage) => (
        <div key={stage.key} className="rounded-lg border border-gray-200 bg-white p-5">
          <p className="text-sm font-medium text-gray-500">{stage.label}</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">{stage.count.toLocaleString("ko-KR")}</p>
          <p className="mt-1 text-xs text-gray-400">
            {stage.stepRatePercent !== null ? `이전 단계 대비 ${stage.stepRatePercent.toFixed(1)}%` : "퍼널 시작"}
          </p>
        </div>
      ))}
    </div>
  );
}
