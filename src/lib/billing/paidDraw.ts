import { formatTokens } from "@/lib/entropy/pricing";
import type { BillingResponse, ChargeData } from "./cloudBilling";
import { BillingUnavailableError, ReauthRequiredError } from "./errors";

// The money + receipt flow of one draw, kept free of Next/Logto/fetch/DB so
// every path can be tested on its own. /api/entropy supplies the real
// dependencies.
//
//   charge       -> refused: record, answer; the egress is never called
//   draw         -> not delivered (503 out of entropy, 4xx, timeout, network,
//                   200 without a receipt): refund, record, answer
//   saveReceipt  -> the signed receipt is stored BEFORE any bytes go back;
//                   if that fails: refund, record, answer with no bytes
//   answer       -> bytes + receipt
//   settle       -> after the response (afterResponse); a settle that never
//                   lands is refunded by cloud's sweep
//
// A user is never charged for bytes they did not receive, never receives
// bytes without a stored receipt, and one charge can never deliver twice (a
// replayed draw id is refused before drawing).

export const BUY_URL = "/settings/credits";

export type DrawOutcome = {
  /** Egress HTTP response, or null when it was never reached. */
  res: { ok: boolean; status: number } | null;
  /** Parsed body (JSON.parse - for the browser response only). */
  data: unknown;
  /** Raw response text (for the verbatim receipt). */
  text: string | null;
  /** "timeout" | "unreachable" when res is null. */
  failure: string | null;
};

export type PaidDrawDeps = {
  billing: boolean;
  costTokens: number;
  charge: () => Promise<BillingResponse<ChargeData>>;
  draw: () => Promise<DrawOutcome>;
  /** Store the signed receipt from the egress response text. Throws on failure. */
  saveReceipt: (egressResponseText: string) => Promise<void>;
  settle: (egressRequestId: string) => Promise<boolean>;
  refund: (reason: string) => Promise<boolean>;
  /** Best-effort bookkeeping on the draw row. */
  markRefused: (reason: string) => Promise<void>;
  markFailed: (reason: string) => Promise<void>;
  markSettled: () => Promise<void>;
};

export type PaidDrawResult = {
  status: number;
  body: Record<string, unknown>;
  /** Work to run after the response is sent (settling a delivered draw). */
  afterResponse?: () => Promise<void>;
};

export async function runPaidDraw(deps: PaidDrawDeps): Promise<PaidDrawResult> {
  const { billing, costTokens } = deps;
  let balanceCents: number | null = null;

  if (billing) {
    let charge: BillingResponse<ChargeData>;
    try {
      charge = await deps.charge();
    } catch (err) {
      if (err instanceof ReauthRequiredError) {
        await deps.markRefused("reauth_required");
        return { status: 401, body: { error: "reauth_required", message: "Please sign in again to use your credits." } };
      }
      if (!(err instanceof BillingUnavailableError)) console.error("[billing] unexpected charge error:", err);
      await deps.markRefused("billing_unavailable");
      return {
        status: 503,
        body: { error: "billing_unavailable", message: "Billing is temporarily unavailable. Nothing was charged." },
      };
    }
    const c = charge.data;
    if (charge.status === 402) {
      const locked = c.error === "credits_locked";
      await deps.markRefused(locked ? "credits_locked" : "insufficient_credits");
      return {
        status: 402,
        body: {
          error: locked ? "credits_locked" : "insufficient_credits",
          message: locked
            ? "Free signup credits can't be spent on entropy. Buy credits to unlock your balance."
            : `Not enough credits: this draw costs ${formatTokens(costTokens)}, your balance is ${formatTokens(c.balanceCents)}.`,
          costTokens,
          balanceTokens: c.balanceCents,
          buyUrl: BUY_URL,
        },
      };
    }
    if (charge.status !== 200 || c.status !== "charged") {
      await deps.markRefused(c.error ?? "charge_refused");
      return {
        status: charge.status === 409 ? 409 : 400,
        body: { message: c.message ?? "This draw could not be charged." },
      };
    }
    if (c.replayed) {
      // This click was already processed (or is in flight). Never draw twice
      // for one charge; a stuck charge is refunded by cloud's sweep.
      return {
        status: 409,
        body: { error: "draw_already_processed", message: "This draw was already processed. Generate again for new bytes." },
      };
    }
    balanceCents = c.balanceCents;
  }

  const { res, data, text, failure } = await deps.draw();
  const receiptId = (data as { receipt?: { request_id?: string } } | null)?.receipt?.request_id;

  if (res?.ok && receiptId && text) {
    // The signed receipt is stored before any bytes are returned.
    try {
      await deps.saveReceipt(text);
    } catch (err) {
      console.error("[receipts] could not save receipt, refunding:", err);
      const refunded = billing ? await deps.refund("receipt_save_failed") : false;
      await deps.markFailed("receipt_save_failed");
      return {
        status: 503,
        body: {
          error: "receipt_unavailable",
          message: `Your receipt could not be saved, so no entropy was returned.${
            billing ? (refunded ? " You were not charged." : " Your credits will be returned automatically within a few minutes.") : ""
          } Please try again.`,
          refunded,
        },
      };
    }
    return {
      status: 200,
      body: { ...(data as object), billing: billing ? { costTokens, balanceTokens: balanceCents } : null },
      afterResponse: billing
        ? async () => {
            if (await deps.settle(receiptId)) await deps.markSettled();
          }
        : undefined,
    };
  }

  // Not delivered: give the credits back before answering.
  const reason = failure ?? `egress_${res?.status ?? "error"}`;
  const refunded = billing ? await deps.refund(reason) : false;
  await deps.markFailed(reason);
  const note = billing
    ? refunded
      ? " You were not charged."
      : " Your credits will be returned automatically within a few minutes."
    : "";
  if (!res) return { status: 502, body: { message: `Could not reach EMS.${note}`, refunded } };
  const payload = (data ?? {}) as Record<string, unknown>;
  return {
    status: res.ok ? 502 : res.status,
    body: { ...payload, message: `${String(payload.message ?? "Entropy request failed.")}${note}`, refunded },
  };
}
