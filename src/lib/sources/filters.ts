export interface Source {
  name: string;
  type: string;
  policy: string;
  online: boolean;
}

export interface SourceFilterState {
  policy: Set<string>;
}

export function createEmptyFilters(): SourceFilterState {
  return { policy: new Set() };
}

export function filterSources(
  sources: Source[],
  filters: SourceFilterState,
): Source[] {
  if (filters.policy.size === 0) return sources;
  return sources.filter((s) => filters.policy.has(s.policy));
}
