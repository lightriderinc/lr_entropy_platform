import { NextRequest, NextResponse } from "next/server";
import { logtoConfig } from "@/app/logto";
import { requireLogtoUser } from "@/lib/auth/session";
import {
  BillingUnavailableError,
  cloudBilling,
  ReauthRequiredError,
} from "@/lib/billing/cloudBilling";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/billing/checkout  { amountUsd }
 * Starts the same Stripe Checkout as the cloud platform's credit top-up, for
 * the same wallet. Cloud creates the session and its webhook credits the
 * balance; Stripe returns the user to this app's /settings/credits.
 */
export async function POST(request: NextRequest) {
  let user;
  try {
    user = await requireLogtoUser();
  } catch {
    return NextResponse.json({ error: "Sign in to buy credits." }, { status: 401 });
  }
  const body = await request.json().catch(() => null);
  const amountUsd = Number(body?.amountUsd);
  try {
    // This app's own configured origin, never the request's Host header.
    const returnOrigin = new URL(logtoConfig.baseUrl).origin;
    const r = await cloudBilling.checkout(amountUsd, returnOrigin, user.email);
    return NextResponse.json(r.data, { status: r.status });
  } catch (err) {
    if (err instanceof ReauthRequiredError) {
      return NextResponse.json({ error: "Please sign in again to buy credits." }, { status: 401 });
    }
    if (!(err instanceof BillingUnavailableError)) throw err;
    console.error("[billing] checkout failed:", err);
    return NextResponse.json({ error: "Billing is temporarily unavailable." }, { status: 503 });
  }
}
