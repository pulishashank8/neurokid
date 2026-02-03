import type { Metadata } from "next";
import { Nunito, Quicksand } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";
import { SessionProvider } from "@/app/providers";
import { ProfileGuard } from "@/components/shared/ProfileGuard";
import SessionTracker from "@/components/shared/SessionTracker";
import PremiumNavbar from "@/components/layout/PremiumNavbar";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const quicksand = Quicksand({
  variable: "--font-quicksand",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://neurokid.help'

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "NeuroKid - Support Platform for Neurodivergent Families",
    template: "%s | NeuroKid",
  },
  description: "NeuroKid is a community platform connecting neurodivergent individuals and their families with resources, screening tools, verified providers, and peer support.",
  keywords: [
    "autism",
    "neurodivergent",
    "ADHD",
    "autism screening",
    "neurodiversity",
    "autism support",
    "autism community",
    "autism resources",
    "developmental screening",
    "autism families",
    "autism parents",
    "special needs",
  ],
  authors: [{ name: "NeuroKid" }],
  creator: "NeuroKid",
  publisher: "NeuroKid",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: baseUrl,
    siteName: "NeuroKid",
    title: "NeuroKid - Support Platform for Neurodivergent Families",
    description: "Connect with resources, screening tools, verified providers, and a supportive community for neurodivergent individuals and their families.",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "NeuroKid - Support for Neurodivergent Families",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "NeuroKid - Support Platform for Neurodivergent Families",
    description: "Connect with resources, screening tools, verified providers, and a supportive community for neurodivergent individuals and their families.",
    images: ["/logo.png"],
  },
  alternates: {
    canonical: baseUrl,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body
        className={`${nunito.variable} ${quicksand.variable} font-sans antialiased transition-colors duration-300`}
        style={{ fontFamily: 'var(--font-nunito), var(--font-quicksand), system-ui, sans-serif' }}
      >
        <SessionProvider>
          <SessionTracker />
          <ProfileGuard>
            <PremiumNavbar />
            <main className="min-h-screen">
              {children}
            </main>
            <Analytics />
          </ProfileGuard>
        </SessionProvider>
      </body>
    </html>
  );
}
