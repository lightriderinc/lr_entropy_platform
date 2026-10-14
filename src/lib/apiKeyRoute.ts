import { NextResponse } from "next/server";
import { requireLogtoUser } from "@/lib/auth/session";
import {
  BillingUnavailableError,
  isBillingConfigured,
  ReauthRequiredError,
  type BillingResponse,
} from "@/lib/billing/cloudBilling";

/**
 * Shared shell for /api/api-key*: signed-in only, then one call to cloud's
 * key API (lib/billing/cloudBilling.ts apiKeyAccount), passing cloud's answer
 * through. Responses carrying a full key are never cached.
 */
export async function apiKeyRoute<T>(cloudCall: () => Promise<BillingResponse<T>>): Promise<NextResponse> {
  try {
    await requireLogtoUser();
  } catch {
    return NextResponse.json({ error: "sign_in_required", message: "Sign in to manage your API key." }, { status: 401 });
  }
  if (!isBillingConfigured()) {
    return NextResponse.json({ error: "unavailable", message: "API keys can't be managed right now." }, { status: 503 });
  }
  try {
    const r = await cloudCall();
    return NextResponse.json(r.data, { status: r.status, headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    if (err instanceof ReauthRequiredError) {
      return NextResponse.json({ error: "reauth_required", message: "Please sign in again to manage your API key." }, { status: 401 });
    }
    if (!(err instanceof BillingUnavailableError)) console.error("[api-key] unexpected error:", err);
    return NextResponse.json({ error: "unavailable", message: "API keys can't be managed right now. Try again shortly." }, { status: 503 });
  }
}
