import { BillingUnavailableError, cloudBilling, isBillingDisabledForDev, transferAccount } from "./cloudBilling";
import {
  MAX_TRANSFER_ROWS,
  type TransferHistoryPage,
  type TransferRecord,
  type TransferRowInput,
  type TransferView,
} from "./transferTypes";

// Share Credits backend, server-only. The UI only ever talks to this app's
// /api/billing/transfers route, whose request/response shapes are fixed in
// transferTypes.ts.
//
// Sending always goes to Light Rider Cloud, behind the internal secret + user
// token:
//   POST /api/internal/entropy/transfer  { rows: [{ email, credits }], idempotencyKey, email? }
//     -> exactly what Cloud's own POST /api/billing/credits/transfer returns
// Sending moves money between two wallets that live in cloud's database, so
// it can only happen on cloud: there is no local fallback for it, by design.
//
// History is chosen by env:
//   ENTROPY_TRANSFER_HISTORY  "cloud" -> GET cloud /api/internal/entropy/transfers
//                             (not served by Cloud yet; falls back to the ledger)
//                             anything else (default) -> "ledger": read from the
//                             shared wallet ledger this app already gets

export type SendOutcome = { status: number; body: Record<string, unknown> };

const UNAVAILABLE: SendOutcome = {
  status: 501,
  body: {
    error: "transfers_unavailable",
    message: "Sending credits isn't available on the Entropy platform yet.",
  },
};

const TRANSFER_SENT_PREFIX = "transfer_sent:";
const TRANSFER_RECEIVED_PREFIX = "transfer_received:";
const HISTORY_PAGE_SIZE = 10;
/** Ledger pages (50 rows each) one history request may scan for transfers. */
const LEDGER_SCAN_PAGES = 10;

function sendBackend(): "cloud" | "off" {
  return isBillingDisabledForDev() ? "off" : "cloud";
}

function historyBackend(): "cloud" | "ledger" | "none" {
  if (isBillingDisabledForDev()) return "none";
  return process.env.ENTROPY_TRANSFER_HISTORY === "cloud" ? "cloud" : "ledger";
}

/** What the page should offer. Read on the server and passed down as props. */
export function transferCapabilities(): { canSend: boolean } {
  return { canSend: sendBackend() !== "off" };
}

/** Basic shape checks only; the backend does the real per-row validation. */
function badRequest(message: string): SendOutcome {
  return { status: 400, body: { error: "error", message } };
}

export async function sendTransfers(
  rows: unknown,
  idempotencyKey: unknown,
  senderEmail?: string,
): Promise<SendOutcome> {
  if (sendBackend() === "off") return UNAVAILABLE;
  if (!Array.isArray(rows)) return badRequest("Expected a list of recipients.");
  if (rows.length > MAX_TRANSFER_ROWS) {
    return { status: 400, body: { error: "too_many_rows", message: `Send to at most ${MAX_TRANSFER_ROWS} people at once.` } };
  }
  if (typeof idempotencyKey !== "string" || !idempotencyKey) return badRequest("Missing idempotency key.");

  const clean: TransferRowInput[] = rows.map((raw) => {
    const row = (raw ?? {}) as { email?: unknown; credits?: unknown };
    return { email: typeof row.email === "string" ? row.email : "", credits: Number(row.credits) };
  });

  const r = await transferAccount.send(clean, idempotencyKey, senderEmail);
  // CLOUD_BILLING_URL still points at a deployment without the endpoint (e.g.
  // the Quantum app before the switch-over): same answer as "switched off".
  if (r.status === 404) return UNAVAILABLE;
  // Cloud answers its own handled failures (e.g. a recipient lookup that
  // failed) with a 500 and a user-facing message: pass that through so this
  // page shows exactly what Cloud's page does. A bare 500 is an outage.
  if (r.status >= 500 && typeof r.data.message !== "string") {
    throw new BillingUnavailableError(`Billing API /api/internal/entropy/transfer returned ${r.status}`);
  }
  return { status: r.status, body: r.data };
}

export async function getTransferHistory(view: TransferView, cursor: string | null): Promise<TransferHistoryPage> {
  const backend = historyBackend();
  if (backend === "none") return { view, transfers: [], nextCursor: null };

  if (backend === "cloud") {
    const r = await transferAccount.history(view, cursor);
    // Not deployed on cloud yet: fall back to the ledger rather than show nothing.
    if (r.status !== 404) return r.data as unknown as TransferHistoryPage;
  }
  return historyFromLedger(view, cursor);
}

/**
 * Transfers read out of the shared wallet ledger. Every transfer already
 * writes a ledger row ("transfer_sent:<id>" / "transfer_received:<id>") with
 * the other person's email captured at transfer time, so history needs no new
 * cloud endpoint. Scans at most LEDGER_SCAN_PAGES ledger pages per request;
 * the returned cursor resumes the scan where it stopped.
 */
async function historyFromLedger(view: TransferView, cursor: string | null): Promise<TransferHistoryPage> {
  const prefix = view === "sent" ? TRANSFER_SENT_PREFIX : TRANSFER_RECEIVED_PREFIX;
  const transfers: TransferRecord[] = [];
  let next = cursor;

  for (let scanned = 0; scanned < LEDGER_SCAN_PAGES; scanned++) {
    const { data } = await cloudBilling.wallet(next);
    for (const e of data.entries ?? []) {
      if (!e.reason.startsWith(prefix)) continue;
      transfers.push({
        id: e.id,
        amountCents: Math.abs(e.amountCents),
        counterpartyEmail: e.counterpartyEmail,
        reason: e.reason,
        createdAt: e.createdAt,
      });
      // The wallet cursor is "the last row seen", so any row id resumes here.
      if (transfers.length === HISTORY_PAGE_SIZE) return { view, transfers, nextCursor: e.id };
    }
    if (!data.nextCursor) return { view, transfers, nextCursor: null };
    next = data.nextCursor;
  }
  return { view, transfers, nextCursor: next };
}
