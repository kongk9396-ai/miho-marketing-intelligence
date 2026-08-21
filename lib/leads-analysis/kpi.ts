import type { LeadAnalysisRow } from "@/lib/leads-analysis/types";

export interface LeadsKpiSummary {
  totalDb: number;
  validDb: number;
  validDbRate: number | null;

  connected: number;
  connectedRate: number | null;

  confirmedBookings: number;
  bookingRate: number | null;

  visited: number;
  visitRate: number | null;
}

/**
 * 전체 DB = applied_at이 있는 row 수 (row-mapper.ts가 applied_at 없는 행은
 * 애초에 동기화하지 않으므로, leads 테이블의 모든 row가 곧 전체 DB다).
 * 유효 DB = outcome_status가 invalid가 아닌 row (leads.is_valid로 이미 그렇게
 * derive되어 저장됨 — status-mapping.ts의 deriveIsValid 참고).
 * 상담 연결률/예약률의 분모는 유효 DB.
 */
export function computeLeadsKpiSummary(rows: LeadAnalysisRow[]): LeadsKpiSummary {
  const totalDb = rows.length;
  const validRows = rows.filter((r) => r.is_valid);
  const validDb = validRows.length;

  const connected = validRows.filter(
    (r) => r.consultation_status === "connected" || r.consultation_status === "booked"
  ).length;

  const confirmedBookings = validRows.filter((r) => r.booking_status === "confirmed").length;

  const visited = validRows.filter((r) => r.visit_status === "visited").length;

  return {
    totalDb,
    validDb,
    validDbRate: totalDb > 0 ? (validDb / totalDb) * 100 : null,
    connected,
    connectedRate: validDb > 0 ? (connected / validDb) * 100 : null,
    confirmedBookings,
    bookingRate: validDb > 0 ? (confirmedBookings / validDb) * 100 : null,
    visited,
    visitRate: confirmedBookings > 0 ? (visited / confirmedBookings) * 100 : null,
  };
}

export interface LeadsCpaSummary {
  dbCpa: number | null;
  validDbCpa: number | null;
  connectedCpa: number | null;
  bookingCpa: number | null;
  visitedCpa: number | null;
}

/** Every CPA is spend / count, null (not a fabricated number) whenever the count is 0. */
export function computeLeadsCpaSummary(spend: number, kpi: LeadsKpiSummary): LeadsCpaSummary {
  return {
    dbCpa: kpi.totalDb > 0 ? spend / kpi.totalDb : null,
    validDbCpa: kpi.validDb > 0 ? spend / kpi.validDb : null,
    connectedCpa: kpi.connected > 0 ? spend / kpi.connected : null,
    bookingCpa: kpi.confirmedBookings > 0 ? spend / kpi.confirmedBookings : null,
    visitedCpa: kpi.visited > 0 ? spend / kpi.visited : null,
  };
}
