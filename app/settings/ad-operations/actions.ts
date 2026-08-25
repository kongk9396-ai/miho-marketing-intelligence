"use server";

import { revalidatePath } from "next/cache";
import {
  insertAdOffSnapshot,
  upsertAdAccountSettings,
  upsertAdOperationalStatus,
  upsertCampaignSetting,
} from "@/lib/ad-operations/repository";
import { buildOffSnapshotMetrics } from "@/lib/ad-operations/snapshot";
import { AD_OPERATIONAL_STATUSES, type AdOperationalStatusValue } from "@/lib/ad-operations/types";
import type { AdOperationsActionState } from "@/app/settings/ad-operations/action-state";

function toNumberOrNull(value: FormDataEntryValue | null): number | null {
  const trimmed = String(value ?? "").trim();
  if (trimmed === "") return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

function toStringOrNull(value: FormDataEntryValue | null): string | null {
  const trimmed = String(value ?? "").trim();
  return trimmed === "" ? null : trimmed;
}

export async function saveAccountSettingsAction(
  _prevState: AdOperationsActionState,
  formData: FormData
): Promise<AdOperationsActionState> {
  try {
    await upsertAdAccountSettings({
      official_start_date: toStringOrNull(formData.get("officialStartDate")),
      planned_monthly_budget: toNumberOrNull(formData.get("plannedMonthlyBudget")),
      planned_daily_budget: toNumberOrNull(formData.get("plannedDailyBudget")),
    });
    revalidatePath("/settings/ad-operations");
    revalidatePath("/report");
    return { status: "success", message: "전체 Meta 설정이 저장되었습니다." };
  } catch (err) {
    return { status: "error", message: err instanceof Error ? err.message : "저장 중 오류가 발생했습니다." };
  }
}

export async function saveCampaignSettingAction(
  _prevState: AdOperationsActionState,
  formData: FormData
): Promise<AdOperationsActionState> {
  const campaignName = String(formData.get("campaignName") ?? "").trim();
  if (!campaignName) return { status: "error", message: "캠페인을 선택해주세요." };

  try {
    await upsertCampaignSetting({
      campaign_name: campaignName,
      campaign_id: toStringOrNull(formData.get("campaignId")),
      official_start_date: toStringOrNull(formData.get("officialStartDate")),
      planned_daily_budget: toNumberOrNull(formData.get("plannedDailyBudget")),
      planned_monthly_budget: toNumberOrNull(formData.get("plannedMonthlyBudget")),
    });
    revalidatePath("/settings/ad-operations");
    revalidatePath("/report");
    return { status: "success", message: "캠페인 설정이 저장되었습니다." };
  } catch (err) {
    return { status: "error", message: err instanceof Error ? err.message : "저장 중 오류가 발생했습니다." };
  }
}

export async function saveAdOperationalStatusAction(
  _prevState: AdOperationsActionState,
  formData: FormData
): Promise<AdOperationsActionState> {
  const campaignName = String(formData.get("campaignName") ?? "").trim();
  const adName = String(formData.get("adName") ?? "").trim();
  const adId = String(formData.get("adId") ?? "").trim() || null;
  const status = String(formData.get("status") ?? "");
  const statusChangedAt = toStringOrNull(formData.get("statusChangedAt"));
  const reason = String(formData.get("reason") ?? "").trim() || null;
  const memo = String(formData.get("memo") ?? "").trim() || null;

  if (!campaignName || !adName) return { status: "error", message: "광고를 선택해주세요." };
  if (!AD_OPERATIONAL_STATUSES.includes(status as AdOperationalStatusValue)) {
    return { status: "error", message: "운영 상태를 선택해주세요." };
  }
  if (!statusChangedAt) return { status: "error", message: "상태 변경일을 입력해주세요." };

  try {
    const record = await upsertAdOperationalStatus({
      campaign_name: campaignName,
      ad_name: adName,
      ad_id: adId,
      status: status as AdOperationalStatusValue,
      status_changed_at: statusChangedAt,
      reason,
      memo,
    });

    // OFF로 전환하는 순간의 실제 성과를 스냅샷으로 남긴다. 시스템이 상태를
    // 자동으로 바꾸는 것이 아니라, 사용자가 방금 저장한 OFF 상태에 대해서만
    // 그 시점 지표를 기록하는 것 — 자동 OFF 실행이 아니다.
    if (status === "OFF") {
      const metrics = await buildOffSnapshotMetrics(campaignName, adName);
      await insertAdOffSnapshot({ ad_operational_status_id: record.id, ...metrics });
    }

    revalidatePath("/settings/ad-operations");
    revalidatePath("/report");
    return { status: "success", message: "광고 운영 상태가 저장되었습니다." };
  } catch (err) {
    return { status: "error", message: err instanceof Error ? err.message : "저장 중 오류가 발생했습니다." };
  }
}
