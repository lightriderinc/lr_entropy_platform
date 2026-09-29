import { NextResponse } from "next/server";

const EMS_ADMIN = process.env.EMS_ADMIN_URL ?? "http://93.127.215.63:5001";

// Only these six sources are shown on the platform.
// Keyed by source_id from EMS.
const SOURCE_META: Record<string, { name: string; type: string; policy: string }> = {
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
  inmetro_beacon_001: {
    name: "Inmetro Beacon",
    type: "Public randomness beacon (Brazil)",
    policy: "fastest",
  },
  nist_beacon_001: {
    name: "NIST Beacon",
    type: "Public randomness beacon (US)",
    policy: "fastest",
  },
  rdseed_local_001: {
    name: "RDSEED",
    type: "CPU hardware entropy pool",
    policy: "fastest",
  },
};

export async function GET() {
  try {
    const res = await fetch(`${EMS_ADMIN}/api/v1/sources`, {
      cache: "no-store",
    });

    if (!res.ok) throw new Error(`EMS returned ${res.status}`);

    const allSources = await res.json();

    // Filter to only our six known sources and map to the Source shape
    const sources = allSources
      .filter((s: { source_id: string }) => SOURCE_META[s.source_id])
      .map((s: { source_id: string; status: string }) => ({
        ...SOURCE_META[s.source_id],
        online: s.status === "online",
      }));

    return NextResponse.json(sources);
  } catch (err) {
    console.error("[sources route error]", err);
    // Fall back to hardcoded list if EMS is unreachable
    const fallback = Object.values(SOURCE_META).map((s) => ({ ...s, online: true }));
    return NextResponse.json(fallback);
  }
}