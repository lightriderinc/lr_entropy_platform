import { NextRequest, NextResponse } from "next/server";
import {
  MAX_CUSTOM_SOURCES,
  MIN_CUSTOM_SOURCES,
  POOL_OPTIONS,
  SINGLE_SOURCE_OPTIONS,
} from "@/lib/entropy/modes";
import { EMS_EGRESS, egressHeaders, fetchMultiSources } from "@/lib/sources/egress";

// Source cards (`?source=<card id>`): each card draws from the tier pool its
// source feeds; the receipt shows which pool actually served it.
const POLICY_MAP: Record<string, string> = {
   "cisco-qrng":       "highest_quality",
  "anu-qrng":         "highest_quality",
  "iqm-resonance":    "quantum_verified",
  "iqm-qec-2":        "quantum_verified",
  "iqm-qec-3":        "quantum_verified",
  "iqm-qec-4":        "quantum_verified",
  "iqm-qec-5":        "quantum_verified",
  "inmetro-beacon":   "fastest_available",
  "nist-beacon":      "fastest_available",
  "rdseed":           "fastest_available",
  // Rigetti feeds pool_quantum_verified (ems-egress/src/policy.rs), so it is
  // the one source here that does NOT route to the fastest tier.
  "rigetti-cepheus":  "quantum_verified",
  default:            "fastest_available",
};

const MIN_BYTES = 1;
const MAX_BYTES = 4096;

interface EgressCall {
  path: string;
  body: Record<string, unknown>;
}

/**
 * Custom pool: the user's picks, re-validated against EMS's CURRENT picker
 * list (not the list the browser saw), so a source that went offline, was
 * disabled, is a beacon/simulator, or would read the corrupted pool_fastest
 * ring is refused here even if a stale page still offers it.
 */
async function customCall(
  rawIds: string,
  bytes: number,
): Promise<{ call: EgressCall } | { error: string; status: number }> {
  const ids = [...new Set(rawIds.split(",").map((s) => s.trim()).filter(Boolean))];
  if (ids.length < MIN_CUSTOM_SOURCES || ids.length > MAX_CUSTOM_SOURCES) {
    return {
      error: `Pick ${MIN_CUSTOM_SOURCES}–${MAX_CUSTOM_SOURCES} different sources.`,
      status: 400,
    };
  }
  let catalog;
  try {
    catalog = await fetchMultiSources();
  } catch (err) {
    console.error("[EMS multi sources error]", err);
    return { error: "Could not check source status with EMS.", status: 502 };
  }
  for (const id of ids) {
    const entry = catalog.find((s) => s.source_id === id);
    if (!entry) return { error: `Source '${id}' cannot be used in a custom pool.`, status: 400 };
    if (!entry.selectable) {
      return { error: `Source '${id}' is not available: ${entry.reason ?? "not selectable"}.`, status: 409 };
    }
  }
  return {
    call: { path: "/v1/entropy/multi", body: { bytes, method: "cascade", source_ids: ids } },
  };
}

// Explicit modes (`?mode=pool|source&id=...`). Every id is checked
// against an allowlist, so the client can never steer the egress path.
function explicitCall(mode: string, id: string, bytes: number): EgressCall | null {
  if (mode === "pool") {
    const pool = POOL_OPTIONS.find((p) => p.id === id);
    return pool ? { path: "/v1/entropy/request", body: { bytes, policy: pool.policy } } : null;
  }
  if (mode === "source") {
    const source = SINGLE_SOURCE_OPTIONS.find((s) => s.id === id);
    return source
      ? { path: `/v1/entropy/source/${encodeURIComponent(source.id)}`, body: { bytes } }
      : null;
  }
  return null;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const bytes = parseInt(searchParams.get("bytes") ?? "32", 10);
  const mode = searchParams.get("mode");

  let call: EgressCall | null;
  if (mode) {
    if (!Number.isInteger(bytes) || bytes < MIN_BYTES || bytes > MAX_BYTES) {
      return NextResponse.json(
        { message: `bytes must be ${MIN_BYTES}–${MAX_BYTES}` },
        { status: 400 }
      );
    }
    if (mode === "custom") {
      const custom = await customCall(searchParams.get("ids") ?? "", bytes);
      if ("error" in custom) {
        return NextResponse.json({ message: custom.error }, { status: custom.status });
      }
      call = custom.call;
    } else {
      call = explicitCall(mode, searchParams.get("id") ?? "", bytes);
    }
    if (!call) {
      return NextResponse.json({ message: "Unknown entropy mode or id." }, { status: 400 });
    }
  } else {
    const sourceId = searchParams.get("source") ?? "nist-beacon";
    const policy = POLICY_MAP[sourceId] ?? POLICY_MAP.default;
    call = { path: "/v1/entropy/request", body: { bytes, policy } };
  }

  try {
    const res = await fetch(`${EMS_EGRESS}${call.path}`, {
      method: "POST",
      headers: egressHeaders(),
      body: JSON.stringify(call.body),
      cache: "no-store",
    });

    // Egress errors are plain text, except single-source ones, which are
    // JSON ({ error: "source_empty", source_id, message, ... }). Both reach
    // the client as JSON with a `message`.
    const text = await res.text();
    let data: unknown;
    try { data = JSON.parse(text); } catch { data = { message: text }; }

    console.log("[EMS egress]", call.path, res.status, text.slice(0, 120));
    return NextResponse.json(data, { status: res.ok ? 200 : res.status });
  } catch (err) {
    console.error("[EMS egress error]", err);
    return NextResponse.json(
      { message: "Could not reach EMS", error: String(err) },
      { status: 502 }
    );
  }
}
