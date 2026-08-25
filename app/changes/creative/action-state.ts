export interface RegisterChangeFormState {
  status: "idle" | "conflict" | "success" | "error";
  message: string;
}

export const initialRegisterChangeState: RegisterChangeFormState = { status: "idle", message: "" };
