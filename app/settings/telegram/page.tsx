import { Send } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";

export default function TelegramSettingsPage() {
  return (
    <>
      <PageHeader
        title="텔레그램"
        description="리포트 발송에 사용할 텔레그램 봇 토큰과 채팅방을 설정합니다."
      />
      <EmptyState
        icon={Send}
        title="아직 데이터가 없습니다."
        description="텔레그램 봇 연동 설정은 다음 단계에서 제공될 예정입니다."
      />
    </>
  );
}
