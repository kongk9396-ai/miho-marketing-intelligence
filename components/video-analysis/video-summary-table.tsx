import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import type { VideoAdSummary } from "@/lib/video-analysis/summary";
import type { RetentionRate } from "@/lib/creative-changes/types";

interface VideoSummaryTableProps {
  ads: VideoAdSummary[];
}

function formatWon(value: number | null): string {
  return value === null ? "—" : `₩${Math.round(value).toLocaleString("ko-KR")}`;
}

function formatCount(value: number): string {
  return Math.round(value).toLocaleString("ko-KR");
}

function formatPercent(value: number | null, digits = 2): string {
  return value === null ? "—" : `${value.toFixed(digits)}%`;
}

function formatRetention(retention: RetentionRate): string {
  if (retention.rate === null) return "—";
  const suffix = retention.reliable ? "" : " (표본 부족)";
  return `${retention.rate.toFixed(1)}%${suffix}`;
}

const columns: DataTableColumn<VideoAdSummary>[] = [
  { key: "adName", header: "광고명", render: (row) => row.adName ?? row.adId },
  { key: "spend", header: "총 광고비", align: "right", render: (row) => formatWon(row.metrics.totalSpend) },
  { key: "plays", header: "총 재생", align: "right", render: (row) => formatCount(row.metrics.totalVideoPlays) },
  {
    key: "avgWatchTime",
    header: "평균 시청시간",
    align: "right",
    render: (row) => (row.metrics.avgWatchTime === null ? "—" : `${row.metrics.avgWatchTime.toFixed(1)}초`),
  },
  { key: "video3s", header: "3초", align: "right", render: (row) => formatRetention(row.metrics.video3s) },
  { key: "video25", header: "25%", align: "right", render: (row) => formatRetention(row.metrics.video25) },
  { key: "video50", header: "50%", align: "right", render: (row) => formatRetention(row.metrics.video50) },
  { key: "video75", header: "75%", align: "right", render: (row) => formatRetention(row.metrics.video75) },
  { key: "video95", header: "95%", align: "right", render: (row) => formatRetention(row.metrics.video95) },
  { key: "video100", header: "100%", align: "right", render: (row) => formatRetention(row.metrics.video100) },
  { key: "ctr", header: "CTR", align: "right", render: (row) => formatPercent(row.metrics.ctr) },
  { key: "cpc", header: "CPC", align: "right", render: (row) => formatWon(row.metrics.cpc) },
];

export function VideoSummaryTable({ ads }: VideoSummaryTableProps) {
  return (
    <DataTable title="광고별 영상 성과" columns={columns} data={ads} getRowKey={(row) => row.adId} />
  );
}
