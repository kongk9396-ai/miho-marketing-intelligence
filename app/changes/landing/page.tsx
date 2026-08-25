import { PageHeader } from "@/components/layout/page-header";
import { RegisterLandingChangeForm } from "@/components/landing-changes/register-change-form";
import { LandingChangeListTable } from "@/components/landing-changes/change-list-table";
import { getDistinctLandingPages, getLandingChangeById, listLandingChanges } from "@/lib/landing-changes/repository";
import { getMetaAdHierarchy } from "@/lib/creative-changes/repository";
import { SchemaNotReadyError } from "@/lib/meta/schema-not-ready";

export const dynamic = "force-dynamic";

export default async function LandingChangesPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const params = await searchParams;
  const editId = params.edit ?? null;
  const header = (
    <PageHeader title="랜딩 변경" description="랜딩 페이지 개편 이력을 등록하고 전후 GA4 성과를 비교합니다." />
  );

  let landingPages;
  let hierarchy;
  let changes;
  try {
    [landingPages, hierarchy, changes] = await Promise.all([
      getDistinctLandingPages(),
      getMetaAdHierarchy(),
      listLandingChanges(100),
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

  const campaignNames = [...new Set(hierarchy.map((r) => r.campaignName).filter((n): n is string => !!n))];

  const editingChange = editId
    ? await getLandingChangeById(editId)
    : null;

  return (
    <>
      {header}

      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-gray-900">{editingChange ? "변경 이력 수정" : "변경 이력 등록"}</h3>
        <div className="mt-4">
          <RegisterLandingChangeForm landingPages={landingPages} campaignNames={campaignNames} initialChange={editingChange} />
        </div>
      </div>

      <div className="mt-6">
        <LandingChangeListTable changes={changes} />
      </div>
    </>
  );
}

