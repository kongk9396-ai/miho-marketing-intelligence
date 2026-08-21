import { Megaphone } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";

export default function CampaignsPage() {
  return (
    <>
      <PageHeader
        title="캠페인"
        description="캠페인별 광고비, 노출, 성과 지표를 확인합니다."
      />
      <EmptyState
        icon={Megaphone}
        title="아직 데이터가 없습니다."
        description="Meta CSV를 업로드하면 캠페인 데이터가 여기에 표시됩니다."
      />
    </>
  );
}
