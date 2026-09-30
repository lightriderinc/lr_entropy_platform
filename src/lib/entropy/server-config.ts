// Server-only settings and helpers for the /api/entropy routes (never
// imported by the client; env is read on Vercel at request time).

import type { MultiSourceStatus } from "./modes";

export const EMS_EGRESS = process.env.EMS_EGRESS_URL ?? "http://93.127.215.63:7081";

/**
 * The custom-pool picker list from EMS: live status (the same check
 * /v1/entropy/multi makes) and the ring each source's bytes come from.
 * Fetched fresh every time, so a draw is validated against current state.
 */
export async function fetchMultiSources(): Promise<MultiSourceStatus[]> {
  const res = await fetch(`${EMS_EGRESS}/v1/entropy/multi/sources`, { cache: "no-store" });
  if (!res.ok) throw new Error(`egress ${res.status}`);
  return (await res.json()) as MultiSourceStatus[];
}
