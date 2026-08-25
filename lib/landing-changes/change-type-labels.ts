import type { LandingChangeType } from "@/lib/landing-changes/types";

export const LANDING_CHANGE_TYPE_LABELS: Record<LandingChangeType, string> = {
  layout: "레이아웃",
  copy: "본문",
  cta: "CTA",
  price: "가격",
  structure: "페이지 구조",
  other: "기타",
};
