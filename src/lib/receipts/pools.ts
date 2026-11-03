import { POOL_OPTIONS, sourceDisplayName } from "@/lib/entropy/modes";

// The Pool a receipt is listed under on the Receipts page, shared by the
// table, the detail modal, the Pool filter's options (client) and the filter
// query (server). A key is one of:
//
//   <pool_id>        - a preset pool draw ("pool_fastest").
//   custom:multi     - a Custom pool draw blending several sources.
//   custom:<source>  - a Custom pool draw from one source.

export const CUSTOM_MULTI_KEY = "custom:multi";
const CUSTOM_PREFIX = "custom:";

/** Receipt policies for a blend of several sources. */
export const MULTI_SOURCE_POLICIES = ["multi_source", "custom_pool"];
export const SINGLE_SOURCE_POLICY = "single_source";

export function receiptPoolKey(policy: string, poolId: string, sources: string[]): string {
  if (MULTI_SOURCE_POLICIES.includes(policy)) return CUSTOM_MULTI_KEY;
  if (policy === SINGLE_SOURCE_POLICY && sources.length > 0) return `${CUSTOM_PREFIX}${sources[0]}`;
  return poolId;
}

export type ParsedPoolKey =
  | { kind: "multi" }
  | { kind: "source"; sourceId: string }
  | { kind: "pool"; poolId: string };

export function parsePoolKey(key: string): ParsedPoolKey {
  if (key === CUSTOM_MULTI_KEY) return { kind: "multi" };
  if (key.startsWith(CUSTOM_PREFIX)) return { kind: "source", sourceId: key.slice(CUSTOM_PREFIX.length) };
  return { kind: "pool", poolId: key };
}

/** "Fastest pool", "Custom: Multi-source", "Custom: ANU Quantum RNG", else the pool id. */
export function poolKeyLabel(key: string): string {
  const k = parsePoolKey(key);
  if (k.kind === "multi") return "Custom: Multi-source";
  if (k.kind === "source") return `Custom: ${sourceDisplayName(k.sourceId)}`;
  return POOL_OPTIONS.find((p) => p.poolId === k.poolId)?.name ?? k.poolId;
}
