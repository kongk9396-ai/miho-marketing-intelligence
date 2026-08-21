import { StatusBadge } from "@/components/ui/status-badge";
import { formatKoreanDate } from "@/lib/date/kst";
import type { DashboardFreshness, DataSourceFreshness } from "@/lib/dashboard/freshness";

interface DataFreshnessCardProps {
  freshness: DashboardFreshness;
}

function Row({ source }: { source: DataSourceFreshness }) {
  return (
    <div className="flex items-center justify-between border-t border-gray-100 py-2.5 first:border-t-0">
      <p className="text-sm font-medium text-gray-700">{source.label}</p>
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-900">
          {source.latestDate ? formatKoreanDate(source.latestDate) : "아직 데이터가 없습니다."}
        </span>
        {source.isStale ? (
          <StatusBadge label={source.latestDate ? "오래됨" : "데이터 없음"} variant="warning" />
        ) : (
          <StatusBadge label="최신" variant="success" />
        )}
      </div>
    </div>
  );
}

export function DataFreshnessCard({ freshness }: DataFreshnessCardProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <p className="text-sm font-semibold text-gray-900">데이터 최신성</p>
      <div className="mt-1">
        <Row source={freshness.meta} />
        <Row source={freshness.ga4} />
        <Row source={freshness.leads} />
      </div>
    </div>
  );
}
