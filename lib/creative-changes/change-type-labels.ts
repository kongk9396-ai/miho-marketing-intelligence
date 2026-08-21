import type { ChangeType } from "@/lib/creative-changes/types";

export const CHANGE_TYPE_LABELS: Record<ChangeType, string> = {
  video: "영상",
  thumbnail: "썸네일",
  copy: "본문",
  hook: "후킹 문구",
  cta: "CTA",
  landing: "랜딩",
  price: "가격",
  event_text: "이벤트 문구",
  budget: "예산",
  target: "타겟",
  campaign_structure: "캠페인 구조",
  call_team: "콜팀",
  other: "기타",
};

export const OBSERVATION_STATUS_LABELS = {
  observing: "관찰 중",
  insufficient_data: "데이터 부족",
  verdict_ready: "판정 가능",
  rollback_review: "롤백 검토",
  winner_confirmed: "승자 확정",
} as const;
