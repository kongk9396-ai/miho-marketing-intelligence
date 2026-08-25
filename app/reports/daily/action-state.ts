export interface GenerateReportActionState {
  status: "idle" | "success" | "error";
  message: string;
}

export const initialGenerateReportState: GenerateReportActionState = { status: "idle", message: "" };
