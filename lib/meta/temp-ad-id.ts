import { createHash } from "node:crypto";

/**
 * Stable stand-in ad_id for a CSV row that has no real Ad ID column (or an
 * empty cell in that column). Built from campaign_name + adset_name +
 * ad_name so the same ad gets the same temp id across re-uploads — the
 * `temp:` prefix keeps it visually distinct from Meta's own numeric ad ids
 * in the database. Rows using this must be flagged via is_temp_ad_id so a
 * real ad_id can replace it later without silently merging into it.
 */
export function computeTempAdId(
  campaignName: string | null,
  adsetName: string | null,
  adName: string | null
): string {
  const parts = [campaignName ?? "", adsetName ?? "", adName ?? ""];
  return `temp:${createHash("sha256").update(parts.join("|")).digest("hex")}`;
}
