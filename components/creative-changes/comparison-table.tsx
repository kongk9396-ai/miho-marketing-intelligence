import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { StatusBadge, type StatusVariant } from "@/components/ui/status-badge";
import type { MetricComparisonRow, MetricSection } from "@/lib/creative-changes/types";

interface ComparisonTableProps {
  rows: MetricComparisonRow[];
}

const SECTION_TITLES: Record<MetricSection, string> = {
  delivery: "광고 전달",
  click: "클릭",
  video: "영상",
};

const SECTION_ORDER: MetricSection[] = ["delivery", "click", "video"];

const STATUS_VARIANT: Record<MetricComparisonRow["status"], StatusVariant> = {
  improved: "success",
  worsened: "danger",
  flat: "neutral",
  unavailable: "neutral",
};

const columns: DataTableColumn<MetricComparisonRow>[] = [
  { key: "label", header: "지표" },
  { key: "beforeDisplay", header: "변경 전", align: "right" },
  { key: "afterDisplay", header: "변경 후", align: "right" },
  { key: "diffDisplay", header: "차이", align: "right" },
  { key: "changePercentDisplay", header: "변화율", align: "right" },
  {
    key: "status",
    header: "상태",
    render: (row) => <StatusBadge label={row.statusLabel} variant={STATUS_VARIANT[row.status]} />,
  },
];

export function ComparisonTable({ rows }: ComparisonTableProps) {
  return (
    <div className="space-y-4">
      {SECTION_ORDER.map((section) => {
        const sectionRows = rows.filter((row) => row.section === section);
        if (sectionRows.length === 0) return null;
        return (
          <DataTable
            key={section}
            title={SECTION_TITLES[section]}
            columns={columns}
            data={sectionRows}
            getRowKey={(row) => row.key}
          />
        );
      })}
    </div>
  );
}
