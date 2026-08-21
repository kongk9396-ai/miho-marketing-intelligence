import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { UploadForm } from "@/components/meta-upload/upload-form";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { StatusBadge, type StatusVariant } from "@/components/ui/status-badge";
import { getLatestImportHistory } from "@/lib/meta/repository";
import { formatKoreanDateTime } from "@/lib/date/kst";
import { SchemaNotReadyError } from "@/lib/meta/schema-not-ready";
import type { MetaImportHistoryRecord } from "@/lib/meta/types";

export const dynamic = "force-dynamic";

const IMPORT_STATUS_LABELS: Record<string, { label: string; variant: StatusVariant }> = {
  success: { label: "성공", variant: "success" },
  partial: { label: "일부 성공", variant: "info" },
  failed: { label: "실패", variant: "danger" },
  duplicate: { label: "중복", variant: "neutral" },
  unsupported: { label: "미지원 형식", variant: "warning" },
};

export default async function MetaCsvUploadPage() {
  let history: MetaImportHistoryRecord[];
  try {
    history = await getLatestImportHistory(50);
  } catch (err) {
    if (err instanceof SchemaNotReadyError) {
      return (
        <>
          <PageHeader
            title="Meta CSV 업로드"
            description="Meta 광고관리자에서 내보낸 CSV 또는 XLSX 파일을 수동으로 업로드합니다."
          />
          <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {err.message}
          </div>
        </>
      );
    }
    throw err;
  }

  const manualHistory = history.filter((row) => row.source_type === "manual");

  const columns: DataTableColumn<MetaImportHistoryRecord>[] = [
    { key: "processed_at", header: "처리 시간", render: (row) => formatKoreanDateTime(row.processed_at) },
    { key: "file_name", header: "파일명", render: (row) => row.file_name ?? "—" },
    {
      key: "status",
      header: "상태",
      render: (row) => {
        const s = IMPORT_STATUS_LABELS[row.status] ?? { label: row.status, variant: "neutral" as StatusVariant };
        return <StatusBadge label={s.label} variant={s.variant} />;
      },
    },
    { key: "row_count", header: "전체 행", align: "right" },
    { key: "inserted_count", header: "신규", align: "right" },
    { key: "updated_count", header: "업데이트", align: "right" },
    { key: "skipped_count", header: "건너뜀", align: "right" },
  ];

  return (
    <>
      <PageHeader
        title="Meta CSV 업로드"
        description="Meta 광고관리자에서 내보낸 CSV 또는 XLSX 파일을 수동으로 업로드합니다."
      />

      <div className="mb-4 rounded-md border border-gray-200 bg-white px-4 py-3 text-sm text-gray-600">
        평소에는{" "}
        <Link href="/data/meta-sync" className="font-medium text-blue-600 hover:underline">
          Meta 자동 수집
        </Link>
        이 이메일에서 자동으로 보고서를 가져옵니다. 이 업로드 기능은 자동 수집에 문제가 있을 때 사용하는
        대체 수단입니다.
      </div>

      <UploadForm />

      <div className="mt-6">
        <DataTable
          title="수동 업로드 내역"
          columns={columns}
          data={manualHistory}
          getRowKey={(row) => row.id}
          emptyMessage="아직 업로드한 파일이 없습니다."
        />
      </div>
    </>
  );
}
