import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Community",
  description: "Join the NeuroKid community - a safe space for parents and caregivers of neurodivergent children to share experiences, ask questions, and support each other.",
  keywords: [
    "autism community",
    "autism parent support",
    "neurodivergent community",
    "autism forum",
    "parent support group",
    "autism discussion",
  ],
  openGraph: {
    title: "Community | NeuroKid",
    description: "Join the NeuroKid community - a safe space for parents and caregivers of neurodivergent children to share experiences and support each other.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Community | NeuroKid",
    description: "Join the NeuroKid community - a safe space for neurodivergent families.",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function CommunityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
