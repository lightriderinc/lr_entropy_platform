import { formatTokens } from "@/lib/entropy/pricing";
import type { BillingResponse, ChargeData } from "./cloudBilling";
import { BillingUnavailableError, ReauthRequiredError } from "./errors";

// The money flow of one draw, kept free of Next/Logto/fetch so every path can
// be tested on its own. /api/entropy supplies the real dependencies.
//
//   charge  -> (refused: answer, egress never called)
//   draw    -> delivered (receipt): settle
//           -> anything else (503 out of entropy, 4xx, timeout, network,
//              200 without a receipt): refund, then answer
//
// A user is never charged for bytes they did not receive, and one charge can
// never deliver twice (a replayed draw id is refused before drawing).

export const BUY_URL = "/settings/credits";

export type DrawOutcome = {
  /** Egress HTTP response, or null when it was never reached. */
  res: { ok: boolean; status: number } | null;
  data: unknown;
  /** "timeout" | "unreachable" when res is null. */
  failure: string | null;
};

export type PaidDrawDeps = {
  billing: boolean;
  costTokens: number;
  charge: () => Promise<BillingResponse<ChargeData>>;
  draw: () => Promise<DrawOutcome>;
  settle: (egressRequestId: string) => Promise<boolean>;
  refund: (reason: string) => Promise<boolean>;
};

export type PaidDrawResult = { status: number; body: Record<string, unknown> };

export async function runPaidDraw(deps: PaidDrawDeps): Promise<PaidDrawResult> {
  const { billing, costTokens } = deps;
  let balanceCents: number | null = null;

  if (billing) {
    let charge: BillingResponse<ChargeData>;
    try {
      charge = await deps.charge();
    } catch (err) {
      if (err instanceof ReauthRequiredError) {
        return { status: 401, body: { error: "reauth_required", message: "Please sign in again to use your credits." } };
      }
      if (!(err instanceof BillingUnavailableError)) console.error("[billing] unexpected charge error:", err);
      return {
        status: 503,
        body: { error: "billing_unavailable", message: "Billing is temporarily unavailable. Nothing was charged." },
      };
    }
    const c = charge.data;
    if (charge.status === 402) {
      const locked = c.error === "credits_locked";
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

  const { res, data, failure } = await deps.draw();
  const receiptId = (data as { receipt?: { request_id?: string } } | null)?.receipt?.request_id;

  if (res?.ok && receiptId) {
    if (billing) await deps.settle(receiptId);
    return {
      status: 200,
      body: { ...(data as object), billing: billing ? { costTokens, balanceTokens: balanceCents } : null },
    };
  }

  // Not delivered: give the credits back before answering.
  const reason = failure ?? `egress_${res?.status ?? "error"}`;
  const refunded = billing ? await deps.refund(reason) : false;
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
