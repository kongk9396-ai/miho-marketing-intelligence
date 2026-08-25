import "server-only";
import { getMetaAdHierarchy, getMetaDailyRowsForAd } from "@/lib/creative-changes/repository";
import { resolveUtmForAd } from "@/lib/utm-mapping/resolve";
import { computeLeadsCpaSummary, computeLeadsKpiSummary, type LeadsCpaSummary, type LeadsKpiSummary } from "@/lib/leads-analysis/kpi";
import type { LeadAnalysisRow } from "@/lib/leads-analysis/types";

export interface CampaignBreakdownRow {
  key: string;
  campaignLabel: string;
  contentLabel: string | null;
  isUnmapped: boolean;
  spend: number;
  kpi: LeadsKpiSummary;
  cpa: LeadsCpaSummary;
}

const SCAN_LIMIT = 50;
const NULL_CPA: LeadsCpaSummary = {
  dbCpa: null,
  validDbCpa: null,
  connectedCpa: null,
  bookingCpa: null,
  visitedCpa: null,
};

function utmKey(campaign: string, content: string): string {
  return `${campaign}|||${content}`;
}

/**
 * Meta spend per (utm_campaign, utm_content), reusing the exact same
 * resolveUtmForAd path GA4 uses (manual utm_mappings row wins, else the ad's
 * own campaign/ad name is assumed to equal utm_campaign/utm_content).
 */
async function getMetaSpendByUtmKey(startDate: string, endDate: string, scanLimit: number): Promise<Map<string, number>> {
  const hierarchy = await getMetaAdHierarchy();
  const candidates = hierarchy.slice(0, scanLimit);

  const perAd = await Promise.all(
    candidates.map(async (ad) => {
      const resolved = await resolveUtmForAd(ad.campaignName, ad.adName);
      if (!resolved) return null;
      const rows = await getMetaDailyRowsForAd(ad.adId, startDate, endDate);
      const spend = rows.reduce((acc, r) => acc + (r.spend ?? 0), 0);
      return { key: utmKey(resolved.utmCampaign, resolved.utmContent), spend };
    })
  );

  const spendByKey = new Map<string, number>();
  for (const entry of perAd) {
    if (!entry) continue;
    spendByKey.set(entry.key, (spendByKey.get(entry.key) ?? 0) + entry.spend);
  }
  return spendByKey;
}

/**
 * Pure grouping/join logic, split out from the Supabase/Meta I/O below so it
 * can be unit-tested without a live database: given each Meta-resolved
 * utm_campaign/utm_content's spend, join every lead against it by the same
 * key. A lead whose utm pair isn't in `spendByUtmKey` is "매핑 실패" and
 * lands in the one aggregate "매핑되지 않음" row instead of being dropped.
 */
export function buildCampaignBreakdown(
  leadsRows: LeadAnalysisRow[],
  spendByUtmKey: Map<string, number>
): CampaignBreakdownRow[] {
  const leadsByUtmKey = new Map<string, LeadAnalysisRow[]>();
  // Two distinct "couldn't attribute" reasons, never merged into one bucket:
  // - noUtmLeads: the lead never had a utm_campaign at all (legacy DB from
  //   before UTM collection existed) — this is a data-collection-era fact,
  //   not a mapping problem, so it must not read as "매핑되지 않음".
  // - mismatchedUtmLeads: the lead has a real utm_campaign/utm_content, it
  //   just doesn't match any of the currently-known Meta ads' resolved keys
  //   (renamed ad, missing utm_mappings row, etc.) — a genuine mapping gap.
  const noUtmLeads: LeadAnalysisRow[] = [];
  const mismatchedUtmLeads: LeadAnalysisRow[] = [];

  for (const lead of leadsRows) {
    if (!lead.utm_campaign) {
      noUtmLeads.push(lead);
      continue;
    }
    const key = utmKey(lead.utm_campaign, lead.utm_content ?? "");
    if (spendByUtmKey.has(key)) {
      const arr = leadsByUtmKey.get(key) ?? [];
      arr.push(lead);
      leadsByUtmKey.set(key, arr);
    } else {
      mismatchedUtmLeads.push(lead);
    }
  }

  const allKeys = new Set([...spendByUtmKey.keys(), ...leadsByUtmKey.keys()]);
  const rows: CampaignBreakdownRow[] = [];

  for (const key of allKeys) {
    const [campaignLabel, contentLabel] = key.split("|||");
    const rowsForKey = leadsByUtmKey.get(key) ?? [];
    const spend = spendByUtmKey.get(key) ?? 0;
    const kpi = computeLeadsKpiSummary(rowsForKey);
    rows.push({
      key,
      campaignLabel,
      contentLabel: contentLabel || null,
      isUnmapped: false,
      spend,
      kpi,
      cpa: computeLeadsCpaSummary(spend, kpi),
    });
  }

  if (mismatchedUtmLeads.length > 0) {
    const kpi = computeLeadsKpiSummary(mismatchedUtmLeads);
    rows.push({
      key: "__unmapped__",
      campaignLabel: "매핑되지 않음",
      contentLabel: null,
      isUnmapped: true,
      spend: 0,
      kpi,
      cpa: NULL_CPA,
    });
  }

  if (noUtmLeads.length > 0) {
    const kpi = computeLeadsKpiSummary(noUtmLeads);
    rows.push({
      key: "__no_utm__",
      campaignLabel: "과거 DB 중 광고 귀속 보류",
      contentLabel: null,
      isUnmapped: true,
      spend: 0,
      kpi,
      cpa: NULL_CPA,
    });
  }

  return rows.sort((a, b) => b.spend - a.spend);
}

/** 캠페인/소재별 DB 성과 표 (section 9) — fetches Meta spend, then delegates to the pure buildCampaignBreakdown above. */
export async function getCampaignBreakdown(
  leadsRows: LeadAnalysisRow[],
  startDate: string,
  endDate: string,
  scanLimit = SCAN_LIMIT
): Promise<CampaignBreakdownRow[]> {
  const spendByUtmKey = await getMetaSpendByUtmKey(startDate, endDate, scanLimit);
  return buildCampaignBreakdown(leadsRows, spendByUtmKey);
}
