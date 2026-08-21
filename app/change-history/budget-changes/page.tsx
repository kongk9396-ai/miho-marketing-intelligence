import { Wallet } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";

export default function BudgetChangesPage() {
  return (
    <>
      <PageHeader
        title="예산 변경"
        description="예산 조정 이력과 그에 따른 성과 변화를 확인합니다."
      />
      <EmptyState
        icon={Wallet}
        title="아직 데이터가 없습니다."
        description="변경 이력 기록이 활성화되면 예산 변경 이벤트가 여기에 표시됩니다."
      />
    </>
  );
}
