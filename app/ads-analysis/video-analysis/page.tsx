import { Video } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";

export default function VideoAnalysisPage() {
  return (
    <>
      <PageHeader
        title="영상 분석"
        description="영상 소재의 시청 시간, 후킹률, 완료율 등을 분석합니다."
      />
      <EmptyState
        icon={Video}
        title="아직 데이터가 없습니다."
        description="광고 데이터를 업로드하면 영상 성과 지표가 여기에 표시됩니다."
      />
    </>
  );
}
