import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "NeuroKid Owner Dashboard",
  description: "Owner dashboard for NeuroKid platform",
  robots: "noindex, nofollow",
};

export default function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full min-w-0 overflow-x-hidden">
      {children}
    </div>
  );
}
