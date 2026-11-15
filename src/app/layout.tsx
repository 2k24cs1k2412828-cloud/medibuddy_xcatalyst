import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MediCare Connect | Elderly Care & Medication Management Platform",
  description: "A collaborative, accessible healthcare platform connecting elderly individuals, family circles, and caregivers.",
  metadataBase: new URL("https://medibuddyxcatalyst.vercel.app"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "MediCare Connect | Elderly Care & Medication Management",
    description: "Putting elderly individuals at the centre of healthcare decisions with accessible medication tracking and clinical coordination.",
    url: "https://medibuddyxcatalyst.vercel.app",
    siteName: "MediCare Connect",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "MediCare Connect Healthcare Platform",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MediCare Connect | Elderly Healthcare Platform",
    description: "Putting elderly individuals at the centre of healthcare decisions.",
  },
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
