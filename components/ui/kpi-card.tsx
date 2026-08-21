import { ArrowDown, ArrowUp, Minus, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type TrendDirection = "up" | "down" | "flat";

interface KpiCardProps {
  label: string;
  value: string;
  change?: {
    value: string;
    direction: TrendDirection;
    period?: string;
  };
  icon?: LucideIcon;
  /** Shown under the value when the underlying source has no data yet, e.g. "아직 데이터가 없습니다." */
  emptyHint?: string;
}

const trendStyles: Record<TrendDirection, { text: string; icon: LucideIcon }> = {
  up: { text: "text-green-600", icon: ArrowUp },
  down: { text: "text-red-600", icon: ArrowDown },
  flat: { text: "text-gray-500", icon: Minus },
};

export function KpiCard({ label, value, change, icon: Icon, emptyHint }: KpiCardProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-gray-500">{label}</p>
        {Icon ? <Icon className="h-4 w-4 text-gray-400" strokeWidth={2} /> : null}
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-gray-900">
        {value}
      </p>
      {change ? (
        <div className="mt-2 flex items-center gap-1 text-xs">
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
          {change.period ? (
            <span className="text-gray-400">{change.period}</span>
          ) : null}
        </div>
      ) : null}
      {emptyHint ? <p className="mt-2 text-xs text-gray-400">{emptyHint}</p> : null}
    </div>
  );
}
