import { NextResponse } from "next/server";
import type { EntropyCatalog, SourceStatus } from "@/lib/entropy/modes";
import { EMS_EGRESS, fetchMultiSources } from "@/lib/entropy/server-config";

// Live per-source state changes with every draw and refill, so this must
// never be served from a cache.
export const dynamic = "force-dynamic";

async function fetchSingleSources(): Promise<SourceStatus[]> {
  const res = await fetch(`${EMS_EGRESS}/v1/entropy/sources`, { cache: "no-store" });
  if (!res.ok) throw new Error(`egress ${res.status}`);
  return (await res.json()) as SourceStatus[];
}

export async function GET() {
  // Independent: one failing leaves the other half of the catalog usable.
  const [single, multi] = await Promise.allSettled([fetchSingleSources(), fetchMultiSources()]);
  for (const r of [single, multi]) {
    if (r.status === "rejected") console.error("[EMS sources error]", r.reason);
  }
  const body: EntropyCatalog = {
    sources: single.status === "fulfilled" ? single.value : [],
    multiSources: multi.status === "fulfilled" ? multi.value : [],
  };
  const ok = single.status === "fulfilled" && multi.status === "fulfilled";
  return NextResponse.json(body, { status: ok ? 200 : 502 });
}
