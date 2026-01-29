import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Read NeuroKid's privacy policy. Learn how we collect, use, and protect your personal information on our platform for neurodivergent families.",
  keywords: ["privacy policy", "data protection", "NeuroKid privacy", "user data"],
  openGraph: {
    title: "Privacy Policy | NeuroKid",
    description: "Read NeuroKid's privacy policy. Learn how we collect, use, and protect your personal information.",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
