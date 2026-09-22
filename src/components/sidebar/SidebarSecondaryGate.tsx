"use client";

import { usePathname } from "next/navigation";

// Route prefixes that get a secondary sidebar. Keep in sync with the branch
// in SidebarNav.
const SECONDARY_SIDEBAR_ROUTES = ["/settings"];

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
