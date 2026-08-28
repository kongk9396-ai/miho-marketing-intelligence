import Link from "next/link";
import {
  AdRankingTable,
  type AdRankingRow,
} from "@/components/report/ad-ranking-table";

export function TopAdsSection({
  rows,
}: {
  rows: AdRankingRow[];
}) {
  const topRows = [...rows]
    .sort((a, b) => b.spend - a.spend)
    .slice(0, 5);

  return (
    <section className="mt-6">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">
            주요 광고 TOP 5
          </h2>
          <p className="mt-0.5 text-xs text-gray-400">
            분석 기간 광고비 기준
          </p>
        </div>

        <Link
          href="/ads-analysis/overview"
          className="text-xs font-medium text-blue-600 hover:underline"
        >
          전체 광고 보기 →
        </Link>
      </div>

      <AdRankingTable rows={topRows} compact />
    </section>
  );
}
