import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import { buildAdPerformanceSummary } from "@/lib/ad-performance-summary/build";
import { SchemaNotReadyError } from "@/lib/meta/schema-not-ready";

export const dynamic = "force-dynamic";

function formatDate(value: string | null | undefined) {
  if (!value) return "날짜 미확인";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value.slice(0, 10);
  }

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function buildResultLabel(
  available: boolean,
  verdict: unknown
) {
  if (!available) {
    return {
      label: "변경 이력 없음",
      className: "bg-gray-100 text-gray-600",
    };
  }

  const text = String(verdict ?? "").toLowerCase();

  if (
    text.includes("improv") ||
    text.includes("positive") ||
    text.includes("better") ||
    text.includes("success")
  ) {
    return {
      label: "개선 신호",
      className: "bg-green-100 text-green-700",
    };
  }

  if (
    text.includes("declin") ||
    text.includes("negative") ||
    text.includes("worse")
  ) {
    return {
      label: "악화 신호",
      className: "bg-red-100 text-red-700",
    };
  }

  return {
    label: "관찰 중",
    className: "bg-amber-100 text-amber-700",
  };
}

function ChangeSummaryCard({
  title,
  date,
  resultLabel,
  resultClassName,
  reportLine,
  attributionText,
  actionText,
  href,
}: {
  title: string;
  date: string;
  resultLabel: string;
  resultClassName: string;
  reportLine: string;
  attributionText: string;
  actionText: string;
  href: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-gray-950">
            {title}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            최근 변경 {date}
          </p>
        </div>

        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${resultClassName}`}
        >
          {resultLabel}
        </span>
      </div>

      <div className="mt-4">
        <p className="text-xs font-medium text-gray-400">
          결과
        </p>
        <p className="mt-1 text-sm leading-relaxed text-gray-800">
          {reportLine}
        </p>
      </div>

      <div className="mt-4 rounded-lg bg-gray-50 p-3">
        <p className="text-xs font-medium text-gray-500">
          판단 근거
        </p>
        <p className="mt-1 text-xs leading-relaxed text-gray-600">
          {attributionText}
        </p>
      </div>

      <div className="mt-3 rounded-lg bg-blue-50/70 p-3">
        <p className="text-xs font-medium text-blue-700">
          다음 행동
        </p>
        <p className="mt-1 text-xs leading-relaxed text-gray-700">
          {actionText}
        </p>
      </div>

      <Link
        href={href}
        className="mt-4 inline-block text-xs font-medium text-blue-600 hover:underline"
      >
        상세 비교 보기 →
      </Link>
    </div>
  );
}

export default async function ChangesHubPage() {
  let summary;

  try {
    summary = await buildAdPerformanceSummary();
  } catch (err) {
    if (err instanceof SchemaNotReadyError) {
      return (
        <>
          <PageHeader
            title="변경 기록"
            description="광고·랜딩·예산 변경 후 실제 성과 변화를 확인합니다."
          />

          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {err.message}
          </div>
        </>
      );
    }

    throw err;
  }

  const creative = summary.creativeChange;
  const landing = summary.landingChange;

  const creativeStatus = buildResultLabel(
    creative.available,
    creative.verdict
  );

  const landingStatus = buildResultLabel(
    landing.available,
    landing.verdict
  );

  const creativeAttribution = !creative.available
    ? "아직 등록된 소재 변경 이력이 없습니다."
    : creative.dbAttributionAvailable
      ? `광고 성과뿐 아니라 연결된 DB의 변경 전후 데이터도 함께 확인했습니다.${
          creative.dbBefore && creative.dbAfter
            ? ` DB ${creative.dbBefore.totalLeads}건 → ${creative.dbAfter.totalLeads}건, 예약 ${creative.dbBefore.confirmedBookings}건 → ${creative.dbAfter.confirmedBookings}건입니다.`
            : ""
        }`
      : "광고 성과 전후 비교는 가능하지만, 이 소재와 정확히 연결된 DB 전후 데이터는 아직 충분하지 않습니다.";

  const landingAttribution = !landing.available
    ? "아직 등록된 랜딩 변경 이력이 없습니다."
    : landing.ga4AttributionAvailable && landing.dbAttributionAvailable
      ? `GA4 행동 데이터와 연결된 DB의 변경 전후 데이터를 함께 확인했습니다.${
          landing.dbBefore && landing.dbAfter
            ? ` DB ${landing.dbBefore.totalLeads}건 → ${landing.dbAfter.totalLeads}건, 예약 ${landing.dbBefore.confirmedBookings}건 → ${landing.dbAfter.confirmedBookings}건입니다.`
            : ""
        }`
      : landing.ga4AttributionAvailable
        ? "랜딩 방문·행동 변화는 확인 가능하지만, DB까지 연결된 전후 데이터는 아직 충분하지 않습니다."
        : "변경 전후를 비교할 GA4 데이터가 아직 충분하지 않습니다.";

  const creativeAction = !creative.available
    ? "소재를 교체하거나 수정한 날짜를 기록하면 이후 성과를 자동 비교할 수 있습니다."
    : creativeStatus.label === "개선 신호"
      ? "현재 소재를 유지하면서 성과가 며칠 더 지속되는지 확인합니다. 안정적으로 이어지면 예산 확대를 검토합니다."
      : creativeStatus.label === "악화 신호"
        ? "소재 변경 이후 하락한 지표를 확인하고, 이전 소재 복귀 또는 새 소재 테스트를 검토합니다."
        : "비교 기간이 더 쌓일 때까지 성급하게 결론 내리지 않고 추이를 관찰합니다.";

  const landingAction = !landing.available
    ? "랜딩을 수정한 날짜를 기록하면 이후 GA4와 DB 변화를 자동 비교할 수 있습니다."
    : landingStatus.label === "개선 신호"
      ? "현재 랜딩을 유지하면서 문의와 예약 증가가 계속되는지 확인합니다."
      : landingStatus.label === "악화 신호"
        ? "랜딩 변경 후 이탈이 커진 구간을 확인하고 CTA·폼·콘텐츠 순서 중 수정할 부분을 점검합니다."
        : "랜딩 변경 후 데이터가 더 쌓일 때까지 유입·폼 시작·DB 흐름을 함께 관찰합니다.";

  return (
    <>
      <PageHeader
        title="변경 기록"
        description="무엇을 바꿨고, 실제로 좋아졌는지와 다음 행동을 한눈에 확인합니다."
      />

      <section className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
        <h2 className="text-sm font-semibold text-blue-950">
          변경 후에는 이것만 보면 됩니다
        </h2>

        <p className="mt-2 text-sm leading-relaxed text-gray-700">
          단순히 변경 날짜만 기록하는 화면이 아니라,
          <strong> 변경 결과 → 판단 근거 → 다음 행동</strong> 순서로 확인합니다.
          데이터가 부족한 경우에는 개선·악화를 억지로 판단하지 않습니다.
        </p>
      </section>

      <section className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ChangeSummaryCard
          title="소재 변경"
          date={formatDate(creative.change?.changedAt)}
          resultLabel={creativeStatus.label}
          resultClassName={creativeStatus.className}
          reportLine={creative.reportLine}
          attributionText={creativeAttribution}
          actionText={creativeAction}
          href="/changes/creative"
        />

        <ChangeSummaryCard
          title="랜딩 변경"
          date={formatDate(landing.change?.changedAt)}
          resultLabel={landingStatus.label}
          resultClassName={landingStatus.className}
          reportLine={landing.reportLine}
          attributionText={landingAttribution}
          actionText={landingAction}
          href="/changes/landing"
        />
      </section>

      <section className="mt-5">
        <h2 className="text-sm font-semibold text-gray-900">
          다른 변경 기록
        </h2>

        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Link
            href="/ads/before-after"
            className="rounded-xl border border-gray-200 bg-white p-4 transition hover:border-blue-300 hover:bg-blue-50/30"
          >
            <p className="text-sm font-semibold text-gray-900">
              광고 전후 상세
            </p>
            <p className="mt-1 text-xs leading-relaxed text-gray-500">
              클릭·광고비 등 세부 지표를 직접 비교합니다.
            </p>
          </Link>

          <Link
            href="/landing/before-after"
            className="rounded-xl border border-gray-200 bg-white p-4 transition hover:border-blue-300 hover:bg-blue-50/30"
          >
            <p className="text-sm font-semibold text-gray-900">
              랜딩 전후 상세
            </p>
            <p className="mt-1 text-xs leading-relaxed text-gray-500">
              랜딩 수정 전후의 유입과 문의 변화를 비교합니다.
            </p>
          </Link>

          <Link
            href="/change-history/budget-changes"
            className="rounded-xl border border-gray-200 bg-white p-4 transition hover:border-blue-300 hover:bg-blue-50/30"
          >
            <p className="text-sm font-semibold text-gray-900">
              예산 변경
            </p>
            <p className="mt-1 text-xs leading-relaxed text-gray-500">
              언제 광고 예산을 조정했는지 확인합니다.
            </p>
          </Link>
        </div>
      </section>
    </>
  );
}
