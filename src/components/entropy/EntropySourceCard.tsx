"use client";

import React from "react";
import ComingSoonTag from "@/components/ui/ComingSoonTag";

interface EntropySourceCardProps {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  selected: boolean;
  /** Coming soon: greyed out, not selectable, tagged. */
  disabled?: boolean;
  /** Optional status line under the description (e.g. live ring state). */
  badge?: React.ReactNode;
  onSelect: () => void;
}

export default function EntropySourceCard({
  name,
  description,
  icon,
  selected,
  disabled = false,
  badge,
  onSelect,
}: EntropySourceCardProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-disabled={disabled}
      onClick={onSelect}
      className={[
        "relative text-left w-full p-4 default-radius border transition-all duration-150",
        disabled
          ? "cursor-not-allowed bg-gray-50 border-gray-100"
          : selected
            ? "cursor-pointer border-[var(--brand-primary)] bg-red-50 shadow-sm"
            : "cursor-pointer border-gray-100 bg-white card-hover-primary",
      ].join(" ")}
    >
      {disabled && <ComingSoonTag className="absolute top-2 right-2" />}

      {selected && !disabled && (
        <span className="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center bg-[var(--brand-primary)]">
          <svg
            width="8"
            height="6"
            viewBox="0 0 8 6"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M1 3L3 5L7 1"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      )}

      <div className={["flex items-start gap-3", disabled ? "pr-24" : "pr-12"].join(" ")}>
        <span
          className={[
            "mt-0.5 text-xl shrink-0",
            disabled
              ? "text-gray-300"
              : selected
                ? "text-[var(--brand-primary)]"
                : "text-gray-400",
          ].join(" ")}
        >
          {icon}
        </span>
        <div>
          <p
            className={[
              "text-sm font-semibold",
              disabled ? "text-gray-400" : "text-gray-800",
            ].join(" ")}
          >
            {name}
          </p>
          <p
            className={[
              "text-xs mt-0.5 leading-snug",
              disabled ? "text-gray-300" : "text-gray-500",
            ].join(" ")}
          >
            {description}
          </p>
          {badge && <div className="mt-1.5">{badge}</div>}
        </div>
      </div>
    </button>
  );
}
