import { NextRequest, NextResponse } from "next/server";
import { requireLogtoUser } from "@/lib/auth/session";
import { BillingUnavailableError, ReauthRequiredError } from "@/lib/billing/cloudBilling";
import { getTransferHistory, sendTransfers } from "@/lib/billing/transfers";

export const runtime = "nodejs";
// Per-user and changes with every transfer: never cache.
export const dynamic = "force-dynamic";

/**
 * Share Credits for this app's UI. Shapes: lib/billing/transferTypes.ts.
 * Which backend serves each half: lib/billing/transfers.ts.
 *
 *   GET  /api/billing/transfers?view=sent|received&cursor=...  -> TransferHistoryPage
 *   POST /api/billing/transfers { rows: [{ email, credits }], idempotencyKey }
 *        -> TransferBatchOk, or { error, message, rows? } with cloud's statuses;
 *           501 { error: "transfers_unavailable" } while sending is switched off
 */
export async function GET(request: NextRequest) {
  try {
    await requireLogtoUser();
  } catch {
    return NextResponse.json({ error: "sign_in_required" }, { status: 401 });
  }
  const params = request.nextUrl.searchParams;
  const view = params.get("view") === "received" ? "received" : "sent";
  try {
    return NextResponse.json(await getTransferHistory(view, params.get("cursor")));
  } catch (err) {
    return billingFailure(err, "history");
  }
}

export async function POST(request: NextRequest) {
  let user;
  try {
    user = await requireLogtoUser();
  } catch {
    return NextResponse.json({ error: "error", message: "Sign in to send credits." }, { status: 401 });
  }
  const body = await request.json().catch(() => null);
  try {
    const r = await sendTransfers(body?.rows, body?.idempotencyKey, user.email);
    return NextResponse.json(r.body, { status: r.status });
  } catch (err) {
    return billingFailure(err, "send");
  }
}

function billingFailure(err: unknown, what: "history" | "send") {
  if (err instanceof ReauthRequiredError) {
    return NextResponse.json(
      { error: "error", message: "Please sign out and sign in again." },
      { status: 401 },
    );
  }
  if (!(err instanceof BillingUnavailableError)) throw err;
  console.error(`[billing] transfers ${what} failed:`, err);
  return NextResponse.json(
    {
      error: "error",
      message:
        what === "send"
          ? "Billing is temporarily unavailable. Nothing was sent."
          : "Transfer history could not be loaded right now.",
    },
    { status: 503 },
  );
}
