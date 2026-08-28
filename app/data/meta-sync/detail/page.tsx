import Link from "next/link";
import { Mail, Settings2 } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import {
  StatusBadge,
  type StatusVariant,
} from "@/components/ui/status-badge";
import { SyncStatusCard } from "@/components/ui/sync-status-card";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/ui/data-table";

import { SyncNowButton } from "@/components/meta-sync/sync-now-button";
import { TestConnectionButton } from "@/components/meta-sync/test-connection-button";
import { SyncSettingsForm } from "@/components/meta-sync/sync-settings-form";

import {
  getMetaSyncStatusView,
  type OverallSyncStatus,
} from "@/lib/meta/sync-status";
import { getMetaSyncSettings } from "@/lib/meta/repository";
import { formatKoreanDateTime } from "@/lib/date/kst";
import { SchemaNotReadyError } from "@/lib/meta/schema-not-ready";
import type { MetaImportHistoryRecord } from "@/lib/meta/types";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<
  OverallSyncStatus,
  { label: string; variant: StatusVariant }
> = {
  ok: {
    label: "정상",
    variant: "success",
  },
  connection_required: {
    label: "연결 필요",
    variant: "warning",
  },
  last_sync_failed: {
    label: "최근 수집 실패",
    variant: "danger",
  },
  no_new_reports: {
    label: "새 보고서 없음",
    variant: "info",
  },
  not_yet_run: {
    label: "아직 실행 전",
    variant: "neutral",
  },
};

const IMPORT_STATUS_LABELS: Record<
  string,
  { label: string; variant: StatusVariant }
> = {
  success: {
    label: "성공",
    variant: "success",
  },
  partial: {
    label: "일부 성공",
    variant: "info",
  },
  failed: {
    label: "실패",
    variant: "danger",
  },
  duplicate: {
    label: "중복",
    variant: "neutral",
  },
  unsupported: {
    label: "지원하지 않는 형식",
    variant: "warning",
  },
  no_new_reports: {
    label: "새 보고서 없음",
    variant: "neutral",
  },
};

const SOURCE_LABELS: Record<string, string> = {
  manual: "수동 업로드",
  gmail: "Gmail 자동 수집",
};

function formatOrDash(value: string | null): string {
  return value ? formatKoreanDateTime(value) : "—";
}

interface MetaSyncPageProps {
  searchParams: Promise<{
    gmailConnected?: string;
    gmailError?: string;
  }>;
}

export default async function MetaSyncDetailPage({
  searchParams,
}: MetaSyncPageProps) {
  const params = await searchParams;

  let status;
  let settings;

  try {
    [status, settings] = await Promise.all([
      getMetaSyncStatusView(),
      getMetaSyncSettings(),
    ]);
  } catch (err) {
    if (err instanceof SchemaNotReadyError) {
      return (
        <>
          <PageHeader
            title="Meta 자동 수집"
            description="Meta Ads Manager 예약 보고서를 Gmail에서 자동으로 수집해 저장합니다."
          />

          <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {err.message}
          </div>
        </>
      );
    }

    throw err;
  }

  const overall = STATUS_LABELS[status.overallStatus];

  const historyColumns: DataTableColumn<MetaImportHistoryRecord>[] = [
    {
      key: "processed_at",
      header: "처리 시간",
      render: (row) => formatKoreanDateTime(row.processed_at),
    },
    {
      key: "source_type",
      header: "출처",
      render: (row) =>
        SOURCE_LABELS[row.source_type] ?? row.source_type,
    },
    {
      key: "file_name",
      header: "파일명",
      render: (row) => row.file_name ?? "—",
    },
    {
      key: "status",
      header: "상태",
      render: (row) => {
        const s =
          IMPORT_STATUS_LABELS[row.status] ?? {
            label: row.status,
            variant: "neutral" as StatusVariant,
          };

        return (
          <StatusBadge
            label={s.label}
            variant={s.variant}
          />
        );
      },
    },
    {
      key: "row_count",
      header: "처리 행",
      align: "right",
    },
    {
      key: "inserted_count",
      header: "신규",
      align: "right",
    },
    {
      key: "updated_count",
      header: "업데이트",
      align: "right",
    },
  ];

  return (
    <>
      <PageHeader
        title="Meta 자동 수집"
        description="Meta Ads Manager 예약 보고서를 Gmail에서 자동으로 수집해 저장합니다."
        actions={
          <div className="flex items-center gap-2">
            <a
              href="#collection-settings"
              className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              <Settings2
                className="h-3.5 w-3.5"
                strokeWidth={2}
              />
              수집 설정
            </a>

            <TestConnectionButton />
            <SyncNowButton />
          </div>
        }
      />

      {params.gmailConnected ? (
        <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          Gmail 연결이 완료되었습니다.
        </div>
      ) : null}

      {params.gmailError ? (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Gmail 연결에 실패했습니다: {params.gmailError}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <SyncStatusCard
          title="Meta"
          lastSyncLabel={formatOrDash(status.lastSyncAt)}
          statusLabel={overall.label}
          statusVariant={overall.variant}
          latestDataDateLabel={
            status.latestDataDate ?? "—"
          }
        />

        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-500">
              Gmail 연결 상태
            </p>

            <StatusBadge
              label={
                status.gmailConnected
                  ? "연결됨"
                  : "연결 필요"
              }
              variant={
                status.gmailConnected
                  ? "success"
                  : "warning"
              }
            />
          </div>

          <p className="mt-2 text-base font-semibold text-gray-900">
            {status.gmailConnected
              ? status.gmailEmail ?? "연결된 계정"
              : "Gmail 연결이 필요합니다."}
          </p>

          {!status.gmailConnected ? (
            <Link
              href="/api/auth/gmail/start"
              className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              <Mail
                className="h-3.5 w-3.5"
                strokeWidth={2}
              />
              Gmail 연결
            </Link>
          ) : null}
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <p className="text-sm font-medium text-gray-500">
            오늘 수집 건수
          </p>

          <p className="mt-2 text-2xl font-semibold text-gray-900">
            {status.todayCount}건
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <p className="text-sm font-medium text-gray-500">
            마지막 수집 시간
          </p>
          <p className="mt-2 text-sm font-semibold text-gray-900">
            {formatOrDash(status.lastSyncAt)}
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <p className="text-sm font-medium text-gray-500">
            마지막 성공 시간
          </p>
          <p className="mt-2 text-sm font-semibold text-gray-900">
            {formatOrDash(status.lastSuccessAt)}
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <p className="text-sm font-medium text-gray-500">
            마지막 처리 파일
          </p>
          <p className="mt-2 truncate text-sm font-semibold text-gray-900">
            {status.lastFile ?? "—"}
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <p className="text-sm font-medium text-gray-500">
            마지막 처리 행
          </p>
          <p className="mt-2 text-sm font-semibold text-gray-900">
            {status.lastRowCount !== null
              ? `${status.lastRowCount}행`
              : "—"}
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-5 sm:col-span-2 lg:col-span-1">
          <p className="text-sm font-medium text-gray-500">
            마지막 오류
          </p>
          <p className="mt-2 text-sm font-semibold text-gray-900">
            {status.lastError ?? "없음"}
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-md border border-gray-200 bg-white px-4 py-3 text-sm text-gray-600">
        자동 수집에 문제가 있을 경우{" "}
        <Link
          href="/data/meta-csv-upload"
          className="font-medium text-blue-600 hover:underline"
        >
          Meta CSV 수동 업로드
        </Link>
        를 사용할 수 있습니다.
      </div>

      <div className="mt-6">
        <DataTable
          title="최근 처리 내역"
          columns={historyColumns}
          data={status.recentHistory}
          getRowKey={(row) => row.id}
          emptyMessage="아직 처리 내역이 없습니다."
        />
      </div>

      <div
        id="collection-settings"
        className="mt-6 rounded-lg border border-gray-200 bg-white p-5"
      >
        <h3 className="text-sm font-semibold text-gray-900">
          수집 설정
        </h3>

        <p className="mt-1 text-xs text-gray-500">
          이메일 제목, 검색 기간, 첨부파일 형식과 자동 수집 여부를 설정합니다.
        </p>

        <div className="mt-4">
          <SyncSettingsForm settings={settings} />
        </div>
      </div>
    </>
  );
}
