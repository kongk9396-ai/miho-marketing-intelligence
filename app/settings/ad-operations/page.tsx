import { PageHeader } from "@/components/layout/page-header";
import { AccountSettingsForm } from "@/components/ad-operations/account-settings-form";
import { CampaignSettingsForm } from "@/components/ad-operations/campaign-settings-form";
import { AdStatusForm } from "@/components/ad-operations/ad-status-form";
import { getMetaAdHierarchy } from "@/lib/creative-changes/repository";
import {
  getAdAccountSettings,
  getOffSnapshotsByStatusId,
  listAdOperationalStatuses,
  listCampaignSettings,
} from "@/lib/ad-operations/repository";
import { SchemaNotReadyError } from "@/lib/meta/schema-not-ready";

export const dynamic = "force-dynamic";

export default async function AdOperationsSettingsPage() {
  const header = (
    <PageHeader
      title="광고 운영 설정"
      description="Meta 공식 시작일, 계획 예산, 광고별 실제 운영 상태를 직접 등록/수정합니다. 이 값들은 /report 종합 보고 화면에 반영됩니다."
    />
  );

  let hierarchy;
  let accountSettings;
  let campaignSettings;
  let adStatuses;
  let snapshotsByStatusId;
  try {
    [hierarchy, accountSettings, campaignSettings, adStatuses, snapshotsByStatusId] = await Promise.all([
      getMetaAdHierarchy(),
      getAdAccountSettings(),
      listCampaignSettings(),
      listAdOperationalStatuses(),
      getOffSnapshotsByStatusId(),
    ]);
  } catch (err) {
    if (err instanceof SchemaNotReadyError) {
      return (
        <>
          {header}
          <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {err.message}
          </div>
        </>
      );
    }
    throw err;
  }

  return (
    <>
      {header}

      <section className="rounded-lg border border-gray-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-gray-900">전체 Meta 설정</h3>
        <p className="mt-1 text-xs text-gray-500">
          공식 시작일을 등록하지 않으면 보고 화면에는 데이터 기준 최초 집행일만 표시되고, 운영 N일째는
          계산되지 않습니다.
        </p>
        <div className="mt-4">
          <AccountSettingsForm settings={accountSettings} />
        </div>
      </section>

      <section className="mt-6 rounded-lg border border-gray-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-gray-900">캠페인별 설정</h3>
        <p className="mt-1 text-xs text-gray-500">캠페인별 공식 시작일과 계획 예산입니다.</p>
        <div className="mt-4">
          <CampaignSettingsForm hierarchy={hierarchy} settings={campaignSettings} />
        </div>
      </section>

      <section className="mt-6 rounded-lg border border-gray-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-gray-900">광고별 운영 상태</h3>
        <p className="mt-1 text-xs text-gray-500">
          운영 중 / 일시중지 / 종료(OFF) / 테스트 중 중 하나를 직접 기록합니다. 시스템의 자동진단 OFF 검토
          추천과는 별개이며, 시스템이 이 상태를 자동으로 바꾸지 않습니다. OFF로 저장하는 순간의 실제 지표가
          자동으로 스냅샷에 기록됩니다.
        </p>
        <div className="mt-4">
          <AdStatusForm hierarchy={hierarchy} statuses={adStatuses} snapshotsByStatusId={snapshotsByStatusId} />
        </div>
      </section>
    </>
  );
}
