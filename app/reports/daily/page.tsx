import { FileText } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";

export default function DailyReportsPage() {
  return (
    <>
      <PageHeader
        title="일일 리포트"
        description="자동 생성된 일일 성과 요약입니다."
      />
      <EmptyState
        icon={FileText}
        title="아직 데이터가 없습니다."
        description="리포트 생성이 설정되면 일일 리포트가 여기에 표시됩니다."
      />
    </>
  );
}
