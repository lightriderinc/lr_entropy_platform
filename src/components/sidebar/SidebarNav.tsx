"use client";

import { usePathname } from "next/navigation";
import SidebarGroupSettings from "./SidebarGroupSettings";

/**
 * Secondary-rail nav. Picks the nav group that matches the current route
 * section. Adding another sub-navigated section is two edits: a branch here
 * and its route prefix in SECONDARY_SIDEBAR_ROUTES (SidebarSecondaryGate.tsx
 * and MobileMenu.tsx).
 */
export default function SidebarNav({
  onNavigate,
  isAuthenticated,
}: {
  onNavigate?: () => void;
  isAuthenticated: boolean;
}) {
  const pathname = usePathname();
  const isSettingsRoute = pathname?.startsWith("/settings");

  return (
    <nav className="flex-1 overflow-auto px-3 py-4">
      {isSettingsRoute && (
        <SidebarGroupSettings
          onNavigate={onNavigate}
          isAuthenticated={isAuthenticated}
        />
      )}
    </nav>
  );
}
