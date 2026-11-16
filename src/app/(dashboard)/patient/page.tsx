import { PageContainer } from "@/components/layout/page-container";
import { PatientDashboardClient } from "@/components/patient/patient-dashboard-client";
import { getPatientKioskData } from "@/lib/actions/clinical-data.actions";

export default async function PatientDashboardPage() {
  const data = await getPatientKioskData();

  return (
    <PageContainer isPatient={true}>
      <PatientDashboardClient initialData={data} />
    </PageContainer>
  );
}
