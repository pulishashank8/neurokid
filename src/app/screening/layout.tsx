import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Developmental Screening Tools",
  description: "Access validated autism and developmental screening tools. Early screening helps identify developmental differences and connect families with appropriate resources.",
  keywords: [
    "autism screening",
    "developmental screening",
    "M-CHAT",
    "autism assessment",
    "early detection",
    "autism checklist",
    "developmental milestones",
    "autism signs",
  ],
  openGraph: {
    title: "Developmental Screening Tools | NeuroKid",
    description: "Access validated autism and developmental screening tools. Early screening helps identify developmental differences and connect families with appropriate resources.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Developmental Screening Tools | NeuroKid",
    description: "Access validated autism and developmental screening tools for early identification.",
  },
};

export default function ScreeningLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
