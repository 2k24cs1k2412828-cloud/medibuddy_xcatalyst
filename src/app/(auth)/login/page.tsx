import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ShieldCheck } from "lucide-react";
import { LoginClient } from "@/components/auth/login-client";

export const metadata: Metadata = {
  title: "Sign In & Patient Kiosk | MediCare Connect",
  description: "Secure role-based portal login and elderly-friendly patient kiosk access.",
  alternates: {
    canonical: "/login",
  },
};

export default function LoginPage() {
  return (
    <main className="min-h-screen flex flex-col justify-center items-center p-4 bg-slate-50 text-slate-900">
      {/* Brand Header */}
      <div className="mb-6 text-center space-y-3">
        <Link href="/" className="inline-flex items-center justify-center group">
          <Image
            src="/logo.png"
            alt="MediCare Connect Logo"
            width={280}
            height={98}
            className="h-16 w-auto object-contain group-hover:scale-[1.02] transition-transform"
            priority
          />
        </Link>
        <p className="text-sm text-slate-500 max-w-sm mx-auto">
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
    </main>
  );
}
