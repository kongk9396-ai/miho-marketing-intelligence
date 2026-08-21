import type { FunnelStage } from "@/lib/video-analysis/funnel";

interface RetentionFunnelChartProps {
  stages: FunnelStage[];
}

export function RetentionFunnelChart({ stages }: RetentionFunnelChartProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <p className="text-sm font-semibold text-gray-900">시청 유지 퍼널</p>
      <div className="mt-4 space-y-3">
        {stages.map((stage) => (
          <div key={stage.key}>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span className="font-medium text-gray-700">{stage.label}</span>
              <span>
                {stage.count.toLocaleString("ko-KR")}회
                {stage.retentionRate !== null ? ` · 유지율 ${stage.retentionRate.toFixed(1)}%` : ""}
                {stage.dropOffRate !== null ? ` · 이전 대비 이탈 ${stage.dropOffRate.toFixed(1)}%` : ""}
              </span>
            </div>
            <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-blue-500"
                style={{ width: `${stage.retentionRate ?? 0}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      {!stages[0]?.reliable ? (
        <p className="mt-3 text-xs text-amber-600">
          표본(재생 수)이 적어 유지율이 실제와 다를 수 있습니다.
        </p>
      ) : null}
    </div>
  );
}
