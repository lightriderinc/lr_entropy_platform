"use client";

import type { SourceFilterState } from "@/lib/sources/filters";
import { useEffect, useRef, useState } from "react";
import { MdCheck, MdClose, MdExpandLess, MdExpandMore, MdFilterList } from "react-icons/md";

const POLICY_OPTIONS: { value: string; label: string }[] = [
  { value: "highest-quality", label: "Highest quality" },
  { value: "fastest", label: "Fastest" },
];

// Single-category (policy) filter dropdown for the sources catalog. Trigger
// button opens a checklist popover; once a value is picked the trigger is
// replaced by a tag summarizing the selection, which reopens the same
// checklist or clears it via its x.
export default function SourceFilterBar({
  filters,
  onToggle,
  onClearAll,
}: {
  filters: SourceFilterState;
  onToggle: (value: string) => void;
  onClearAll: () => void;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const hasSelection = filters.policy.size > 0;
  const tagLabel = `Policy: ${Array.from(filters.policy)
    .map((value) => POLICY_OPTIONS.find((o) => o.value === value)?.label ?? value)
    .join(", ")}`;

  return (
    <div ref={containerRef} className="relative flex items-center gap-2">
      {hasSelection ? (
        <div className="relative flex items-center gap-1 default-radius border border-gray-100 bg-white py-1 pl-3 pr-1.5 text-sm text-gray-700">
          <button
            type="button"
            aria-haspopup="menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="flex max-w-[220px] items-center gap-1"
          >
            <span className="truncate" title={tagLabel}>
              {tagLabel}
            </span>
            {open ? (
              <MdExpandLess className="shrink-0 text-gray-400" />
            ) : (
              <MdExpandMore className="shrink-0 text-gray-400" />
            )}
          </button>
          <button
            type="button"
            aria-label="Clear policy filter"
            onClick={onClearAll}
            className="flex h-5 w-5 items-center justify-center default-radius text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <MdClose className="text-sm" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 default-radius border border-gray-100 bg-white px-3 py-1.5 text-sm text-gray-500 transition-colors hover:bg-gray-50"
        >
          <MdFilterList className="text-gray-400" />
          <span>Filter sources</span>
        </button>
      )}

      {open && (
        <div
          role="menu"
          className="absolute left-0 top-full z-50 mt-2 w-56 default-radius border border-gray-100 bg-white p-3 shadow-lg"
        >
          <p className="mb-1 px-2 text-2xs font-medium uppercase tracking-wider text-gray-300">
            Policy
          </p>
          <div className="flex flex-col">
            {POLICY_OPTIONS.map((option) => {
              const checked = filters.policy.has(option.value);
              return (
                <button
                  key={option.value}
                  type="button"
                  role="menuitemcheckbox"
                  aria-checked={checked}
                  onClick={() => onToggle(option.value)}
                  className="flex w-full items-center gap-2 default-radius px-2 py-1.5 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50"
                >
                  <span
                    className={`flex h-4 w-4 shrink-0 items-center justify-center default-radius border transition-colors ${
                      checked ? "border-gray-700 bg-gray-700 text-white" : "border-gray-300"
                    }`}
                  >
                    {checked && <MdCheck className="text-[11px]" />}
                  </span>
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
