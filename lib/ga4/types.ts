export interface Ga4MainRow {
  date: string; // YYYY-MM-DD
  source: string;
  medium: string;
  campaign: string;
  content: string;
  landingPage: string;
  sessions: number;
  totalUsers: number;
  engagedSessions: number;
  engagementRate: number | null;
  avgSessionDuration: number | null;
  screenPageViews: number;
  keyEvents: number;
}

export const GA4_TRACKED_EVENTS = ["cta_click", "form_start", "form_complete", "scroll_depth"] as const;
export type Ga4TrackedEvent = (typeof GA4_TRACKED_EVENTS)[number];

export interface Ga4EventRow {
  date: string;
  campaign: string;
  content: string;
  landingPage: string;
  eventName: string;
  eventCount: number;
}

export interface Ga4MergedRow extends Ga4MainRow {
  ctaClicks: number;
  formStarts: number;
  formCompletes: number;
  scrollDepthEvents: number;
}

export interface Ga4DailyUpsertRow {
  date: string;
  source: string;
  medium: string;
  campaign: string;
  content: string;
  landing_page: string;
  sessions: number;
  users: number;
  engaged_sessions: number;
  engagement_rate: number | null;
  avg_session_duration: number | null;
  page_views: number;
  landing_views: number;
  cta_clicks: number;
  form_starts: number;
  form_completes: number;
  scroll_depth_events: number;
  key_events: number;
}

export interface Ga4DailyLike {
  date: string;
  sessions: number;
  users: number;
  engaged_sessions: number;
  page_views: number;
  cta_clicks: number;
  form_starts: number;
  form_completes: number;
  /** Only populated when the caller explicitly selects it (see getGa4DailyRows landingPagePattern filter) — optional so existing callers/mocks are unaffected. */
  landing_page?: string;
}
