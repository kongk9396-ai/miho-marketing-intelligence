const fs = require("fs");

const path = "./app/report/meeting-share/page.tsx";
let s = fs.readFileSync(path, "utf8");

s = s.replace(
  `{data.period.current.start} ~ {data.period.current.end}`,
  `{data.reportPeriod.start} ~ {data.reportPeriod.end}`
);

s = s.replace(
  `const s = data.summary;
  const p = data.previous;`,
  `const s = data.summary;
  const p = data.previous;
  const c = data.current;`
);

s = s.replaceAll(
  `s.spend`,
  `c.spend`
);

s = s.replaceAll(
  `s.impressions`,
  `c.impressions`
);

s = s.replaceAll(
  `s.linkClicks`,
  `c.linkClicks`
);

s = s.replaceAll(
  `s.landingViews`,
  `c.landingViews`
);

s = s.replaceAll(
  `s.ctr`,
  `c.ctr`
);

s = s.replaceAll(
  `s.cpc`,
  `c.cpc`
);

s = s.replaceAll(
  `s.lpvCost`,
  `c.lpvCost`
);

s = s.replaceAll(
  `s.cpm`,
  `c.cpm`
);

fs.writeFileSync(path, s, "utf8");

console.log("✅ 8/17~8/31 최종 보고기간 적용 완료");
