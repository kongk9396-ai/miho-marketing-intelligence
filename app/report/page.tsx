import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import { buildAdPerformanceSummary } from "@/lib/ad-performance-summary/build";
import { SchemaNotReadyError } from "@/lib/meta/schema-not-ready";

export const dynamic = "force-dynamic";

function dateOnly(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addDays(date: Date, amount: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function resolveReportRange(params: {
  preset?: string;
  start?: string;
  end?: string;
}) {
  const now = new Date();

  if (
    params.start &&
    params.end &&
    /^\d{4}-\d{2}-\d{2}$/.test(params.start) &&
    /^\d{4}-\d{2}-\d{2}$/.test(params.end)
  ) {
    return {
      preset: "custom",
      startDate: params.start,
      endDate: params.end,
      label: "직접 선택",
    };
  }

  if (params.preset === "this-week") {
    const day = now.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    const monday = addDays(now, mondayOffset);

    return {
      preset: "this-week",
      startDate: dateOnly(monday),
      endDate: dateOnly(now),
      label: "이번 주",
    };
  }

  if (params.preset === "last-week") {
    const day = now.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;

    const thisMonday = addDays(now, mondayOffset);
    const lastMonday = addDays(thisMonday, -7);
    const lastSunday = addDays(thisMonday, -1);

    return {
      preset: "last-week",
      startDate: dateOnly(lastMonday),
      endDate: dateOnly(lastSunday),
      label: "지난주",
    };
  }

  const end = now;
  const start = addDays(end, -6);

  return {
    preset: "7d",
    startDate: dateOnly(start),
    endDate: dateOnly(end),
    label: "최근 7일",
  };
}

function won(value: number) {
  return `${Math.round(value).toLocaleString("ko-KR")}원`;
}

function number(value: number) {
  return value.toLocaleString("ko-KR");
}

function KpiCard({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-gray-950">
        {value}
      </p>
      <p className="mt-2 text-xs leading-relaxed text-gray-400">
        {description}
      </p>
    </div>
  );
}

function ActionBox({
  type,
  title,
  children,
}: {
  type: "good" | "warning" | "action";
  title: string;
  children: React.ReactNode;
}) {
  const styles = {
    good: "border-green-100 bg-green-50/60",
    warning: "border-amber-100 bg-amber-50/60",
    action: "border-blue-100 bg-blue-50/60",
  };

  return (
    <div className={`rounded-xl border p-4 ${styles[type]}`}>
      <p className="text-sm font-semibold text-gray-900">{title}</p>
      <div className="mt-2 text-sm leading-relaxed text-gray-700">
        {children}
      </div>
    </div>
  );
}

interface ReportPageProps {
  searchParams: Promise<{
    preset?: string;
    start?: string;
    end?: string;
  }>;
}

export default async function ReportPage({
  searchParams,
}: ReportPageProps) {
  const params = await searchParams;
  const selectedRange = resolveReportRange(params);

  let summary;

  try {
    summary = await buildAdPerformanceSummary({
      startDate: selectedRange.startDate,
      endDate: selectedRange.endDate,
    });
  } catch (err) {
    if (err instanceof SchemaNotReadyError) {
      return (
        <>
          <PageHeader
            title="요약 보고"
            description="광고부터 문의·예약까지 핵심 결과를 한눈에 확인합니다."
          />

          <div className="mb-5">
            <Link
              href="/report/meeting"
              className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              회의용 주간 보고 열기 →
            </Link>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {err.message}
          </div>
        </>
      );
    }

    throw err;
  }

  /*
   * 선택한 기간 데이터.
   * Meta 데이터가 없는 뒤쪽 날짜는 CPA 왜곡 방지를 위해
   * 마지막 광고비 확인일까지 KPI 계산에서 제외한다.
   */
  const allDaily = summary.dailyPerformance;

  let latestMetaIndex = -1;

  for (let i = allDaily.length - 1; i >= 0; i -= 1) {
    if (allDaily[i].spend > 0) {
      latestMetaIndex = i;
      break;
    }
  }

  const recentDays =
    latestMetaIndex >= 0
      ? allDaily.slice(0, latestMetaIndex + 1)
      : allDaily;

  const periodSpend = recentDays.reduce(
    (sum, row) => sum + row.spend,
    0
  );

  const periodDb = recentDays.reduce(
    (sum, row) => sum + row.db,
    0
  );

  const periodValidDb = recentDays.reduce(
    (sum, row) => sum + row.validDb,
    0
  );

  const periodBookings = recentDays.reduce(
    (sum, row) => sum + row.bookings,
    0
  );

  const periodCpa =
    periodDb > 0 ? periodSpend / periodDb : null;

  const latestMetaDate =
    recentDays.length > 0
      ? recentDays[recentDays.length - 1].date
      : null;

  const laterDbRows =
    latestMetaDate !== null
      ? allDaily.filter(
          (row) =>
            row.date > latestMetaDate &&
            (row.db > 0 ||
              row.validDb > 0 ||
              row.bookings > 0)
        )
      : [];

  const hasDateMismatch = laterDbRows.length > 0;

  /*
   * 광고 판단
   */
  const decisionMap = new Map(
    summary.adComparison.map((decision) => [
      decision.adId,
      decision,
    ])
  );

  const ads = summary.adDiagnosisGroups
    .flatMap((group) => group.ads)
    .map((ad) => {
      const decision = decisionMap.get(ad.adId);

      return {
        adId: ad.adId,
        adName: ad.adName ?? ad.adId,
        campaignName: ad.campaignName ?? "캠페인 미확인",
        spend: ad.metrics.spend,
        recommendation:
          decision?.recommendation ?? "WATCH",
      };
    });

  const goodAds = ads
    .filter((ad) =>
      ["KEEP", "SCALE_REVIEW"].includes(ad.recommendation)
    )
    .sort((a, b) => b.spend - a.spend);

  const problemAds = ads
    .filter((ad) =>
      [
        "OFF_REVIEW",
        "CREATIVE_FIX",
        "LANDING_FIX",
      ].includes(ad.recommendation)
    )
    .sort((a, b) => b.spend - a.spend);

  const watchAds = ads.filter(
    (ad) => ad.recommendation === "WATCH"
  );

  const bestAd = goodAds[0] ?? null;
  const problemAd = problemAds[0] ?? null;

  /*
   * 쉬운 문장 생성
   */
  const goodText =
    bestAd !== null
      ? `${bestAd.adName} 광고가 현재 유지 또는 확대 검토 대상입니다. 광고비 ${won(
          bestAd.spend
        )}이 집행됐습니다.`
      : periodBookings > 0
        ? `최근 기간 동안 문의 ${number(
            periodDb
          )}건 중 예약 ${number(
            periodBookings
          )}건이 확인됐습니다.`
        : "아직 성과가 충분히 쌓이지 않아 명확한 우수 광고를 판단하기 어렵습니다.";

  const warningText =
    problemAd !== null
      ? `${problemAd.adName} 광고에서 확인이 필요한 신호가 있습니다. 바로 중단하기보다 광고 반응과 랜딩 흐름을 함께 확인하는 것이 좋습니다.`
      : watchAds.length > 0
        ? `${watchAds.length}개 광고는 아직 판단할 데이터가 충분하지 않아 조금 더 지켜볼 필요가 있습니다.`
        : summary.bottleneck?.headline ??
          "현재 뚜렷한 문제 신호는 확인되지 않았습니다.";

  let nextAction =
    "현재 성과를 유지하면서 데이터가 더 쌓이는지 확인합니다.";

  if (problemAd) {
    nextAction = `${problemAd.adName} 광고를 먼저 확인하고, 소재 문제인지 랜딩 문제인지 구분한 뒤 수정 여부를 결정합니다.`;
  } else if (summary.bottleneck?.headline) {
    nextAction = `고객 흐름에서 표시된 병목 구간을 우선 확인합니다. ${summary.bottleneck.headline}`;
  } else if (goodAds.length > 0) {
    nextAction =
      "잘되고 있는 광고는 유지하고, 성과가 안정적으로 이어지는지 확인한 뒤 예산 확대를 검토합니다.";
  }

  /*
   * 전체 고객 흐름
   */
  const funnel = summary.fullFunnel;

  const impressions =
    funnel.find((row) => row.key === "impressions")?.count ??
    null;

  const clicks =
    funnel.find((row) => row.key === "linkClicks")?.count ??
    null;

  const landing =
    funnel.find((row) => row.key === "landingViews")?.count ??
    null;

  return (
    <>
      <PageHeader
        title="요약 보고"
        description="광고 성과부터 문의·예약까지, 지금 알아야 할 내용만 정리했습니다."
      />

      <div className="mb-5">
        <Link
          href="/report/meeting"
          className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          회의용 주간 보고 열기 →
        </Link>
      </div>

      <section className="mb-5 rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-gray-900">
              보고 기간
            </p>
            <p className="mt-1 text-xs text-gray-500">
              {selectedRange.startDate} ~ {selectedRange.endDate}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/report?preset=this-week"
              className={`rounded-lg border px-3 py-2 text-xs font-medium transition ${
                selectedRange.preset === "this-week"
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              이번 주
            </Link>

            <Link
              href="/report?preset=last-week"
              className={`rounded-lg border px-3 py-2 text-xs font-medium transition ${
                selectedRange.preset === "last-week"
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              지난주
            </Link>

            <Link
              href="/report?preset=7d"
              className={`rounded-lg border px-3 py-2 text-xs font-medium transition ${
                selectedRange.preset === "7d"
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              최근 7일
            </Link>
          </div>
        </div>

        <form
          method="GET"
          action="/report"
          className="mt-4 flex flex-wrap items-end gap-2 border-t border-gray-100 pt-4"
        >
          <div>
            <label
              htmlFor="report-start"
              className="mb-1 block text-xs text-gray-500"
            >
              시작일
            </label>
            <input
              id="report-start"
              name="start"
              type="date"
              defaultValue={selectedRange.startDate}
              className="rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-700"
            />
          </div>

          <div>
            <label
              htmlFor="report-end"
              className="mb-1 block text-xs text-gray-500"
            >
              종료일
            </label>
            <input
              id="report-end"
              name="end"
              type="date"
              defaultValue={selectedRange.endDate}
              className="rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-700"
            />
          </div>

          <button
            type="submit"
            className="rounded-lg bg-gray-900 px-4 py-2 text-xs font-medium text-white hover:bg-gray-800"
          >
            기간 조회
          </button>
        </form>
      </section>

      {/* 기간 */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-gray-900">
            {selectedRange.label}
          </p>

          <p className="mt-0.5 text-xs text-gray-400">
            {recentDays.length > 0
              ? `${recentDays[0].date} ~ ${
                  recentDays[recentDays.length - 1].date
                }`
              : "수집된 데이터가 없습니다."}
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            href="/reports/weekly"
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            주간 리포트
          </Link>

          <Link
            href="/reports/daily"
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            일일 리포트
          </Link>
        </div>
      </div>

      {hasDateMismatch ? (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm font-semibold text-amber-900">
            데이터 수집일이 서로 다릅니다
          </p>
          <p className="mt-1 text-xs leading-relaxed text-amber-800">
            Meta 광고 데이터는 {latestMetaDate}까지 확인되어,
            광고비·문의(DB)·DB 1건당 비용·예약은 모두 같은 기간까지만 계산했습니다.
            이후 들어온 DB는 다음 Meta 데이터가 수집되면 자동으로 반영됩니다.
          </p>
        </div>
      ) : null}

      {/* 핵심 KPI */}
      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <KpiCard
          label="광고비"
          value={won(periodSpend)}
          description="같은 분석 기간 동안 사용한 광고비"
        />

        <KpiCard
          label="문의(DB)"
          value={`${number(periodDb)}건`}
          description="광고비와 동일한 기간에 들어온 전체 문의"
        />

        <KpiCard
          label="DB 1건당 비용"
          value={
            periodCpa !== null
              ? won(periodCpa)
              : "-"
          }
          description="동일 기간 기준 문의 1건당 평균 광고비"
        />

        <KpiCard
          label="예약"
          value={`${number(periodBookings)}건`}
          description="현재 데이터에서 확인된 예약"
        />
      </section>

      {/* 결과 해석 */}
      <section className="mt-5">
        <div className="mb-3">
          <h2 className="text-base font-semibold text-gray-950">
            이번 결과
          </h2>
          <p className="mt-1 text-xs text-gray-500">
            숫자를 어떻게 봐야 하는지 쉽게 정리했습니다.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <ActionBox
            type="good"
            title="👍 잘된 점"
          >
            {goodText}
          </ActionBox>

          <ActionBox
            type="warning"
            title="⚠️ 확인할 점"
          >
            {warningText}
          </ActionBox>

          <ActionBox
            type="action"
            title="→ 다음 액션"
          >
            {nextAction}
          </ActionBox>
        </div>
      </section>

      {/* 광고 성과 */}
      <section className="mt-5 rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-gray-950">
              광고 성과
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              어떤 광고를 유지하고 어떤 광고를 확인해야 하는지 봅니다.
            </p>
          </div>

          <Link
            href="/ads-analysis/overview"
            className="shrink-0 text-xs font-medium text-blue-600 hover:underline"
          >
            자세히 보기 →
          </Link>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
          <div className="rounded-lg bg-green-50/70 p-4">
            <p className="text-xs font-medium text-green-700">
              잘되고 있는 광고
            </p>

            {bestAd ? (
              <>
                <p className="mt-1 truncate text-sm font-semibold text-gray-900">
                  {bestAd.adName}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-gray-600">
                  현재 유지하거나 확대를 검토할 수 있는 광고입니다.
                </p>
              </>
            ) : (
              <p className="mt-2 text-sm text-gray-500">
                아직 확정할 만큼 데이터가 쌓이지 않았습니다.
              </p>
            )}
          </div>

          <div className="rounded-lg bg-amber-50/70 p-4">
            <p className="text-xs font-medium text-amber-700">
              확인이 필요한 광고
            </p>

            {problemAd ? (
              <>
                <p className="mt-1 truncate text-sm font-semibold text-gray-900">
                  {problemAd.adName}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-gray-600">
                  광고 반응과 랜딩 성과를 함께 확인하는 것이 좋습니다.
                </p>
              </>
            ) : (
              <p className="mt-2 text-sm text-gray-500">
                현재 뚜렷한 문제 광고가 없습니다.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* 고객 흐름 */}
      <section className="mt-5 rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-gray-950">
              고객 흐름
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              광고를 본 사람이 문의와 예약까지 어떻게 이동했는지 봅니다.
            </p>
          </div>

          <Link
            href="/funnel/landing"
            className="shrink-0 text-xs font-medium text-blue-600 hover:underline"
          >
            자세히 보기 →
          </Link>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
          <div className="rounded-lg bg-gray-50 p-3">
            <p className="text-[11px] text-gray-400">
              광고 노출
            </p>
            <p className="mt-1 text-lg font-semibold text-gray-900">
              {impressions !== null
                ? Number(impressions).toLocaleString("ko-KR")
                : "-"}
            </p>
          </div>

          <div className="rounded-lg bg-gray-50 p-3">
            <p className="text-[11px] text-gray-400">
              클릭
            </p>
            <p className="mt-1 text-lg font-semibold text-gray-900">
              {clicks !== null
                ? Number(clicks).toLocaleString("ko-KR")
                : "-"}
            </p>
          </div>

          <div className="rounded-lg bg-gray-50 p-3">
            <p className="text-[11px] text-gray-400">
              랜딩 진입
            </p>
            <p className="mt-1 text-lg font-semibold text-gray-900">
              {landing !== null
                ? Number(landing).toLocaleString("ko-KR")
                : "-"}
            </p>
          </div>

          <div className="rounded-lg bg-gray-50 p-3">
            <p className="text-[11px] text-gray-400">
              문의(DB)
            </p>
            <p className="mt-1 text-lg font-semibold text-gray-900">
              {number(periodDb)}
            </p>
          </div>

          <div className="rounded-lg bg-green-50 p-3">
            <p className="text-[11px] text-green-600">
              유효 DB
            </p>
            <p className="mt-1 text-lg font-semibold text-green-800">
              {number(periodValidDb)}
            </p>
          </div>

          <div className="rounded-lg bg-blue-50 p-3">
            <p className="text-[11px] text-blue-600">
              예약
            </p>
            <p className="mt-1 text-lg font-semibold text-blue-900">
              {number(periodBookings)}
            </p>
          </div>
        </div>

        {summary.bottleneck?.headline ? (
          <div className="mt-3 rounded-lg border border-amber-100 bg-amber-50/50 px-3 py-2 text-xs leading-relaxed text-gray-700">
            <strong>확인:</strong>{" "}
            {summary.bottleneck.headline}
          </div>
        ) : null}
      </section>

      {/* 변경 영향 */}
      <section className="mt-5 rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-gray-950">
              최근 변경 영향
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              소재나 랜딩을 바꾼 뒤 실제 성과가 달라졌는지 확인합니다.
            </p>
          </div>

          <Link
            href="/changes/creative"
            className="shrink-0 text-xs font-medium text-blue-600 hover:underline"
          >
            자세히 보기 →
          </Link>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
          <div className="rounded-lg bg-gray-50 p-4">
            <p className="text-xs font-medium text-gray-500">
              소재 변경
            </p>
            <p className="mt-2 text-sm leading-relaxed text-gray-700">
              {summary.creativeChange.available
                ? summary.creativeChange.reportLine
                : "최근 소재 변경 이력이 없거나 비교 데이터가 부족합니다."}
            </p>
          </div>

          <div className="rounded-lg bg-gray-50 p-4">
            <p className="text-xs font-medium text-gray-500">
              랜딩 변경
            </p>
            <p className="mt-2 text-sm leading-relaxed text-gray-700">
              {summary.landingChange.available
                ? summary.landingChange.reportLine
                : "최근 랜딩 변경 이력이 없거나 비교 데이터가 부족합니다."}
            </p>
          </div>
        </div>
      </section>

      {/* 일별 추이 */}
      <section className="mt-5 rounded-xl border border-gray-200 bg-white p-5">
        <div>
          <h2 className="text-base font-semibold text-gray-950">
            기간별 일자 추이
          </h2>
          <p className="mt-1 text-xs text-gray-500">
            일별 광고비와 문의가 어떻게 움직였는지 확인합니다.
          </p>
        </div>

        {recentDays.length > 0 ? (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[680px] text-left">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-400">
                  <th className="px-3 py-2 font-medium">
                    날짜
                  </th>
                  <th className="px-3 py-2 text-right font-medium">
                    광고비
                  </th>
                  <th className="px-3 py-2 text-right font-medium">
                    문의(DB)
                  </th>
                  <th className="px-3 py-2 text-right font-medium">
                    DB 1건당 비용
                  </th>
                  <th className="px-3 py-2 text-right font-medium">
                    예약
                  </th>
                </tr>
              </thead>

              <tbody>
                {recentDays
                  .slice()
                  .reverse()
                  .map((row) => (
                    <tr
                      key={row.date}
                      className="border-b border-gray-50 text-sm text-gray-700"
                    >
                      <td className="px-3 py-3">
                        {row.date}
                      </td>

                      <td className="px-3 py-3 text-right">
                        {won(row.spend)}
                      </td>

                      <td className="px-3 py-3 text-right">
                        {number(row.db)}건
                      </td>

                      <td className="px-3 py-3 text-right">
                        {row.cpa !== null
                          ? won(row.cpa)
                          : "-"}
                      </td>

                      <td className="px-3 py-3 text-right">
                        {number(row.bookings)}건
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="mt-4 rounded-lg bg-gray-50 p-4 text-sm text-gray-500">
            아직 일별 데이터가 없습니다.
          </div>
        )}
      </section>
    </>
  );
}

