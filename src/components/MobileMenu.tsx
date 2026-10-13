"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { MdMenu, MdClose } from "react-icons/md";
import SidebarNav from "./sidebar/SidebarNav";
import SidebarNavMain from "./sidebar/SidebarNavMain";

// Route prefixes that get a secondary sidebar. Keep in sync with the branch
// in SidebarNav.
const SECONDARY_SIDEBAR_ROUTES = ["/settings"];

export default function MobileMenu({
  children,
  isAuthenticated = false,
}: {
  children?: ReactNode;
  isAuthenticated?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const showSection = SECONDARY_SIDEBAR_ROUTES.some((r) =>
    pathname?.startsWith(r),
  );
  const close = () => setOpen(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-label="Open menu"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="flex h-9 w-9 items-center justify-center default-radius transition-colors hover:bg-gray-100"
      >
        <MdMenu className="text-2xl text-gray-700" />
      </button>

      {/* Always mounted so the panel can slide in and out. */}
      <div
        aria-hidden={!open}
        onClick={close}
        className={`fixed inset-0 z-50 flex justify-end transition-colors duration-300 motion-reduce:transition-none ${
          open ? "bg-black/40" : "pointer-events-none bg-transparent"
        }`}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          onClick={(e) => e.stopPropagation()}
          className={`flex h-full w-72 max-w-[85%] flex-col bg-white shadow-xl transition-transform duration-300 ease-out motion-reduce:transition-none ${
            open ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex h-14 shrink-0 items-center justify-between border-b border-gray-100 px-4">
            <span className="text-sm font-medium text-gray-600">Menu</span>
            <button
              type="button"
              aria-label="Close menu"
              onClick={close}
              className="flex h-9 w-9 items-center justify-center default-radius transition-colors hover:bg-gray-100"
            >
              <MdClose className="text-2xl text-gray-700" />
            </button>
          </div>

          {showSection && (
            <div className="border-b border-gray-100">
              <SidebarNav onNavigate={close} isAuthenticated={isAuthenticated} />
            </div>
          )}

          <SidebarNavMain onNavigate={close} isAuthenticated={isAuthenticated} />

          {children && (
            <div className="border-t border-gray-100 px-3 py-4">{children}</div>
          )}
        </div>
      </div>
    </div>
  );
}
