import { Settings } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";

export default function GeneralSettingsPage() {
  return (
    <>
      <PageHeader
        title="기본 설정"
        description="워크스페이스 및 계정 관련 기본 설정입니다."
      />
      <EmptyState
        icon={Settings}
        title="아직 데이터가 없습니다."
        description="기본 설정 항목은 다음 단계에서 제공될 예정입니다."
      />
    </>
  );
}
