import { createHash } from "node:crypto";

/** Digits only — "010-1234-5678" and "010 1234 5678" hash identically. */
export function normalizePhone(raw: string | null | undefined): string {
  return (raw ?? "").replace(/\D/g, "");
}

/**
 * Stable dedup key for a sheet row with no configured stable id column.
 * Built from the business date + normalized phone + UTM pair, never from
 * the raw phone digits alone — this value is what gets stored (as
 * lead_key), the phone itself never is. See docs on
 * lib/leads-sync/header-aliases.ts's `phone` alias for why phone is read at
 * all.
 */
export function computeLeadKey(input: {
  appliedAtIso: string;
  phone: string | null | undefined;
  utmCampaign: string | null | undefined;
  utmContent: string | null | undefined;
}): string {
  const normalizedPhone = normalizePhone(input.phone);
  const parts = [input.appliedAtIso, normalizedPhone, input.utmCampaign ?? "", input.utmContent ?? ""];
  return createHash("sha256").update(parts.join("|")).digest("hex");
}

/** A sheet-provided stable row id always wins over the computed hash — see status-mapping.ts's file comment on priority. */
export function computeLeadKeyFromSourceId(sourceRowId: string): string {
  return createHash("sha256").update(`source_id:${sourceRowId}`).digest("hex");
}
