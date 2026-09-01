import { NextRequest, NextResponse } from "next/server";
import { parseSheetDateTime } from "@/lib/leads-sync/parse-date";

import {
  fetchSheetRecords,
  listSheetTabNames,
} from "@/lib/leads-sync/sheets-client";

import {
  attributionMatchKey,
  attributionSubmittedAtKey,
  fetchAttributionMatchMap,
  parseAttributionRecords,
} from "@/lib/leads-sync/attribution-repository";
import type { AttributionRecord } from "@/lib/leads-sync/attribution-repository";

export const dynamic = "force-dynamic";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

type RawRow = Record<string, unknown>;

function text(value: unknown): string {
  return String(value ?? "").trim();
}

function pick(row: RawRow, aliases: string[]): string {
  for (const alias of aliases) {
    if (Object.prototype.hasOwnProperty.call(row, alias)) {
      const value = text(row[alias]);
      if (value) return value;
    }
  }

  return "";
}

function parseMeetingLeadDateTime(value: string): string | null {
  const text = String(value ?? "").trim();

  if (!text) return null;

  // 예: 2026.08.12/20:55
  //     2026.08.12 20:55
  //     2026-08-12 20:55
  const match = text.match(
    /^(\d{4})[.\/-](\d{1,2})[.\/-](\d{1,2})(?:[\/\sT]+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/
  );

  if (!match) {
    return parseSheetDateTime(text);
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const hour = Number(match[4] ?? 0);
  const minute = Number(match[5] ?? 0);
  const second = Number(match[6] ?? 0);

  // 입력값은 한국시간(KST, UTC+9)
  const utcMs = Date.UTC(
    year,
    month - 1,
    day,
    hour - 9,
    minute,
    second
  );

  return new Date(utcMs).toISOString();
}

function dateOnly(value: string): string | null {
  const match = value.match(/(\d{4})[-./](\d{1,2})[-./](\d{1,2})/);

  if (!match) return null;

  return [
    match[1],
    match[2].padStart(2, "0"),
    match[3].padStart(2, "0"),
  ].join("-");
}

const DATE_HEADERS = [
  "유입날짜",
  "신청날짜",
  "접수일",
  "접수일자",
  "등록일시",
  "신청일시",
  "submitted_at",
  "applied_at",
];

const AD_HEADERS = [
  "광고소재",
  "광고 소재",
  "소재",
  "utm_content",
  "UTM Content",
  "콘텐츠",
];

const LANDING_HEADERS = [
  "landing_name",
  "랜딩명",
  "랜딩",
  "관심시술",
  "시술명",
  "시술분류",
];

const MEDIA_HEADERS = [
  "매체",
  "유입경로",
  "utm_source",
  "UTM Source",
];

function classifyLanding(
  sheetName: string,
  row: RawRow
): "first_nose" | "under_eye" | null {
  const combined = [
    sheetName,
    pick(row, LANDING_HEADERS),
    pick(row, AD_HEADERS),
  ]
    .join(" ")
    .toLowerCase();

  if (
    sheetName.trim() === "눈" ||
    combined.includes("눈밑") ||
    combined.includes("눈밑지") ||
    combined.includes("하안검")
  ) {
    return "under_eye";
  }

  if (
    combined.includes("코첫") ||
    combined.includes("첫코") ||
    combined.includes("첫 코") ||
    combined.includes("남자코")
  ) {
    return "first_nose";
  }

  return null;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const start = searchParams.get("start");
  const end = searchParams.get("end");

  if (
    !start ||
    !end ||
    !DATE_RE.test(start) ||
    !DATE_RE.test(end)
  ) {
    return NextResponse.json(
      {
        ok: false,
        message: "올바른 시작일과 종료일이 필요합니다.",
      },
      { status: 400 }
    );
  }

  try {
    const sheetNames = await listSheetTabNames();

    // DBcart에서 저장한 UTM / 랜딩 / 광고소재 정보를 불러온다.
    // 상담 시트의 실제 행과 source_sheet + source_row로 연결한다.
    const attributionMap =
      await fetchAttributionMatchMap(
        process.env.LEADS_ATTRIBUTION_SHEET_NAME || "marketing_attribution",
        fetchSheetRecords
      );

    const attributionSheetName =
      process.env.LEADS_ATTRIBUTION_SHEET_NAME ||
      "marketing_attribution_(건드리기x)";

    let attributionRecords: AttributionRecord[] = [];

    try {
      const rawAttributionRecords =
        await fetchSheetRecords(attributionSheetName);

      attributionRecords =
        parseAttributionRecords(rawAttributionRecords);
    } catch {
      attributionRecords = [];
    }

    const usedAttributionIndexes = new Set<number>();

    function resolveLandingFromAttribution(record: any) {
      const text = [
        record?.landingName,
        record?.utmCampaign,
        record?.utmContent,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      if (
        text.includes("눈밑") ||
        text.includes("눈") ||
        text.includes("under_eye") ||
        text.includes("undereye")
      ) {
        return "under_eye";
      }

      if (
        text.includes("코첫") ||
        text.includes("첫코") ||
        text.includes("firstnose") ||
        text.includes("first_nose")
      ) {
        return "first_nose";
      }

      return null;
    }

    function findNearestAttribution(
      appliedAtIso: string | null,
      landingKey: "first_nose" | "under_eye" | null
    ) {
      if (!appliedAtIso) return null;

      const appliedMs = new Date(appliedAtIso).getTime();

      if (!Number.isFinite(appliedMs)) {
        return null;
      }

      let bestIndex = -1;
      let bestDiff = Infinity;

      attributionRecords.forEach((record, index) => {
        if (usedAttributionIndexes.has(index)) {
          return;
        }

        if (!record?.submittedAt) {
          return;
        }

        const attributionLanding =
          resolveLandingFromAttribution(record);

        if (
          landingKey &&
          attributionLanding &&
          attributionLanding !== landingKey
        ) {
          return;
        }

        const submittedMs =
          new Date(record.submittedAt).getTime();

        if (!Number.isFinite(submittedMs)) {
          return;
        }

        const diff =
          Math.abs(submittedMs - appliedMs);

        // DBcart 저장과 attribution 기록 사이 최대 10분만 허용
        if (diff <= 10 * 60 * 1000 && diff < bestDiff) {
          bestDiff = diff;
          bestIndex = index;
        }
      });

      if (bestIndex === -1) {
        return null;
      }

      usedAttributionIndexes.add(bestIndex);

      return attributionRecords[bestIndex];
    }

    /*
     * 실제 상담 DB 후보 탭만 읽는다.
     * 개별 코첫/눈 탭 구조와 통합 상담DB 구조 모두 대응.
     */
    const candidateSheets = sheetNames.filter((name) => {
      const n = name.toLowerCase();

      return (
        n.includes("코첫") ||
        n.includes("첫코") ||
        n === "눈" ||
        n.includes("눈밑") ||
        n.includes("상담db") ||
        n.includes("상담 db")
      );
    });

    const targets =
      candidateSheets.length > 0
        ? candidateSheets
        : sheetNames;

    const groups = {
      first_nose: {
        key: "first_nose",
        label: "코첫",
        actualDb: 0,
        ads: new Map<string, number>(),
      },
      under_eye: {
        key: "under_eye",
        label: "눈밑",
        actualDb: 0,
        ads: new Map<string, number>(),
      },
    };

    let scannedRows = 0;
    let attributionMatchedRows = 0;

    const attributionSamples = attributionRecords
      .filter((r) => r.submittedAt)
      .slice(0, 5)
      .map((r) => ({
        submittedAt: r.submittedAt,
        utmCampaign: r.utmCampaign,
        utmContent: r.utmContent,
      }));

    const leadTimeSamples: Array<{
      sheet: string;
      rawDate: string;
      parsedDate: string | null;
    }> = [];

    for (const sheetName of targets) {
      let records: RawRow[];

      try {
        records = await fetchSheetRecords(sheetName);
      } catch {
        continue;
      }

      for (let rowIndex = 0; rowIndex < records.length; rowIndex += 1) {
        const row = records[rowIndex];
        const sourceRowNumber = rowIndex + 2;

        scannedRows += 1;

        const rawDate = pick(row, DATE_HEADERS);
        const date = dateOnly(rawDate);

        // 선택 기간 밖 DB는 attribution을 절대 소비하지 않는다.
        if (!date || date < start || date > end) {
          continue;
        }

        const appliedAtIso = parseMeetingLeadDateTime(rawDate);

        if (leadTimeSamples.length < 5) {
          leadTimeSamples.push({
            sheet: sheetName,
            rawDate,
            parsedDate: appliedAtIso,
          });
        }

        const rowLanding =
          classifyLanding(sheetName, row);

        let attribution =
          attributionMap?.get(
            attributionMatchKey(sheetName, sourceRowNumber)
          ) ??
          (appliedAtIso
            ? attributionMap?.get(
                attributionSubmittedAtKey(appliedAtIso)
              )
            : null) ??
          null;

        if (!attribution) {
          attribution =
            findNearestAttribution(
              appliedAtIso,
              rowLanding
            );
        }

        if (attribution) {
          attributionMatchedRows += 1;
        }

        const media = pick(row, MEDIA_HEADERS).toLowerCase();

        /*
         * 매체값이 있다면 Meta 계열만 사용.
         * 값 자체가 없는 기존 DB 시트는 랜딩/광고명으로 분류 가능하게 둔다.
         */
        if (
          media &&
          !media.includes("meta") &&
          !media.includes("메타")
        ) {
          continue;
        }

        let landing = classifyLanding(sheetName, row);

        // 상담 시트 자체에 랜딩명이 없으면 DBcart attribution 값으로 보완
        if (!landing && attribution) {
          const attributionText = [
            attribution.landingName,
            attribution.utmCampaign,
            attribution.utmContent,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          if (
            attributionText.includes("눈밑") ||
            attributionText.includes("under_eye") ||
            attributionText.includes("undereye")
          ) {
            landing = "under_eye";
          } else if (
            attributionText.includes("코첫") ||
            attributionText.includes("첫코") ||
            attributionText.includes("firstnose") ||
            attributionText.includes("first_nose")
          ) {
            landing = "first_nose";
          }
        }

        if (!landing) {
          continue;
        }

        const group = groups[landing];

        group.actualDb += 1;

        const ad =
          pick(row, AD_HEADERS) ||
          attribution?.utmContent ||
          "(광고소재 미확인)";

        group.ads.set(
          ad,
          (group.ads.get(ad) ?? 0) + 1
        );
      }
    }

    return NextResponse.json({
      ok: true,
      start,
      end,
      scannedRows,

      attributionDebug: {
        available: attributionMap !== null,
        entries: attributionMap?.size ?? 0,
        matchedRows: attributionMatchedRows,
      },

      timeDebug: {
        attributionSamples,
        leadTimeSamples,
      },

      landings: [
        {
          key: groups.first_nose.key,
          label: groups.first_nose.label,
          actualDb: groups.first_nose.actualDb,
          ads: [...groups.first_nose.ads.entries()]
            .map(([adName, db]) => ({
              adName,
              db,
            }))
            .sort((a, b) => b.db - a.db),
        },

        {
          key: groups.under_eye.key,
          label: groups.under_eye.label,
          actualDb: groups.under_eye.actualDb,
          ads: [...groups.under_eye.ads.entries()]
            .map(([adName, db]) => ({
              adName,
              db,
            }))
            .sort((a, b) => b.db - a.db),
        },
      ],
    });
  } catch (error) {
    console.error("[meeting-leads]", error);

    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : "Google Sheet DB를 읽지 못했습니다.",
      },
      { status: 500 }
    );
  }
}
