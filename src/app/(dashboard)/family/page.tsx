import { PageContainer } from "@/components/layout/page-container";
import { FamilyDashboardClient } from "@/components/family/family-dashboard-client";
import { getFamilyDashboardData } from "@/lib/actions/clinical-data.actions";

export default async function FamilyDashboardPage() {
  const data = await getFamilyDashboardData();

  return (
    <PageContainer>
      <FamilyDashboardClient initialData={data} />
    </PageContainer>
  );
}
