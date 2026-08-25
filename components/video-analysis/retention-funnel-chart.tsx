import { findMaxDropoff } from "@/lib/video-analysis/funnel";
import type { FunnelStage, VideoHookMetrics } from "@/lib/video-analysis/funnel";
import { cn } from "@/lib/utils";

interface RetentionFunnelChartProps {
  stages: FunnelStage[];
  hook?: VideoHookMetrics;
}

function clampWidth(rate: number | null): number {
  if (rate === null) return 0;
  return Math.max(0, Math.min(100, rate));
}

export function RetentionFunnelChart({ stages, hook }: RetentionFunnelChartProps) {
  const max = findMaxDropoff(stages);

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <p className="text-sm font-semibold text-gray-900">시청 유지 퍼널</p>

      {hook ? (
        <div className="mt-3 rounded-md border border-gray-100 bg-gray-50 px-3 py-2">
          <p className="text-xs font-medium text-gray-500">초반 후킹 (3초)</p>
          <div className="mt-1 flex flex-wrap items-baseline gap-x-4 gap-y-0.5 text-sm text-gray-700">
            <span>3초 재생 {hook.video3sCount.toLocaleString("ko-KR")}회</span>
            <span>{hook.video3sRate !== null ? `3초 재생률 ${hook.video3sRate.toFixed(1)}%` : "3초 재생률 데이터 없음"}</span>
            <span>{hook.avgWatchTime !== null ? `평균 시청시간 ${hook.avgWatchTime.toFixed(1)}초` : "평균 시청시간 데이터 없음"}</span>
          </div>
          <p className="mt-1 text-[11px] text-gray-400">
            Meta의 3초 재생과 25% 이하 재생 지표는 서로 다른 기준(분모)으로 집계될 수 있어, 아래 시청 유지
            퍼널과 별도로 표시합니다.
          </p>
        </div>
      ) : null}

      <div className="mt-4 space-y-3">
        {stages.length === 0 || !stages[0].reliable ? null : (
          <p className="text-[11px] text-gray-400">25% 도달 시점을 100% 기준으로 하는 유지율입니다.</p>
        )}
        {stages.map((stage, i) => {
          const isMaxDropoff = i > 0 && max !== null && stages[i - 1].label === max.fromLabel && stage.label === max.toLabel;
          return (
            <div key={stage.key}>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span className="font-medium text-gray-700">{stage.label}</span>
                <span>
                  {stage.count.toLocaleString("ko-KR")}회
                  {stage.cumulativeRetentionRate !== null ? ` · 25% 기준 유지율 ${stage.cumulativeRetentionRate.toFixed(1)}%` : " · 데이터 없음"}
                  {stage.dropOffRate !== null ? ` · 직전 대비 이탈 ${stage.dropOffRate.toFixed(1)}%` : ""}
                </span>
              </div>
              <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
                {stage.cumulativeRetentionRate === null ? (
                  <div className="h-full w-0" />
                ) : (
                  <div
                    className={cn("h-full rounded-full", isMaxDropoff ? "bg-amber-500" : "bg-blue-500")}
                    style={{ width: `${clampWidth(stage.cumulativeRetentionRate)}%` }}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {stages.length > 0 && !stages[0].reliable ? (
        <p className="mt-3 text-xs text-amber-600">표본(25% 도달 수)이 적어 유지율이 실제와 다를 수 있습니다.</p>
      ) : null}
    </div>
  );
}
