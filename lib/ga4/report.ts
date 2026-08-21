import "server-only";
import { createGa4Client, getGa4PropertyId, getMissingGa4EnvVars, isGa4Configured } from "@/lib/ga4/client";
import { categorizeGa4Error, type Ga4ErrorCategory } from "@/lib/ga4/errors";
import { GA4_TRACKED_EVENTS } from "@/lib/ga4/types";
import type { Ga4EventRow, Ga4MainRow } from "@/lib/ga4/types";

const MAIN_DIMENSIONS = [
  "date",
  "sessionSource",
  "sessionMedium",
  "sessionCampaignName",
  "sessionManualAdContent",
  "landingPagePlusQueryString",
];

const MAIN_METRICS = [
  "sessions",
  "totalUsers",
  "engagedSessions",
  "engagementRate",
  "averageSessionDuration",
  "screenPageViews",
  "keyEvents",
];

/** GA4's `date` dimension comes back as "YYYYMMDD"; normalize to "YYYY-MM-DD". */
function formatGa4Date(raw: string): string {
  if (!/^\d{8}$/.test(raw)) return raw;
  return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
}

function parseIntSafe(value: string | undefined): number {
  const n = Number(value);
  return Number.isFinite(n) ? Math.round(n) : 0;
}

function parseFloatSafe(value: string | undefined): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

interface ReportRow {
  dimensionValues?: Array<{ value?: string | null } | null> | null;
  metricValues?: Array<{ value?: string | null } | null> | null;
}

interface ReportResponse {
  dimensionHeaders?: Array<{ name?: string | null } | null> | null;
  metricHeaders?: Array<{ name?: string | null } | null> | null;
  rows?: ReportRow[] | null;
}

function toRecords(response: ReportResponse): Array<{ dims: Record<string, string>; metrics: Record<string, string> }> {
  const dimNames = (response.dimensionHeaders ?? []).map((h) => h?.name ?? "");
  const metricNames = (response.metricHeaders ?? []).map((h) => h?.name ?? "");

  return (response.rows ?? []).map((row) => {
    const dims: Record<string, string> = {};
    (row.dimensionValues ?? []).forEach((v, i) => {
      dims[dimNames[i]] = v?.value ?? "";
    });
    const metrics: Record<string, string> = {};
    (row.metricValues ?? []).forEach((v, i) => {
      metrics[metricNames[i]] = v?.value ?? "0";
    });
    return { dims, metrics };
  });
}

export async function fetchGa4MainReport(startDate: string, endDate: string): Promise<Ga4MainRow[]> {
  const client = createGa4Client();
  const propertyId = getGa4PropertyId();

  const [response] = await client.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [{ startDate, endDate }],
    dimensions: MAIN_DIMENSIONS.map((name) => ({ name })),
    metrics: MAIN_METRICS.map((name) => ({ name })),
    limit: 100000,
  });

  return toRecords(response).map(({ dims, metrics }) => ({
    date: formatGa4Date(dims.date),
    source: dims.sessionSource || "(not set)",
    medium: dims.sessionMedium || "(not set)",
    campaign: dims.sessionCampaignName || "(not set)",
    content: dims.sessionManualAdContent || "(not set)",
    landingPage: dims.landingPagePlusQueryString || "(not set)",
    sessions: parseIntSafe(metrics.sessions),
    totalUsers: parseIntSafe(metrics.totalUsers),
    engagedSessions: parseIntSafe(metrics.engagedSessions),
    engagementRate: parseFloatSafe(metrics.engagementRate),
    avgSessionDuration: parseFloatSafe(metrics.averageSessionDuration),
    screenPageViews: parseIntSafe(metrics.screenPageViews),
    keyEvents: parseIntSafe(metrics.keyEvents),
  }));
}

/**
 * cta_click / form_start / form_complete / scroll_depth counts, per
 * date+campaign+content+landingPage. A tracked event that has never fired in
 * this GA4 property simply produces no rows here — that is not an error, it
 * just means every merged count for it comes out 0 (see merge.ts).
 */
export async function fetchGa4EventCounts(startDate: string, endDate: string): Promise<Ga4EventRow[]> {
  const client = createGa4Client();
  const propertyId = getGa4PropertyId();

  const [response] = await client.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [{ startDate, endDate }],
    dimensions: [
      { name: "date" },
      { name: "sessionCampaignName" },
      { name: "sessionManualAdContent" },
      { name: "landingPagePlusQueryString" },
      { name: "eventName" },
    ],
    metrics: [{ name: "eventCount" }],
    dimensionFilter: {
      filter: {
        fieldName: "eventName",
        inListFilter: { values: [...GA4_TRACKED_EVENTS] },
      },
    },
    limit: 100000,
  });

  return toRecords(response).map(({ dims, metrics }) => ({
    date: formatGa4Date(dims.date),
    campaign: dims.sessionCampaignName || "(not set)",
    content: dims.sessionManualAdContent || "(not set)",
    landingPage: dims.landingPagePlusQueryString || "(not set)",
    eventName: dims.eventName,
    eventCount: parseIntSafe(metrics.eventCount),
  }));
}

export interface Ga4ConnectionTestResult {
  ok: boolean;
  propertyId?: string;
  category?: Ga4ErrorCategory;
  error?: string;
  sample?: { activeUsers: number; sessions: number };
}

/**
 * Simplest possible request that proves both auth and property access work:
 * activeUsers + sessions over the last 7 days, no dimensions. Used by the
 * "GA4 연결 테스트" button — kept separate from the daily-sync report shape.
 */
export async function testGa4Connection(): Promise<Ga4ConnectionTestResult> {
  if (!isGa4Configured()) {
    return {
      ok: false,
      category: "missing_env",
      error: `환경변수 누락: ${getMissingGa4EnvVars().join(", ")}`,
    };
  }

  try {
    const propertyId = getGa4PropertyId();
    const client = createGa4Client();
    const [response] = await client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
      metrics: [{ name: "activeUsers" }, { name: "sessions" }],
      limit: 1,
    });

    const row = response.rows?.[0];
    const activeUsers = parseIntSafe(row?.metricValues?.[0]?.value ?? undefined);
    const sessions = parseIntSafe(row?.metricValues?.[1]?.value ?? undefined);

    return { ok: true, propertyId, sample: { activeUsers, sessions } };
  } catch (err) {
    const { category, message } = categorizeGa4Error(err);
    return { ok: false, category, error: message };
  }
}
