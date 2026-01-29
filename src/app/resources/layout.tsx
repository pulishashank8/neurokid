import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Resources & Articles",
  description: "Access curated resources, articles, and guides for neurodivergent individuals and families. Evidence-based information to support your journey.",
  keywords: [
    "autism resources",
    "neurodivergent resources",
    "autism articles",
    "autism guides",
    "autism information",
    "autism education",
    "autism parenting",
  ],
  openGraph: {
    title: "Resources & Articles | NeuroKid",
    description: "Access curated resources, articles, and guides for neurodivergent individuals and families.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Resources & Articles | NeuroKid",
    description: "Curated resources and guides for neurodivergent families.",
  },
};

export default function ResourcesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
