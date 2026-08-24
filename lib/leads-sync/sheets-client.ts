import "server-only";
import { google } from "googleapis";

// Read-write: this app's own leads-sync reads consultation sheets and
// writes only to the app-owned marketing_attribution tab it creates itself
// (see ensureAttributionSheetExists) — it never writes to the consultation
// team's 코첫/코재/눈 tabs. The service account must be shared on the
// spreadsheet as "편집자"(Editor), not just "뷰어"(Viewer), for the write
// half (tab creation + header row) to succeed; read-only access still works
// for everything else if only Viewer was granted.
const SHEETS_SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Google Sheets 환경변수(${name})가 설정되지 않았습니다.`);
  }
  return value;
}

export function isSheetsConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_SHEETS_SPREADSHEET_ID && process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY
  );
}

export function getMissingSheetsEnvVars(): string[] {
  return ["GOOGLE_SHEETS_SPREADSHEET_ID", "GOOGLE_CLIENT_EMAIL", "GOOGLE_PRIVATE_KEY"].filter(
    (name) => !process.env[name]
  );
}

export function getSpreadsheetId(): string {
  return requireEnv("GOOGLE_SHEETS_SPREADSHEET_ID");
}

/**
 * Reuses the same GA4 service account (GOOGLE_CLIENT_EMAIL / GOOGLE_PRIVATE_KEY,
 * see lib/ga4/client.ts) rather than introducing a second Google credential
 * pair — that account just needs Sheets API enabled in the same GCP project
 * and Viewer access shared on the target spreadsheet. The private key never
 * leaves the server: this client is only ever imported from server-only code.
 */
export function createSheetsClient() {
  const clientEmail = requireEnv("GOOGLE_CLIENT_EMAIL");
  const privateKey = requireEnv("GOOGLE_PRIVATE_KEY").replace(/\\n/g, "\n");

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: SHEETS_SCOPES,
  });

  return google.sheets({ version: "v4", auth });
}

/** Tab names actually present in the configured spreadsheet, for the mapping-settings UI and connection test. */
export async function listSheetTabNames(): Promise<string[]> {
  const sheets = createSheetsClient();
  const spreadsheetId = getSpreadsheetId();

  const response = await sheets.spreadsheets.get({ spreadsheetId, fields: "sheets.properties.title" });
  return (response.data.sheets ?? []).map((s) => s.properties?.title).filter((t): t is string => Boolean(t));
}

export interface EnsureSheetResult {
  sheetName: string;
  created: boolean; // true = this call created it; false = it already existed (never recreated/overwritten)
  headerWritten: boolean;
}

/**
 * Creates `sheetName` as a new tab (with `headers` as its first row) if it
 * doesn't already exist in the configured spreadsheet — idempotent: an
 * existing tab is left completely untouched (not even its header row is
 * rewritten), so this is safe to call on every sync run. Never touches any
 * other tab. Requires the service account to have Editor (not just Viewer)
 * access on the spreadsheet; a permission error propagates to the caller
 * rather than being swallowed, since tab creation is an explicit,
 * user-requested action, not best-effort background enrichment.
 */
export async function ensureAttributionSheetExists(
  sheetName: string,
  headers: readonly string[]
): Promise<EnsureSheetResult> {
  const sheets = createSheetsClient();
  const spreadsheetId = getSpreadsheetId();

  const existingTabs = await listSheetTabNames();
  if (existingTabs.includes(sheetName)) {
    return { sheetName, created: false, headerWritten: false };
  }

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [{ addSheet: { properties: { title: sheetName } } }],
    },
  });

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${sheetName}!A1`,
    valueInputOption: "RAW",
    requestBody: { values: [[...headers]] },
  });

  return { sheetName, created: true, headerWritten: true };
}

/**
 * Appends a single row to the end of `sheetName`. Used only for the
 * app-owned marketing_attribution tab (see appendAttributionRecord in
 * attribution-repository.ts) — never for the consultation team's sheets.
 */
export async function appendRow(sheetName: string, values: unknown[]): Promise<void> {
  const sheets = createSheetsClient();
  const spreadsheetId = getSpreadsheetId();

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${sheetName}!A1`,
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: [values] },
  });
}

/**
 * Row-oriented records for one sheet tab: first row is headers, everything
 * after is data. FORMATTED_VALUE so dates/numbers arrive as the same text a
 * person sees in the sheet, matching how the CSV/XLSX parser already reads
 * Meta exports.
 */
export async function fetchSheetRecords(sheetName: string): Promise<Record<string, unknown>[]> {
  const sheets = createSheetsClient();
  const spreadsheetId = getSpreadsheetId();

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: sheetName,
    valueRenderOption: "FORMATTED_VALUE",
  });

  const values = response.data.values ?? [];
  if (values.length === 0) return [];

  const [headerRow, ...dataRows] = values;
  const headers = headerRow.map((h) => String(h ?? "").trim());

  return dataRows
    .filter((row) => row.some((cell) => String(cell ?? "").trim() !== ""))
    .map((row) => {
      const record: Record<string, unknown> = {};
      headers.forEach((header, i) => {
        if (header) record[header] = row[i] ?? "";
      });
      return record;
    });
}
