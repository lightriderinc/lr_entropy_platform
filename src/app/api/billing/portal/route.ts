import { NextResponse } from "next/server";
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
 * POST /api/billing/portal
 * Opens the Stripe Customer Portal for the shared wallet's Customer (update
 * payment method, view invoices), without sending the user to Light Rider
 * Cloud. Cloud creates the session; Stripe's "Return" link comes back to this
 * app's /settings/payment-and-history. Answers { url } to navigate to.
 */
export async function POST() {
  try {
    await requireLogtoUser();
  } catch {
    return NextResponse.json({ error: "Sign in to manage billing." }, { status: 401 });
  }
  try {
    // This app's own configured origin, never the request's Host header.
    const returnOrigin = new URL(logtoConfig.baseUrl).origin;
    const r = await cloudBilling.portal(returnOrigin);
    if (r.status === 404) {
      return NextResponse.json({ error: "No billing account yet. Purchase credits first." }, { status: 404 });
    }
    return NextResponse.json(r.data, { status: r.status });
  } catch (err) {
    if (err instanceof ReauthRequiredError) {
      return NextResponse.json({ error: "Please sign in again to manage billing." }, { status: 401 });
    }
    if (!(err instanceof BillingUnavailableError)) throw err;
    console.error("[billing] portal failed:", err);
    return NextResponse.json({ error: "Billing is temporarily unavailable." }, { status: 503 });
  }
}
