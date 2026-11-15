import { formatReadableDate } from "@/lib/utils";
import { UserRole } from "@/types";
import { ShieldCheck, HeartHandshake, PhoneCall } from "lucide-react";

interface WelcomeSectionProps {
  userName: string;
  role: UserRole;
  isPatient?: boolean;
  patientSubtitle?: string;
}

export function WelcomeSection({
  userName,
  role,
  isPatient = false,
  patientSubtitle = "Here is your simple health schedule for today.",
}: WelcomeSectionProps) {
  const todayStr = formatReadableDate(new Date());

  if (isPatient) {
    return (
      <div className="rounded-2xl bg-gradient-to-r from-teal-800 to-teal-700 text-white p-6 md:p-8 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="inline-block px-3.5 py-1 rounded-full bg-teal-900/60 text-teal-100 text-sm font-semibold tracking-wide uppercase">
              {todayStr}
            </span>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              Good day, {userName}!
            </h1>
            <p className="text-xl text-teal-100 max-w-xl font-medium">
              {patientSubtitle}
            </p>
          </div>

          {/* Large SOS / Assistance Touch Button */}
          <div className="shrink-0 flex items-center">
            <a
              href="#request-help"
              className="w-full md:w-auto inline-flex items-center justify-center gap-3 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-extrabold text-xl px-7 py-4 rounded-xl shadow-lg border-2 border-red-400 focus:ring-4 focus:ring-red-300 transition-all min-h-[60px]"
            >
              <PhoneCall className="h-7 w-7 animate-pulse" />
              <span>Need Help / Caretaker</span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  const roleTitles: Record<UserRole, string> = {
    ADMIN: "Healthcare Administration Console",
    CARETAKER: "Caretaker Operations Center",
    FAMILY: "Family Circle Portal",
    PATIENT: "Patient Healthcare Dashboard",
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Welcome back, {userName}
          </h1>
          <ShieldCheck className="h-5 w-5 text-teal-700" />
        </div>
        <p className="text-sm text-slate-500 mt-1">
          {roleTitles[role]} &bull; Today is {todayStr}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-50 border border-teal-200 text-xs font-semibold text-teal-800">
          <HeartHandshake className="h-4 w-4" />
          <span>Care Network Connected</span>
        </span>
      </div>
    </div>
  );
}
