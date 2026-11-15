import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { UserRole } from "@/types";
import { User, LogOut, Bell } from "lucide-react";
import { signOutUser } from "@/lib/auth/auth.service";

interface AppHeaderProps {
  role: UserRole;
  userName?: string;
  isPatient?: boolean;
}

export function AppHeader({ role, userName = "Demo User", isPatient = false }: AppHeaderProps) {
  const roleBadges: Record<UserRole, { label: string; variant: "default" | "secondary" | "success" | "warning" | "info" }> = {
    ADMIN: { label: "System Admin", variant: "default" },
    CARETAKER: { label: "Caretaker Portal", variant: "info" },
    FAMILY: { label: "Family Circle", variant: "success" },
    PATIENT: { label: "Patient View", variant: "warning" },
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-sm shadow-xs">
      <div className={`mx-auto flex h-16 items-center justify-between px-4 md:px-8 ${isPatient ? "max-w-5xl h-20" : "max-w-7xl"}`}>
        {/* Brand / Logo */}
        <Link href="/" className="flex items-center space-x-2.5 group">
          <Image
            src="/logo-icon.png"
            alt="MediCare Connect Logo"
            width={40}
            height={40}
            className="h-10 w-10 object-contain group-hover:scale-105 transition-transform"
            priority
          />
          <div>
            <span className={`font-bold tracking-tight text-slate-900 ${isPatient ? "text-2xl" : "text-xl"}`}>
              MediCare Connect
            </span>
            {!isPatient && (
              <span className="hidden sm:inline-block ml-2 text-xs font-medium text-slate-500">
                Healthcare Ecosystem
              </span>
            )}
          </div>
        </Link>

        {/* Center / Role Badge */}
        <div className="flex items-center space-x-3">
          <Badge variant={roleBadges[role].variant} className={isPatient ? "text-base px-3.5 py-1 font-bold" : ""}>
            {roleBadges[role].label}
          </Badge>
        </div>

        {/* Right Section: User & Quick Navigation */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {!isPatient && (
            <button
              type="button"
              className="relative min-h-[44px] min-w-[44px] flex items-center justify-center p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
              aria-label="View notifications"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-teal-600 ring-2 ring-white" />
            </button>
          )}

          <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
            <div className={`flex items-center justify-center rounded-full bg-slate-100 text-slate-700 font-semibold ${isPatient ? "h-11 w-11 text-lg" : "h-9 w-9 text-sm"}`}>
              <User className={isPatient ? "h-6 w-6" : "h-4 w-4"} />
            </div>
            <span className={`hidden md:inline-block font-medium text-slate-800 ${isPatient ? "text-lg font-bold" : "text-sm"}`}>
              {userName}
            </span>
          </div>

          <form action={signOutUser}>
            <button
              type="submit"
              className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 text-slate-500 hover:text-red-700 rounded-lg hover:bg-red-50 transition-colors"
              title="Sign out"
              aria-label="Sign out of MediCare Connect"
            >
              <LogOut className="h-5 w-5" />
              <span className="sr-only">Sign out</span>
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
