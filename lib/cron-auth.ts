import { createHash, timingSafeEqual } from "node:crypto";

function timingSafeEqualStrings(a: string, b: string): boolean {
  const hashA = createHash("sha256").update(a).digest();
  const hashB = createHash("sha256").update(b).digest();
  return timingSafeEqual(hashA, hashB);
}

/**
 * Pure, dependency-injected check so it's directly unit-testable without
 * touching process.env or a real Request object. Shared by every /api/sync/*
 * cron-triggered endpoint (Meta, GA4, ...).
 */
export function checkCronSecret(
  authorizationHeader: string | null,
  expectedSecret: string | undefined
): boolean {
  if (!expectedSecret) return false;
  if (!authorizationHeader) return false;

  const match = authorizationHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) return false;

  return timingSafeEqualStrings(match[1], expectedSecret);
}

export function isAuthorizedCronRequest(request: Request): boolean {
  return checkCronSecret(request.headers.get("authorization"), process.env.CRON_SECRET);
}

/**
 * Separate secret from CRON_SECRET on purpose: this one is held by an
 * external third party (DBcart, or whatever writes to it), not just
 * Render's own cron system, so it should be independently rotatable
 * without affecting the Meta/GA4/leads sync cron jobs.
 */
export function isAuthorizedAttributionIngestRequest(request: Request): boolean {
  return checkCronSecret(request.headers.get("authorization"), process.env.LEADS_ATTRIBUTION_INGEST_SECRET);
}
