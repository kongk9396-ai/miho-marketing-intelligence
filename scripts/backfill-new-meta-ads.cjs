const { loadEnvConfig } = require("@next/env");
loadEnvConfig(process.cwd());

const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  const { data: metaRows, error: metaError } = await supabase
    .from("meta_daily")
    .select("campaign_name,ad_name,ad_id,is_temp_ad_id,date")
    .order("date", { ascending: false })
    .limit(5000);

  if (metaError) throw metaError;

  const { data: statuses, error: statusError } = await supabase
    .from("ad_operational_status")
    .select("campaign_name,ad_name");

  if (statusError) throw statusError;

  const existing = new Set(
    (statuses ?? []).map(
      (r) => `${r.campaign_name}|||${r.ad_name}`
    )
  );

  const unique = new Map();

  for (const row of metaRows ?? []) {
    if (!row.campaign_name || !row.ad_name) continue;

    const key = `${row.campaign_name}|||${row.ad_name}`;

    if (!unique.has(key)) {
      unique.set(key, row);
    }
  }

  const missing = [...unique.values()].filter(
    (row) =>
      !existing.has(`${row.campaign_name}|||${row.ad_name}`)
  );

  console.log("현재 Meta 광고:", unique.size);
  console.log("자동등록 필요:", missing.length);

  for (const row of missing) {
    const { error } = await supabase
      .from("ad_operational_status")
      .upsert(
        {
          campaign_name: row.campaign_name,
          ad_name: row.ad_name,
          ad_id: row.is_temp_ad_id ? null : row.ad_id,
          status: "ACTIVE",
          status_changed_at: new Date().toISOString(),
          reason: "Meta 데이터 자동 감지",
          memo: null,
        },
        {
          onConflict: "campaign_name,ad_name",
        }
      );

    if (error) throw error;

    console.log(
      "등록:",
      row.campaign_name,
      "→",
      row.ad_name
    );
  }

  console.log("✅ 신규 광고 자동등록 완료");
})();
