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

export interface SingleSourceOption {
  id: string;
  name: string;
  description: string;
}

// Pilot: ANU only. Must stay a subset of SINGLE_SOURCES in ems-egress.
export const SINGLE_SOURCE_OPTIONS: SingleSourceOption[] = [
  {
    id: "anu_aws_001",
    name: "ANU Quantum RNG",
    description: "Quantum vacuum fluctuations from the Australian National University. Bytes come only from ANU.",
  },
  {
    id: "cisco_qrng_001",
    name: "Cisco Outshift QRNG",
    description: "Quantum-generated random numbers from Cisco's cloud quantum service. Bytes come only from Cisco.",
  },
  {
    id: "lightrider_qec_001",
    name: "Light Rider QEC (IQM)",
    description: "Quantum error-corrected entropy from real IQM Garnet hardware. Bytes come only from QEC circuits.",
  },
  {
    id: "qispace_kds_001",
    name: "QiSpace TQRND",
    description: "True quantum random numbers from QiSpace enterprise node. Bytes come only from QiSpace.",
  },
];

// Custom pool size limits (EMS multi.rs MAX_SOURCES, and its 2-source floor).
export const MIN_CUSTOM_SOURCES = 2;
export const MAX_CUSTOM_SOURCES = 8;

// Display names for source ids that can appear on a receipt.
const SOURCE_NAMES: Record<string, string> = {
  anu_aws_001: "ANU Quantum RNG",
  qispace_kds_001: "QiSpace TQRND",
  lightrider_qec_001: "Light Rider QEC (IQM)",
  iqm_resonance_001: "IQM Resonance",
  ibm_kingston_001: "IBM Kingston",
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
  return SOURCE_NAMES[id] ?? id;
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
