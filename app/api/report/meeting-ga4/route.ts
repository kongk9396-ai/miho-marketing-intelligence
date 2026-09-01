import { NextRequest, NextResponse } from "next/server";

import { getGa4DailyRows } from "@/lib/ga4/repository";
import { aggregateGa4Metrics } from "@/lib/ga4/metrics";
import { getAllLeadsForAnalysis } from "@/lib/leads-analysis/repository";
import { toKstDateOnly } from "@/lib/date/kst";

export const dynamic = "force-dynamic";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

type LeadDateLike = {
  applied_at?: string | null;
  created_at?: string | null;
};

function getLeadKstDate(row: LeadDateLike): string | null {
  const raw = row.applied_at ?? row.created_at;

  if (!raw) return null;

  try {
    return toKstDateOnly(raw);
  } catch {
    return raw.slice(0, 10);
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const startDate = searchParams.get("start");
  const endDate = searchParams.get("end");

  if (
    !startDate ||
    !endDate ||
    !DATE_RE.test(startDate) ||
    !DATE_RE.test(endDate)
  ) {
    return NextResponse.json(
      {
        ok: false,
        message: "올바른 시작일과 종료일이 필요합니다.",
      },
      { status: 400 }
    );
  }

  try {
    const [ga4Rows, allLeads] = await Promise.all([
      getGa4DailyRows({
        startDate,
        endDate,
      }),
      getAllLeadsForAnalysis(),
    ]);

    const metrics = aggregateGa4Metrics(ga4Rows);

    const actualDb = (allLeads as LeadDateLike[]).filter((lead) => {
      const date = getLeadKstDate(lead);

      return (
        date !== null &&
        date >= startDate &&
        date <= endDate
      );
    }).length;

    return NextResponse.json({
      ok: true,

      startDate,
      endDate,

      sessions: metrics.totalSessions,
      ctaClicks: metrics.totalCtaClicks,
      formStarts: metrics.totalFormStarts,

      // GA4 추적값
      formCompletes: metrics.totalFormCompletes,

      // 실제 접수 데이터
      actualDb,

      ga4RowCount: ga4Rows.length,
    });
  } catch (error) {
    console.error("[meeting-ga4]", error);

    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : "회의용 퍼널 데이터를 불러오지 못했습니다.",
      },
      { status: 500 }
    );
  }
}
