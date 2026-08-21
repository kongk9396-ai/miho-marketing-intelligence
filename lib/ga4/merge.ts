import type { Ga4EventRow, Ga4MainRow, Ga4MergedRow, Ga4TrackedEvent } from "@/lib/ga4/types";

function buildKey(date: string, campaign: string, content: string, landingPage: string): string {
  return `${date}|${campaign}|${content}|${landingPage}`;
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

  return mainRows.map((row) => {
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
