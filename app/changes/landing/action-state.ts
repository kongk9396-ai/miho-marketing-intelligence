export interface RegisterLandingChangeFormState {
  status: "idle" | "success" | "error";
  message: string;
}

export const initialRegisterLandingChangeState: RegisterLandingChangeFormState = { status: "idle", message: "" };
