import { PageHeader } from "@/components/layout/page-header";
import { MappingForm } from "@/components/utm-mapping/mapping-form";
import { MappingList } from "@/components/utm-mapping/mapping-list";
import { getMetaAdHierarchy } from "@/lib/creative-changes/repository";
import { getDistinctGa4CampaignContent } from "@/lib/ga4/repository";
import { listUtmMappings } from "@/lib/utm-mapping/repository";
import { SchemaNotReadyError } from "@/lib/meta/schema-not-ready";

export const dynamic = "force-dynamic";

export default async function UtmMappingPage() {
  const header = (
    <PageHeader
      title="데이터 매핑"
      description="Meta 캠페인/광고와 GA4의 UTM(campaign, content) 값을 직접 연결합니다."
    />
  );

  let hierarchy;
  let ga4Options;
  let mappings;
  try {
    [hierarchy, ga4Options, mappings] = await Promise.all([
      getMetaAdHierarchy(),
      getDistinctGa4CampaignContent(),
      listUtmMappings(),
    ]);
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

      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-gray-900">매핑 등록</h3>
        <p className="mt-1 text-xs text-gray-500">
          자동 매칭이 되지 않는 경우, 여기서 캠페인/광고를 GA4의 utm_campaign/utm_content 값과 직접
          연결하세요.
        </p>
        <div className="mt-4">
          <MappingForm hierarchy={hierarchy} ga4Options={ga4Options} />
        </div>
      </div>

      <div className="mt-6">
        <MappingList mappings={mappings} />
      </div>
    </>
  );
}
