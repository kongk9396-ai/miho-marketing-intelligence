import { AdDiagnosisCard } from "@/components/ad-diagnosis/ad-diagnosis-card";
import type { CampaignAdDiagnosisGroup } from "@/lib/ad-diagnosis/build";

interface CampaignDiagnosisSectionProps {
  group: CampaignAdDiagnosisGroup;
}

export function CampaignDiagnosisSection({ group }: CampaignDiagnosisSectionProps) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white">
      <div className="border-b border-gray-200 px-5 py-4">
        <p className="text-sm font-semibold text-gray-900">{group.campaignName}</p>
        <p className="mt-1 text-sm leading-relaxed text-gray-600">{group.summary.summaryText}</p>
      </div>
      <div className="grid grid-cols-1 gap-4 p-5 lg:grid-cols-2">
        {group.ads.map((ad) => (
          <AdDiagnosisCard key={ad.adId} result={ad} />
        ))}
      </div>
    </section>
  );
}
