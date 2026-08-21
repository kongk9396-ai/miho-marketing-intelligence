"use client";

import { useState, useTransition } from "react";
import { PlugZap } from "lucide-react";
import { testGmailConnectionAction } from "@/app/data/meta-sync/actions";
import { cn } from "@/lib/utils";

export function TestConnectionButton() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const handleClick = () => {
    setResult(null);
    startTransition(async () => {
      const res = await testGmailConnectionAction();
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
          "inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50",
          isPending && "cursor-not-allowed opacity-60"
        )}
      >
        <PlugZap className="h-3.5 w-3.5" strokeWidth={2} />
        연결 테스트
      </button>
      {result ? (
        <p className={cn("max-w-xs text-right text-xs", result.ok ? "text-green-600" : "text-red-600")}>
          {result.message}
        </p>
      ) : null}
    </div>
  );
}
