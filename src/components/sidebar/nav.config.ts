import type { ComponentType } from "react";
import { FaDice } from "react-icons/fa6";
import {
  MdHelpCenter,
  MdSettings,
  MdSpaceDashboard
} from "react-icons/md";

export type IconType = ComponentType<{ className?: string }>;

export interface NavItem {
  name: string;
  href: string;
  icon?: IconType;
  external?: boolean;
  /** Hidden for signed-out visitors (e.g. links behind an auth gate). */
  authOnly?: boolean;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

/** Primary-rail groups. Generic, non-product-specific platform navigation. */
export const MAIN_NAV: NavGroup[] = [
  {
    label: "General",
    items: [
      { name: "Overview", href: "/", icon: MdSpaceDashboard },
      { name: "Get entropy", href: "/entropy", icon: FaDice },
    ],
  },
];

/** Pinned utility links at the bottom of the primary rail. */
export const FOOTER_NAV: NavItem[] = [
  {
    name: "Settings & account",
    href: "/settings/account",
    icon: MdSettings,
    authOnly: true,
  },
  { name: "Contact", href: "https://www.lightriderinc.com/contact", icon: MdHelpCenter, external: true },
];

/**
 * Route prefixes that show a secondary rail. Adding another sub-navigated
 * section is two edits: a branch in SidebarNav and a prefix here.
 */
export const SECONDARY_SIDEBAR_ROUTES: string[] = ["/settings"];
