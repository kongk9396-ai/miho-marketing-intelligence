import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import type { CombinedAdSummary } from "@/lib/combined-analysis/types";

function formatPercent(value: number | null, digits = 2): string {
  return value === null ? "—" : `${value.toFixed(digits)}%`;
}

function formatWon(value: number | null): string {
  return value === null ? "—" : `₩${Math.round(value).toLocaleString("ko-KR")}`;
}

interface CombinedAdTableProps {
  summaries: CombinedAdSummary[];
}

const columns: DataTableColumn<CombinedAdSummary>[] = [
  {
    key: "ad",
    header: "광고",
    render: (row) => (
      <div>
        <p className="font-medium text-gray-900">{row.adName ?? row.adId}</p>
        <p className="text-xs text-gray-400">{row.campaignName ?? "—"}</p>
      </div>
    ),
  },
  { key: "ctr", header: "CTR", align: "right", render: (row) => formatPercent(row.meta.ctr) },
  { key: "cpc", header: "CPC", align: "right", render: (row) => formatWon(row.meta.cpc) },
  {
    key: "sessions",
    header: "랜딩 세션",
    align: "right",
    render: (row) => (row.ga4 ? row.ga4.sessions.toLocaleString("ko-KR") : "—"),
  },
  {
    key: "ctaRate",
    header: "CTA율",
    align: "right",
    render: (row) => (row.ga4 ? formatPercent(row.ga4.ctaRate, 1) : "—"),
  },
  {
    key: "formStartRate",
    header: "폼 시작률",
    align: "right",
    render: (row) => (row.ga4 ? formatPercent(row.ga4.formStartRate, 1) : "—"),
  },
  {
    key: "formCompletes",
    header: "폼 완료",
    align: "right",
    render: (row) => (row.ga4 ? row.ga4.formCompletes.toLocaleString("ko-KR") : "—"),
  },
];

export function CombinedAdTable({ summaries }: CombinedAdTableProps) {
  return (
    <DataTable
      title="광고별 결합 분석 (Meta + GA4, 최근 30일)"
      columns={columns}
      data={summaries}
      getRowKey={(row) => row.adId}
      emptyMessage="아직 데이터가 없습니다."
    />
  );
}
