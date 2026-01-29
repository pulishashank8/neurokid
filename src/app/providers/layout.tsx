import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Find Verified Providers",
  description: "Connect with verified healthcare providers, therapists, and specialists who support neurodivergent individuals and families. Find trusted professionals near you.",
  keywords: [
    "autism therapist",
    "autism specialist",
    "developmental pediatrician",
    "autism provider",
    "ABA therapy",
    "speech therapy",
    "occupational therapy",
    "autism doctor",
  ],
  openGraph: {
    title: "Find Verified Providers | NeuroKid",
    description: "Connect with verified healthcare providers, therapists, and specialists who support neurodivergent individuals and families.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Find Verified Providers | NeuroKid",
    description: "Connect with verified healthcare providers and specialists for neurodivergent families.",
  },
};

export default function ProvidersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
