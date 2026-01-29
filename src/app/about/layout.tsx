import { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us",
  description: "Learn about NeuroKid's mission to support neurodivergent families. Discover our story, vision, and commitment to building a global infrastructure of hope.",
  keywords: ["about NeuroKid", "autism support mission", "neurodivergent families", "autism community platform"],
  openGraph: {
    title: "About NeuroKid - Our Mission & Story",
    description: "Learn about NeuroKid's mission to support neurodivergent families. Discover our story, vision, and commitment to building a global infrastructure of hope.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "About NeuroKid - Our Mission & Story",
    description: "Learn about NeuroKid's mission to support neurodivergent families.",
  },
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
