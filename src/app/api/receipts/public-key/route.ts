import { NextResponse } from "next/server";
import { getReceiptPublicKey } from "@/lib/receipts/publicKey";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/receipts/public-key - the Ed25519 key EMS signs receipts with, for
 * in-browser verification (the egress itself is plain HTTP, which an HTTPS
 * page can't call). Public: it is a public key.
 */
export async function GET() {
  try {
    return NextResponse.json(await getReceiptPublicKey());
  } catch (err) {
    console.error("[receipts] public key unavailable:", err);
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
}
