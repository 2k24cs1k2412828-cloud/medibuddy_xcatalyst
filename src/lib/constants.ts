import { NavItem } from "@/types";

export const DEMO_ROBERT_CHEN_ID = "11111111-1111-1111-1111-111111111111";

export const APP_CONFIG = {
  name: "MediCare Connect",
  tagline: "Empowered, Dignified Elderly Care & Medication Ecosystem",
  description: "A collaborative, accessible healthcare platform connecting elderly individuals, family members, and caregivers.",
  version: "1.0.0-phase1",
};

export const NAVIGATION_ITEMS: Record<string, NavItem[]> = {
  admin: [
    { title: "Overview", href: "/admin", icon: "LayoutDashboard" },
    { title: "Patient Profiles", href: "/admin", icon: "Users", badge: "12" },
    { title: "Care Teams", href: "/admin", icon: "UserCheck" },
    { title: "System Activity", href: "/admin", icon: "ShieldAlert" },
    { title: "Settings", href: "/admin", icon: "Settings" },
  ],
  caretaker: [
    { title: "Overview", href: "/caretaker", icon: "LayoutDashboard" },
    { title: "Assigned Patients", href: "/caretaker", icon: "HeartHandshake", badge: "4" },
    { title: "Medications", href: "/caretaker", icon: "Pill" },
    { title: "Appointments", href: "/caretaker", icon: "Calendar" },
    { title: "Daily Routines", href: "/caretaker", icon: "CheckSquare" },
    { title: "Assistance Requests", href: "/caretaker", icon: "AlertCircle", badge: "2" },
    { title: "Notifications", href: "/caretaker", icon: "Bell" },
  ],
  family: [
    { title: "Overview", href: "/family", icon: "LayoutDashboard" },
    { title: "Assigned Patients", href: "/family", icon: "UserCheck", badge: "1" },
    { title: "Medication Adherence", href: "/family", icon: "Activity" },
    { title: "Appointments", href: "/family", icon: "Calendar" },
    { title: "Care Updates", href: "/family", icon: "FileText" },
  ],
  patient: [
    { title: "My Day", href: "/patient", icon: "Sun" },
    { title: "My Medicines", href: "/patient", icon: "Pill", badge: "3" },
    { title: "Appointments", href: "/patient", icon: "Calendar" },
    { title: "Daily Routines", href: "/patient", icon: "CheckCircle" },
    { title: "Request Help", href: "/patient", icon: "HelpCircle" },
    { title: "My Care Circle", href: "/patient", icon: "Users" },
  ],
};
