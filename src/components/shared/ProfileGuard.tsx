"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/onboarding",
  "/error",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/disclaimer",
  "/privacy",
  "/terms",
  "/about",
  "/crisis",
  "/owner",
];

export function ProfileGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "loading") return;

    const isPublicPath = PUBLIC_PATHS.some(
      (path) => pathname === path || pathname.startsWith(path + "/")
    );

    if (isPublicPath) return;

    if (session?.user && !(session.user as any).profileComplete) {
      router.push("/onboarding");
    }
  }, [session, status, pathname, router]);

  return <>{children}</>;
}
