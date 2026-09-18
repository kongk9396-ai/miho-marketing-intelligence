const fs = require("fs");

const path = "./lib/meta/parser.ts";
let s = fs.readFileSync(path, "utf8");

s = s.replace(
`    const campaignName = nullableString(get("campaign_name"));
    const adsetName = nullableString(get("adset_name"));
    const adName = nullableString(get("ad_name"));`,
`    const campaignName = nullableString(get("campaign_name"));
    const adsetName = nullableString(get("adset_name"));
    const adName = nullableString(get("ad_name"));`
);

/*
 * 기존:
 * campaignName/adName 둘 다 없으면 합계행이라고 무조건 버림.
 *
 * 변경:
 * 이름이 없더라도 실제 성과 숫자가 있으면 전체 성과 행으로 허용.
 */
const oldBlock = `    if (!campaignName && !adName) {
      rowErrors.push({ rowNumber, message: "罹좏럹??愿묎퀬 ?대쫫???녿뒗 ?⑷퀎(?붿빟) ?됱쑝濡??먮떒?섏뼱 嫄대꼫?곷땲??" });
      return;
    }`;

if (s.includes(oldBlock)) {
  s = s.replace(
    oldBlock,
`    if (!campaignName && !adName) {
      const hasMetrics =
        Number(get("spend") ?? 0) !== 0 ||
        Number(get("impressions") ?? 0) !== 0 ||
        Number(get("reach") ?? 0) !== 0 ||
        Number(get("clicks") ?? 0) !== 0 ||
        Number(get("link_clicks") ?? 0) !== 0;

      if (!hasMetrics) {
        return;
      }
    }`
  );
}

/*
 * 이름이 없는 전체 수준 보고서도 안정적인 임시 ID 생성.
 */
s = s.replace(
`    const adId = realAdId || computeTempAdId(campaignName, adsetName, adName);`,
`    const adId =
      realAdId ||
      computeTempAdId(
        campaignName ?? "(전체 캠페인)",
        adsetName ?? "(전체 광고세트)",
        adName ?? "(전체 광고)"
      );`
);

fs.writeFileSync(path, s, "utf8");

console.log("✅ Meta 자유형 보고서 파서 적용 완료");
