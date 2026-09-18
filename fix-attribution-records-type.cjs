const fs = require("fs");

const path = "./app/api/report/meeting-leads/route.ts";
let s = fs.readFileSync(path, "utf8");

s = s.replace(
`import {
  attributionMatchKey,
  attributionSubmittedAtKey,
  fetchAttributionMatchMap,
  parseAttributionRecords,
} from "@/lib/leads-sync/attribution-repository";`,
`import {
  attributionMatchKey,
  attributionSubmittedAtKey,
  fetchAttributionMatchMap,
  parseAttributionRecords,
} from "@/lib/leads-sync/attribution-repository";
import type { AttributionRecord } from "@/lib/leads-sync/attribution-repository";`
);

s = s.replace(
`    let attributionRecords = [];`,
`    let attributionRecords: AttributionRecord[] = [];`
);

s = s.replace(
`      attributionRecords.forEach((record: any, index: number) => {`,
`      attributionRecords.forEach((record, index) => {`
);

fs.writeFileSync(path, s, "utf8");

console.log("✅ attributionRecords 타입 지정 완료");
