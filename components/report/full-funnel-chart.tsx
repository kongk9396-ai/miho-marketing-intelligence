import type { FullFunnelStage } from "@/lib/ad-performance-summary/full-funnel";

export function FullFunnelChart({ stages }: { stages: FullFunnelStage[] }) {
  const maxCount = Math.max(1, ...stages.map((s) => s.count ?? 0));

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <p className="text-sm font-semibold text-gray-900">전체 광고 퍼널</p>
      <p className="mt-1 text-xs text-gray-500">
        Meta 광고 → 영상 시청 → 광고 클릭 → GA4 랜딩 → CTA → 폼 시작 → DB → 유효 DB → 예약 확정
      </p>
      <div className="mt-4 space-y-3">
        {stages.map((stage) => (
          <div key={stage.key}>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span className="font-medium text-gray-700">{stage.label}</span>
              <span>
                {stage.count !== null ? `${stage.count.toLocaleString("ko-KR")}건` : "데이터 없음"}
                {stage.conversionFromPrevious !== null ? ` · 이전 대비 ${stage.conversionFromPrevious.toFixed(1)}%` : ""}
              </span>
            </div>
            <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-blue-500"
                style={{ width: `${stage.count !== null ? Math.max(2, (stage.count / maxCount) * 100) : 0}%` }}
              />
            </div>
            {stage.note ? <p className="mt-1 text-[11px] text-gray-400">{stage.note}</p> : null}
          </div>
        ))}
      </div>
    </div>
  );
}
