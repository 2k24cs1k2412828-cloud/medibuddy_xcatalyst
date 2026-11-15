import { PageContainer } from "@/components/layout/page-container";
import { PatientDashboardClient } from "@/components/patient/patient-dashboard-client";

export default function PatientDashboardPage() {
  return (
    <PageContainer isPatient={true}>
      <PatientDashboardClient />
    </PageContainer>
  );
}
