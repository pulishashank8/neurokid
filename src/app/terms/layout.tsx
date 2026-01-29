import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Read NeuroKid's terms of service. Understand the rules and guidelines for using our platform for neurodivergent families.",
  keywords: ["terms of service", "terms and conditions", "NeuroKid terms", "user agreement"],
  openGraph: {
    title: "Terms of Service | NeuroKid",
    description: "Read NeuroKid's terms of service. Understand the rules and guidelines for using our platform.",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
