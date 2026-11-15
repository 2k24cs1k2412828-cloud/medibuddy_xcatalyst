import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MediCare Connect | Elderly Care & Medication Management Platform",
  description: "A collaborative, accessible healthcare platform connecting elderly individuals, family members, and caregivers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-slate-50 text-slate-900 min-h-screen">
        {children}
      </body>
    </html>
  );
}
