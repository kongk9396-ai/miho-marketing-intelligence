"use client";

import { useRouter } from "next/navigation";
import type { VideoAdSummary } from "@/lib/video-analysis/summary";

interface VideoAdSelectorProps {
  ads: VideoAdSummary[];
  selectedId: string;
}

export function VideoAdSelector({ ads, selectedId }: VideoAdSelectorProps) {
  const router = useRouter();

  return (
    <select
      value={selectedId}
      onChange={(e) => router.push(`/ads-analysis/video-analysis?adId=${e.target.value}`)}
      className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
    >
      {ads.map((ad) => (
        <option key={ad.adId} value={ad.adId}>
          {ad.adName ?? ad.adId}
        </option>
      ))}
    </select>
  );
}
