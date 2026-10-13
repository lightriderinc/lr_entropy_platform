// Serving modes offered on Get Entropy, shared by the console (client) and
// the /api/entropy route (server). Pure data: no client or server imports.
//
//   pool   - an EMS tier pool. Several collectors feed each one, so a draw
//            says which sources contributed only via the receipt.
//   custom - a blend of 2-8 sources the user picks (EMS /v1/entropy/multi).
//   source - one source only, from its own ring (EMS /v1/entropy/source/:id).

export type EntropyMode = "pool" | "custom" | "source" | "card";

export interface PoolOption {
  id: string;
  poolId: string;
  policy: string;
  name: string;
  description: string;
}

export const POOL_OPTIONS: PoolOption[] = [
  {
    id: "fastest",
    poolId: "pool_fastest",
    policy: "fastest_available",
    name: "Fastest pool",
    description: "Shared pool fed by local and fast sources. Lowest latency.",
  },
  {
    id: "highest_quality",
    poolId: "pool_highest_quality",
    policy: "highest_quality",
    name: "Highest-quality pool",
    description: "Shared pool fed by quantum RNG services and hardware backstops.",
  },
  {
    id: "quantum_verified",
    poolId: "pool_quantum_verified",
    policy: "quantum_verified",
    name: "Quantum-verified pool",
    description: "Shared pool fed by quantum processors and quantum RNGs.",
  },
];

export type TierId = "highest_quality" | "quantum_verified" | "fastest";

/**
 * A source the site shows. Every source appears in exactly one way:
 *
 *   Available   - listed here without `comingSoon`, AND it has its own ring
 *                 (egress catalogs). An empty own ring is still Available,
 *                 with the "refill pending" badge.
 *   Coming soon - listed here with `comingSoon: true`: shown greyed out,
 *                 never selectable. Moving one to Available = deleting
 *                 that `comingSoon: true` (it must also be in ems-egress
 *                 SINGLE_SOURCES to be drawn alone).
 *   Hidden      - isHiddenSource(): never shown anywhere.
 *
 * Anything else (not listed, or listed but with no own ring yet) is not
 * shown either.
 */
/** Short tag shown on a source's card. */
export type SourceTag = "QPU" | "QRNG" | "Beacon" | "Hardware RNG";

export interface SiteSource {
  id: string;
  name: string;
  tag: SourceTag;
  /** One-line kind for the Sources page. User-facing: no internals. */
  kind: string;
  /** Tier pool this source's surplus feeds. */
  tier: TierId;
  comingSoon?: true;
}

export const SITE_SOURCES: SiteSource[] = [
  { id: "anu_aws_001", name: "ANU Quantum RNG", tag: "QRNG", kind: "Quantum optical source (photon vacuum)", tier: "highest_quality" },
  { id: "cisco_qrng_001", name: "Cisco Outshift QRNG", tag: "QRNG", kind: "Cloud quantum random number generator", tier: "highest_quality" },
  { id: "lightrider_qec_001", name: "Light Rider QEC (IQM)", tag: "QPU", kind: "Error-corrected quantum processor", tier: "highest_quality" },
  { id: "qispace_kds_001", name: "QiSpace TQRND", tag: "QRNG", kind: "Quantum random number generator", tier: "highest_quality" },
  { id: "rigetti_cepheus_001", name: "Rigetti Cepheus-1-108Q", tag: "QPU", kind: "Superconducting quantum processor", tier: "quantum_verified" },
  { id: "iqm_resonance_001", name: "IQM Resonance", tag: "QPU", kind: "Superconducting quantum processor", tier: "highest_quality" },
  // --- Coming soon -----------------------------------------------------------
  ...(
    [
      ["ibm_boston_001", "IBM Boston"],
      ["ibm_fez_001", "IBM Fez"],
      ["ibm_kingston_001", "IBM Kingston"],
      ["ibm_marrakesh_001", "IBM Marrakesh"],
      ["ibm_miami_001", "IBM Miami"],
      ["ibm_pittsburgh_001", "IBM Pittsburgh"],
    ] as const
  ).map(([id, name]): SiteSource => ({
    id,
    name,
    tag: "QPU",
    kind: "Superconducting quantum processor",
    tier: "highest_quality",
    comingSoon: true,
  })),
  { id: "rdseed_local_001", name: "RDSEED", tag: "Hardware RNG", kind: "CPU hardware entropy", tier: "fastest", comingSoon: true },
];

/** Never shown anywhere: public beacons, simulators, stand-ins, host RNG twins, expansion lanes. */
export function isHiddenSource(id: string): boolean {
  return (
    id === "nist_beacon_001" ||
    id === "inmetro_beacon_001" ||
    id.startsWith("curby_") ||
    id === "sim_dev_001" ||
    id === "lightrider_qec_sim_001" ||
    id === "ql_lab_001" ||
    id.startsWith("hwrng_") ||
    id === "qispace_qpp_001"
  );
}

export function siteSource(id: string): SiteSource | undefined {
  return SITE_SOURCES.find((s) => s.id === id);
}

export function isComingSoon(id: string): boolean {
  return siteSource(id)?.comingSoon === true;
}

/** Listed, not coming soon, not hidden. Still needs its own ring to be shown. */
export function isOfferedSource(id: string): boolean {
  const s = siteSource(id);
  return !!s && !s.comingSoon && !isHiddenSource(id);
}

export const COMING_SOON_SOURCES: SiteSource[] = SITE_SOURCES.filter((s) => s.comingSoon);

/**
 * Single source: a card whose "QEC error correction" toggle draws from a
 * different source with its own ring. IQM Resonance raw (off) vs the same
 * IQM hardware through the Light Rider SDK with QEC (on). The QEC source is
 * folded into its parent's card rather than listed twice.
 */
export const QEC_VARIANT: Record<string, string> = {
  iqm_resonance_001: "lightrider_qec_001",
};

/** The source a single-source draw really uses for this card + toggle. */
export function singleSourceDrawId(cardId: string, qec: boolean): string {
  return qec && QEC_VARIANT[cardId] ? QEC_VARIANT[cardId] : cardId;
}

export type SingleSourceOption = Pick<SiteSource, "id" | "name" | "tag">;

// Offered for single-source draws (the route's allowlist too). Must stay a
// subset of SINGLE_SOURCES in ems-egress (config.rs).
export const SINGLE_SOURCE_OPTIONS: SingleSourceOption[] = SITE_SOURCES.filter((s) => isOfferedSource(s.id));

// Custom pool size limits (EMS multi.rs MAX_SOURCES, and its 2-source floor).
export const MIN_CUSTOM_SOURCES = 2;
export const MAX_CUSTOM_SOURCES = 8;

// Display names for source ids that can appear on a receipt (receipts can
// name any contributing source, hidden ones included). Falls back to SITE_SOURCES.
const SOURCE_NAMES: Record<string, string> = {
  anu_aws_001: "ANU Quantum RNG",
  qispace_kds_001: "QiSpace TQRND",
  lightrider_qec_001: "Light Rider QEC (IQM)",
  iqm_resonance_001: "IQM Resonance",
  rigetti_cepheus_001: "Rigetti Cepheus-1-108Q",
  cisco_qrng_001: "Cisco Outshift QRNG",
  curby_q_jila_001: "CURBy-Q beacon",
  curby_rng_jila_001: "CURBy-RNG beacon",
  nist_beacon_001: "NIST Beacon",
  inmetro_beacon_001: "Inmetro Beacon",
  rdseed_local_001: "RDSEED (host kernel RNG)",
  hwrng_qv_001: "Host hardware RNG",
  hwrng_hq_001: "Host hardware RNG",
  ql_lab_001: "Quantum Light (lab stand-in)",
  sim_dev_001: "Simulator",
};

export function sourceDisplayName(id: string): string {
  return SOURCE_NAMES[id] ?? siteSource(id)?.name ?? id;
}

/** What kind of draw a receipt describes, from its own `policy` field. */
export function modeFromPolicy(policy: string): string {
  if (policy === "single_source") return "Single source";
  if (policy === "multi_source" || policy === "custom_pool") return "Custom pool";
  return "Pool";
}

/** Catalog entry from EMS GET /v1/entropy/sources. */
export interface SourceStatus {
  source_id: string;
  label: string;
  class: string;
  pool_id: string;
  tier_pool: string;
  credited_rate_bits_per_byte: number;
  state: "ready" | "empty" | "unavailable";
  bytes_available: number;
  max_draw_bytes: number;
}

/**
 * Custom-pool picker entry from EMS GET /v1/entropy/multi/sources. Public
 * beacons and simulators never appear. `ring` is where a draw would read
 * this source's share: its own `pool_src_<id>`, or the tier it falls back to.
 */
export interface MultiSourceStatus {
  source_id: string;
  selectable: boolean;
  reason: string | null;
  live: boolean;
  enabled: boolean;
  bytes_from: "own_ring" | "tier_fallback";
  ring: string;
  ring_healthy: boolean;
  /** Bytes on hand in the source's own pool; null/absent for a tier fallback. */
  bytes_available?: number | null;
  credited_rate_bits_per_byte: number;
}

export interface EntropyCatalog {
  sources: SourceStatus[];
  multiSources: MultiSourceStatus[];
}

/**
 * A source's own ring, from the egress catalogs: "ready" / "empty", or null
 * when it has no ring of its own (not Available). The single-source catalog
 * is authoritative; the custom-pool list covers sources not in it.
 */
export function ownRingState(id: string, catalog: EntropyCatalog): "ready" | "empty" | null {
  const single = catalog.sources.find((s) => s.source_id === id);
  if (single && single.state !== "unavailable") return single.state;
  const multi = catalog.multiSources.find((s) => s.source_id === id);
  if (multi?.bytes_from === "own_ring") return (multi.bytes_available ?? 0) > 0 ? "ready" : "empty";
  return null;
}
