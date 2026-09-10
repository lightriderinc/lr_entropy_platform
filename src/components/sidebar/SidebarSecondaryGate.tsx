"use client";

import { usePathname } from "next/navigation";
import { SECONDARY_SIDEBAR_ROUTES } from "./nav.config";

export default function SidebarSecondaryGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const show = SECONDARY_SIDEBAR_ROUTES.some((r) => pathname?.startsWith(r));
  if (!show) return null;
  return <>{children}</>;
}
