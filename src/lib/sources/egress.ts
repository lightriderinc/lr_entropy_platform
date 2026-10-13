import type { EntropyCatalog, MultiSourceStatus, SourceStatus } from "@/lib/entropy/modes";

// Server-only: EMS egress (data plane) calls. The admin registry lives in
// ./ems.ts; this file is the egress side. Like getSources(), call these
// directly from server code rather than through this app's own /api routes.

export const EMS_EGRESS = process.env.EMS_EGRESS_URL ?? "http://93.127.215.63:7081";

/**
 * Headers for every egress call. PRE-LAUNCH: EMS_API_KEY is left unset and
 * callers rely on the egress's anonymous grant (all tier pools, multi-source,
 * single source). This adds `Authorization` only when EMS_API_KEY is set, so
 * auth can come back at launch by setting the env var, without touching any
 * call site.
 */
export function egressHeaders(): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const key = (process.env.EMS_API_KEY ?? "").trim();
  if (key) headers["Authorization"] = `Bearer ${key}`;
  return headers;
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${EMS_EGRESS}${path}`, { headers: egressHeaders(), cache: "no-store" });
  if (!res.ok) throw new Error(`egress ${path} returned ${res.status}`);
  return (await res.json()) as T;
}

/** Single-source catalog: each source's own ring, ready / empty / unavailable. */
export function fetchSingleSources(): Promise<SourceStatus[]> {
  return getJson<SourceStatus[]>("/v1/entropy/sources");
}

/**
 * Custom-pool picker list: live status (the same check /v1/entropy/multi
 * makes) and the ring each source's bytes come from. Always fetched fresh,
 * so a draw is validated against current state.
 */
export function fetchMultiSources(): Promise<MultiSourceStatus[]> {
  return getJson<MultiSourceStatus[]>("/v1/entropy/multi/sources");
}

/**
 * Both catalogs. Never rejects (it feeds `use()` under Suspense): a failed
 * half comes back empty and `ok` is false.
 */
export async function getEntropyCatalog(): Promise<EntropyCatalog & { ok: boolean }> {
  const [single, multi] = await Promise.allSettled([fetchSingleSources(), fetchMultiSources()]);
  for (const r of [single, multi]) {
    if (r.status === "rejected") console.error("[EMS catalog error]", r.reason);
  }
  return {
    sources: single.status === "fulfilled" ? single.value : [],
    multiSources: multi.status === "fulfilled" ? multi.value : [],
    ok: single.status === "fulfilled" && multi.status === "fulfilled",
  };
}
