import { PageHeader } from "@/components/layout/page-header";
import { FunnelStages } from "@/components/ga4/funnel-stages";
import { FunnelFilters } from "@/components/ga4/funnel-filters";
import { CombinedAdTable } from "@/components/combined-analysis/combined-ad-table";
import { computeLandingFunnel } from "@/lib/ga4/funnel";
import { getDistinctGa4CampaignContent, getGa4DailyRows } from "@/lib/ga4/repository";
import { buildCombinedAdSummaries } from "@/lib/combined-analysis/build";
import { SchemaNotReadyError } from "@/lib/meta/schema-not-ready";

export const dynamic = "force-dynamic";

interface FunnelLandingPageProps {
  searchParams: Promise<{ campaign?: string; content?: string }>;
}

export default async function FunnelLandingPage({ searchParams }: FunnelLandingPageProps) {
  const params = await searchParams;
  const header = (
    <PageHeader
      title="랜딩 분석"
      description="세션부터 폼 완료까지 랜딩 퍼널 전환율을 확인합니다."
    />
  );

  let rows;
  let filterOptions;
  let combinedSummaries;
  try {
    [rows, filterOptions, combinedSummaries] = await Promise.all([
      getGa4DailyRows({ campaign: params.campaign, content: params.content }),
      getDistinctGa4CampaignContent(),
      buildCombinedAdSummaries(10),
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

  const funnelStages = computeLandingFunnel(rows);

  return (
    <>
      <PageHeader
        title="랜딩 분석"
        description="세션부터 폼 완료까지 랜딩 퍼널 전환율을 확인합니다."
        actions={<FunnelFilters options={filterOptions} />}
      />

      <FunnelStages stages={funnelStages} />

      <div className="mt-6">
        <CombinedAdTable summaries={combinedSummaries} />
      </div>
    </>
  );
}
