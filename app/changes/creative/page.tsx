import { PageHeader } from "@/components/layout/page-header";
import { RegisterChangeForm } from "@/components/creative-changes/register-change-form";
import { ChangeListTable } from "@/components/creative-changes/change-list-table";
import { getMetaAdHierarchy, listCreativeChanges } from "@/lib/creative-changes/repository";
import { SchemaNotReadyError } from "@/lib/meta/schema-not-ready";

export const dynamic = "force-dynamic";

export default async function CreativeChangesPage() {
  let hierarchy;
  let changes;
  try {
    [hierarchy, changes] = await Promise.all([getMetaAdHierarchy(), listCreativeChanges(100)]);
  } catch (err) {
    if (err instanceof SchemaNotReadyError) {
      return (
        <>
          <PageHeader title="소재 변경" description="광고 소재/랜딩/예산/타겟 등의 변경 이력을 등록합니다." />
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
      <PageHeader title="소재 변경" description="광고 소재/랜딩/예산/타겟 등의 변경 이력을 등록합니다." />

      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-gray-900">변경 이력 등록</h3>
        <div className="mt-4">
          <RegisterChangeForm hierarchy={hierarchy} />
        </div>
      </div>

      <div className="mt-6">
        <ChangeListTable changes={changes} />
      </div>
    </>
  );
}
