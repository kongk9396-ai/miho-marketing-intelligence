import "server-only";
import { google } from "googleapis";

const SHEETS_SCOPES = ["https://www.googleapis.com/auth/spreadsheets.readonly"];

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
