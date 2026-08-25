import { DollarSign, MousePointerClick, PlayCircle, Target, Video } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { KpiCard } from "@/components/ui/kpi-card";
import { VideoAdSelector } from "@/components/video-analysis/video-ad-selector";
import { RetentionFunnelChart } from "@/components/video-analysis/retention-funnel-chart";
import { VideoDiagnosisCard } from "@/components/video-analysis/video-diagnosis-card";
import { VideoSummaryTable } from "@/components/video-analysis/video-summary-table";
import { VideoRankingSection } from "@/components/video-analysis/video-ranking-section";
import { getVideoAdSummaries } from "@/lib/video-analysis/summary";
import { buildRetentionFunnel, buildVideoHookMetrics, buildRetentionInterpretation } from "@/lib/video-analysis/funnel";
import { diagnoseVideo } from "@/lib/video-analysis/diagnosis";
import { buildCreativeRankings } from "@/lib/video-analysis/ranking";
import { SchemaNotReadyError } from "@/lib/meta/schema-not-ready";

export const dynamic = "force-dynamic";

interface VideoAnalysisPageProps {
  searchParams: Promise<{ adId?: string }>;
}

function formatWon(value: number | null): string {
  return value === null ? "—" : `₩${Math.round(value).toLocaleString("ko-KR")}`;
}

function formatPercent(value: number | null, digits = 2): string {
  return value === null ? "—" : `${value.toFixed(digits)}%`;
}

export default async function VideoAnalysisPage({ searchParams }: VideoAnalysisPageProps) {
  const params = await searchParams;
  const header = (
    <PageHeader title="영상 분석" description="영상 소재의 시청 시간, 후킹률, 완료율 등을 분석합니다." />
  );

  let ads;
  try {
    ads = await getVideoAdSummaries();
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

  if (ads.length === 0) {
    return (
      <>
        {header}
        <EmptyState
          icon={Video}
          title="아직 데이터가 없습니다."
          description="영상 재생 데이터가 있는 Meta 광고가 수집되면 여기에 표시됩니다."
        />
      </>
    );
  }

  const sortedBySpend = [...ads].sort((a, b) => b.metrics.totalSpend - a.metrics.totalSpend);
  const selectedAd = sortedBySpend.find((a) => a.adId === params.adId) ?? sortedBySpend[0];

  const funnel = buildRetentionFunnel(selectedAd.metrics);
  const hook = buildVideoHookMetrics(selectedAd.metrics);
  const interpretation = buildRetentionInterpretation(funnel);
  const diagnosis = diagnoseVideo(selectedAd.metrics);
  const rankings = buildCreativeRankings(ads);

  return (
    <>
      <PageHeader
        title="영상 분석"
        description="영상 소재의 시청 시간, 후킹률, 완료율 등을 분석합니다."
        actions={<VideoAdSelector ads={sortedBySpend} selectedId={selectedAd.adId} />}
      />

      <p className="-mt-2 mb-4 text-sm font-medium text-gray-700">
        {selectedAd.campaignName ?? "—"} · {selectedAd.adName ?? selectedAd.adId}
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <KpiCard label="총 광고비" value={formatWon(selectedAd.metrics.totalSpend)} icon={DollarSign} />
        <KpiCard
          label="총 재생"
          value={selectedAd.metrics.totalVideoPlays.toLocaleString("ko-KR")}
          icon={PlayCircle}
        />
        <KpiCard
          label="평균 시청시간"
          value={selectedAd.metrics.avgWatchTime === null ? "—" : `${selectedAd.metrics.avgWatchTime.toFixed(1)}초`}
          icon={Target}
        />
        <KpiCard label="CTR" value={formatPercent(selectedAd.metrics.ctr)} icon={MousePointerClick} />
        <KpiCard label="CPC" value={formatWon(selectedAd.metrics.cpc)} icon={DollarSign} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div>
          <RetentionFunnelChart stages={funnel} hook={hook} />
          <p className="mt-3 rounded-md bg-blue-50 px-3 py-2 text-sm text-blue-900">{interpretation}</p>
        </div>
        <VideoDiagnosisCard insights={diagnosis} />
      </div>

      <div className="mt-6">
        <VideoSummaryTable ads={sortedBySpend} />
      </div>

      <div className="mt-6">
        <VideoRankingSection rankings={rankings} />
      </div>
    </>
  );
}
