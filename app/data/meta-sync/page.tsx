import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import { getMetaSyncStatusView } from "@/lib/meta/sync-status";
import { getGa4SyncStatusView } from "@/lib/ga4/sync-status";
import { getLeadsSyncStatusView } from "@/lib/leads-sync/sync-status";
import { formatKoreanDateTime } from "@/lib/date/kst";
import { SchemaNotReadyError } from "@/lib/meta/schema-not-ready";

export const dynamic = "force-dynamic";

type StatusTone = "success" | "warning" | "danger" | "neutral";

interface StatusInfo {
  label: string;
  tone: StatusTone;
}

function formatDateTime(value: string | null | undefined) {
  return value ? formatKoreanDateTime(value) : "아직 없음";
}

function statusClasses(tone: StatusTone) {
  switch (tone) {
    case "success":
      return "bg-green-100 text-green-700";
    case "warning":
      return "bg-amber-100 text-amber-700";
    case "danger":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-600";
  }
}

function metaStatus(value: string): StatusInfo {
  switch (value) {
    case "ok":
      return { label: "정상", tone: "success" };
    case "connection_required":
      return { label: "연결 필요", tone: "warning" };
    case "last_sync_failed":
      return { label: "최근 수집 실패", tone: "danger" };
    case "no_new_reports":
      return { label: "새 보고서 없음", tone: "warning" };
    default:
      return { label: "아직 실행 전", tone: "neutral" };
  }
}

function syncStatus(
  configured: boolean,
  lastSyncStatus: string | null | undefined
): StatusInfo {
  if (!configured) {
    return {
      label: "설정 필요",
      tone: "warning",
    };
  }

  if (lastSyncStatus === "failed") {
    return {
      label: "최근 동기화 실패",
      tone: "danger",
    };
  }

  if (lastSyncStatus === "partial") {
    return {
      label: "일부 성공",
      tone: "warning",
    };
  }

  if (lastSyncStatus === "success") {
    return {
      label: "정상",
      tone: "success",
    };
  }

  return {
    label: "아직 실행 전",
    tone: "neutral",
  };
}

function SourceStatusCard({
  title,
  description,
  status,
  lastSync,
  latestData,
  error,
  href,
  linkLabel,
}: {
  title: string;
  description: string;
  status: StatusInfo;
  lastSync: string;
  latestData: string;
  error?: string | null;
  href: string;
  linkLabel: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-950">
            {title}
          </h3>

          <p className="mt-1 text-xs leading-relaxed text-gray-500">
            {description}
          </p>
        </div>

        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${statusClasses(
            status.tone
          )}`}
        >
          {status.label}
        </span>
      </div>

      <div className="mt-4 space-y-2 rounded-lg bg-gray-50 p-3">
        <div className="flex items-center justify-between gap-3 text-xs">
          <span className="text-gray-500">최근 수집</span>
          <span className="font-medium text-gray-800">
            {lastSync}
          </span>
        </div>

        <div className="flex items-center justify-between gap-3 text-xs">
          <span className="text-gray-500">최근 데이터</span>
          <span className="font-medium text-gray-800">
            {latestData}
          </span>
        </div>
      </div>

      {error ? (
        <div className="mt-3 rounded-lg border border-red-100 bg-red-50 p-3">
          <p className="text-xs font-medium text-red-700">
            최근 오류
          </p>
          <p className="mt-1 break-words text-xs leading-relaxed text-red-600">
            {error}
          </p>
        </div>
      ) : null}

      <Link
        href={href}
        className="mt-4 inline-block text-xs font-medium text-blue-600 hover:underline"
      >
        {linkLabel} →
      </Link>
    </div>
  );
}

export default async function DataManagementHubPage() {
  let meta;
  let ga4;
  let leads;

  try {
    [meta, ga4, leads] = await Promise.all([
      getMetaSyncStatusView(),
      getGa4SyncStatusView(),
      getLeadsSyncStatusView(),
    ]);
  } catch (err) {
    if (err instanceof SchemaNotReadyError) {
      return (
        <>
          <PageHeader
            title="관리"
            description="광고·GA4·DB 데이터 수집과 설정을 관리합니다."
          />

          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {err.message}
          </div>
        </>
      );
    }

    throw err;
  }

  const metaState = metaStatus(meta.overallStatus);

  const ga4State = syncStatus(
    ga4.configured,
    ga4.lastSyncStatus
  );

  const leadsState = syncStatus(
    leads.configured,
    leads.lastSyncStatus
  );

  const hasProblem =
    metaState.tone === "danger" ||
    ga4State.tone === "danger" ||
    leadsState.tone === "danger";

  const needsSetup =
    metaState.tone === "warning" ||
    ga4State.tone === "warning" ||
    leadsState.tone === "warning";

  return (
    <>
      <PageHeader
        title="관리"
        description="데이터가 제대로 들어오고 있는지 한눈에 확인하고, 문제가 있을 때만 상세 설정으로 들어갑니다."
      />

      <section
        className={`rounded-xl border p-4 ${
          hasProblem
            ? "border-red-100 bg-red-50/60"
            : needsSetup
              ? "border-amber-100 bg-amber-50/60"
              : "border-green-100 bg-green-50/60"
        }`}
      >
        <h2 className="text-sm font-semibold text-gray-950">
          데이터 연결 상태
        </h2>

        <p className="mt-2 text-sm leading-relaxed text-gray-700">
          {hasProblem
            ? "최근 수집 과정에서 실패한 데이터 소스가 있습니다. 아래 오류 상태를 먼저 확인하세요."
            : needsSetup
              ? "일부 데이터 소스에서 연결 또는 추가 확인이 필요합니다."
              : "현재 확인된 Meta·GA4·DB 데이터 수집 상태는 정상입니다."}
        </p>
      </section>

      <section className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <SourceStatusCard
          title="Meta 광고"
          description={
            meta.gmailConnected
              ? "Gmail 예약 보고서를 통해 Meta 광고 데이터를 수집하고 있습니다."
              : "Meta 예약 보고서를 수집하려면 Gmail 연결이 필요합니다."
          }
          status={metaState}
          lastSync={formatDateTime(meta.lastSyncAt)}
          latestData={meta.latestDataDate ?? "아직 없음"}
          href="/data/meta-sync/detail"
          linkLabel="Meta 수집 상세"
        />

        <SourceStatusCard
          title="GA4"
          description="랜딩 진입·CTA·폼 시작 등 사이트 행동 데이터를 수집합니다."
          status={ga4State}
          lastSync={formatDateTime(ga4.lastSyncAt)}
          latestData={ga4.latestDataDate ?? "아직 없음"}
          error={ga4.lastError}
          href="/data/ga4-sync"
          linkLabel="GA4 수집 상세"
        />

        <SourceStatusCard
          title="DB"
          description="Google Sheet의 문의·유효 DB·상담·예약 데이터를 동기화합니다."
          status={leadsState}
          lastSync={formatDateTime(leads.lastSyncAt)}
          latestData={formatDateTime(leads.latestDataAt)}
          error={leads.lastError}
          href="/data/leads-sync"
          linkLabel="DB 동기화 상세"
        />
      </section>

      <section className="mt-5">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">
            데이터 관리
          </h2>

          <p className="mt-1 text-xs text-gray-500">
            평소에는 위 상태만 확인하고, 필요한 경우에만 아래 메뉴를 사용하면 됩니다.
          </p>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/data/meta-csv-upload"
            className="rounded-xl border border-gray-200 bg-white p-4 transition hover:border-blue-300 hover:bg-blue-50/30"
          >
            <p className="text-sm font-semibold text-gray-900">
              Meta CSV 업로드
            </p>
            <p className="mt-1 text-xs leading-relaxed text-gray-500">
              자동 수집이 안 될 때 Meta 보고서를 직접 업로드합니다.
            </p>
          </Link>

          <Link
            href="/data/utm-mapping"
            className="rounded-xl border border-gray-200 bg-white p-4 transition hover:border-blue-300 hover:bg-blue-50/30"
          >
            <p className="text-sm font-semibold text-gray-900">
              광고 ↔ DB 연결
            </p>
            <p className="mt-1 text-xs leading-relaxed text-gray-500">
              어떤 광고에서 들어온 DB인지 연결 기준을 관리합니다.
            </p>
          </Link>

          <Link
            href="/settings/database"
            className="rounded-xl border border-gray-200 bg-white p-4 transition hover:border-blue-300 hover:bg-blue-50/30"
          >
            <p className="text-sm font-semibold text-gray-900">
              데이터베이스
            </p>
            <p className="mt-1 text-xs leading-relaxed text-gray-500">
              데이터 저장 및 연결 상태를 확인합니다.
            </p>
          </Link>
        </div>
      </section>

      <section className="mt-5">
        <h2 className="text-sm font-semibold text-gray-900">
          설정
        </h2>

        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Link
            href="/settings/ad-operations"
            className="rounded-xl border border-gray-200 bg-white p-4 transition hover:border-blue-300 hover:bg-blue-50/30"
          >
            <p className="text-sm font-semibold text-gray-900">
              광고 운영 설정
            </p>
            <p className="mt-1 text-xs text-gray-500">
              광고 상태와 운영 판단 기준을 관리합니다.
            </p>
          </Link>

          <Link
            href="/settings/telegram"
            className="rounded-xl border border-gray-200 bg-white p-4 transition hover:border-blue-300 hover:bg-blue-50/30"
          >
            <p className="text-sm font-semibold text-gray-900">
              텔레그램
            </p>
            <p className="mt-1 text-xs text-gray-500">
              리포트 및 알림 발송을 관리합니다.
            </p>
          </Link>

          <Link
            href="/settings/general"
            className="rounded-xl border border-gray-200 bg-white p-4 transition hover:border-blue-300 hover:bg-blue-50/30"
          >
            <p className="text-sm font-semibold text-gray-900">
              기본 설정
            </p>
            <p className="mt-1 text-xs text-gray-500">
              시스템 공통 설정을 관리합니다.
            </p>
          </Link>
        </div>
      </section>
    </>
  );
}

