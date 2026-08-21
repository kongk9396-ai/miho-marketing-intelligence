export interface UtmMappingRecord {
  id: string;
  campaign_name: string;
  ad_name: string;
  utm_campaign: string;
  utm_content: string;
  created_at: string;
  updated_at: string;
}

export interface UtmMappingInput {
  campaign_name: string;
  ad_name: string;
  utm_campaign: string;
  utm_content: string;
}
