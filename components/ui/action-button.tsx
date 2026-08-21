"use client";

import { cloneElement, useState, useTransition } from "react";
import type { ReactElement } from "react";
import { cn } from "@/lib/utils";

interface ActionButtonProps {
  label: string;
  pendingLabel?: string;
  /**
   * A rendered icon element (e.g. `<PlugZap />`), not a component reference —
   * a bare `LucideIcon` component can't cross the server/client boundary as a
   * prop (RSC only allows plain values and rendered elements).
   */
  icon: ReactElement<{ className?: string }>;
  variant?: "primary" | "secondary";
  action: () => Promise<{ ok: boolean; message: string }>;
}

export function ActionButton({ label, pendingLabel, icon, variant = "secondary", action }: ActionButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const handleClick = () => {
    setResult(null);
    startTransition(async () => {
      const res = await action();
      setResult(res);
    });
  };

  return (
    <div className="flex flex-col items-end gap-1.5">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
          variant === "primary"
            ? "bg-blue-600 text-white hover:bg-blue-700"
            : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50",
          isPending && "cursor-not-allowed opacity-60"
        )}
      >
        {cloneElement(icon, {
          className: cn("h-3.5 w-3.5", isPending && "animate-spin", icon.props.className),
        })}
        {isPending ? (pendingLabel ?? label) : label}
      </button>
      {result ? (
        <p className={cn("max-w-xs text-right text-xs", result.ok ? "text-green-600" : "text-red-600")}>
          {result.message}
        </p>
      ) : null}
    </div>
  );
}
