const fs = require("fs");

const path = "./lib/meta/repository.ts";
let s = fs.readFileSync(path, "utf8");

const startMarker =
  "export async function upsertMetaDailyRows(rows: MetaDailyInsert[]): Promise<UpsertResult> {";

const endMarker =
  "\n}\n\n// --- meta_import_history";

const start = s.indexOf(startMarker);
const end = s.indexOf(endMarker, start);

if (start === -1 || end === -1) {
  throw new Error("upsertMetaDailyRows 함수 위치를 찾지 못했습니다.");
}

const replacement = `export async function upsertMetaDailyRows(
  rows: MetaDailyInsert[]
): Promise<UpsertResult> {
  if (rows.length === 0) {
    return { inserted: 0, updated: 0 };
  }

  /**
   * 한 Meta 보고서 안에서 동일한 date + ad_id가 여러 번 나오는 경우가 있다.
   *
   * PostgreSQL upsert는 한 SQL 명령 안에서 같은 conflict key를 두 번
   * 업데이트할 수 없으므로 저장 전에 중복 키를 정리한다.
   *
   * 동일 키가 여러 번 있으면 파일의 마지막 행을 사용한다.
   */
  const dedupedByKey = new Map<string, MetaDailyInsert>();

  for (const row of rows) {
    const key = \`\${row.date}|\${row.ad_id}\`;
    dedupedByKey.set(key, row);
  }

  const dedupedRows = [...dedupedByKey.values()];

  const supabase = getSupabaseServiceRoleClient();

  const adIds = [...new Set(dedupedRows.map((r) => r.ad_id))];
  const dates = [...new Set(dedupedRows.map((r) => r.date))];

  const { data: existingRows, error: lookupError } = await supabase
    .from("meta_daily")
    .select("date, ad_id")
    .in("ad_id", adIds)
    .in("date", dates);

  if (lookupError) {
    throwSupabaseError("meta_daily 조회", lookupError);
  }

  const existingKeys = new Set(
    (existingRows ?? []).map((r) => \`\${r.date}|\${r.ad_id}\`)
  );

  const updated = dedupedRows.filter((r) =>
    existingKeys.has(\`\${r.date}|\${r.ad_id}\`)
  ).length;

  const inserted = dedupedRows.length - updated;

  const { error: upsertError } = await supabase
    .from("meta_daily")
    .upsert(dedupedRows, {
      onConflict: "date,ad_id",
    });

  if (upsertError) {
    throwSupabaseError("meta_daily 저장", upsertError);
  }

  return {
    inserted,
    updated,
  };
}`;

s =
  s.slice(0, start) +
  replacement +
  s.slice(end + 2);

fs.writeFileSync(path, s, "utf8");

console.log("✅ Meta 동일 날짜 + 광고 중복 제거 패치 완료");
