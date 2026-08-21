import type { CategoryRanking, RankingEntry } from "@/lib/video-analysis/ranking";

interface VideoRankingSectionProps {
  rankings: CategoryRanking[];
}

function EntryList({ entries, emptyMessage }: { entries: RankingEntry[]; emptyMessage: string }) {
  if (entries.length === 0) {
    return <p className="text-xs text-gray-400">{emptyMessage}</p>;
  }
  return (
    <ol className="space-y-1 text-sm">
      {entries.map((entry, i) => (
        <li key={entry.adId} className="flex items-center justify-between gap-2">
          <span className="truncate text-gray-700">
            {i + 1}. {entry.adName ?? entry.adId}
          </span>
          <span className="shrink-0 font-medium text-gray-900">{entry.displayValue}</span>
        </li>
      ))}
    </ol>
  );
}

export function VideoRankingSection({ rankings }: VideoRankingSectionProps) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-gray-900">소재 랭킹</h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {rankings.map((ranking) => (
          <div key={ranking.category} className="rounded-lg border border-gray-200 bg-white p-5">
            <p className="text-sm font-medium text-gray-500">{ranking.label}</p>

            <div className="mt-3">
              <p className="text-xs font-medium text-gray-400">상위</p>
              <div className="mt-1">
                <EntryList entries={ranking.top} emptyMessage="랭킹을 매길 수 있는 데이터가 없습니다." />
              </div>
            </div>

            {ranking.bottom.length > 0 ? (
              <div className="mt-3 border-t border-gray-100 pt-3">
                <p className="text-xs font-medium text-gray-400">하위</p>
                <div className="mt-1">
                  <EntryList entries={ranking.bottom} emptyMessage="" />
                </div>
              </div>
            ) : null}

            {ranking.insufficientSample.length > 0 ? (
              <p className="mt-3 border-t border-gray-100 pt-3 text-xs text-gray-400">
                표본 부족으로 제외: {ranking.insufficientSample.length}개
              </p>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
