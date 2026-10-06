import type { Source } from "./filters";

const EMS_ADMIN = process.env.EMS_ADMIN_URL ?? "http://93.127.215.63:5001";

// Genuine sources shown on the platform, keyed by source_id from EMS.
//
// Excluded sources and why:
//   nist_beacon_001        — public beacon, zero secret entropy, anyone can download its values
//   inmetro_beacon_001     — public beacon, zero secret entropy, anyone can download its values
//   curby_q_jila_001       — public beacon, zero secret entropy
//   curby_rng_jila_001     — public beacon, zero secret entropy
//   lightrider_qec_sim_001 — classical simulator, not real quantum entropy
//   ql_lab_001             — stand-in only, no physical hardware attached to this host
//   hwrng_hq_001           — reads same /dev/random as rdseed, not an independent source
//   hwrng_qv_001           — reads same /dev/random as rdseed, not an independent source
//   rdseed_local_001       — classical CPU entropy, Rust collector does not support source rings yet
//   ibm_boston_001         — offline
//   ibm_fez_001            — offline
//   ibm_kingston_001       — offline
//   ibm_marrakesh_001      — offline
//   ibm_miami_001          — offline
//   ibm_pittsburgh_001     — offline
//   rigetti_cepheus_001    — real QPU but per-chiplet pool complexity, adding last
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
    type: "Superconducting QPU — IQM Garnet hardware",
    policy: "quantum-verified",
  },
  lightrider_qec_001: {
    name: "Light Rider QEC (IQM)",
    type: "Quantum error-corrected entropy — real IQM Garnet hardware",
    policy: "highest-quality",
  },
  qispace_kds_001: {
    name: "QiSpace TQRND",
    type: "True quantum random number generator — QiSpace enterprise node",
    policy: "highest-quality",
  },
};

/**
 * Fetches live source status from EMS. Call this directly from server code
 * rather than going through /api/sources over HTTP — a server-side fetch to
 * the app's own URL breaks on protected preview deployments.
 */
export async function getSources(): Promise<Source[]> {
  try {
    const res = await fetch(`${EMS_ADMIN}/api/v1/sources`, {
      cache: "no-store",
    });

    if (!res.ok) throw new Error(`EMS returned ${res.status}`);

    const allSources = await res.json();

    return allSources
      .filter((s: { source_id: string }) => SOURCE_META[s.source_id])
      .map((s: { source_id: string; status: string }) => ({
        ...SOURCE_META[s.source_id],
        online: s.status === "online",
      }));
  } catch (err) {
    console.error("[getSources error]", err);
    return Object.values(SOURCE_META).map((s) => ({ ...s, online: true }));
  }
}