"use client";

/**
 * Secondary-rail nav. No sub-navigated sections exist yet. When one is added,
 * branch here on the route prefix (§10.6) and add that prefix to
 * SECONDARY_SIDEBAR_ROUTES in nav.config.ts.
 */
export default function SidebarNav(props: { onNavigate?: () => void }) {
  void props;
  return <nav className="flex-1 overflow-auto px-3 py-4" />;
}
