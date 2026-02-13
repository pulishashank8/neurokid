import type { Metadata } from "next";
import { OwnerRoleGuard } from "@/components/owner/OwnerRoleGuard";

export const metadata: Metadata = {
  title: "NeuroKid Owner Dashboard",
  description: "Owner dashboard for NeuroKid platform - Secure RBAC Protected",
  robots: "noindex, nofollow",
};

export default function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Note: Login page handles its own auth, so we exclude it from the guard
  return (
    <OwnerRoleGuard>
      <div className="w-full min-w-0 overflow-x-hidden">
        {children}
      </div>
    </OwnerRoleGuard>
  );
}
