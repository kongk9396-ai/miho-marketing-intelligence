import { NextResponse } from "next/server";
import { fetchSheetRecords } from "@/lib/leads-sync/sheets-client";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await fetchSheetRecords("marketing_attribution_(건드리기x)");

  const safeRows = rows.map((row, index) => ({
    attribution_row: index + 2,
    submitted_at:
      row["submitted_at"] ??
      row["신청일"] ??
      row["신청날짜"] ??
      row["신청일시"] ??
      null,
    utm_campaign:
      row["utm_campaign"] ??
      row["utm_campaign(캠페인)"] ??
      row["캠페인"] ??
      null,
    utm_content:
      row["utm_content"] ??
      row["utm_content(콘텐츠)"] ??
      row["콘텐츠"] ??
      row["소재"] ??
      null,
    source_sheet: row["source_sheet"] ?? null,
    source_row: row["source_row"] ?? null,
  }));

  return NextResponse.json({
    count: safeRows.length,
    rows: safeRows,
  });
}
