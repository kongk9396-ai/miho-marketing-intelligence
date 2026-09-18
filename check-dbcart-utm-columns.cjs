const { loadEnvConfig } = require("@next/env");
loadEnvConfig(process.cwd());

const { google } = require("googleapis");

async function main() {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

  if (!clientEmail || !privateKey || !spreadsheetId) {
    throw new Error(
      "GOOGLE_CLIENT_EMAIL / GOOGLE_PRIVATE_KEY / GOOGLE_SHEETS_SPREADSHEET_ID 중 빠진 환경변수가 있습니다."
    );
  }

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });

  const sheets = google.sheets({
    version: "v4",
    auth,
  });

  const meta = await sheets.spreadsheets.get({
    spreadsheetId,
    fields: "sheets.properties.title",
  });

  const names = (meta.data.sheets || [])
    .map((s) => s.properties?.title)
    .filter(Boolean);

  console.log("\n===== 탭 목록 =====");
  console.log(names);

  for (const name of names) {
    if (
      name.includes("코첫") ||
      name.includes("첫코") ||
      name === "눈" ||
      name.includes("눈밑")
    ) {
      const res = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `'${name}'!1:2`,
        valueRenderOption: "FORMATTED_VALUE",
      });

      console.log(`\n===== ${name} =====`);
      console.log("헤더:");
      console.log(res.data.values?.[0] || []);
    }
  }
}

main().catch((err) => {
  console.error("\n❌ 오류");
  console.error(err);
});
