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
}

export function createEmptyFilters(): SourceFilterState {
  return { policy: new Set() };
}

export function filterSources<T extends Source>(sources: T[], filters: SourceFilterState): T[] {
  if (filters.policy.size === 0) return sources;
  return sources.filter((s) => filters.policy.has(s.policy));
}
