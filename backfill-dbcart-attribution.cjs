const { loadEnvConfig } = require("@next/env");
loadEnvConfig(process.cwd());

const XLSX = require("xlsx");
const { google } = require("googleapis");
const path = require("path");

const FILE = path.join(process.cwd(), "dbcart-firstnose.xls");

const spreadsheetId =
  process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

const sheetName =
  process.env.LEADS_ATTRIBUTION_SHEET_NAME ||
  "marketing_attribution_(건드리기x)";

function normalizeDate(v) {
  if (!v) return "";

  if (v instanceof Date) {
    const y = v.getFullYear();
    const m = String(v.getMonth() + 1).padStart(2, "0");
    const d = String(v.getDate()).padStart(2, "0");
    const h = String(v.getHours()).padStart(2, "0");
    const min = String(v.getMinutes()).padStart(2, "0");
    return `${y}-${m}-${d} ${h}:${min}`;
  }

  return String(v)
    .trim()
    .replace(/\./g, "-")
    .replace("/", " ");
}

async function main() {
  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_CLIENT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    scopes: [
      "https://www.googleapis.com/auth/spreadsheets",
    ],
  });

  const sheets = google.sheets({
    version: "v4",
    auth,
  });

  const workbook = XLSX.readFile(FILE, {
    cellDates: true,
  });

  const ws =
    workbook.Sheets[workbook.SheetNames[0]];

  const rows = XLSX.utils.sheet_to_json(ws, {
    defval: "",
  });

  const existingRes =
    await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `'${sheetName}'!A:Z`,
      valueRenderOption: "FORMATTED_VALUE",
    });

  const existing =
    existingRes.data.values || [];

  if (!existing.length) {
    throw new Error("attribution 시트 헤더가 없습니다.");
  }

  const headers = existing[0].map(String);

  function col(...names) {
    return names
      .map((n) =>
        headers.findIndex(
          (h) =>
            h.trim().toLowerCase() ===
            n.toLowerCase()
        )
      )
      .find((i) => i >= 0);
  }

  const submittedCol =
    col("submitted_at", "신청일", "신청시간");

  const landingCol =
    col("landing_name", "landing", "랜딩");

  const sourceCol =
    col("utm_source");

  const mediumCol =
    col("utm_medium");

  const campaignCol =
    col("utm_campaign");

  const contentCol =
    col("utm_content");

  const termCol =
    col("utm_term");

  const existingKeys = new Set();

  existing.slice(1).forEach((r) => {
    const submitted =
      submittedCol >= 0 ? String(r[submittedCol] || "") : "";

    const campaign =
      campaignCol >= 0 ? String(r[campaignCol] || "") : "";

    const content =
      contentCol >= 0 ? String(r[contentCol] || "") : "";

    existingKeys.add(
      `${submitted}|${campaign}|${content}`
    );
  });

  const output = [];

  for (const r of rows) {
    const submitted = normalizeDate(
      r["신청일"] ||
      r["신청날짜"]
    );

    if (!submitted) continue;

    const source =
      String(
        r["utm_source(출처)"] ||
        r["utm_source"] ||
        ""
      ).trim();

    const medium =
      String(
        r["utm_medium(매체/방식)"] ||
        r["utm_medium"] ||
        ""
      ).trim();

    const campaign =
      String(
        r["utm_campaign(캠페인)"] ||
        r["utm_campaign"] ||
        ""
      ).trim();

    const content =
      String(
        r["utm_content(콘텐츠 구분)"] ||
        r["utm_content"] ||
        ""
      ).trim();

    const term =
      String(
        r["utm_term(키워드)"] ||
        r["utm_term"] ||
        ""
      ).trim();

    const key =
      `${submitted}|${campaign}|${content}`;

    if (existingKeys.has(key)) {
      continue;
    }

    const row =
      new Array(headers.length).fill("");

    if (submittedCol >= 0)
      row[submittedCol] = submitted;

    if (landingCol >= 0)
      row[landingCol] = "코첫";

    if (sourceCol >= 0)
      row[sourceCol] = source;

    if (mediumCol >= 0)
      row[mediumCol] = medium;

    if (campaignCol >= 0)
      row[campaignCol] = campaign;

    if (contentCol >= 0)
      row[contentCol] = content;

    if (termCol >= 0)
      row[termCol] = term;

    output.push(row);
    existingKeys.add(key);
  }

  if (!output.length) {
    console.log("✅ 추가할 과거 attribution 없음");
    return;
  }

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `'${sheetName}'!A1`,
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: {
      values: output,
    },
  });

  console.log(
    `✅ 과거 attribution ${output.length}건 백필 완료`
  );
}

main().catch((e) => {
  console.error("❌", e);
  process.exitCode = 1;
});
