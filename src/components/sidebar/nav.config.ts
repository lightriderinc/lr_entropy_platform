import type { ComponentType } from "react";
import { MdSpaceDashboard, MdSettings, MdHelpOutline } from "react-icons/md";

export type IconType = ComponentType<{ className?: string }>;

export interface NavItem {
  name: string;
  href: string;
  icon?: IconType;
  external?: boolean;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

/** Primary-rail groups. Generic, non-product-specific platform navigation. */
export const MAIN_NAV: NavGroup[] = [
  {
    label: "General",
    items: [{ name: "Dashboard", href: "/", icon: MdSpaceDashboard }],
  },
];

/** Pinned utility links at the bottom of the primary rail. */
export const FOOTER_NAV: NavItem[] = [
  { name: "Settings", href: "/settings", icon: MdSettings },
  { name: "Help", href: "/help", icon: MdHelpOutline },
];

/**
 * Route prefixes that show a secondary rail. Empty for now. Adding a
 * sub-navigated section is two edits: a branch in SidebarNav and a prefix here.
 */
export const SECONDARY_SIDEBAR_ROUTES: string[] = [];
