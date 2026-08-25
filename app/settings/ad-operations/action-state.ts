export interface AdOperationsActionState {
  status: "idle" | "success" | "error";
  message: string;
}

export const initialAdOperationsActionState: AdOperationsActionState = { status: "idle", message: "" };
