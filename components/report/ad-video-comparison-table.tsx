import { formatCount, formatPercent } from "@/lib/dashboard/format";
import type { AdVideoFunnelSummary } from "@/lib/ad-performance-summary/ad-video-comparison";
import type { FunnelStage } from "@/lib/video-analysis/funnel";

function retentionCell(stage: FunnelStage, hasData: boolean): string {
  if (!hasData) return "데이터 없음";
  return stage.cumulativeRetentionRate !== null ? formatPercent(stage.cumulativeRetentionRate, 1) : "데이터 없음";
}

function ComparisonRow({ ad }: { ad: AdVideoFunnelSummary }) {
  return (
    <tr className="border-b border-gray-100">
      <td className="px-3 py-2 text-sm text-gray-900">{ad.adName ?? ad.adId}</td>
      {ad.stages.map((stage) => (
        <td key={stage.key} className="px-3 py-2 text-center text-sm text-gray-700">
          {retentionCell(stage, ad.hasData)}
        </td>
      ))}
      <td className="px-3 py-2 text-center text-xs text-gray-500">
        {ad.hasData ? (ad.maxDropoffLabel ? ad.maxDropoffLabel.split(" 구간에서")[0] : "표본 부족") : "—"}
      </td>
    </tr>
  );
}

function DetailBlock({ ad }: { ad: AdVideoFunnelSummary }) {
  return (
    <details className="rounded-md border border-gray-200 bg-white px-3 py-2">
      <summary className="cursor-pointer text-sm font-medium text-gray-900">
        {ad.adName ?? ad.adId} {ad.excluded ? "(기존 상시 운영 — 참고)" : null}
      </summary>
      {!ad.hasData ? (
        <p className="mt-2 text-sm text-gray-500">데이터 없음 (이 광고에는 25% 시청 기록이 없습니다)</p>
      ) : (
        <ul className="mt-2 space-y-1 text-sm text-gray-700">
          {ad.stages.map((stage, i) => (
            <li key={stage.key}>
              {stage.label} {formatCount(stage.count)}회{" "}
              {i === 0
                ? `· 기준 ${formatPercent(stage.cumulativeRetentionRate, 1)}`
                : `· 유지율 ${formatPercent(stage.cumulativeRetentionRate, 1)}${
                    stage.dropOffRate !== null
                      ? ` · ${ad.stages[i - 1].label}→${stage.label} 이탈 ${formatPercent(stage.dropOffRate, 1)}`
                      : ""
                  }`}
            </li>
          ))}
        </ul>
      )}
      {ad.hasData ? (
        <p className="mt-2 text-xs text-gray-500">최대 이탈: {ad.maxDropoffLabel ?? "표본 부족으로 판정 보류"}</p>
      ) : null}
    </details>
  );
}

/**
 * Per-ad 25%→50%→75%→95%→100% video retention comparison. Long-running
 * legacy campaigns (excluded: true) are shown in a separate reference-only
 * section, never merged into the "신규 광고" comparison rows.
 */
export function AdVideoComparisonTable({ ads }: { ads: AdVideoFunnelSummary[] }) {
  const newAds = ads.filter((a) => !a.excluded);
  const excludedAds = ads.filter((a) => a.excluded);

  if (ads.length === 0) {
    return <p className="text-sm text-gray-500">비교할 광고가 없습니다.</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-semibold text-gray-900">광고별 영상 시청 유지율 비교 (신규 광고)</h4>
        {newAds.length === 0 ? (
          <p className="mt-2 text-sm text-gray-500">비교할 신규 광고가 없습니다.</p>
        ) : (
          <div className="mt-2 overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full min-w-[560px] border-collapse">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-xs font-medium text-gray-500">
                  <th className="px-3 py-2 text-left">광고명</th>
                  <th className="px-3 py-2">25%</th>
                  <th className="px-3 py-2">50%</th>
                  <th className="px-3 py-2">75%</th>
                  <th className="px-3 py-2">95%</th>
                  <th className="px-3 py-2">100%</th>
                  <th className="px-3 py-2">최대 이탈</th>
                </tr>
              </thead>
              <tbody>
                {newAds.map((ad) => (
                  <ComparisonRow key={ad.adId} ad={ad} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-gray-900">광고별 상세 (25/50/75/95/100% 재생수 · 유지율 · 구간 이탈)</h4>
        {newAds.map((ad) => (
          <DetailBlock key={ad.adId} ad={ad} />
        ))}
      </div>

      {excludedAds.length > 0 ? (
        <div>
          <h4 className="text-sm font-semibold text-gray-500">참고 — 기존 상시 운영 광고 (신규 비교에서 제외)</h4>
          <div className="mt-2 overflow-x-auto rounded-lg border border-dashed border-gray-300">
            <table className="w-full min-w-[560px] border-collapse opacity-80">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-xs font-medium text-gray-500">
                  <th className="px-3 py-2 text-left">광고명</th>
                  <th className="px-3 py-2">25%</th>
                  <th className="px-3 py-2">50%</th>
                  <th className="px-3 py-2">75%</th>
                  <th className="px-3 py-2">95%</th>
                  <th className="px-3 py-2">100%</th>
                  <th className="px-3 py-2">최대 이탈</th>
                </tr>
              </thead>
              <tbody>
                {excludedAds.map((ad) => (
                  <ComparisonRow key={ad.adId} ad={ad} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
