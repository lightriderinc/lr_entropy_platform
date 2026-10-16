"use client";

import FilterBar, { type FilterGroup } from "@/components/ui/FilterBar";
import type { SourceFilterGroup, SourceFilterState } from "@/lib/sources/filters";

const FILTER_GROUPS: FilterGroup<SourceFilterGroup>[] = [
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

// Faceted filter bar for the sources catalog.
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
  return (
    <FilterBar
      label="Filter sources"
      groups={FILTER_GROUPS}
      filters={filters}
      onToggle={onToggle}
      onClearGroup={onClearGroup}
      onClearAll={onClearAll}
    />
  );
}
