"use server";

import { revalidatePath } from "next/cache";
import { findActiveObservationConflict } from "@/lib/creative-changes/conflict-check";
import { deleteCreativeChange, getRecentChangesForAdOrCampaign, insertCreativeChange, updateCreativeChange } from "@/lib/creative-changes/repository";
import { CHANGE_TYPES, type ChangeType, type CreativeChangeInput } from "@/lib/creative-changes/types";
import type { RegisterChangeFormState } from "@/app/changes/creative/action-state";

export async function registerCreativeChangeAction(
  _prevState: RegisterChangeFormState,
  formData: FormData
): Promise<RegisterChangeFormState> {
  const force = formData.get("force") === "true";
  const parsed = parseFormInput(formData);
  if (!parsed.ok) {
    return { status: "error", message: parsed.error };
  }

  if (!force) {
    const recentChanges = await getRecentChangesForAdOrCampaign(
      parsed.value.ad_id,
      parsed.value.campaign_id
    );
    const conflict = findActiveObservationConflict(recentChanges);
    if (conflict) {
      return { status: "conflict", message: conflict.warningMessage };
    }
  }

  try {
    await insertCreativeChange({ ...parsed.value, forced: force });
    revalidatePath("/changes/creative");
    revalidatePath("/ads/before-after");
    revalidatePath("/");
    return { status: "success", message: "변경 이력이 등록되었습니다." };
  } catch (err) {
    return {
      status: "error",
      message: err instanceof Error ? err.message : "등록 중 오류가 발생했습니다.",
    };
  }
}

function parseFormInput(
  formData: FormData
): { ok: true; value: CreativeChangeInput } | { ok: false; error: string } {
  const adId = String(formData.get("adId") ?? "").trim();
  const adName = String(formData.get("adName") ?? "").trim() || null;
  const campaignId = String(formData.get("campaignId") ?? "").trim() || null;
  const campaignName = String(formData.get("campaignName") ?? "").trim() || null;
  const adsetId = String(formData.get("adsetId") ?? "").trim() || null;
  const adsetName = String(formData.get("adsetName") ?? "").trim() || null;
  const changedAtRaw = String(formData.get("changedAt") ?? "").trim();
  const changeType = String(formData.get("changeType") ?? "");
  const oldVersion = String(formData.get("oldVersion") ?? "").trim() || null;
  const newVersion = String(formData.get("newVersion") ?? "").trim() || null;
  const memo = String(formData.get("memo") ?? "").trim() || null;
  const periodChoice = String(formData.get("periodChoice") ?? "5");
  const customPeriodRaw = formData.get("customPeriodDays");

  if (!adId) return { ok: false, error: "광고를 선택해주세요." };
  if (!changedAtRaw) return { ok: false, error: "변경 일시를 입력해주세요." };
  if (!CHANGE_TYPES.includes(changeType as ChangeType)) {
    return { ok: false, error: "변경 유형을 선택해주세요." };
  }

  const changedAt = new Date(changedAtRaw);
  if (Number.isNaN(changedAt.getTime())) {
    return { ok: false, error: "변경 일시 형식이 올바르지 않습니다." };
  }

  let comparisonPeriodDays: number;
  if (periodChoice === "custom") {
    const customPeriod = Number(customPeriodRaw);
    if (!Number.isFinite(customPeriod) || customPeriod <= 0) {
      return { ok: false, error: "비교 기간을 올바르게 입력해주세요." };
    }
    comparisonPeriodDays = Math.round(customPeriod);
  } else {
    comparisonPeriodDays = Number(periodChoice);
  }

  return {
    ok: true,
    value: {
      campaign_id: campaignId,
      campaign_name: campaignName,
      adset_id: adsetId,
      adset_name: adsetName,
      ad_id: adId,
      ad_name: adName,
      changed_at: changedAt.toISOString(),
      change_type: changeType as ChangeType,
      old_version: oldVersion,
      new_version: newVersion,
      memo,
      comparison_period_days: comparisonPeriodDays,
      forced: false,
    },
  };
}

export async function updateCreativeChangeAction(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { status: "error", message: "수정할 소재 변경 ID가 없습니다." };

  const parsed = parseFormInput(formData);
  if (!parsed.ok) return { status: "error", message: parsed.error };

  try {
    await updateCreativeChange(id, parsed.value);
    revalidatePath("/changes/creative");
    revalidatePath("/ads/before-after");
    revalidatePath("/report");
    return { status: "success", message: "소재 변경 이력이 수정되었습니다." };
  } catch (err) {
    return {
      status: "error",
      message: err instanceof Error ? err.message : "수정 중 오류가 발생했습니다.",
    };
  }
}

export async function deleteCreativeChangeAction(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;

  await deleteCreativeChange(id);
  revalidatePath("/changes/creative");
  revalidatePath("/ads/before-after");
  revalidatePath("/report");
}
