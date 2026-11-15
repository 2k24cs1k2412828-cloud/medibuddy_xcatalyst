import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Pill,
  Users,
  ShieldCheck,
  Bell,
  ArrowRight,
  CheckCircle2,
  HeartHandshake,
  Lock,
  AlertTriangle,
  Sparkles,
  Layers,
  FileCheck2,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-teal-100 selection:text-teal-900">
      {/* 1. Global Clinical Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3 group">
            <Image
              src="/logo-icon.png"
              alt="MediCare Connect Logo"
              width={40}
              height={40}
              className="h-10 w-10 object-contain group-hover:scale-105 transition-transform"
              priority
            />
            <div>
              <span className="text-xl font-bold tracking-tight text-slate-950">
                MediCare Connect
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs font-semibold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200/80">
                Elderly Care Ecosystem
              </span>
            </div>
          </Link>

          <nav aria-label="Primary Navigation" className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <a href="#how-it-works" className="hover:text-teal-800 transition-colors">Clinical Workflow</a>
            <a href="#stakeholder-dashboards" className="hover:text-teal-800 transition-colors">Portals & Roles</a>
            <a href="#security-governance" className="hover:text-teal-800 transition-colors">Security & Compliance</a>
          </nav>

          <nav aria-label="Quick Action Navigation" className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="outline" className="font-semibold text-slate-700 hover:text-slate-900 border-slate-300">
                Sign In
              </Button>
            </Link>
            <Link href="/patient">
              <Button className="bg-teal-700 hover:bg-teal-800 text-white font-semibold shadow-sm">
                Patient Demo View
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* 2. Main Landmark Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-teal-50/70 via-slate-50 to-slate-50 border-b border-slate-200/80">
          <div className="max-w-5xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-100/70 border border-teal-300/80 text-teal-900 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="h-3.5 w-3.5 text-teal-700" />
              <span>Catalyst Hackathon 2026 &bull; Healthcare Innovation</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-950 leading-tight md:leading-[1.15]">
              Putting Elderly Individuals at the{" "}
              <span className="text-teal-700 underline decoration-teal-300 underline-offset-8">
                Centre of Healthcare Decisions
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed font-normal">
              A collaborative healthcare platform connecting elderly patients, dedicated caregivers,
              and family circles. We simplify complex daily medication regimens, clinical visits,
              and health routines with dignity, high accessibility, and proactive automated safety reminders.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link href="/login" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto text-lg h-14 px-8 bg-teal-700 hover:bg-teal-800 shadow-md transition-all">
                  <span>Access Caregiver & Patient Portal</span>
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/patient" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg h-14 px-8 border-2 border-slate-300 hover:border-slate-400 bg-white">
                  <span>Launch Patient Kiosk View</span>
                </Button>
              </Link>
            </div>

            {/* Core Proof Pillars */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-8 text-left max-w-4xl mx-auto">
              <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-teal-300 transition-colors">
                <div className="flex items-center gap-2 text-teal-700 font-bold text-sm">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>Accessibility-First</span>
                </div>
                <p className="text-xs text-slate-500 mt-1.5 leading-snug">
                  20px+ font scale & 60px tactile touch targets designed following WCAG guidelines.
                </p>
              </div>

              <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-teal-300 transition-colors">
                <div className="flex items-center gap-2 text-teal-700 font-bold text-sm">
                  <Pill className="h-4 w-4 shrink-0" />
                  <span>Smart Dosing Guard</span>
                </div>
                <p className="text-xs text-slate-500 mt-1.5 leading-snug">
                  Mark taken, mandatory clinical skip reasons, and strict duplicate-prevention rules.
                </p>
              </div>

              <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-teal-300 transition-colors">
                <div className="flex items-center gap-2 text-teal-700 font-bold text-sm">
                  <Bell className="h-4 w-4 shrink-0" />
                  <span>Proactive Resend Alerts</span>
                </div>
                <p className="text-xs text-slate-500 mt-1.5 leading-snug">
                  Automated transactional reminders with worker leases and exponential retry backoff.
                </p>
              </div>

              <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-teal-300 transition-colors">
                <div className="flex items-center gap-2 text-teal-700 font-bold text-sm">
                  <ShieldCheck className="h-4 w-4 shrink-0" />
                  <span>Kiosk Passcode Defense</span>
                </div>
                <p className="text-xs text-slate-500 mt-1.5 leading-snug">
                  Bcrypt PIN verification, 5-attempt rate limit, and automated 15-minute lockout.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 3. How It Works: The Care Circle Paradigm */}
        <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
          <div className="text-center space-y-3 mb-16">
            <Badge variant="secondary" className="px-3 py-1 font-semibold uppercase text-xs">
              Workflow Synergy
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
              The Four-Way Care Circle Paradigm
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto text-base">
              Healthcare decisions should never isolate the patient or overburden a single caregiver. MediCare Connect binds all four stakeholders in lockstep.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <span className="h-9 w-9 rounded-lg bg-teal-50 text-teal-800 font-black flex items-center justify-center text-sm border border-teal-200 mb-4">
                  01
                </span>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Prescription Setup</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Caregivers configure clinical orders, dosages, times, and special meal instructions in the Caretaker Operations Center.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs font-semibold text-teal-700">
                <Pill className="h-4 w-4" />
                <span>Automatic Dose Scheduling</span>
              </div>
            </div>

            <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <span className="h-9 w-9 rounded-lg bg-teal-50 text-teal-800 font-black flex items-center justify-center text-sm border border-teal-200 mb-4">
                  02
                </span>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Tactile Kiosk Action</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Elderly patients use an uncluttered tablet interface to log doses as TAKEN or report SKIPS with mandatory clinical reasons.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs font-semibold text-teal-700">
                <CheckCircle2 className="h-4 w-4" />
                <span>Zero Auto-Take Policy</span>
              </div>
            </div>

            <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <span className="h-9 w-9 rounded-lg bg-teal-50 text-teal-800 font-black flex items-center justify-center text-sm border border-teal-200 mb-4">
                  03
                </span>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Family Peace-of-Mind</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Family members check real-time adherence rates and doctor visit milestones from anywhere without clinical alteration rights.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs font-semibold text-emerald-700">
                <Users className="h-4 w-4" />
                <span>Transparent Circle Updates</span>
              </div>
            </div>

            <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <span className="h-9 w-9 rounded-lg bg-teal-50 text-teal-800 font-black flex items-center justify-center text-sm border border-teal-200 mb-4">
                  04
                </span>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Emergency Escalation</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Immediate SOS signals trigger high-priority alerts (`priority: 10`) and notify caregivers via Resend with guaranteed backoff retry.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs font-semibold text-red-700">
                <AlertTriangle className="h-4 w-4" />
                <span>Sub-10s Alert Dispatch</span>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Stakeholder Dashboards Showcase */}
        <section id="stakeholder-dashboards" className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-100/60 border-y border-slate-200/80">
          <div className="max-w-7xl mx-auto">
            <div className="text-center space-y-3 mb-16">
              <Badge variant="default" className="px-3 py-1 font-semibold uppercase text-xs">
                Dedicated Workspaces
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
                Purpose-Built Stakeholder Portals
              </h2>
              <p className="text-slate-600 max-w-2xl mx-auto text-base">
                Explore tailored operational consoles customized to the exact permissions, tasks, and ergonomics of each role.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Patient Card */}
              <Card className="hover:shadow-md transition-shadow border-teal-300 bg-white flex flex-col justify-between">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <div className="h-10 w-10 rounded-xl bg-teal-700 text-white flex items-center justify-center font-bold shadow-xs">
                      <Pill className="h-5 w-5" />
                    </div>
                    <Badge variant="warning">Accessibility-First</Badge>
                  </div>
                  <CardTitle className="text-xl font-bold">Patient View</CardTitle>
                  <CardDescription>
                    High-contrast tactile interface with 60px action buttons for dose logging, reason selection, and immediate SOS help.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/patient">
                    <Button className="w-full bg-teal-700 hover:bg-teal-800 text-white font-semibold">
                      Launch Patient Kiosk &rarr;
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Caretaker Card */}
              <Card className="hover:shadow-md transition-shadow flex flex-col justify-between bg-white border-slate-200">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <div className="h-10 w-10 rounded-xl bg-blue-700 text-white flex items-center justify-center font-bold shadow-xs">
                      <HeartHandshake className="h-5 w-5" />
                    </div>
                    <Badge variant="info">Primary Operator</Badge>
                  </div>
                  <CardTitle className="text-xl font-bold">Caretaker Portal</CardTitle>
                  <CardDescription>
                    Multi-patient roster oversight, medication schedule orders, clinic visits coordination, and live assistance resolution.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/caretaker">
                    <Button variant="outline" className="w-full font-semibold border-slate-300">
                      Launch Caretaker Portal &rarr;
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Family Member Card */}
              <Card className="hover:shadow-md transition-shadow flex flex-col justify-between bg-white border-slate-200">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <div className="h-10 w-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold shadow-xs">
                      <Users className="h-5 w-5" />
                    </div>
                    <Badge variant="success">Circle of Care</Badge>
                  </div>
                  <CardTitle className="text-xl font-bold">Family Circle</CardTitle>
                  <CardDescription>
                    Real-time adherence rate visibility, daily dose logs, upcoming doctor appointments, and active care team contact cards.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/family">
                    <Button variant="outline" className="w-full font-semibold border-slate-300">
                      Launch Family View &rarr;
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Admin Card */}
              <Card className="hover:shadow-md transition-shadow flex flex-col justify-between bg-white border-slate-200">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <div className="h-10 w-10 rounded-xl bg-slate-800 text-white flex items-center justify-center font-bold shadow-xs">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <Badge variant="secondary">System Governance</Badge>
                  </div>
                  <CardTitle className="text-xl font-bold">Admin Console</CardTitle>
                  <CardDescription>
                    Patient enrollment, caregiver credential invitations, granular authorization allocations, and append-only activity auditing.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/admin">
                    <Button variant="outline" className="w-full font-semibold border-slate-300">
                      Launch Admin Console &rarr;
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* 5. Security & Clinical Governance */}
        <section id="security-governance" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <Badge variant="secondary" className="px-3 py-1 font-semibold uppercase text-xs">
                Technical Governance
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 leading-tight">
                Data Privacy & System Governance Safeguards
              </h2>
              <p className="text-slate-600 text-base leading-relaxed">
                MediCare Connect safeguards sensitive healthcare workflows through defense-in-depth engineering principles implemented across database, application, and edge transport layers.
              </p>

              <div className="space-y-4">
                <div className="flex items-start gap-3.5">
                  <div className="h-8 w-8 rounded-lg bg-teal-100/70 text-teal-800 flex items-center justify-center shrink-0 mt-0.5">
                    <Lock className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">PostgreSQL Row-Level Security (RLS)</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Enforced directly at the database engine. Cross-patient data mutations are rejected automatically.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="h-8 w-8 rounded-lg bg-teal-100/70 text-teal-800 flex items-center justify-center shrink-0 mt-0.5">
                    <FileCheck2 className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Append-Only Clinical Audit Logs</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Database triggers raise hard exceptions on any `UPDATE` or `DELETE` attempts against audit entries.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="h-8 w-8 rounded-lg bg-teal-100/70 text-teal-800 flex items-center justify-center shrink-0 mt-0.5">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Hardened HTTP Security Headers</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      `X-Frame-Options: DENY`, `nosniff`, `Permissions-Policy`, and strict Next.js/Supabase CSP enforced.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8 rounded-2xl bg-slate-900 text-white shadow-xl space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2 text-teal-400 font-bold text-sm">
                  <Layers className="h-4 w-4" />
                  <span>Production System Metrics</span>
                </div>
                <span className="text-xs font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                  SYSTEM READY
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <p className="text-xs text-slate-400">Automated Assertions</p>
                  <p className="text-2xl font-black text-white mt-1">105 Passed</p>
                  <p className="text-[11px] text-emerald-400 mt-1">Security & Integration</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <p className="text-xs text-slate-400">Ergonomics Focus</p>
                  <p className="text-2xl font-black text-white mt-1">60px Tactile</p>
                  <p className="text-[11px] text-teal-400 mt-1">High-Contrast Targets</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <p className="text-xs text-slate-400">Core Relational Tables</p>
                  <p className="text-2xl font-black text-white mt-1">11 Tables</p>
                  <p className="text-[11px] text-teal-400 mt-1">Full Schema RLS</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <p className="text-xs text-slate-400">Notification Retries</p>
                  <p className="text-2xl font-black text-white mt-1">Bounded</p>
                  <p className="text-[11px] text-teal-400 mt-1">Lease Concurrency</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 text-xs text-slate-400 leading-relaxed">
                Deployed live on Vercel with continuous integration, Supabase PostgreSQL 15, and Resend transactional email services.
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* 6. Standardized Clinical Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-12 px-4 sm:px-6 lg:px-8 text-sm text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <Image
              src="/logo-icon.png"
              alt="MediCare Connect Logo"
              width={36}
              height={36}
              className="h-9 w-9 object-contain"
            />
            <div>
              <p className="font-bold text-slate-900">MediCare Connect</p>
              <p className="text-xs text-slate-500">Elderly Healthcare & Care-Circle Collaboration</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-medium text-slate-600">
            <Link href="/login" className="hover:text-teal-800 transition-colors">Sign In</Link>
            <Link href="/patient" className="hover:text-teal-800 transition-colors">Patient Kiosk</Link>
            <Link href="/caretaker" className="hover:text-teal-800 transition-colors">Caretaker Portal</Link>
            <Link href="/family" className="hover:text-teal-800 transition-colors">Family Circle</Link>
            <Link href="/admin" className="hover:text-teal-800 transition-colors">Admin Console</Link>
          </div>

          <div className="text-center md:text-right space-y-1">
            <p className="text-xs font-semibold text-slate-700">
              CATALYST &bull; Solo AI Hackathon 2026
            </p>
            <p className="text-[11px] text-slate-400">
              Presented for Makers Need More (MnM) &bull; PromptWars
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
