const fs = require("fs");

const path = "./app/report/meeting/page.tsx";
let s = fs.readFileSync(path, "utf8");

const oldBlock = `        setGa4Sessions(String(data.sessions ?? 0));
        setGa4Cta(String(data.ctaClicks ?? 0));
        setGa4FormStart(String(data.formStarts ?? 0));
        setGa4FormComplete(String(data.formCompletes ?? 0));
        setActualDb(String(data.actualDb ?? 0));`;

const newBlock = `        setGa4Sessions(String(data.sessions ?? 0));
        setGa4Cta(String(data.ctaClicks ?? 0));
        setGa4FormStart(String(data.formStarts ?? 0));
        setGa4FormComplete(String(data.formCompletes ?? 0));

        // 실제 문의(DB)는 Supabase leads가 아니라
        // 원본 Google Sheet를 직접 읽는 meeting-leads API를 기준으로 사용한다.
        const leadsResponse = await fetch(
          \`/api/report/meeting-leads?start=\${currStart}&end=\${currEnd}\`,
          {
            cache: "no-store",
            signal: controller.signal,
          }
        );

        const leadsData = await leadsResponse.json();

        if (!leadsResponse.ok || !leadsData.ok) {
          throw new Error(
            leadsData.message || "실제 상담 DB를 불러오지 못했습니다."
          );
        }

        const totalActualDb = Array.isArray(leadsData.landings)
          ? leadsData.landings.reduce(
              (sum: number, landing: { actualDb?: number }) =>
                sum + Number(landing.actualDb ?? 0),
              0
            )
          : 0;

        setActualDb(String(totalActualDb));`;

if (!s.includes(oldBlock)) {
  throw new Error("기존 actualDb 자동조회 위치를 찾지 못했습니다.");
}

s = s.replace(oldBlock, newBlock);

fs.writeFileSync(path, s, "utf8");

console.log("✅ 실제 문의(DB)를 Google Sheet 원본 기준으로 변경 완료");
