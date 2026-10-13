import { NextRequest, NextResponse } from "next/server";
import { requireLogtoUser } from "@/lib/auth/session";
import {
  BillingUnavailableError,
  cloudBilling,
  isBillingDisabledForDev,
  ReauthRequiredError,
} from "@/lib/billing/cloudBilling";

export const runtime = "nodejs";
// Per-user and changes with every draw: never cache.
export const dynamic = "force-dynamic";

/**
 * GET /api/billing/wallet?cursor=...
 * The signed-in user's shared Light Rider wallet (balance in tokens = credits,
 * unlock status, ledger page), proxied from the cloud billing API.
 */
export async function GET(request: NextRequest) {
  try {
    await requireLogtoUser();
  } catch {
    return NextResponse.json({ error: "sign_in_required" }, { status: 401 });
  }
  if (isBillingDisabledForDev()) {
    return NextResponse.json({ disabled: true, balanceCents: 0, unlocked: true, entries: [], nextCursor: null });
  }
  try {
    const r = await cloudBilling.wallet(request.nextUrl.searchParams.get("cursor"));
    return NextResponse.json(r.data, { status: r.status });
  } catch (err) {
    if (err instanceof ReauthRequiredError) {
      return NextResponse.json({ error: "reauth_required" }, { status: 401 });
    }
    if (!(err instanceof BillingUnavailableError)) throw err;
    console.error("[billing] wallet failed:", err);
    return NextResponse.json({ error: "billing_unavailable" }, { status: 503 });
  }
}
