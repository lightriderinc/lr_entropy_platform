import { NextResponse } from "next/server";
import type { EntropyCatalog } from "@/lib/entropy/modes";
import { getEntropyCatalog } from "@/lib/sources/egress";

// Client-side refresh of the Get Entropy catalog after a draw (the first
// load streams from the page). Live state changes with every draw and
// refill, so this must never be served from a cache.
export const dynamic = "force-dynamic";

export async function GET() {
  const { ok, ...catalog } = await getEntropyCatalog();
  return NextResponse.json(catalog satisfies EntropyCatalog, { status: ok ? 200 : 502 });
}
