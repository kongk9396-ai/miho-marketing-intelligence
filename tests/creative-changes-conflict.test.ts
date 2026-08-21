import { describe, expect, it } from "vitest";
import { findActiveObservationConflict } from "@/lib/creative-changes/conflict-check";
import type { CreativeChangeRecord } from "@/lib/creative-changes/types";

function change(overrides: Partial<CreativeChangeRecord>): CreativeChangeRecord {
  return {
    id: "id-1",
    campaign_id: "camp-1",
    campaign_name: "캠페인 A",
    adset_id: "adset-1",
    adset_name: "광고세트 A",
    ad_id: "ad-1",
    ad_name: "첫코 A",
    changed_at: "2026-08-18T10:00:00.000Z",
    change_type: "video",
    old_version: "v1",
    new_version: "v2",
    memo: null,
    comparison_period_days: 5,
    forced: false,
    created_at: "2026-08-18T10:00:00.000Z",
    updated_at: "2026-08-18T10:00:00.000Z",
    ...overrides,
  };
}

describe("findActiveObservationConflict — 변경 충돌 경고", () => {
  it("아직 관찰 중인 변경이 있으면 경고 정보를 반환한다", () => {
    const now = new Date("2026-08-20T10:00:00.000Z"); // D+2, still within 5-day window
    const conflict = findActiveObservationConflict([change({})], now);

    expect(conflict).not.toBeNull();
    expect(conflict?.warningMessage).toContain("8월 18일");
    expect(conflict?.warningMessage).toContain("영상");
    expect(conflict?.warningMessage).toContain("관찰 중");
  });

  it("관찰이 이미 완료된 변경은 충돌로 취급하지 않는다", () => {
    const now = new Date("2026-08-30T10:00:00.000Z"); // well past the 5-day window
    const conflict = findActiveObservationConflict([change({})], now);
    expect(conflict).toBeNull();
  });

  it("관찰 중인 변경이 없으면(빈 배열) null을 반환한다", () => {
    expect(findActiveObservationConflict([], new Date())).toBeNull();
  });

  it("여러 후보 중 가장 최신(첫 번째) 관찰 중 항목을 반환한다", () => {
    const now = new Date("2026-08-20T10:00:00.000Z");
    const changes = [
      change({ id: "id-2", changed_at: "2026-08-19T10:00:00.000Z", change_type: "thumbnail" }),
      change({ id: "id-1", changed_at: "2026-08-18T10:00:00.000Z", change_type: "video" }),
    ];

    const conflict = findActiveObservationConflict(changes, now);
    expect(conflict?.change.id).toBe("id-2");
  });
});
