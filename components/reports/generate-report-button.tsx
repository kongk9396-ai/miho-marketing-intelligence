"use client";

import { useActionState } from "react";
import { cn } from "@/lib/utils";

interface ActionState {
  status: "idle" | "success" | "error";
  message: string;
}

interface GenerateReportButtonProps {
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  initialState: ActionState;
  label: string;
}

export function GenerateReportButton({ action, initialState, label }: GenerateReportButtonProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex items-center gap-3">
      <button
        type="submit"
        disabled={isPending}
        className={cn(
          "inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700",
          isPending && "cursor-not-allowed opacity-60"
        )}
      >
        {isPending ? "생성 중..." : label}
      </button>
      {state.message ? (
        <p className={cn("text-sm", state.status === "success" ? "text-green-600" : "text-red-600")}>
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
