"use client";

import type { ReactNode } from "react";

interface EntropySourceCardProps {
  id: string;
  name: string;
  description: string;
  icon: ReactNode;
  selected: boolean;
  disabled?: boolean;
  onSelect: () => void;
}

export default function EntropySourceCard({
  name,
  description,
  icon,
  selected,
  disabled = false,
  onSelect,
}: EntropySourceCardProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      className={[
        "relative text-left w-full p-3 default-radius border transition-all",
        disabled
          ? "cursor-not-allowed bg-gray-50 border-gray-100"
          : selected
            ? "cursor-pointer border-[var(--brand-primary)] bg-white"
            : "cursor-pointer border-gray-100 bg-white card-hover-primary",
      ].join(" ")}
    >
      {disabled && (
        <span
          className="absolute top-0.5 right-0.5 text-2xs font-medium text-white px-1.5 py-0.5 default-radius leading-tight"
          style={{ backgroundColor: "var(--brand-tertiary)" }}
        >
          Available at EMS Launch
        </span>
      )}

      <div className="flex items-start gap-2">
        <span
          className={[
            "mt-0.5 text-lg shrink-0",
            disabled ? "text-gray-300" : "text-gray-500",
          ].join(" ")}
        >
          {icon}
        </span>
        <div className="min-w-0">
          <p
            className={[
              "text-sm font-medium leading-tight",
              disabled ? "text-gray-400" : "text-gray-800",
            ].join(" ")}
          >
            {name}
          </p>
          <p
            className={[
              "mt-0.5 text-xs leading-relaxed",
              disabled ? "text-gray-300" : "text-gray-400",
            ].join(" ")}
          >
            {description}
          </p>
        </div>
      </div>
    </button>
  );
}
