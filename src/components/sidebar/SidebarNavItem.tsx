"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MdArrowOutward } from "react-icons/md";
import type { IconType } from "./nav.config";

export default function SidebarNavItem({
  name,
  href,
  icon,
  onNavigate,
  external,
}: {
  name: string;
  href: string;
  icon?: IconType;
  onNavigate?: () => void;
  external?: boolean;
}) {
  const pathname = usePathname();
  const active = external
    ? false
    : href === "/"
      ? pathname === "/"
      : pathname === href || pathname.startsWith(`${href}/`);

  const Icon = icon;

  return (
    <li>
      <Link
        href={href}
        onClick={onNavigate}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
        className={`mb-1 flex items-center gap-2 default-radius px-2 py-1.5 text-sm transition-colors ${
          active ? "bg-gray-100 font-medium" : "hover:bg-gray-50"
        }`}
      >
        {Icon && (
          <Icon className={`text-gray-500 ${active ? "text-gray-700" : ""}`} />
        )}
        <span className="flex-1">{name}</span>
        {external && <MdArrowOutward className="text-gray-400" />}
      </Link>
    </li>
  );
}
