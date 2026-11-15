import Link from "next/link";
import { Heart, ShieldCheck } from "lucide-react";
import { LoginClient } from "@/components/auth/login-client";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-slate-50 text-slate-900">
      {/* Brand Header */}
      <div className="mb-6 text-center space-y-2">
        <Link href="/" className="inline-flex items-center gap-2.5 group">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-700 text-white shadow-md group-hover:bg-teal-800 transition-colors">
            <Heart className="h-7 w-7 fill-white/20" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-slate-950">
            MediCare Connect
          </span>
        </Link>
        <p className="text-sm text-slate-500 max-w-sm">
          Secure healthcare portal for elderly patients, caregivers, and family members.
        </p>
      </div>

      {/* Main Interactive Login & Kiosk PIN Card */}
      <LoginClient />

      {/* Security Note */}
      <div className="mt-8 flex items-center gap-2 text-xs text-slate-500">
        <ShieldCheck className="h-4 w-4 text-teal-700" />
        <span>End-to-end encrypted session &bull; Role-based access control</span>
      </div>
    </div>
  );
}
