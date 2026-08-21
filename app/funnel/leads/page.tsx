import { Users } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";

export default function LeadsPage() {
  return (
    <>
      <PageHeader
        title="DB 분석"
        description="리드(DB) 유입량, 유입 경로, DB 품질을 확인합니다."
      />
      <EmptyState
        icon={Users}
        title="아직 데이터가 없습니다."
        description="리드 데이터 소스가 연동되면 여기에 표시됩니다."
      />
    </>
  );
}
