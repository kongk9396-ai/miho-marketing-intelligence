import { PlugZap, RefreshCw } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import {
  StatusBadge,
  type StatusVariant,
} from "@/components/ui/status-badge";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/ui/data-table";
import { ActionButton } from "@/components/ui/action-button";

import { getGa4SyncStatusView } from "@/lib/ga4/sync-status";
import { formatKoreanDateTime } from "@/lib/date/kst";
import {
  runManualGa4SyncAction,
  testGa4ConnectionAction,
} from "@/app/data/ga4-sync/actions";
import { SchemaNotReadyError } from "@/lib/meta/schema-not-ready";
import type { Ga4SyncHistoryRecord } from "@/lib/ga4/repository";

export const dynamic = "force-dynamic";

function formatOrDash(value: string | null): string {
  return value ? formatKoreanDateTime(value) : "—";
}

export default async function Ga4SyncPage() {
  let status;

  try {
    status = await getGa4SyncStatusView();
  } catch (err) {
    if (err instanceof SchemaNotReadyError) {
      return (
        <>
          <PageHeader
            title="GA4 자동 수집"
            description="Google Analytics 4 데이터를 자동으로 수집해 저장합니다."
          />

          <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {err.message}
          </div>
        </>
      );
    }

    throw err;
  }

  const overall: {
    label: string;
    variant: StatusVariant;
  } = !status.configured
    ? {
        label: "설정 필요",
        variant: "warning",
      }
    : status.lastSyncStatus === "failed"
      ? {
          label: "최근 동기화 실패",
          variant: "danger",
        }
      : status.lastSyncStatus === "success"
        ? {
            label: "정상",
            variant: "success",
          }
        : {
            label: "아직 실행 전",
            variant: "neutral",
          };

  const historyColumns: DataTableColumn<Ga4SyncHistoryRecord>[] = [
    {
      key: "processed_at",
      header: "처리 시간",
      render: (row) =>
        formatKoreanDateTime(row.processed_at),
    },
    {
      key: "sync_date",
      header: "수집 대상 날짜",
      render: (row) => row.sync_date ?? "—",
    },
    {
      key: "status",
      header: "상태",
      render: (row) => (
        <StatusBadge
          label={
            row.status === "success"
              ? "성공"
              : "실패"
          }
          variant={
            row.status === "success"
              ? "success"
              : "danger"
          }
        />
      ),
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
        title="GA4 자동 수집"
        description="Google Analytics 4 데이터를 자동으로 수집해 저장합니다."
        actions={
          <div className="flex items-center gap-2">
            <ActionButton
              label="GA4 연결 테스트"
              icon={<PlugZap strokeWidth={2} />}
              action={testGa4ConnectionAction}
            />

            <ActionButton
              label="지금 동기화"
              pendingLabel="동기화 중..."
              icon={<RefreshCw strokeWidth={2} />}
              variant="primary"
              action={runManualGa4SyncAction}
            />
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-500">
              GA4 연결 상태
            </p>

            <StatusBadge
              label={overall.label}
              variant={overall.variant}
            />
          </div>

          <p className="mt-2 text-sm font-semibold text-gray-900">
            {status.configured
              ? "환경변수가 설정되어 있습니다."
              : "GA4 환경변수 설정이 필요합니다."}
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <p className="text-sm font-medium text-gray-500">
            속성 ID
          </p>
          <p className="mt-2 text-sm font-semibold text-gray-900">
            {status.propertyId ?? "—"}
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <p className="text-sm font-medium text-gray-500">
            마지막 동기화
          </p>
          <p className="mt-2 text-sm font-semibold text-gray-900">
            {formatOrDash(status.lastSyncAt)}
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <p className="text-sm font-medium text-gray-500">
            최근 데이터 날짜
          </p>
          <p className="mt-2 text-sm font-semibold text-gray-900">
            {status.latestDataDate ?? "—"}
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <p className="text-sm font-medium text-gray-500">
            최근 7일 수집 행
          </p>
          <p className="mt-2 text-sm font-semibold text-gray-900">
            {status.recent7DayRowCount}행
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <p className="text-sm font-medium text-gray-500">
            마지막 오류
          </p>
          <p className="mt-2 text-sm font-semibold text-gray-900">
            {status.lastError ?? "없음"}
          </p>
        </div>
      </div>

      <div className="mt-6">
        <DataTable
          title="최근 동기화 내역"
          columns={historyColumns}
          data={status.recentHistory}
          getRowKey={(row) => row.id}
          emptyMessage="아직 동기화 내역이 없습니다."
        />
      </div>
    </>
  );
}
