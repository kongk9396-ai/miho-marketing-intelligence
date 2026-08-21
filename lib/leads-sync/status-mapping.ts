/**
 * Raw Google Sheet text -> internal standard status, for the two status
 * concepts the sheet actually carries (see the "최종 결과" and "콜 결과"
 * columns). Kept as a single editable config, mirroring
 * lib/meta/header-aliases.ts's HEADER_ALIASES pattern — when the sheet's
 * wording changes, this is the only place that needs to change.
 *
 * Never invent a mapping for text that hasn't actually been observed in the
 * sheet — anything unmatched falls through to "other" rather than being
 * guessed.
 */

export type OutcomeStatus = "confirmed" | "invalid" | "cancelled" | "pending" | "other";
export type ConsultationStatus =
  | "new"
  | "booked"
  | "connected"
  | "unreachable"
  | "callback"
  | "rejected"
  | "invalid"
  | "other";
export type BookingStatus = "none" | "pending" | "confirmed" | "cancelled";
export type VisitStatus = "none" | "scheduled" | "visited" | "cancelled" | "no_show";

function normalizeStatusText(raw: string): string {
  return raw.trim().replace(/\s+/g, "");
}

/** "최종 결과" column -> outcome_status. Empty/blank cells are "pending" (미정), not "other". */
const OUTCOME_STATUS_ALIASES: Record<Exclude<OutcomeStatus, "other">, string[]> = {
  confirmed: ["예약", "예약완료", "확정"],
  invalid: ["불량"],
  cancelled: ["취소", "취소함"],
  pending: ["미정"],
};

export function normalizeOutcomeStatus(rawValue: string | null | undefined): OutcomeStatus {
  const raw = (rawValue ?? "").trim();
  if (raw === "") return "pending";

  const normalized = normalizeStatusText(raw);
  for (const [status, aliases] of Object.entries(OUTCOME_STATUS_ALIASES) as [
    Exclude<OutcomeStatus, "other">,
    string[],
  ][]) {
    if (aliases.some((alias) => normalizeStatusText(alias) === normalized)) return status;
  }
  return "other";
}

/**
 * "콜 결과(1차/2차/3차/4차)" -> consultation_status. In the real sheet this
 * is a single free-text log, one line per attempt, e.g.:
 *   "1차 : 문자\n2차: 부재.카톡\n3차 : 문자 예약 완료"
 * — not a clean enum value. So this is a substring/contains match per line
 * (not an exact match against the whole cell), and the *last* line that
 * contains a recognizable keyword wins, since that's the most recent
 * attempt's outcome. A line with no recognizable keyword contributes
 * nothing (doesn't overwrite an earlier match) — only forgotten/unclassified
 * lines are ignored, never guessed at.
 */
const CONSULTATION_STATUS_ALIASES: Record<Exclude<ConsultationStatus, "new" | "other">, string[]> = {
  booked: ["예약완료", "예약 완료"],
  connected: ["통화완료", "통화 완료"],
  unreachable: ["부재", "미응답", "부재중"],
  callback: ["재통화예정", "재통화 예정"],
  rejected: ["거절"],
  invalid: ["불량"],
};

function matchConsultationLine(line: string): ConsultationStatus | null {
  const normalized = normalizeStatusText(line);
  if (!normalized) return null;

  for (const [status, aliases] of Object.entries(CONSULTATION_STATUS_ALIASES) as [
    Exclude<ConsultationStatus, "new" | "other">,
    string[],
  ][]) {
    if (aliases.some((alias) => normalized.includes(normalizeStatusText(alias)))) return status;
  }
  return null;
}

export function normalizeConsultationStatus(rawValue: string | null | undefined): ConsultationStatus {
  const raw = (rawValue ?? "").trim();
  if (raw === "") return "new";

  const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return "new";

  let latestMatch: ConsultationStatus | null = null;
  for (const line of lines) {
    const match = matchConsultationLine(line);
    if (match) latestMatch = match;
  }
  return latestMatch ?? "other";
}

/**
 * booking_status is derived, not read from its own sheet column — the
 * sheet expresses "was this booked" through two independent signals (the
 * case-level "최종 결과" and the latest call's "콜 결과"), and the KPI spec
 * treats either one as sufficient: "booking_status가 confirmed 또는
 * consultation_status가 booked".
 */
export function deriveBookingStatus(
  outcomeStatus: OutcomeStatus,
  consultationStatus: ConsultationStatus
): BookingStatus {
  if (outcomeStatus === "confirmed" || consultationStatus === "booked") return "confirmed";
  if (outcomeStatus === "cancelled") return "cancelled";
  if (outcomeStatus === "pending") return "pending";
  return "none";
}

/** outcome_status = invalid is the only thing that makes a lead invalid — matches the "유효 DB" KPI definition exactly. */
export function deriveIsValid(outcomeStatus: OutcomeStatus): boolean {
  return outcomeStatus !== "invalid";
}

export const CONSULTATION_STATUS_LABELS: Record<ConsultationStatus, string> = {
  new: "신규",
  booked: "예약 완료",
  connected: "상담 연결",
  unreachable: "부재",
  callback: "재통화 예정",
  rejected: "거절",
  invalid: "불량",
  other: "기타",
};

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  none: "예약 없음",
  pending: "예약 예정",
  confirmed: "예약 확정",
  cancelled: "예약 취소",
};

export const VISIT_STATUS_LABELS: Record<VisitStatus, string> = {
  none: "내원 예정 없음",
  scheduled: "내원 예정",
  visited: "내원 완료",
  cancelled: "내원 취소",
  no_show: "노쇼",
};

export const OUTCOME_STATUS_LABELS: Record<OutcomeStatus, string> = {
  confirmed: "예약",
  invalid: "불량",
  cancelled: "취소",
  pending: "미정",
  other: "기타",
};
