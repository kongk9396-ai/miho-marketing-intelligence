import "server-only";
import { findUtmMappingForAd } from "@/lib/utm-mapping/repository";

export interface ResolvedUtm {
  utmCampaign: string;
  utmContent: string;
  source: "manual_mapping" | "auto_match";
}

/**
 * A manual utm_mappings row always wins. Failing that, falls back to the
 * common default where an ad account's utm_campaign/utm_content are simply
 * set to the Meta campaign/ad name — the combined view just shows no GA4
 * data if that guess doesn't match anything in ga4_daily.
 */
export async function resolveUtmForAd(
  campaignName: string | null,
  adName: string | null
): Promise<ResolvedUtm | null> {
  if (!campaignName || !adName) return null;

  const mapping = await findUtmMappingForAd(campaignName, adName);
  if (mapping) {
    return { utmCampaign: mapping.utm_campaign, utmContent: mapping.utm_content, source: "manual_mapping" };
  }

  return { utmCampaign: campaignName, utmContent: adName, source: "auto_match" };
}
