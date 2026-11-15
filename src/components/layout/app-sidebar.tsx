"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavItem } from "@/types";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  UserCheck,
  ShieldAlert,
  Settings,
  HeartHandshake,
  Pill,
  Calendar,
  CheckSquare,
  AlertCircle,
  Bell,
  Activity,
  FileText,
  Sun,
  CheckCircle,
  HelpCircle,
  LucideIcon,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard,
  Users,
  UserCheck,
  ShieldAlert,
  Settings,
  HeartHandshake,
  Pill,
  Calendar,
  CheckSquare,
  AlertCircle,
  Bell,
  Activity,
  FileText,
  Sun,
  CheckCircle,
  HelpCircle,
};

interface AppSidebarProps {
  items: NavItem[];
  isPatient?: boolean;
}

export function AppSidebar({ items, isPatient = false }: AppSidebarProps) {
  const pathname = usePathname();

  if (isPatient) {
    // Patient layout: prominent large card tabs or top horizontal action bar
    return (
      <nav
        aria-label="Patient Navigation"
        className="bg-white border-b border-slate-200 px-4 py-3 sticky top-20 z-30 shadow-xs"
      >
        <div className="max-w-5xl mx-auto flex items-center justify-between overflow-x-auto gap-2 no-scrollbar py-1">
          {items.map((item) => {
            const IconComponent = ICON_MAP[item.icon] || Pill;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.title}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-5 py-3 rounded-xl font-bold text-lg transition-all min-h-[56px] whitespace-nowrap border-2",
                  isActive
                    ? "bg-teal-700 text-white border-teal-800 shadow-sm"
                    : "bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100 hover:border-slate-300"
                )}
              >
                <IconComponent className="h-6 w-6 shrink-0" />
                <span>{item.title}</span>
                {item.badge && (
                  <span
                    className={cn(
                      "px-2.5 py-0.5 rounded-full text-sm font-extrabold",
                      isActive
                        ? "bg-white text-teal-800"
                        : "bg-teal-100 text-teal-800"
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    );
  }

  return (
    <aside
      aria-label="Sidebar Navigation"
      className="hidden md:flex w-64 flex-col border-r border-slate-200 bg-white p-4 space-y-6 shrink-0 min-h-[calc(100vh-4rem)]"
    >
      <div className="space-y-1">
        {items.map((item) => {
          const IconComponent = ICON_MAP[item.icon] || LayoutDashboard;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.title}
              href={item.href}
              className={cn(
                "flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-teal-50 text-teal-900 font-semibold border-l-4 border-teal-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <div className="flex items-center gap-3">
                <IconComponent
                  className={cn(
                    "h-5 w-5",
                    isActive ? "text-teal-700" : "text-slate-400"
                  )}
                />
                <span>{item.title}</span>
              </div>
              {item.badge && (
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Quick Role Navigation for Review & Demonstration */}
      <div className="mt-auto p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Role Portals
          </span>
          <span className="text-[10px] text-teal-800 font-semibold bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200/60">
            Demo Nav
          </span>
        </div>
        <div className="grid grid-cols-2 gap-1.5 text-xs font-semibold">
          <Link
            href="/admin"
            className="p-2 text-center rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors shadow-2xs"
          >
            Admin
          </Link>
          <Link
            href="/caretaker"
            className="p-2 text-center rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors shadow-2xs"
          >
            Caretaker
          </Link>
          <Link
            href="/family"
            className="p-2 text-center rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors shadow-2xs"
          >
            Family
          </Link>
          <Link
            href="/patient"
            className="p-2 text-center rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 transition-colors shadow-2xs font-bold"
          >
            Patient Kiosk
          </Link>
        </div>
      </div>
    </aside>
  );
}
