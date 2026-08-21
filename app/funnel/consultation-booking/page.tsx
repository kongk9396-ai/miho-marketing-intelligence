import { CalendarCheck } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { PeriodFilter } from "@/components/leads-analysis/period-filter";
import { LeadsFunnelStages } from "@/components/leads-analysis/leads-funnel-stages";
import { DbProblemCard } from "@/components/leads-analysis/db-problem-card";
import { getLeadsInRange } from "@/lib/leads-analysis/repository";
import { computeLeadsFunnel } from "@/lib/leads-analysis/funnel";
import { computeLeadsKpiSummary } from "@/lib/leads-analysis/kpi";
import { classifyDbProblem } from "@/lib/leads-analysis/problem-classification";
import { resolvePeriod, resolvePriorPeriod, type PeriodPreset } from "@/lib/leads-analysis/period";
import { SchemaNotReadyError } from "@/lib/meta/schema-not-ready";

export const dynamic = "force-dynamic";

interface ConsultationBookingPageProps {
  searchParams: Promise<{ period?: string; start?: string; end?: string }>;
}

export default async function ConsultationBookingPage({ searchParams }: ConsultationBookingPageProps) {
  const params = await searchParams;
  const preset = (params.period as PeriodPreset) || "7d";
  const period = resolvePeriod(preset, params.start, params.end);
  const priorPeriod = resolvePriorPeriod(period);

  const header = (
    <PageHeader
      title="상담 / 예약"
      description="퍼널 단계별 상담 요청 및 예약 전환 현황입니다."
      actions={<PeriodFilter basePath="/funnel/consultation-booking" />}
    />
  );

  let currentRows;
  let priorRows;
  try {
    [currentRows, priorRows] = await Promise.all([
      getLeadsInRange(period.startIso, period.endIsoExclusive),
      getLeadsInRange(priorPeriod.startIso, priorPeriod.endIsoExclusive),
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

  if (currentRows.length === 0) {
    return (
      <>
        {header}
        <EmptyState
          icon={CalendarCheck}
          title="아직 데이터가 없습니다."
          description={`${period.label} 기간에 동기화된 DB가 없습니다.`}
        />
      </>
    );
  }

  const stages = computeLeadsFunnel(currentRows);
  const problemResult = classifyDbProblem(computeLeadsKpiSummary(priorRows), computeLeadsKpiSummary(currentRows));

  return (
    <>
      {header}

      <p className="-mt-2 mb-4 text-sm text-gray-500">
        {period.label} ({period.startDate} ~ {period.endDate})
      </p>

      <LeadsFunnelStages stages={stages} />

      <div className="mt-6">
        <DbProblemCard result={problemResult} />
      </div>
    </>
  );
}
