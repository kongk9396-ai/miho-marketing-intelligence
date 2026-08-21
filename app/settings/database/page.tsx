import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge, type StatusVariant } from "@/components/ui/status-badge";
import { RefreshCheckButton } from "@/components/settings/refresh-check-button";
import { checkSupabaseConnection } from "@/lib/supabase/check-connection";

export const dynamic = "force-dynamic";

function overallStatus(status: Awaited<ReturnType<typeof checkSupabaseConnection>>): {
  label: string;
  variant: StatusVariant;
} {
  if (!status.envConfigured) {
    return { label: "환경변수 미설정", variant: "warning" };
  }
  if (!status.connected) {
    return { label: "연결 실패", variant: "danger" };
  }
  if (!status.schemaReady) {
    return { label: "테이블 없음", variant: "warning" };
  }
  return { label: "연결 정상", variant: "success" };
}

function formatCheckedAt(iso: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "medium",
  }).format(new Date(iso));
}

export default async function DatabaseSettingsPage() {
  const status = await checkSupabaseConnection();
  const overall = overallStatus(status);

  return (
    <>
      <PageHeader
        title="데이터베이스 연결 상태"
        description="Supabase PostgreSQL 연결 상태와 환경변수 설정 여부를 확인합니다."
        actions={<RefreshCheckButton />}
      />

      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-500">Supabase 연결 상태</p>
          <StatusBadge label={overall.label} variant={overall.variant} />
        </div>
        <p className="mt-2 text-base font-semibold text-gray-900">{status.message}</p>
        {status.errorDetail ? (
          <p className="mt-1.5 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">
            {status.errorDetail}
          </p>
        ) : null}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <p className="text-sm font-medium text-gray-500">데이터베이스 응답 여부</p>
          <p className="mt-2 text-base font-semibold text-gray-900">
            {status.connected ? "응답함" : "응답 없음"}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            {status.connected
              ? "Supabase 서버로부터 응답을 받았습니다."
              : "Supabase 서버로부터 응답을 받지 못했습니다."}
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <p className="text-sm font-medium text-gray-500">마지막 확인 시간</p>
          <p className="mt-2 text-base font-semibold text-gray-900">
            {formatCheckedAt(status.checkedAt)}
          </p>
          <p className="mt-1 text-xs text-gray-400">페이지를 새로고침하면 다시 확인합니다.</p>
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-5 py-3">
          <h3 className="text-sm font-semibold text-gray-900">환경변수 설정 여부</h3>
        </div>
        <ul className="divide-y divide-gray-100">
          {status.envVars.map((envVar) => (
            <li
              key={envVar.name}
              className="flex items-center justify-between px-5 py-3 text-sm"
            >
              <span className="font-mono text-gray-700">{envVar.name}</span>
              <StatusBadge
                label={envVar.isSet ? "설정됨" : "설정되지 않음"}
                variant={envVar.isSet ? "success" : "danger"}
              />
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
