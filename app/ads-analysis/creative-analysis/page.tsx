import { Image as ImageIcon } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";

export default function CreativeAnalysisPage() {
  return (
    <>
      <PageHeader
        title="소재 분석"
        description="이미지, 카피, 포맷 등 소재별 성과를 분석합니다."
      />
      <EmptyState
        icon={ImageIcon}
        title="아직 데이터가 없습니다."
        description="광고 데이터를 업로드하면 소재별 성과 지표가 여기에 표시됩니다."
      />
    </>
  );
}
