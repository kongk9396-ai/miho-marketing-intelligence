import "server-only";
import { getSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { throwSupabaseError } from "@/lib/meta/schema-not-ready";
import type { AnalysisReportInput, AnalysisReportRecord, ReportType } from "@/lib/reports/types";

/** Upserts on (report_type, start_date, end_date) — regenerating the same period overwrites, per spec section 21. */
export async function upsertAnalysisReport(input: AnalysisReportInput): Promise<AnalysisReportRecord> {
  const supabase = getSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("analysis_reports")
    .upsert({ ...input, status: "success" }, { onConflict: "report_type,start_date,end_date" })
    .select("*")
    .single();

  if (error) throwSupabaseError("리포트 저장", error);
  return data as AnalysisReportRecord;
}

export async function listAnalysisReports(reportType: ReportType, limit = 30): Promise<AnalysisReportRecord[]> {
  const supabase = getSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("analysis_reports")
    .select("*")
    .eq("report_type", reportType)
    .order("start_date", { ascending: false })
    .limit(limit);

  if (error) throwSupabaseError("리포트 이력 조회", error);
  return (data ?? []) as AnalysisReportRecord[];
}

export async function getAnalysisReportByPeriod(
  reportType: ReportType,
  startDate: string,
  endDate: string
): Promise<AnalysisReportRecord | null> {
  const supabase = getSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("analysis_reports")
    .select("*")
    .eq("report_type", reportType)
    .eq("start_date", startDate)
    .eq("end_date", endDate)
    .maybeSingle();

  if (error) throwSupabaseError("리포트 조회", error);
  return data as AnalysisReportRecord | null;
}
