"use client";

import { useTransition } from "react";
import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export function RefreshCheckButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(() => {
      router.refresh();
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50",
        isPending && "cursor-not-allowed opacity-60"
      )}
    >
      <RefreshCw className={cn("h-3.5 w-3.5", isPending && "animate-spin")} strokeWidth={2} />
      다시 확인
    </button>
  );
}
