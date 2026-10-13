"use client";

import { MdHelpCenter, MdSettings } from "react-icons/md";
import SidebarGroupDefault from "./SidebarGroupDefault";
import SidebarNavItem from "./SidebarNavItem";

export default function SidebarNavMain({
  onNavigate,
  isAuthenticated = false,
}: {
  onNavigate?: () => void;
  isAuthenticated?: boolean;
}) {
  return (
    <>
      <nav className="flex-1 overflow-auto px-3 py-4">
        <SidebarGroupDefault isAuthenticated={isAuthenticated} onNavigate={onNavigate} />
      </nav>

      <div className="border-t border-gray-100 px-3 py-4">
        <ul>
          {isAuthenticated && (
            <SidebarNavItem
              name="Settings & account"
              href="/settings/account"
              icon={MdSettings}
              onNavigate={onNavigate}
            />
          )}
          <SidebarNavItem
            name="Contact"
            href="https://www.lightriderinc.com/contact"
            icon={MdHelpCenter}
            external
            onNavigate={onNavigate}
          />
        </ul>
      </div>
    </>
  );
}
