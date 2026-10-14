export interface Source {
  name: string;
  type: string;
  policy: string;
  online: boolean;
}

/** A Sources page entry (lib/sources/directory.ts). */
export interface DirectorySource extends Source {
  id: string;
  availability: "available" | "coming_soon";
  /** Own ring: "empty" shows the refill-pending badge; null when unknown or coming soon. */
  ringState: "ready" | "empty" | null;
}

export interface SourceFilterState {
  policy: Set<string>;
  access: Set<string>;
}

export type SourceFilterGroup = keyof SourceFilterState;

export function createEmptyFilters(): SourceFilterState {
  return { policy: new Set(), access: new Set() };
}

// Groups AND together; values within a group OR together. An empty group
// doesn't constrain anything.
export function filterSources<T extends DirectorySource>(
  sources: T[],
  filters: SourceFilterState,
): T[] {
  return sources.filter(
    (s) =>
      (filters.policy.size === 0 || filters.policy.has(s.policy)) &&
      (filters.access.size === 0 || filters.access.has(s.availability)),
  );
}
