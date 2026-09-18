"use client";

import SidebarGroupDefault from "./SidebarGroupDefault";
import SidebarNavItem from "./SidebarNavItem";
import { FOOTER_NAV } from "./nav.config";

export default function SidebarNavMain({
  onNavigate,
  isAuthenticated = false,
}: {
  onNavigate?: () => void;
  isAuthenticated?: boolean;
}) {
  const footerItems = FOOTER_NAV.filter((item) => !item.authOnly || isAuthenticated);

  return (
    <>
      <nav className="flex-1 overflow-auto px-3 py-4">
        <SidebarGroupDefault onNavigate={onNavigate} />
      </nav>

      {footerItems.length > 0 && (
        <div className="border-t border-gray-100 px-3 py-4">
          <ul>
            {footerItems.map((item) => (
              <SidebarNavItem key={item.href} {...item} onNavigate={onNavigate} />
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
