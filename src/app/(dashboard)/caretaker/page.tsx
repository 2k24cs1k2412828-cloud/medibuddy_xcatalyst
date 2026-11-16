import { PageContainer } from "@/components/layout/page-container";
import { CaretakerDashboardClient } from "@/components/caretaker/caretaker-dashboard-client";
import { getCaretakerDashboardData } from "@/lib/actions/clinical-data.actions";

export default async function CaretakerDashboardPage() {
  const data = await getCaretakerDashboardData();

  return (
    <PageContainer>
      <CaretakerDashboardClient initialData={data} />
    </PageContainer>
  );
}
