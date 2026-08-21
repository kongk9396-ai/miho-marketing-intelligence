import "server-only";
import { getSupabaseServiceRoleClient } from "@/lib/supabase/server";

export interface EnvVarStatus {
  name: string;
  isSet: boolean;
}

export interface SupabaseConnectionStatus {
  envVars: EnvVarStatus[];
  envConfigured: boolean;
  connected: boolean;
  schemaReady: boolean;
  message: string;
  errorDetail?: string;
  checkedAt: string;
}

const REQUIRED_ENV_VARS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const;

export async function checkSupabaseConnection(): Promise<SupabaseConnectionStatus> {
  const checkedAt = new Date().toISOString();

  const envVars: EnvVarStatus[] = REQUIRED_ENV_VARS.map((name) => ({
    name,
    isSet: Boolean(process.env[name]),
  }));
  const envConfigured = envVars.every((v) => v.isSet);

  if (!envConfigured) {
    return {
      envVars,
      envConfigured: false,
      connected: false,
      schemaReady: false,
      message: "환경변수가 설정되지 않았습니다.",
      checkedAt,
    };
  }

  try {
    const supabase = getSupabaseServiceRoleClient();
    const { error } = await supabase.from("meta_daily").select("id").limit(1);

    if (error) {
      const isMissingTable = error.code === "42P01";
      return {
        envVars,
        envConfigured: true,
        connected: true,
        schemaReady: !isMissingTable,
        message: isMissingTable
          ? "데이터베이스에 연결되었지만 아직 테이블이 생성되지 않았습니다."
          : "Supabase 연결에 실패했습니다.",
        errorDetail: error.message,
        checkedAt,
      };
    }

    return {
      envVars,
      envConfigured: true,
      connected: true,
      schemaReady: true,
      message: "데이터베이스 연결이 정상입니다.",
      checkedAt,
    };
  } catch (err) {
    return {
      envVars,
      envConfigured: true,
      connected: false,
      schemaReady: false,
      message: "Supabase 연결에 실패했습니다.",
      errorDetail: err instanceof Error ? err.message : String(err),
      checkedAt,
    };
  }
}
