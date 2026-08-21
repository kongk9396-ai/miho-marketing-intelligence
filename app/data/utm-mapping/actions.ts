"use server";

import { revalidatePath } from "next/cache";
import { deleteUtmMapping, upsertUtmMapping } from "@/lib/utm-mapping/repository";

export interface UtmMappingActionResult {
  ok: boolean;
  message: string;
}

export async function saveUtmMappingAction(
  _prevState: UtmMappingActionResult,
  formData: FormData
): Promise<UtmMappingActionResult> {
  const campaignName = String(formData.get("campaignName") ?? "").trim();
  const adName = String(formData.get("adName") ?? "").trim();
  const utmCampaign = String(formData.get("utmCampaign") ?? "").trim();
  const utmContent = String(formData.get("utmContent") ?? "").trim();

  if (!campaignName || !adName) {
    return { ok: false, message: "캠페인과 광고를 선택해주세요." };
  }
  if (!utmCampaign || !utmContent) {
    return { ok: false, message: "utm_campaign과 utm_content를 입력해주세요." };
  }

  try {
    await upsertUtmMapping({
      campaign_name: campaignName,
      ad_name: adName,
      utm_campaign: utmCampaign,
      utm_content: utmContent,
    });
    revalidatePath("/data/utm-mapping");
    revalidatePath("/funnel/landing");
    return { ok: true, message: "UTM 매핑이 저장되었습니다." };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : "저장 중 오류가 발생했습니다.",
    };
  }
}

export async function removeUtmMappingAction(id: string): Promise<UtmMappingActionResult> {
  try {
    await deleteUtmMapping(id);
    revalidatePath("/data/utm-mapping");
    revalidatePath("/funnel/landing");
    return { ok: true, message: "삭제되었습니다." };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : "삭제 중 오류가 발생했습니다.",
    };
  }
}
