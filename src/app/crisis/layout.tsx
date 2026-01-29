import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Crisis Resources",
  description: "Access crisis support resources and helplines for neurodivergent individuals and families. Get immediate help and support when you need it most.",
  keywords: ["crisis support", "autism crisis help", "mental health helpline", "emergency resources", "neurodivergent support"],
  openGraph: {
    title: "Crisis Resources | NeuroKid",
    description: "Access crisis support resources and helplines for neurodivergent individuals and families.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Crisis Resources | NeuroKid",
    description: "Access crisis support resources and helplines for neurodivergent individuals and families.",
  },
};

export default function CrisisLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
