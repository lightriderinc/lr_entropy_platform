"use client";

import SidebarGroupDefault from "./SidebarGroupDefault";
import SidebarNavItem from "./SidebarNavItem";
import { FOOTER_NAV } from "./nav.config";

export default function SidebarNavMain({
  onNavigate,
}: {
  onNavigate?: () => void;
}) {
  return (
    <>
      <nav className="flex-1 overflow-auto px-3 py-4">
        <SidebarGroupDefault onNavigate={onNavigate} />
      </nav>

      {FOOTER_NAV.length > 0 && (
        <div className="border-t border-gray-100 px-3 py-4">
          <ul>
            {FOOTER_NAV.map((item) => (
              <SidebarNavItem key={item.href} {...item} onNavigate={onNavigate} />
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
