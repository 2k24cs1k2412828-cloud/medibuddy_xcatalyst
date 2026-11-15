import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { NAVIGATION_ITEMS } from "@/lib/constants";

export default function FamilyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <AppHeader role="FAMILY" userName="David Chen (Son)" />
      <div className="flex flex-1">
        <AppSidebar items={NAVIGATION_ITEMS.family} />
        <div className="flex-1 flex flex-col min-w-0">{children}</div>
      </div>
    </div>
  );
}
