import { Send } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";

export default function TelegramReportsPage() {
  return (
    <>
      <PageHeader
        title="텔레그램"
        description="텔레그램 봇을 통한 리포트 발송 내역을 확인하고 미리 봅니다."
      />
      <EmptyState
        icon={Send}
        title="아직 데이터가 없습니다."
        description="설정 → 텔레그램에서 봇 토큰과 채팅방을 연동하면 리포트 발송을 사용할 수 있습니다."
      />
    </>
  );
}
