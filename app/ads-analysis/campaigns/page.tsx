import { Megaphone } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { CampaignDiagnosisSection } from "@/components/ad-diagnosis/campaign-diagnosis-section";
import { buildAdDiagnosisGroups } from "@/lib/ad-diagnosis/build";
import { SchemaNotReadyError } from "@/lib/meta/schema-not-ready";

export const dynamic = "force-dynamic";

export default async function CampaignsPage() {
  const header = (
    <PageHeader
      title="캠페인"
      description="캠페인별 광고비, 노출, 성과 지표와 Meta+GA4 결합 자동 진단을 확인합니다."
    />
  );

  let groups;
  try {
    groups = await buildAdDiagnosisGroups();
  } catch (err) {
    if (err instanceof SchemaNotReadyError) {
      return (
        <>
          {header}
          <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {err.message}
          </div>
        </>
      );
    }
    throw err;
  }

  return (
    <>
      {header}
      {groups.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="아직 데이터가 없습니다."
          description="Meta CSV를 업로드하면 캠페인 데이터가 여기에 표시됩니다."
        />
      ) : (
        <div>
          <p className="mb-4 text-sm font-semibold text-gray-900">자동 진단</p>
          <div className="flex flex-col gap-6">
            {groups.map((group) => (
              <CampaignDiagnosisSection key={group.campaignName} group={group} />
            ))}
          </div>
        </div>
      )}
    </>
  );
}
