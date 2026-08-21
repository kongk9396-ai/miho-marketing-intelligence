import { PlugZap, RefreshCw, Settings2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge, type StatusVariant } from "@/components/ui/status-badge";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { ActionButton } from "@/components/ui/action-button";
import { SheetConfigForm } from "@/components/leads-sync/sheet-config-form";
import { SheetConfigList } from "@/components/leads-sync/sheet-config-list";
import { getLeadsSyncStatusView } from "@/lib/leads-sync/sync-status";
import { formatKoreanDateTime } from "@/lib/date/kst";
import { runManualLeadsSyncAction, testSheetsConnectionAction } from "@/app/data/leads-sync/actions";
import { SchemaNotReadyError } from "@/lib/meta/schema-not-ready";
import type { LeadsSyncHistoryRecord } from "@/lib/leads-sync/types";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<"success" | "partial" | "failed", { label: string; variant: StatusVariant }> = {
  success: { label: "성공", variant: "success" },
  partial: { label: "일부 성공", variant: "warning" },
  failed: { label: "실패", variant: "danger" },
};

function formatOrDash(value: string | null): string {
  return value ? formatKoreanDateTime(value) : "—";
}

export default async function LeadsSyncPage() {
  let status;
  try {
    status = await getLeadsSyncStatusView();
  } catch (err) {
    if (err instanceof SchemaNotReadyError) {
      return (
        <>
          <PageHeader title="DB 자동 동기화" description="Google Sheet의 상담/예약 신청 데이터를 자동으로 동기화합니다." />
          <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {err.message}
          </div>
        </>
      );
    }
    throw err;
  }

  const overall: { label: string; variant: StatusVariant } = !status.configured
    ? { label: "환경변수 미설정", variant: "warning" }
    : status.lastSyncStatus === "failed"
      ? { label: "마지막 동기화 실패", variant: "danger" }
      : status.lastSyncStatus === "partial"
        ? { label: "일부 성공", variant: "warning" }
        : status.lastSyncStatus === "success"
          ? { label: "정상", variant: "success" }
          : { label: "아직 실행되지 않음", variant: "neutral" };

  const historyColumns: DataTableColumn<LeadsSyncHistoryRecord>[] = [
    { key: "processed_at", header: "처리 시간", render: (row) => formatKoreanDateTime(row.processed_at) },
    {
      key: "status",
      header: "상태",
      render: (row) => {
        const s = STATUS_LABELS[row.status];
        return <StatusBadge label={s.label} variant={s.variant} />;
      },
    },
    { key: "row_count", header: "처리 행 수", align: "right" },
    { key: "inserted_count", header: "신규", align: "right" },
    { key: "updated_count", header: "업데이트", align: "right" },
    { key: "skipped_count", header: "건너뜀", align: "right" },
    { key: "error_count", header: "오류", align: "right" },
  ];

  return (
    <>
      <PageHeader
        title="DB 자동 동기화"
        description="Google Sheet의 상담/예약 신청 데이터를 자동으로 동기화합니다."
        actions={
          <div className="flex items-center gap-2">
            <a
              href="#sheet-settings"
              className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              <Settings2 className="h-3.5 w-3.5" strokeWidth={2} />
              매핑 설정
            </a>
            <ActionButton label="연결 테스트" icon={<PlugZap strokeWidth={2} />} action={testSheetsConnectionAction} />
            <ActionButton
              label="지금 동기화"
              pendingLabel="동기화 중..."
              icon={<RefreshCw strokeWidth={2} />}
              variant="primary"
              action={runManualLeadsSyncAction}
            />
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-500">Google Sheet 연결 상태</p>
            <StatusBadge label={overall.label} variant={overall.variant} />
          </div>
          <p className="mt-2 text-sm font-semibold text-gray-900">
            {status.configured ? "환경변수가 설정되어 있습니다." : "환경변수가 설정되지 않았습니다."}
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <p className="text-sm font-medium text-gray-500">마지막 동기화 시간</p>
          <p className="mt-2 text-sm font-semibold text-gray-900">{formatOrDash(status.lastSyncAt)}</p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <p className="text-sm font-medium text-gray-500">마지막 성공 시간</p>
          <p className="mt-2 text-sm font-semibold text-gray-900">
            {formatOrDash(status.recentHistory.find((h) => h.status !== "failed")?.processed_at ?? null)}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <p className="text-sm font-medium text-gray-500">마지막 처리 행 수</p>
          <p className="mt-2 text-sm font-semibold text-gray-900">
            {status.lastRowCount !== null ? `${status.lastRowCount}행` : "—"}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <p className="text-sm font-medium text-gray-500">신규 / 업데이트 / 건너뜀 / 오류</p>
          <p className="mt-2 text-sm font-semibold text-gray-900">
            {status.lastInserted ?? 0} / {status.lastUpdated ?? 0} / {status.lastSkipped ?? 0} / {status.lastErrorCount ?? 0}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <p className="text-sm font-medium text-gray-500">최근 데이터 일시</p>
          <p className="mt-2 text-sm font-semibold text-gray-900">{formatOrDash(status.latestDataAt)}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <p className="text-sm font-medium text-gray-500">마지막 오류</p>
          <p className="mt-2 text-sm font-semibold text-gray-900">{status.lastError ?? "없음"}</p>
        </div>
      </div>

      <div className="mt-6">
        <DataTable
          title="최근 동기화 이력"
          columns={historyColumns}
          data={status.recentHistory}
          getRowKey={(row) => row.id}
          emptyMessage="아직 동기화 이력이 없습니다."
        />
      </div>

      <div id="sheet-settings" className="mt-6 rounded-lg border border-gray-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-gray-900">매핑 설정</h3>
        <p className="mt-1 text-xs text-gray-500">
          동기화할 Google Sheet 탭과, 자동 인식이 실패할 경우의 컬럼 매핑을 설정합니다.
        </p>

        <div className="mt-4">
          <SheetConfigList configs={status.sheetConfigs} />
        </div>

        <div className="mt-6 border-t border-gray-100 pt-4">
          <p className="text-sm font-medium text-gray-700">시트 추가 / 수정</p>
          <div className="mt-3">
            <SheetConfigForm />
          </div>
        </div>
      </div>
    </>
  );
}
