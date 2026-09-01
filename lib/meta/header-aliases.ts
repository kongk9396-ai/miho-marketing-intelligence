/**
 * Meta Ads report header aliases.
 *
 * Meta 보고서는 언어/보고서 수준/선택 컬럼에 따라 헤더가 달라질 수 있다.
 * 가능한 많은 한국어/영문 헤더를 자동 인식한다.
 */
export const HEADER_ALIASES: Record<string, string[]> = {
  reporting_start: [
    "Reporting starts",
    "보고 시작",
    "보고 시작일",
  ],

  reporting_end: [
    "Reporting ends",
    "보고 종료",
    "보고 종료일",
  ],
  date: [
    "Day",
    "Date",
    "날짜",
    "일",
    "Reporting starts",
    "Reporting ends",
    "보고 시작",
    "보고 종료",
    "보고 시작일",
    "보고 종료일",
  ],

  account_name: [
    "Account name",
    "Account Name",
    "계정 이름",
    "광고 계정 이름",
  ],

  campaign_id: [
    "Campaign ID",
    "캠페인 ID",
  ],

  campaign_name: [
    "Campaign name",
    "Campaign Name",
    "캠페인 이름",
    "캠페인",
  ],

  adset_id: [
    "Ad set ID",
    "Ad Set ID",
    "광고 세트 ID",
  ],

  adset_name: [
    "Ad set name",
    "Ad Set Name",
    "광고 세트 이름",
    "광고 세트",
  ],

  ad_id: [
    "Ad ID",
    "광고 ID",
  ],

  ad_name: [
    "Ad name",
    "Ad Name",
    "광고 이름",
    "광고",
  ],

  spend: [
    "Amount spent",
    "Amount spent (KRW)",
    "Amount spent (USD)",
    "지출 금액",
    "지출 금액 (KRW)",
    "사용 금액",
    "소비 금액",
    "광고비",
  ],

  impressions: [
    "Impressions",
    "노출",
    "노출 수",
  ],

  reach: [
    "Reach",
    "도달",
    "도달 수",
  ],

  frequency: [
    "Frequency",
    "빈도",
  ],

  clicks: [
    "Clicks",
    "Clicks (all)",
    "클릭",
    "클릭(전체)",
    "전체 클릭",
  ],

  link_clicks: [
    "Link clicks",
    "링크 클릭",
    "링크 클릭 수",
  ],

  ctr: [
    "CTR",
    "CTR (all)",
    "CTR(전체)",
    "클릭률",
  ],

  link_ctr: [
    "CTR (link click-through rate)",
    "링크 클릭률",
    "링크 클릭률(CTR)",
    "링크 CTR",
  ],

  cpc: [
    "CPC",
    "CPC (all)",
    "CPC(전체)",
    "클릭당 비용",
  ],

  link_cpc: [
    "CPC (cost per link click)",
    "링크 클릭당 비용",
    "링크 클릭당 비용(CPC)",
  ],

  cpm: [
    "CPM",
    "CPM (cost per 1,000 impressions)",
    "CPM(1,000회 노출당 비용)",
    "1,000회 노출당 비용",
  ],

  video_plays: [
    "Video plays",
    "동영상 재생",
    "동영상 재생 횟수",
  ],

  video_3s: [
    "3-second video plays",
    "3초 동영상 재생",
    "동영상 3초 이상 재생",
  ],

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
    "평균 재생 시간",
  ],
};

/**
 * 이제 캠페인명/광고명은 필수가 아니다.
 * 보고서 수준에 따라 없는 경우가 있기 때문이다.
 *
 * 날짜만 있으면 기간 데이터로 저장할 수 있다.
 */
export const REQUIRED_FIELDS = ["date"] as const;

export function normalizeHeader(header: string): string {
  return header
    .replace(/^\uFEFF/, "")
    .trim()
    .toLowerCase()
    .replace(/[()\[\]{}]/g, " ")
    .replace(/[_\-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function scoreAlias(header: string, alias: string): number {
  const h = normalizeHeader(header);
  const a = normalizeHeader(alias);

  if (h === a) return 100;

  if (h.includes(a) || a.includes(h)) {
    return Math.min(h.length, a.length) >= 2 ? 80 : 0;
  }

  const hTokens = h.split(" ").filter(Boolean);
  const aTokens = a.split(" ").filter(Boolean);

  const matched = aTokens.filter((token) =>
    hTokens.some((hToken) => hToken === token)
  ).length;

  if (aTokens.length > 0 && matched === aTokens.length) {
    return 60;
  }

  return 0;
}

export function resolveHeaderMap(
  rawHeaders: string[]
): Record<string, string> {
  const resolved: Record<string, string> = {};

  for (const [field, aliases] of Object.entries(HEADER_ALIASES)) {
    let bestHeader: string | null = null;
    let bestScore = 0;

    for (const raw of rawHeaders) {
      for (const alias of aliases) {
        const score = scoreAlias(raw, alias);

        if (score > bestScore) {
          bestScore = score;
          bestHeader = raw;
        }
      }
    }

    if (bestHeader && bestScore >= 60) {
      resolved[field] = bestHeader;
    }
  }

  return resolved;
}
