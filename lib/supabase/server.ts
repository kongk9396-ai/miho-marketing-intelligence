import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let serviceRoleClient: SupabaseClient | null = null;

/**
 * Server-only Supabase client using the service role key. This bypasses
 * Row Level Security, so it must never be imported from a Client Component
 * or exposed to the browser. Only import this from Server Components,
 * Server Actions, or Route Handlers.
 */
export function getSupabaseServiceRoleClient(): SupabaseClient {
  if (serviceRoleClient) {
    return serviceRoleClient;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Supabase 환경변수(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)가 설정되지 않았습니다."
    );
  }

  serviceRoleClient = createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
  return serviceRoleClient;
}
