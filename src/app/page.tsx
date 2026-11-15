import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Heart,
  Pill,
  Users,
  ShieldCheck,
  Bell,
  ArrowRight,
  CheckCircle2,
  HeartHandshake,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-700 text-white shadow-sm">
              <Heart className="h-6 w-6 fill-white/20" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-slate-900">
                MediCare Connect
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                Elderly Care Platform
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="outline" className="font-semibold">
                Sign In
              </Button>
            </Link>
            <Link href="/patient">
              <Button className="bg-teal-700 hover:bg-teal-800 text-white font-semibold shadow-sm">
                Patient Demo View
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-teal-50/60 to-slate-50 border-b border-slate-200">
        <div className="max-w-5xl mx-auto text-center space-y-6">
          <Badge variant="default" className="text-sm px-4 py-1 font-semibold uppercase tracking-wide">
            Catalyst Hackathon 2026 &bull; Healthcare Innovation
          </Badge>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-950 leading-tight">
            Putting Elderly Individuals at the{" "}
            <span className="text-teal-700 underline decoration-teal-300 underline-offset-8">
              Centre of Healthcare Decisions
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            MediCare Connect is a smart, collaborative care platform connecting elderly individuals,
            dedicated caretakers, and family circles. We simplify daily medications, doctor appointments,
            and health routines with dignity, high accessibility, and proactive automated safety reminders.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/login" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto text-lg h-14 px-8 bg-teal-700 hover:bg-teal-800 shadow-md">
                <span>Access Caregiver & Patient Portal</span>
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/patient" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg h-14 px-8 border-2">
                <span>Elderly-Accessible Demo</span>
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-8 text-left max-w-4xl mx-auto">
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center gap-2 text-teal-700 font-bold">
                <CheckCircle2 className="h-5 w-5" />
                <span>WCAG AAA Accessible</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">20px+ font scale & 60px tactile touch targets.</p>
            </div>
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center gap-2 text-teal-700 font-bold">
                <Pill className="h-5 w-5" />
                <span>Smart Dosing</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">Mark taken, record skips with reason, PRN support.</p>
            </div>
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center gap-2 text-teal-700 font-bold">
                <Bell className="h-5 w-5" />
                <span>Proactive Alerts</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">Automated reminders for doses & doctor visits.</p>
            </div>
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center gap-2 text-teal-700 font-bold">
                <ShieldCheck className="h-5 w-5" />
                <span>Secure Passcode</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">Frictionless 4-digit PIN for shared family tablets.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Role Navigation Previews */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center space-y-3 mb-12">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">
            Dedicated Stakeholder Dashboards
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto">
            Experience the purpose-built interfaces tailored for patients, caregivers, family members, and platform administrators.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Patient Card */}
          <Card className="hover:shadow-md transition-shadow border-teal-200 bg-teal-50/30 flex flex-col justify-between">
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <div className="h-10 w-10 rounded-lg bg-teal-700 text-white flex items-center justify-center font-bold">
                  <Pill className="h-5 w-5" />
                </div>
                <Badge variant="warning">Accessibility-First</Badge>
              </div>
              <CardTitle className="text-xl font-bold">Patient View</CardTitle>
              <CardDescription>
                High-contrast, uncluttered interface with large 60px buttons for marking doses, reporting skips, and SOS help.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/patient">
                <Button className="w-full bg-teal-700 hover:bg-teal-800 text-white font-semibold">
                  Launch Patient Portal &rarr;
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Caretaker Card */}
          <Card className="hover:shadow-md transition-shadow flex flex-col justify-between">
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <div className="h-10 w-10 rounded-lg bg-blue-700 text-white flex items-center justify-center font-bold">
                  <HeartHandshake className="h-5 w-5" />
                </div>
                <Badge variant="info">Primary Operator</Badge>
              </div>
              <CardTitle className="text-xl font-bold">Caretaker Portal</CardTitle>
              <CardDescription>
                Multi-patient management, medication scheduler, appointment coordination, and live patient assistance requests.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/caretaker">
                <Button variant="outline" className="w-full font-semibold">
                  Launch Caretaker Portal &rarr;
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Family Member Card */}
          <Card className="hover:shadow-md transition-shadow flex flex-col justify-between">
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <div className="h-10 w-10 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold">
                  <Users className="h-5 w-5" />
                </div>
                <Badge variant="success">Circle of Care</Badge>
              </div>
              <CardTitle className="text-xl font-bold">Family Circle</CardTitle>
              <CardDescription>
                Real-time visibility into loved one&apos;s daily medication adherence, doctor visit updates, and care activity.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/family">
                <Button variant="outline" className="w-full font-semibold">
                  Launch Family View &rarr;
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Admin Card */}
          <Card className="hover:shadow-md transition-shadow flex flex-col justify-between">
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <div className="h-10 w-10 rounded-lg bg-slate-800 text-white flex items-center justify-center font-bold">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <Badge variant="secondary">System Governance</Badge>
              </div>
              <CardTitle className="text-xl font-bold">Admin Console</CardTitle>
              <CardDescription>
                Patient registry, care team invitations, granular permission allocation, and append-only activity auditing.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin">
                <Button variant="outline" className="w-full font-semibold">
                  Launch Admin Console &rarr;
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-8 px-4 text-center text-sm text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-semibold text-slate-700">
            <Heart className="h-4 w-4 text-teal-700" />
            <span>MediCare Connect &bull; Catalyst Hackathon 2026</span>
          </div>
          <p className="text-xs">
            Phase 1 Foundation Implementation &bull; Next.js 15 App Router &bull; TypeScript &bull; Tailwind CSS
          </p>
        </div>
      </footer>
    </div>
  );
}
