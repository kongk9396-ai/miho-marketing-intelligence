import type { Ga4EventRow, Ga4MainRow, Ga4MergedRow, Ga4TrackedEvent } from "@/lib/ga4/types";

function buildKey(date: string, campaign: string, content: string, landingPage: string): string {
  return `${date}|${campaign}|${content}|${landingPage}`;
}

interface MainRowAccumulator {
  date: string;
  campaign: string;
  content: string;
  landingPage: string;
  source: string;
  medium: string;
  topSessions: number;
  sessions: number;
  totalUsers: number;
  engagedSessions: number;
  avgSessionDurationWeightedSum: number;
  screenPageViews: number;
  keyEvents: number;
}

/**
 * GA4's main report is dimensioned by source+medium in addition to
 * campaign/content/landingPage (see MAIN_DIMENSIONS in report.ts), but
 * ga4_daily's storage key (and its unique index) is only
 * date+campaign+content+landing_page — source/medium are descriptive, not
 * part of identity. Real traffic regularly has more than one source/medium
 * pair land on the same page/campaign/content in a day (e.g. a tracked UTM
 * visit plus a "(direct)/(none)" repeat visit), which produced multiple
 * `mainRows` sharing one storage key. Upserting those as separate rows in
 * the same batch made Postgres reject the second one ("ON CONFLICT DO
 * UPDATE command cannot affect row a second time"), so nothing was ever
 * saved. Collapsing to one row per storage key here — summing counts,
 * session-weighting the duration average, and recomputing engagementRate
 * from the summed totals (never averaging the per-row rate) — fixes that at
 * the source instead of loosening the schema.
 */
function collapseToStorageKey(mainRows: Ga4MainRow[]): Ga4MainRow[] {
  const groups = new Map<string, MainRowAccumulator>();

  for (const row of mainRows) {
    const key = buildKey(row.date, row.campaign, row.content, row.landingPage);
    let acc = groups.get(key);
    if (!acc) {
      acc = {
        date: row.date,
        campaign: row.campaign,
        content: row.content,
        landingPage: row.landingPage,
        source: row.source,
        medium: row.medium,
        topSessions: -1,
        sessions: 0,
        totalUsers: 0,
        engagedSessions: 0,
        avgSessionDurationWeightedSum: 0,
        screenPageViews: 0,
        keyEvents: 0,
      };
      groups.set(key, acc);
    }

    acc.sessions += row.sessions;
    acc.totalUsers += row.totalUsers;
    acc.engagedSessions += row.engagedSessions;
    acc.screenPageViews += row.screenPageViews;
    acc.keyEvents += row.keyEvents;
    if (row.avgSessionDuration !== null) {
      acc.avgSessionDurationWeightedSum += row.avgSessionDuration * row.sessions;
    }
    // The source/medium pair with the most sessions represents the group.
    if (row.sessions > acc.topSessions) {
      acc.topSessions = row.sessions;
      acc.source = row.source;
      acc.medium = row.medium;
    }
  }

  return [...groups.values()].map((acc) => ({
    date: acc.date,
    source: acc.source,
    medium: acc.medium,
    campaign: acc.campaign,
    content: acc.content,
    landingPage: acc.landingPage,
    sessions: acc.sessions,
    totalUsers: acc.totalUsers,
    engagedSessions: acc.engagedSessions,
    engagementRate: acc.sessions > 0 ? acc.engagedSessions / acc.sessions : null,
    avgSessionDuration: acc.sessions > 0 ? acc.avgSessionDurationWeightedSum / acc.sessions : null,
    screenPageViews: acc.screenPageViews,
    keyEvents: acc.keyEvents,
  }));
}

interface EventCounts {
  cta_click: number;
  form_start: number;
  form_complete: number;
  scroll_depth: number;
}

function emptyEventCounts(): EventCounts {
  return { cta_click: 0, form_start: 0, form_complete: 0, scroll_depth: 0 };
}

/**
 * Joins the main GA4 report with the tracked-event counts by
 * date+campaign+content+landingPage. An event that never fired in this GA4
 * property has no rows in `eventRows`, so it naturally resolves to 0 here —
 * this is the "missing event -> 0, not an error" behavior from the spec.
 */
export function mergeGa4Reports(mainRows: Ga4MainRow[], eventRows: Ga4EventRow[]): Ga4MergedRow[] {
  const eventMap = new Map<string, EventCounts>();

  for (const row of eventRows) {
    const key = buildKey(row.date, row.campaign, row.content, row.landingPage);
    const counts = eventMap.get(key) ?? emptyEventCounts();
    if (row.eventName in counts) {
      counts[row.eventName as Ga4TrackedEvent] += row.eventCount;
    }
    eventMap.set(key, counts);
  }

  return collapseToStorageKey(mainRows).map((row) => {
    const key = buildKey(row.date, row.campaign, row.content, row.landingPage);
    const counts = eventMap.get(key) ?? emptyEventCounts();

    return {
      ...row,
      ctaClicks: counts.cta_click,
      formStarts: counts.form_start,
      formCompletes: counts.form_complete,
      scrollDepthEvents: counts.scroll_depth,
    };
  });
}
