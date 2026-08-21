"use client";

import { useRef, useState, useTransition } from "react";
import { Upload } from "lucide-react";
import { uploadMetaCsvAction, type UploadActionResult } from "@/app/data/meta-csv-upload/actions";
import { cn } from "@/lib/utils";

export function UploadForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<UploadActionResult | null>(null);

  const handleSubmit = (formData: FormData) => {
    setResult(null);
    startTransition(async () => {
      const res = await uploadMetaCsvAction(formData);
      setResult(res);
      formRef.current?.reset();
      setFileName(null);
    });
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <form ref={formRef} action={handleSubmit} className="flex flex-col gap-3">
        <label
          htmlFor="file"
          className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed border-gray-300 px-6 py-10 text-center hover:border-blue-400"
        >
          <Upload className="h-6 w-6 text-gray-400" strokeWidth={2} />
          <span className="text-sm font-medium text-gray-700">
            {fileName ?? "CSV 또는 XLSX 파일을 선택하세요"}
          </span>
          <span className="text-xs text-gray-400">.csv, .xlsx 지원</span>
          <input
            id="file"
            name="file"
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
          />
        </label>

        <button
          type="submit"
          disabled={isPending || !fileName}
          className={cn(
            "inline-flex items-center justify-center gap-1.5 self-start rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700",
            (isPending || !fileName) && "cursor-not-allowed opacity-60"
          )}
        >
          {isPending ? "처리 중..." : "업로드"}
        </button>
      </form>

      {result ? (
        <div
          className={cn(
            "mt-4 rounded-md border px-4 py-3 text-sm",
            result.ok ? "border-green-200 bg-green-50 text-green-700" : "border-red-200 bg-red-50 text-red-700"
          )}
        >
          <p className="font-medium">{result.message}</p>
          {result.detail ? (
            <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs sm:grid-cols-3">
              <div>
                <dt className="text-gray-500">처리 파일</dt>
                <dd className="font-medium">{result.detail.fileName}</dd>
              </div>
              <div>
                <dt className="text-gray-500">날짜 범위</dt>
                <dd className="font-medium">
                  {result.detail.reportStartDate && result.detail.reportEndDate
                    ? result.detail.reportStartDate === result.detail.reportEndDate
                      ? result.detail.reportStartDate
                      : `${result.detail.reportStartDate} ~ ${result.detail.reportEndDate}`
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">신규 저장</dt>
                <dd className="font-medium">{result.detail.insertedCount}행</dd>
              </div>
              <div>
                <dt className="text-gray-500">업데이트</dt>
                <dd className="font-medium">{result.detail.updatedCount}행</dd>
              </div>
              <div>
                <dt className="text-gray-500">건너뜀</dt>
                <dd className="font-medium">{result.detail.skippedCount}행</dd>
              </div>
              <div>
                <dt className="text-gray-500">전체 행</dt>
                <dd className="font-medium">{result.detail.rowCount}행</dd>
              </div>
            </dl>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
