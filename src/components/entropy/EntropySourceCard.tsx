"use client";

import React from "react";
import ComingSoonTag from "@/components/ui/ComingSoonTag";

interface EntropySourceCardProps {
  id: string;
  name: string;
  description?: string;
  icon: React.ReactNode;
  /** Short type tag at the top right, e.g. "QPU" / "QRNG". */
  tag?: string;
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
  tag,
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
      <span className="absolute top-2 right-2 flex items-center gap-1.5">
      {selected && !disabled && (
        <span className="w-4 h-4 rounded-full flex items-center justify-center bg-[var(--brand-primary)]">
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
      {tag && !disabled && <SourceTypeTag tag={tag} />}
      {disabled && <ComingSoonTag />}
      </span>

      <div className={["flex items-start gap-3", disabled ? "pr-24" : tag ? "pr-20" : "pr-12"].join(" ")}>
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
          {description && (
            <p
              className={[
                "text-xs mt-0.5 leading-snug",
                disabled ? "text-gray-300" : "text-gray-500",
              ].join(" ")}
            >
              {description}
            </p>
          )}
          {badge && <div className="mt-1.5">{badge}</div>}
        </div>
      </div>
    </button>
  );
}

/** "QPU" / "QRNG" / ... pill on a source card. */
export function SourceTypeTag({ tag }: { tag: string }) {
  return (
    <span className="inline-block whitespace-nowrap rounded border border-gray-200 bg-white px-1.5 py-0.5 text-[11px] font-semibold tracking-wide text-gray-600">
      {tag}
    </span>
  );
}
