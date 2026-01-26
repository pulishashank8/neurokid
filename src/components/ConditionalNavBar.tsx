"use client";

import { usePathname } from "next/navigation";
import NavBar from "@/components/navbar";

export default function ConditionalNavBar() {
  const pathname = usePathname();
  
  if (pathname?.startsWith("/owner")) {
    return null;
  }
  
  return <NavBar />;
}
