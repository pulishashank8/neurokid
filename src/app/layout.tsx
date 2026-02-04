import ConditionalNavBar from "@/components/layout/ConditionalNavBar";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";
import { SessionProvider } from "@/app/providers";
import { ProfileGuard } from "@/components/shared/ProfileGuard";
import SessionTracker from "@/components/shared/SessionTracker";
import { OrganizationSchema, SoftwareAppSchema } from "@/components/seo/SchemaMarkup";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://neurokid.help';

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "Neuro Kid: AAC App & Autism Support Tools for Families",
    template: "%s | Neuro Kid",
  },
  description: "Help your child communicate and thrive. Neuro Kid offers AAC tools, therapy tracking, and parent support—designed specifically for autistic children and their families.",
  keywords: [
    "AAC app for autism",
    "autism communication app",
    "autism support app",
    "apps for nonverbal autistic child",
    "autism therapy tracker",
    "visual schedule app autism",
    "autism parent support",
    "social stories app",
    "autism resources",
    "ABA therapy tracking",
    "autism screening tools",
    "special needs communication",
    "autism family support",
    "neurodivergent tools",
    "autism daily routine app",
  ],
  authors: [{ name: "Neuro Kid" }],
  creator: "Neuro Kid",
  publisher: "Neuro Kid",
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
    siteName: "Neuro Kid",
    title: "Neuro Kid: AAC App & Autism Support Tools for Families",
    description: "Help your child communicate and thrive. AAC tools, therapy tracking, and parent support—designed specifically for autistic children and their families.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Neuro Kid - AAC and Autism Support App for Families",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Neuro Kid: AAC App & Autism Support Tools for Families",
    description: "Help your child communicate and thrive. AAC tools, therapy tracking, and parent support—designed specifically for autistic children.",
    images: ["/og-image.png"],
  },
  verification: {
    // Add your Google Search Console verification code here
    // google: "your-google-verification-code",
  },
  alternates: {
    canonical: baseUrl,
  },
  category: "Health & Fitness",
  applicationName: "Neuro Kid",
  appleWebApp: {
    capable: true,
    title: "Neuro Kid",
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <OrganizationSchema />
        <SoftwareAppSchema
          name="Neuro Kid"
          description="AAC and autism support app for children and parents"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[var(--background)] transition-colors duration-300`}
      >
        <SessionProvider>
          <SessionTracker />
          <ProfileGuard>
            <ConditionalNavBar />
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
