import { PageContainer } from "@/components/layout/page-container";
import { AdminDashboardClient } from "@/components/admin/admin-dashboard-client";
import { getAdminDashboardData } from "@/lib/actions/clinical-data.actions";

export default async function AdminDashboardPage() {
  const data = await getAdminDashboardData();

  return (
    <PageContainer>
      <AdminDashboardClient initialData={data} />
    </PageContainer>
  );
}
