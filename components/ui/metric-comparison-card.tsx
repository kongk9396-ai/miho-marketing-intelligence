import { ArrowRight, ArrowDown, ArrowUp, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TrendDirection } from "@/components/ui/kpi-card";

interface MetricComparisonCardProps {
  metricLabel: string;
  before: string;
  after: string;
  change?: {
    value: string;
    direction: TrendDirection;
  };
  /** When set, renders this message instead of the before/after comparison — e.g. no change to compare yet. */
  emptyMessage?: string;
}

const trendStyles: Record<TrendDirection, { text: string; icon: typeof ArrowUp }> = {
  up: { text: "text-green-600", icon: ArrowUp },
  down: { text: "text-red-600", icon: ArrowDown },
  flat: { text: "text-gray-500", icon: Minus },
};

export function MetricComparisonCard({
  metricLabel,
  before,
  after,
  change,
  emptyMessage,
}: MetricComparisonCardProps) {
  if (emptyMessage) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <p className="text-sm font-medium text-gray-500">{metricLabel}</p>
        <p className="mt-3 text-sm text-gray-400">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-500">{metricLabel}</p>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-gray-400">이전</p>
          <p className="text-lg font-semibold text-gray-500">{before}</p>
        </div>
        <ArrowRight className="mt-3 h-4 w-4 shrink-0 text-gray-300" />
        <div>
          <p className="text-[11px] uppercase tracking-wide text-gray-400">이후</p>
          <p className="text-lg font-semibold text-gray-900">{after}</p>
        </div>
      </div>

      {change ? (
        <div className="mt-3 flex items-center gap-1 border-t border-gray-100 pt-3 text-xs">
          {(() => {
            const TrendIcon = trendStyles[change.direction].icon;
            return (
              <TrendIcon
                className={cn("h-3.5 w-3.5", trendStyles[change.direction].text)}
                strokeWidth={2.5}
              />
            );
          })()}
          <span className={cn("font-medium", trendStyles[change.direction].text)}>
            {change.value}
          </span>
          <span className="text-gray-400">이전 대비</span>
        </div>
      ) : null}
    </div>
  );
}
