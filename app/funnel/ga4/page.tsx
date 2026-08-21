import { Globe } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";

export default function Ga4Page() {
  return (
    <>
      <PageHeader
        title="GA4"
        description="Google Analytics 4의 웹사이트 트래픽 및 행동 데이터입니다."
      />
      <EmptyState
        icon={Globe}
        title="아직 데이터가 없습니다."
        description="GA4 데이터 소스가 연동되면 여기에 표시됩니다."
      />
    </>
  );
}
