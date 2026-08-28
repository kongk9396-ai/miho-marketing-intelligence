"use client";

import { useMemo, useState } from "react";

type Recommendation =
  | "SCALE_REVIEW"
  | "KEEP"
  | "WATCH"
  | "CREATIVE_FIX"
  | "LANDING_FIX"
  | "OFF_REVIEW";

export type AdRankingRow = {
  adId: string;
  adName: string;
  campaignName: string;
  spend: number;
  ctr: number | null;
  cpc: number | null;
  recommendation: Recommendation;
  actualStatus: string | null;
};

const recommendationLabel: Record<Recommendation, string> = {
  SCALE_REVIEW: "예산 확대 검토",
  KEEP: "유지",
  WATCH: "관찰",
  CREATIVE_FIX: "소재 수정",
  LANDING_FIX: "랜딩 수정",
  OFF_REVIEW: "OFF 검토",
};

function won(v: number | null) {
  if (v === null) return "-";
  return `${Math.round(v).toLocaleString("ko-KR")}원`;
}

function percent(v: number | null) {
  if (v === null) return "-";
  return `${v.toFixed(2)}%`;
}

export function AdRankingTable({
  rows,
  compact = false,
}: {
  rows: AdRankingRow[];
  compact?: boolean;
}) {
  const [search, setSearch] = useState("");
  const [campaign, setCampaign] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [sort, setSort] = useState("spend_desc");

  const campaigns = useMemo(
    () =>
      Array.from(new Set(rows.map((r) => r.campaignName).filter(Boolean))).sort(),
    [rows]
  );

  const visible = useMemo(() => {
    let result = rows.filter((row) => {
      const keyword = search.trim().toLowerCase();

      const matchesSearch =
        !keyword ||
        row.adName.toLowerCase().includes(keyword) ||
        row.campaignName.toLowerCase().includes(keyword);

      const matchesCampaign =
        campaign === "ALL" || row.campaignName === campaign;

      const matchesStatus =
        status === "ALL" ||
        row.actualStatus === status ||
        row.recommendation === status;

      return matchesSearch && matchesCampaign && matchesStatus;
    });

    result = [...result].sort((a, b) => {
      switch (sort) {
        case "spend_asc":
          return a.spend - b.spend;
        case "ctr_desc":
          return (b.ctr ?? -1) - (a.ctr ?? -1);
        case "cpc_asc":
          return (a.cpc ?? Number.MAX_SAFE_INTEGER) -
            (b.cpc ?? Number.MAX_SAFE_INTEGER);
        case "name":
          return a.adName.localeCompare(b.adName, "ko");
        default:
          return b.spend - a.spend;
      }
    });

    return compact ? result.slice(0, 5) : result;
  }, [rows, search, campaign, status, sort, compact]);

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      {!compact ? (
        <div className="flex flex-wrap gap-2 border-b border-gray-100 p-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="광고명 또는 캠페인 검색"
            className="min-w-[220px] flex-1 rounded-md border border-gray-200 px-3 py-2 text-sm"
          />

          <select
            value={campaign}
            onChange={(e) => setCampaign(e.target.value)}
            className="rounded-md border border-gray-200 px-3 py-2 text-sm"
          >
            <option value="ALL">전체 캠페인</option>
            {campaigns.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-md border border-gray-200 px-3 py-2 text-sm"
          >
            <option value="ALL">전체 상태</option>
            <option value="ACTIVE">운영 중</option>
            <option value="PAUSED">일시중지</option>
            <option value="OFF">OFF</option>
            <option value="TESTING">테스트</option>
            <option value="OFF_REVIEW">OFF 검토</option>
            <option value="KEEP">유지 추천</option>
          </select>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="rounded-md border border-gray-200 px-3 py-2 text-sm"
          >
            <option value="spend_desc">광고비 높은 순</option>
            <option value="spend_asc">광고비 낮은 순</option>
            <option value="ctr_desc">CTR 높은 순</option>
            <option value="cpc_asc">CPC 낮은 순</option>
            <option value="name">광고명 순</option>
          </select>
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[850px] text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500">
            <tr>
              <th className="px-4 py-3 text-left">광고</th>
              <th className="px-4 py-3 text-left">캠페인</th>
              <th className="px-4 py-3 text-right">광고비</th>
              <th className="px-4 py-3 text-right">CTR</th>
              <th className="px-4 py-3 text-right">CPC</th>
              <th className="px-4 py-3 text-center">운영 상태</th>
              <th className="px-4 py-3 text-center">시스템 판단</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {visible.map((row) => (
              <tr key={row.adId} className="hover:bg-gray-50">
                <td className="max-w-[280px] px-4 py-3 font-medium text-gray-900">
                  <div className="truncate">{row.adName}</div>
                </td>

                <td className="max-w-[250px] px-4 py-3 text-gray-500">
                  <div className="truncate">{row.campaignName}</div>
                </td>

                <td className="px-4 py-3 text-right font-medium">
                  {won(row.spend)}
                </td>

                <td className="px-4 py-3 text-right">
                  {percent(row.ctr)}
                </td>

                <td className="px-4 py-3 text-right">
                  {won(row.cpc)}
                </td>

                <td className="px-4 py-3 text-center">
                  <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs">
                    {row.actualStatus ?? "미등록"}
                  </span>
                </td>

                <td className="px-4 py-3 text-center">
                  <span
                    className={
                      row.recommendation === "OFF_REVIEW"
                        ? "rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700"
                        : row.recommendation === "SCALE_REVIEW"
                          ? "rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700"
                          : "rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700"
                    }
                  >
                    {recommendationLabel[row.recommendation]}
                  </span>
                </td>
              </tr>
            ))}

            {visible.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-10 text-center text-sm text-gray-400"
                >
                  조건에 맞는 광고가 없습니다.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
