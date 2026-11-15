import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { NAVIGATION_ITEMS } from "@/lib/constants";

export default function PatientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-900">
      <AppHeader role="PATIENT" userName="Robert Chen" isPatient={true} />
      <AppSidebar items={NAVIGATION_ITEMS.patient} isPatient={true} />
      <div className="flex-1 flex flex-col min-w-0">{children}</div>
    </div>
  );
}
