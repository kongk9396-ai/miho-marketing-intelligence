import { AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import type { VideoDiagnosisInsight } from "@/lib/video-analysis/diagnosis";

interface VideoDiagnosisCardProps {
  insights: VideoDiagnosisInsight[];
}

export function VideoDiagnosisCard({ insights }: VideoDiagnosisCardProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <p className="text-sm font-semibold text-gray-900">영상 자동 진단</p>
      <ul className="mt-3 space-y-3">
        {insights.map((insight) => {
          const isWarning = insight.severity === "warning";
          const Icon = isWarning ? AlertTriangle : Info;
          return (
            <li key={insight.key} className="flex items-start gap-2">
              <Icon
                className={cn("mt-0.5 h-4 w-4 shrink-0", isWarning ? "text-amber-500" : "text-blue-500")}
                strokeWidth={2}
              />
              <div>
                <p className="text-sm font-medium text-gray-900">{insight.headline}</p>
                <p className="mt-0.5 text-xs text-gray-500">{insight.detail}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
