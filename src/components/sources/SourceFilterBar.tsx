"use client";

import FilterBar, { type FilterGroup } from "@/components/ui/FilterBar";
import type { SourceFilterGroup, SourceFilterState } from "@/lib/sources/filters";

const FILTER_GROUPS: FilterGroup<SourceFilterGroup>[] = [
  {
    key: "tag",
    label: "Tag",
    options: [
      { value: "QPU", label: "QPU" },
      { value: "QRNG", label: "QRNG" },
      { value: "Hardware RNG", label: "Hardware RNG" },
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
