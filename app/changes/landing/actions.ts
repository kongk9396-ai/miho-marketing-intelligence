"use server";

import { revalidatePath } from "next/cache";
import { deleteLandingChange, insertLandingChange, updateLandingChange } from "@/lib/landing-changes/repository";
import { LANDING_CHANGE_TYPES, type LandingChangeInput, type LandingChangeType } from "@/lib/landing-changes/types";
import type { RegisterLandingChangeFormState } from "@/app/changes/landing/action-state";

export async function registerLandingChangeAction(
  _prevState: RegisterLandingChangeFormState,
  formData: FormData
): Promise<RegisterLandingChangeFormState> {
  const parsed = parseFormInput(formData);
  if (!parsed.ok) {
    return { status: "error", message: parsed.error };
  }

  try {
    await insertLandingChange(parsed.value);
    revalidatePath("/changes/landing");
    revalidatePath("/landing/before-after");
    revalidatePath("/report");
    return { status: "success", message: "랜딩 변경 이력이 등록되었습니다." };
  } catch (err) {
    return {
      status: "error",
      message: err instanceof Error ? err.message : "등록 중 오류가 발생했습니다.",
    };
  }
}

function parseFormInput(
  formData: FormData
): { ok: true; value: LandingChangeInput } | { ok: false; error: string } {
  const landingName = String(formData.get("landingName") ?? "").trim();
  const landingPagePattern = null;
  const linkedCampaignNames = formData
    .getAll("linkedCampaignNames")
    .map((value) => String(value).trim())
    .filter(Boolean);

  const linkedCampaignName =
    linkedCampaignNames.length > 0
      ? JSON.stringify(linkedCampaignNames)
      : null;
  const changedAtRaw = String(formData.get("changedAt") ?? "").trim();
  const changeType = String(formData.get("changeType") ?? "");
  const oldVersion = String(formData.get("oldVersion") ?? "").trim() || null;
  const newVersion = String(formData.get("newVersion") ?? "").trim() || null;
  const memo = String(formData.get("memo") ?? "").trim() || null;
  const periodChoice = String(formData.get("periodChoice") ?? "5");
  const customPeriodRaw = formData.get("customPeriodDays");

  if (!landingName) return { ok: false, error: "랜딩 이름을 입력해주세요." };
  if (!changedAtRaw) return { ok: false, error: "변경 일시를 입력해주세요." };
  if (!LANDING_CHANGE_TYPES.includes(changeType as LandingChangeType)) {
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
      landing_name: landingName,
      landing_page_pattern: landingPagePattern,
      linked_campaign_name: linkedCampaignName,
      changed_at: changedAt.toISOString(),
      change_type: changeType as LandingChangeType,
      old_version: oldVersion,
      new_version: newVersion,
      memo,
      comparison_period_days: comparisonPeriodDays,
      forced: false,
    },
  };
}

export async function updateLandingChangeAction(
  _prevState: RegisterLandingChangeFormState,
  formData: FormData
): Promise<RegisterLandingChangeFormState> {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { status: "error", message: "수정할 랜딩 변경 ID가 없습니다." };

  const parsed = parseFormInput(formData);
  if (!parsed.ok) return { status: "error", message: parsed.error };

  try {
    await updateLandingChange(id, parsed.value);
    revalidatePath("/changes/landing");
    revalidatePath("/landing/before-after");
    revalidatePath("/report");
    return { status: "success", message: "랜딩 변경 이력이 수정되었습니다." };
  } catch (err) {
    return {
      status: "error",
      message: err instanceof Error ? err.message : "수정 중 오류가 발생했습니다.",
    };
  }
}

export async function deleteLandingChangeAction(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;

  await deleteLandingChange(id);
  revalidatePath("/changes/landing");
  revalidatePath("/landing/before-after");
  revalidatePath("/report");
}


