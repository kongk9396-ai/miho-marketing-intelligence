import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import {
  AdRankingTable,
  type AdRankingRow,
} from "@/components/report/ad-ranking-table";
import { buildAdPerformanceSummary } from "@/lib/ad-performance-summary/build";
import { formatCount, formatWon } from "@/lib/dashboard/format";
import { SchemaNotReadyError } from "@/lib/meta/schema-not-ready";

export const dynamic = "force-dynamic";

function recommendationText(value: string) {
  switch (value) {
    case "SCALE_REVIEW":
      return "성과가 좋아 예산 확대를 검토할 수 있습니다.";
    case "KEEP":
      return "현재 성과가 안정적이라 유지해도 좋습니다.";
    case "CREATIVE_FIX":
      return "광고 소재를 수정해볼 필요가 있습니다.";
    case "LANDING_FIX":
      return "광고보다는 랜딩페이지를 먼저 점검하는 편이 좋습니다.";
    case "OFF_REVIEW":
      return "비용 대비 성과가 낮아 중단 여부를 검토하는 것이 좋습니다.";
    default:
      return "아직 판단할 데이터가 충분하지 않아 조금 더 지켜보는 것이 좋습니다.";
  }
}

export default async function AdsOverviewPage() {
  let summary;

  try {
    summary = await buildAdPerformanceSummary();
  } catch (err) {
    if (err instanceof SchemaNotReadyError) {
      return (
        <>
          <PageHeader
            title="광고 성과"
            description="광고가 잘되고 있는지 쉽게 확인합니다."
          />

          <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {err.message}
          </div>
        </>
      );
    }

    throw err;
  }

  const decisionMap = new Map(
    summary.adComparison.map((decision) => [
      decision.adId,
      decision,
    ])
  );

  const rows: AdRankingRow[] =
    summary.adDiagnosisGroups
      .flatMap((group) => group.ads)
      .map((ad) => {
        const decision = decisionMap.get(ad.adId);

        return {
          adId: ad.adId,
          adName: ad.adName ?? ad.adId,
          campaignName: ad.campaignName ?? "캠페인 미확인",
          spend: ad.metrics.spend,
          ctr: ad.metrics.ctr,
          cpc: ad.metrics.cpc,
          recommendation: decision?.recommendation ?? "WATCH",
          actualStatus: decision?.actualStatus?.status ?? null,
        };
      });

  const totalSpend = rows.reduce(
    (sum, row) => sum + row.spend,
    0
  );

  const activeCount = rows.filter(
    (row) => row.actualStatus === "ACTIVE"
  ).length;

  const strongAds = rows
    .filter((row) =>
      ["KEEP", "SCALE_REVIEW"].includes(row.recommendation)
    )
    .sort((a, b) => b.spend - a.spend)
    .slice(0, 3);

  const warningAds = rows
    .filter((row) =>
      ["OFF_REVIEW", "CREATIVE_FIX", "LANDING_FIX"].includes(
        row.recommendation
      )
    )
    .sort((a, b) => b.spend - a.spend)
    .slice(0, 3);

  const watchCount = rows.filter(
    (row) => row.recommendation === "WATCH"
  ).length;

  const offReviewCount = rows.filter(
    (row) => row.recommendation === "OFF_REVIEW"
  ).length;

  const topSpendAd =
    [...rows].sort((a, b) => b.spend - a.spend)[0] ?? null;

  return (
    <>
      <PageHeader
        title="광고 성과"
        description="어떤 광고가 잘되고 있고, 어떤 광고를 확인해야 하는지 쉽게 정리했습니다."
      />

      {/* 핵심 숫자 */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">
            현재 확인 중인 광고
          </p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">
            {formatCount(rows.length)}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            운영 중 {activeCount}개
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">
            분석 기간 광고비
          </p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">
            {formatWon(totalSpend)}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            현재 수집된 Meta 데이터 기준
          </p>
        </div>

        <div className="rounded-xl border border-green-100 bg-green-50/50 p-4">
          <p className="text-xs text-green-700">
            안정적으로 운영 가능한 광고
          </p>
          <p className="mt-1 text-2xl font-semibold text-green-800">
            {strongAds.length}개
          </p>
          <p className="mt-1 text-xs text-green-700/70">
            유지 또는 확대 검토
          </p>
        </div>

        <div className="rounded-xl border border-red-100 bg-red-50/50 p-4">
          <p className="text-xs text-red-600">
            확인이 필요한 광고
          </p>
          <p className="mt-1 text-2xl font-semibold text-red-700">
            {offReviewCount}개
          </p>
          <p className="mt-1 text-xs text-red-600/70">
            중단 검토 기준
          </p>
        </div>
      </section>

      {/* 한눈에 보는 해석 */}
      <section className="mt-5 rounded-xl border border-blue-100 bg-blue-50/60 p-4">
        <h2 className="text-sm font-semibold text-blue-950">
          한눈에 보면
        </h2>

        <div className="mt-3 space-y-2 text-sm leading-relaxed text-gray-800">
          <p>
            • 현재 총 <strong>{rows.length}개 광고</strong>의 성과를
            확인하고 있습니다.
          </p>

          {topSpendAd ? (
            <p>
              • 가장 많은 광고비가 사용된 광고는{" "}
              <strong>{topSpendAd.adName}</strong>이며,
              현재까지 {formatWon(topSpendAd.spend)}이 집행됐습니다.
            </p>
          ) : null}

          <p>
            • 성과 판단을 조금 더 기다려야 하는 광고는{" "}
            <strong>{watchCount}개</strong>입니다.
          </p>

          <p>
            • 숫자 하나만 보고 중단하지 않고, 광고비·클릭 반응·랜딩 성과를
            함께 보고 판단합니다.
          </p>
        </div>
      </section>

      {/* 잘되는 광고 / 확인 광고 */}
      <section className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="rounded-xl border border-green-100 bg-white p-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">
              👍 잘되고 있는 광고
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              현재 성과 기준으로 유지하거나 확대를 검토할 수 있습니다.
            </p>
          </div>

          <div className="mt-4 space-y-3">
            {strongAds.length > 0 ? (
              strongAds.map((row) => (
                <div
                  key={row.adId}
                  className="rounded-lg border border-gray-100 bg-gray-50 p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-900">
                        {row.adName}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-gray-400">
                        {row.campaignName}
                      </p>
                    </div>

                    <span className="shrink-0 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                      {row.recommendation === "SCALE_REVIEW"
                        ? "확대 검토"
                        : "유지"}
                    </span>
                  </div>

                  <p className="mt-2 text-xs leading-relaxed text-gray-600">
                    {recommendationText(row.recommendation)}
                  </p>

                  <p className="mt-2 text-xs text-gray-400">
                    광고비 {formatWon(row.spend)}
                  </p>
                </div>
              ))
            ) : (
              <p className="rounded-lg bg-gray-50 px-3 py-4 text-sm text-gray-500">
                아직 유지 또는 확대를 확정할 만큼 데이터가 쌓이지 않았습니다.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-red-100 bg-white p-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">
              ⚠️ 확인이 필요한 광고
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              바로 끄는 것이 아니라, 원인을 먼저 확인해야 하는 광고입니다.
            </p>
          </div>

          <div className="mt-4 space-y-3">
            {warningAds.length > 0 ? (
              warningAds.map((row) => (
                <div
                  key={row.adId}
                  className="rounded-lg border border-gray-100 bg-gray-50 p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-900">
                        {row.adName}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-gray-400">
                        {row.campaignName}
                      </p>
                    </div>

                    <span className="shrink-0 rounded-full bg-red-50 px-2 py-1 text-xs font-medium text-red-700">
                      확인 필요
                    </span>
                  </div>

                  <p className="mt-2 text-xs leading-relaxed text-gray-600">
                    {recommendationText(row.recommendation)}
                  </p>

                  <p className="mt-2 text-xs text-gray-400">
                    광고비 {formatWon(row.spend)}
                  </p>
                </div>
              ))
            ) : (
              <p className="rounded-lg bg-gray-50 px-3 py-4 text-sm text-gray-500">
                현재 뚜렷하게 문제 신호가 잡힌 광고가 없습니다.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* 상세 분석 바로가기 */}
      <section className="mt-5">
        <div className="mb-3">
          <h2 className="text-sm font-semibold text-gray-900">
            더 자세히 보고 싶다면
          </h2>
          <p className="mt-1 text-xs text-gray-500">
            필요한 분석만 선택해서 확인할 수 있습니다.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Link
            href="/ads-analysis/campaigns"
            className="rounded-xl border border-gray-200 bg-white p-4 transition hover:border-blue-300 hover:bg-blue-50/30"
          >
            <p className="text-sm font-semibold text-gray-900">
              캠페인별 보기
            </p>
            <p className="mt-1 text-xs leading-relaxed text-gray-500">
              어떤 캠페인에 광고비가 많이 쓰이고 있는지 봅니다.
            </p>
          </Link>

          <Link
            href="/ads-analysis/creative-analysis"
            className="rounded-xl border border-gray-200 bg-white p-4 transition hover:border-blue-300 hover:bg-blue-50/30"
          >
            <p className="text-sm font-semibold text-gray-900">
              소재 분석
            </p>
            <p className="mt-1 text-xs leading-relaxed text-gray-500">
              사진·릴스 소재 중 어떤 것이 반응이 좋은지 확인합니다.
            </p>
          </Link>

          <Link
            href="/ads-analysis/video-analysis"
            className="rounded-xl border border-gray-200 bg-white p-4 transition hover:border-blue-300 hover:bg-blue-50/30"
          >
            <p className="text-sm font-semibold text-gray-900">
              영상 분석
            </p>
            <p className="mt-1 text-xs leading-relaxed text-gray-500">
              사람들이 영상의 어느 구간에서 많이 나가는지 봅니다.
            </p>
          </Link>

          <Link
            href="/ads/before-after"
            className="rounded-xl border border-gray-200 bg-white p-4 transition hover:border-blue-300 hover:bg-blue-50/30"
          >
            <p className="text-sm font-semibold text-gray-900">
              변경 전후 비교
            </p>
            <p className="mt-1 text-xs leading-relaxed text-gray-500">
              광고를 수정한 뒤 실제 성과가 좋아졌는지 비교합니다.
            </p>
          </Link>
        </div>
      </section>

      {/* 전체 광고표 접기 */}
      <details className="mt-5 overflow-hidden rounded-xl border border-gray-200 bg-white">
        <summary className="cursor-pointer select-none px-5 py-4 text-sm font-semibold text-gray-900">
          전체 광고 자세히 보기
          <span className="ml-2 text-xs font-normal text-gray-400">
            검색 · 필터 · 정렬 가능
          </span>
        </summary>

        <div className="border-t border-gray-100 p-4">
          <AdRankingTable rows={rows} />
        </div>
      </details>
    </>
  );
}
