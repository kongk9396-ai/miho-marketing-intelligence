import { NextResponse } from "next/server";
import { isAuthorizedAttributionIngestRequest } from "@/lib/cron-auth";
import { appendAttributionRecord } from "@/lib/leads-sync/attribution-repository";

export const dynamic = "force-dynamic";

const DEFAULT_ATTRIBUTION_SHEET_NAME = "marketing_attribution";

function nullableString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

/**
 * Webhook target for DBcart (or any landing/form tool): call this right
 * after appending a row to a consultation sheet (코첫/코재/눈), passing the
 * UTM values captured from the landing URL plus which sheet/row the
 * consultation row just landed on. This route only ever writes to the
 * app-owned marketing_attribution tab — it never touches the consultation
 * sheets themselves. See docs/lead-attribution-setup.md.
 *
 * Body (JSON): { source_sheet, source_row, landing_name?, utm_source?,
 * utm_medium?, utm_campaign?, utm_content? }. No name/phone/birth-date
 * fields are read even if present in the body — this route only ever
 * destructures the fields listed above.
 */
export async function POST(request: Request) {
  if (!isAuthorizedAttributionIngestRequest(request)) {
    return NextResponse.json({ error: "인증되지 않은 요청입니다." }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "요청 본문을 JSON으로 해석할 수 없습니다." }, { status: 400 });
  }

  const sourceSheet = nullableString(body.source_sheet);
  const sourceRowRaw = body.source_row;
  const sourceRow = typeof sourceRowRaw === "number" ? sourceRowRaw : Number(nullableString(sourceRowRaw) ?? NaN);

  if (!sourceSheet || !Number.isFinite(sourceRow)) {
    return NextResponse.json(
      { error: "source_sheet(문자열)과 source_row(숫자)는 필수입니다." },
      { status: 400 }
    );
  }

  const sheetName = process.env.LEADS_ATTRIBUTION_SHEET_NAME || DEFAULT_ATTRIBUTION_SHEET_NAME;

  try {
    await appendAttributionRecord(sheetName, {
      landingName: nullableString(body.landing_name),
      utmSource: nullableString(body.utm_source),
      utmMedium: nullableString(body.utm_medium),
      utmCampaign: nullableString(body.utm_campaign),
      utmContent: nullableString(body.utm_content),
      sourceSheet,
      sourceRow,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "attribution 탭 저장 중 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
