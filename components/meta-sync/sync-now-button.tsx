"use client";

import { useState, useTransition } from "react";
import { RefreshCw } from "lucide-react";
import { runManualMetaSyncAction } from "@/app/data/meta-sync/actions";
import { cn } from "@/lib/utils";

export function SyncNowButton() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const handleClick = () => {
    setResult(null);
    startTransition(async () => {
      const res = await runManualMetaSyncAction();
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
          "inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700",
          isPending && "cursor-not-allowed opacity-60"
        )}
      >
        <RefreshCw className={cn("h-3.5 w-3.5", isPending && "animate-spin")} strokeWidth={2} />
        지금 동기화
      </button>
      {result ? (
        <p className={cn("max-w-xs text-right text-xs", result.ok ? "text-green-600" : "text-red-600")}>
          {result.message}
        </p>
      ) : null}
    </div>
  );
}
