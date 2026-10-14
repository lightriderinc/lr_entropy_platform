"use client";

import type { SourceFilterGroup, SourceFilterState } from "@/lib/sources/filters";
import { useEffect, useRef, useState } from "react";
import { MdCheck, MdClose, MdExpandLess, MdExpandMore, MdFilterList } from "react-icons/md";

interface FilterOption {
  value: string;
  label: string;
}

const FILTER_GROUPS: {
  key: SourceFilterGroup;
  label: string;
  options: FilterOption[];
}[] = [
  {
    key: "policy",
    label: "Policy",
    options: [
      { value: "highest-quality", label: "Highest quality" },
      { value: "quantum-verified", label: "Quantum verified" },
      { value: "fastest", label: "Fastest" },
    ],
  },
  {
    key: "access",
    label: "Access",
    options: [
      { value: "available", label: "Available" },
      { value: "coming_soon", label: "Coming soon" },
    ],
  },
];

type MenuKey = SourceFilterGroup | "all";

// Faceted filter bar for the sources catalog: an "add filter" trigger opening
// a dropdown of every group, plus one tag per group that already has a
// selection — each tag reopens just that group's checklist (via its own
// chevron) and clears it (via its x).
export default function SourceFilterBar({
  filters,
  onToggle,
  onClearGroup,
  onClearAll,
}: {
  filters: SourceFilterState;
  onToggle: (group: SourceFilterGroup, value: string) => void;
  onClearGroup: (group: SourceFilterGroup) => void;
  onClearAll: () => void;
}) {
  const [openMenu, setOpenMenu] = useState<MenuKey | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!openMenu) return;

    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpenMenu(null);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpenMenu(null);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [openMenu]);

  const activeGroups = FILTER_GROUPS.filter((group) => filters[group.key].size > 0);

  function tagLabel(group: (typeof FILTER_GROUPS)[number]): string {
    const values = Array.from(filters[group.key]).map(
      (value) => group.options.find((o) => o.value === value)?.label ?? value,
    );
    return `${group.label}: ${values.join(", ")}`;
  }

  function toggleMenu(key: MenuKey) {
    setOpenMenu((current) => (current === key ? null : key));
  }

  return (
    <div ref={containerRef} className="relative flex flex-wrap items-center gap-2">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={openMenu === "all"}
        onClick={() => toggleMenu("all")}
        className="flex items-center gap-2 default-radius border border-gray-100 bg-white px-3 py-1.5 text-sm text-gray-500 transition-colors hover:bg-gray-50"
      >
        <MdFilterList className="text-gray-400" />
        <span>Filter sources</span>
      </button>

      {openMenu === "all" && (
        <div
          role="menu"
          className="absolute left-0 top-full z-50 mt-2 w-64 default-radius border border-gray-100 bg-white p-3 shadow-lg"
        >
          <div className="flex flex-col gap-3">
            {FILTER_GROUPS.map((group, i) => (
              <div key={group.key} className={i > 0 ? "border-t border-gray-100 pt-3" : undefined}>
                <FilterSection
                  title={group.label}
                  options={group.options}
                  selected={filters[group.key]}
                  onToggle={(value) => onToggle(group.key, value)}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {activeGroups.map((group) => (
        <div
          key={group.key}
          className="relative flex items-center gap-1 default-radius border border-gray-100 bg-white py-1 pl-3 pr-1.5 text-sm text-gray-700"
        >
          <button
            type="button"
            aria-haspopup="menu"
            aria-expanded={openMenu === group.key}
            onClick={() => toggleMenu(group.key)}
            className="flex max-w-[220px] items-center gap-1"
          >
            <span className="truncate" title={tagLabel(group)}>
              {tagLabel(group)}
            </span>
            {openMenu === group.key ? (
              <MdExpandLess className="shrink-0 text-gray-400" />
            ) : (
              <MdExpandMore className="shrink-0 text-gray-400" />
            )}
          </button>
          <button
            type="button"
            aria-label={`Clear ${group.label} filter`}
            onClick={() => onClearGroup(group.key)}
            className="flex h-5 w-5 items-center justify-center default-radius text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <MdClose className="text-sm" />
          </button>

          {openMenu === group.key && (
            <div
              role="menu"
              className="absolute left-0 top-full z-50 mt-2 w-56 default-radius border border-gray-100 bg-white p-3 shadow-lg"
            >
              <FilterSection
                title={group.label}
                options={group.options}
                selected={filters[group.key]}
                onToggle={(value) => onToggle(group.key, value)}
              />
            </div>
          )}
        </div>
      ))}

      {activeGroups.length > 0 && (
        <button
          type="button"
          onClick={onClearAll}
          className="text-sm text-gray-500 underline-offset-2 hover:text-gray-700 hover:underline"
        >
          Clear all
        </button>
      )}
    </div>
  );
}

// One group's checklist, shared by the all-groups dropdown and each tag's
// own dropdown.
function FilterSection({
  title,
  options,
  selected,
  onToggle,
}: {
  title: string;
  options: FilterOption[];
  selected: Set<string>;
  onToggle: (value: string) => void;
}) {
  return (
    <div>
      <p className="mb-1 px-2 text-2xs font-medium uppercase tracking-wider text-gray-300">
        {title}
      </p>
      <div className="flex flex-col">
        {options.map((option) => {
          const checked = selected.has(option.value);
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
  );
}
