import { isHiddenSource } from "@/lib/entropy/modes";
import type { Source } from "./filters";

const EMS_ADMIN = process.env.EMS_ADMIN_URL ?? "http://93.127.215.63:5001";

// The "Source cards" tab on Get Entropy (each card draws from the tier pool
// its source feeds). Keyed by source_id from EMS. Hidden sources (public
// beacons etc., see isHiddenSource) are never listed.
const SOURCE_META: Record<string, Omit<Source, "online">> = {
  anu_aws_001: {
    name: "ANU Quantum RNG",
    type: "Quantum optical source (photon vacuum)",
    policy: "highest-quality",
  },
  cisco_qrng_001: {
    name: "Cisco Outshift QRNG",
    type: "Cloud quantum random number generator",
    policy: "highest-quality",
  },
  iqm_resonance_001: {
    name: "IQM Resonance",
    type: "Superconducting QPU with optional QEC error correction",
    policy: "highest-quality",
  },
  rdseed_local_001: {
    name: "RDSEED",
    type: "CPU hardware entropy pool",
    policy: "fastest",
  },
};

/** EMS admin registry: source_id -> online? Throws when EMS is unreachable. */
export async function fetchSourceOnline(): Promise<Record<string, boolean>> {
  const res = await fetch(`${EMS_ADMIN}/api/v1/sources`, { cache: "no-store" });
  if (!res.ok) throw new Error(`EMS returned ${res.status}`);
  const rows = (await res.json()) as { source_id: string; status: string }[];
  return Object.fromEntries(rows.map((s) => [s.source_id, s.status === "online"]));
}

/**
 * Source cards with live online status from EMS. Call this directly from
 * server code rather than going through /api/sources over HTTP — a
 * server-side fetch to the app's own URL breaks on protected preview
 * deployments.
 */
export async function getSources(): Promise<Source[]> {
  const ids = Object.keys(SOURCE_META).filter((id) => !isHiddenSource(id));
  try {
    const online = await fetchSourceOnline();
    return ids.filter((id) => id in online).map((id) => ({ ...SOURCE_META[id], online: online[id] }));
  } catch (err) {
    console.error("[getSources error]", err);
    // Fall back to the hardcoded list if EMS is unreachable
    return ids.map((id) => ({ ...SOURCE_META[id], online: true }));
  }
}
