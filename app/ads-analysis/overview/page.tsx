import { ChartLine } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";

export default function AdsOverviewPage() {
  return (
    <>
      <PageHeader
        title="전체 성과"
        description="모든 Meta 광고 계정과 캠페인의 성과를 종합적으로 보여줍니다."
      />
      <EmptyState
        icon={ChartLine}
        title="아직 데이터가 없습니다."
        description="데이터 → Meta CSV 업로드에서 광고 데이터를 업로드하면 여기에 표시됩니다."
      />
    </>
  );
}
