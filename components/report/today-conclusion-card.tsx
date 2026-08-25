import { StatusBadge, type StatusVariant } from "@/components/ui/status-badge";
import type { TodayConclusion } from "@/lib/ad-performance-summary/today-conclusion";

const GROUP_LABELS = {
  scaleReview: "예산 확대 검토",
  keep: "유지",
  offReview: "OFF 검토",
  offCompleted: "OFF 완료",
  watch: "관찰",
  creativeFix: "소재 수정",
  landingFix: "랜딩 수정",
} as const;

const GROUP_VARIANTS: Record<keyof typeof GROUP_LABELS, StatusVariant> = {
  scaleReview: "success",
  keep: "info",
  offReview: "warning",
  offCompleted: "danger",
  watch: "neutral",
  creativeFix: "warning",
  landingFix: "warning",
};

const GROUP_ORDER: (keyof typeof GROUP_LABELS)[] = [
  "keep",
  "scaleReview",
  "offReview",
  "offCompleted",
  "creativeFix",
  "landingFix",
  "watch",
];

export function TodayConclusionCard({ conclusion }: { conclusion: TodayConclusion }) {
  return (
    <section className="rounded-lg border border-blue-200 bg-blue-50/60 p-5">
      <h2 className="text-base font-semibold text-gray-900">오늘의 운영 결론</h2>
      <p className="mt-2 text-sm leading-relaxed text-gray-700">{conclusion.summaryText}</p>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {GROUP_ORDER.map((key) => {
          const items = conclusion.groups[key];
          if (items.length === 0) return null;
          return (
            <div key={key} className="rounded-md border border-gray-200 bg-white p-3">
              <StatusBadge label={GROUP_LABELS[key]} variant={GROUP_VARIANTS[key]} />
              <ul className="mt-2 space-y-1 text-xs text-gray-700">
                {items.slice(0, 5).map((d, i) => (
                  <li key={i}>
                    {d.adName ?? d.adId}
                    {key === "offCompleted" && d.actualStatus ? ` — ${d.actualStatus.status_changed_at} OFF` : ""}
                  </li>
                ))}
                {items.length > 5 ? <li className="text-gray-400">외 {items.length - 5}건</li> : null}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}
