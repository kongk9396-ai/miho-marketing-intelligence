/**
 * Meta Ads Manager lets each advertiser choose which columns to export, and
 * the header text differs between the English and Korean Ads Manager UI.
 * This maps each internal meta_daily field to the set of header spellings we
 * recognize (case/whitespace-insensitive match, see normalizeHeader below).
 *
 * Extend these arrays as new report layouts show up — this is the single
 * place both the manual upload and Gmail auto-collect paths read from.
 */
export const HEADER_ALIASES: Record<string, string[]> = {
  date: ["Day", "Date", "Reporting starts", "Reporting ends", "일", "날짜", "보고 시작", "보고 종료", "보고 시작일"],
  account_name: ["Account name", "계정 이름"],
  campaign_id: ["Campaign ID", "캠페인 ID"],
  campaign_name: ["Campaign name", "Campaign Name", "캠페인 이름"],
  adset_id: ["Ad set ID", "Ad Set ID", "광고세트 ID"],
  adset_name: ["Ad set name", "Ad Set Name", "광고세트 이름"],
  ad_id: ["Ad ID", "광고 ID"],
  ad_name: ["Ad name", "Ad Name", "광고 이름"],
  spend: [
    "Amount spent (KRW)",
    "Amount spent (USD)",
    "Amount spent",
    "지출 금액 (KRW)",
    "지출 금액",
    "소비 금액",
  ],
  impressions: ["Impressions", "노출"],
  reach: ["Reach", "도달수", "도달"],
  frequency: ["Frequency", "빈도"],
  clicks: ["Clicks (all)", "Clicks", "클릭(전체)", "클릭"],
  link_clicks: ["Link clicks", "링크 클릭"],
  ctr: ["CTR (all)", "CTR", "CTR(전체)"],
  link_ctr: [
    "CTR (link click-through rate)",
    "링크 클릭율(CTR)",
    "링크 CTR",
    "CTR(링크 클릭률)",
    "링크 클릭률(CTR)",
  ],
  cpc: ["CPC (all)", "CPC(전체)", "CPC(전체) (KRW)"],
  link_cpc: [
    "CPC (cost per link click)",
    "링크 클릭당 비용(CPC)",
    "CPC(링크 클릭당 비용)",
    "CPC(링크 클릭당 비용) (KRW)",
  ],
  cpm: [
    "CPM (cost per 1,000 impressions)",
    "CPM(1,000회 노출당 비용)",
    "CPM(1,000회 노출당 비용) (KRW)",
  ],
  video_plays: ["Video plays", "동영상 재생"],
  video_3s: ["3-second video plays", "3초 동영상 재생", "동영상 3초 이상 재생"],
  video_25: [
    "Video plays at 25%",
    "Video watches at 25%",
    "동영상 25% 재생",
  ],
  video_50: [
    "Video plays at 50%",
    "Video watches at 50%",
    "동영상 50% 재생",
  ],
  video_75: [
    "Video plays at 75%",
    "Video watches at 75%",
    "동영상 75% 재생",
  ],
  video_95: [
    "Video plays at 95%",
    "Video watches at 95%",
    "동영상 95% 재생",
  ],
  video_100: [
    "Video plays at 100%",
    "Video watches at 100%",
    "동영상 100% 재생",
  ],
  avg_watch_time: [
    "Video average play time",
    "Video Average Play Time",
    "동영상 평균 재생 시간",
  ],
};

/**
 * Fields that must be present (mapped to a column) for a file to be usable.
 * ad_id is deliberately not required — Meta exports don't always include it,
 * and a stable temp id is generated per row when it's missing (see
 * lib/meta/temp-ad-id.ts).
 */
export const REQUIRED_FIELDS = ["date", "campaign_name", "ad_name"] as const;

export function normalizeHeader(header: string): string {
  return header.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Given the raw header row from a CSV/XLSX file, returns a map of internal
 * field name -> actual header string found in the file (only for fields that
 * matched).
 */
export function resolveHeaderMap(rawHeaders: string[]): Record<string, string> {
  const normalizedToRaw = new Map<string, string>();
  for (const raw of rawHeaders) {
    normalizedToRaw.set(normalizeHeader(raw), raw);
  }

  const resolved: Record<string, string> = {};
  for (const [field, aliases] of Object.entries(HEADER_ALIASES)) {
    for (const alias of aliases) {
      const match = normalizedToRaw.get(normalizeHeader(alias));
      if (match) {
        resolved[field] = match;
        break;
      }
    }
  }
  return resolved;
}
