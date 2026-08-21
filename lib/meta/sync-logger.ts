/**
 * Structured logging for the Meta sync pipeline. Deliberately accepts only a
 * whitelisted set of fields so a secret (OAuth token, service role key,
 * CRON_SECRET) can never be passed through by accident — there is no
 * "extra data" escape hatch.
 */
interface SyncLogFields {
  event:
    | "sync_start"
    | "emails_found"
    | "file_processed"
    | "sync_error"
    | "sync_complete";
  trigger?: "manual" | "cron";
  emailCount?: number;
  fileName?: string;
  rowCount?: number;
  status?: string;
  durationMs?: number;
  message?: string;
}

export function logSyncEvent(fields: SyncLogFields): void {
  console.log(
    JSON.stringify({
      scope: "meta-sync",
      timestamp: new Date().toISOString(),
      ...fields,
    })
  );
}
