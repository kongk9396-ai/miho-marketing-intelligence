import { CalendarCheck } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";

export default function ConsultationBookingPage() {
  return (
    <>
      <PageHeader
        title="상담 / 예약"
        description="퍼널 단계별 상담 요청 및 예약 전환 현황입니다."
      />
      <EmptyState
        icon={CalendarCheck}
        title="아직 데이터가 없습니다."
        description="데이터가 연동되면 상담/예약 기록이 여기에 표시됩니다."
      />
    </>
  );
}
