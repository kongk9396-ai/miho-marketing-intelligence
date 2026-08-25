/**
 * Google Sheet header text -> internal canonical field name. Sheet owners
 * can rename columns at any time, so nothing downstream matches on a raw
 * header string directly — mirrors lib/meta/header-aliases.ts's pattern for
 * Meta CSV headers.
 *
 * `phone` is matched here only so the sync engine can read it *transiently*
 * to build lead_key — see lib/leads-sync/lead-key.ts. It is never written to
 * any stored row. `name`, `birth_date`, and the consultation-concern /
 * memo columns are deliberately NOT matched at all: this app never reads or
 * stores that data, by design (개인정보 최소 수집).
 */
export const LEADS_HEADER_ALIASES: Record<string, string[]> = {
  applied_at: ["신청날짜", "신청일", "신청일시", "접수일", "접수일시", "created_at", "applied_at"],
  preferred_visit_at: ["내원희망날짜", "내원희망일", "내원 희망일", "내원희망일시"],
  phone: ["연락처", "전화번호", "휴대폰번호", "핸드폰번호"],
  outcome_raw: ["최종 결과", "최종결과", "최종 상태", "최종상태"],
  consultant: ["담당자", "상담사"],
  // The real sheet tracks all call attempts in one column, e.g.
  // "콜 결과(1차/2차/3차/4차)" — not 4 separate columns as originally assumed.
  // That single column is treated as call_result_1; call_result_2..4 stay as
  // separate-column aliases in case a future sheet does split them out.
  call_result_1: [
    "콜결과1차",
    "1차콜결과",
    "콜 결과(1차)",
    "콜결과(1차)",
    "1차 콜 결과",
    "콜 결과(1차/2차/3차/4차)",
    "콜결과(1차/2차/3차/4차)",
  ],
  call_result_2: ["콜결과2차", "2차콜결과", "콜 결과(2차)", "콜결과(2차)", "2차 콜 결과"],
  call_result_3: ["콜결과3차", "3차콜결과", "콜 결과(3차)", "콜결과(3차)", "3차 콜 결과"],
  call_result_4: ["콜결과4차", "4차콜결과", "콜 결과(4차)", "콜결과(4차)", "4차 콜 결과"],
  utm_source: ["utm_source", "utm_source(출처)", "출처"],
  utm_medium: ["utm_medium", "utm_medium(매체)", "매체"],
  utm_campaign: ["utm_campaign", "utm_campaign(캠페인)", "캠페인"],
  utm_content: ["utm_content", "utm_content(콘텐츠)", "소재", "콘텐츠"],
  landing_name: ["랜딩", "랜딩페이지", "랜딩 페이지", "유입경로", "유입 경로", "유입", "랜딩타이틀"],
};

/** A row with no applied_at has no business date to analyze against — required for a row to sync at all. */
export const LEADS_REQUIRED_FIELDS = ["applied_at"] as const;

export function normalizeHeader(header: string): string {
  return header.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Given the raw header row from a sheet, plus optional per-sheet overrides
 * (canonical field -> exact header text, from leads_sheet_configs.column_overrides),
 * returns canonical field -> actual header string found in the sheet.
 * Overrides always win over the built-in alias list.
 */
export function resolveLeadsHeaderMap(
  rawHeaders: string[],
  overrides: Record<string, string> = {}
): Record<string, string> {
  const normalizedToRaw = new Map<string, string>();
  for (const raw of rawHeaders) {
    normalizedToRaw.set(normalizeHeader(raw), raw);
  }

  const resolved: Record<string, string> = {};

  for (const [field, overrideHeader] of Object.entries(overrides)) {
    const match = normalizedToRaw.get(normalizeHeader(overrideHeader));
    if (match) resolved[field] = match;
  }

  for (const [field, aliases] of Object.entries(LEADS_HEADER_ALIASES)) {
    if (resolved[field]) continue; // override already resolved this field
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

