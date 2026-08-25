export type ReportType = "daily" | "weekly";

export interface AnalysisReportRecord {
  id: string;
  report_type: ReportType;
  start_date: string;
  end_date: string;
  campaign_name: string | null;
  ad_name: string | null;
  status: "pending" | "success" | "failed";
  summary: string | null;
  metrics_json: unknown;
  created_at: string;
}

export interface AnalysisReportInput {
  report_type: ReportType;
  start_date: string;
  end_date: string;
  summary: string;
  metrics_json: unknown;
}
