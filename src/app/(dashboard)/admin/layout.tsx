import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { NAVIGATION_ITEMS } from "@/lib/constants";
import { getTrustedActorContext } from "@/lib/auth/permissions";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const actor = await getTrustedActorContext();
  const userName = actor?.name || "System Administrator";

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <AppHeader role="ADMIN" userName={userName} />
      <div className="flex flex-1">
        <AppSidebar items={NAVIGATION_ITEMS.admin} />
        <div className="flex-1 flex flex-col min-w-0">{children}</div>
      </div>
    </div>
  );
}
