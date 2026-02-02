"use client";

import { usePathname } from "next/navigation";
import NavBar from "@/components/layout/navbar";

export default function ConditionalNavBar() {
  const pathname = usePathname();

  if (pathname === "/" || pathname?.startsWith("/owner")) {
    return null;
  }

  return <NavBar />;
}
