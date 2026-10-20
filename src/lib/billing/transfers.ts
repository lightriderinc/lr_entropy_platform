import { cloudBilling, isBillingDisabledForDev, transferAccount } from "./cloudBilling";
import {
  MAX_TRANSFER_ROWS,
  type TransferHistoryPage,
  type TransferRecord,
  type TransferRowInput,
  type TransferView,
} from "./transferTypes";

// Share Credits backend, server-only. The UI only ever talks to this app's
// /api/billing/transfers route, whose request/response shapes are fixed in
// transferTypes.ts. WHERE those calls are served is chosen here, per half, by
// env, so the backend can change without touching the page:
//
//   ENTROPY_TRANSFER_SEND     "cloud" -> POST cloud /api/internal/entropy/transfer
//                             anything else (default) -> sending is unavailable
//   ENTROPY_TRANSFER_HISTORY  "cloud" -> GET cloud /api/internal/entropy/transfers
//                             anything else (default) -> "ledger": read from the
//                             shared wallet ledger this app already gets
//
// Sending moves money between two wallets that live in cloud's database, so
// it can only happen on cloud: there is no local fallback for it, by design.
// Adding another backend (e.g. a dedicated billing service) is one more
// branch in sendBackend() / historyBackend().
//
// Expected cloud contract (to agree with the cloud team) - the same as cloud's
// own session routes, behind the internal secret + user token:
//   POST /api/internal/entropy/transfer  { rows: [{ email, credits }], idempotencyKey, email? }
//     -> exactly what POST /api/billing/credits/transfer returns today
//   GET  /api/internal/entropy/transfers?view=sent|received&cursor=<ledgerEntryId>
//     -> { view, transfers: [{ id, amountCents (positive), counterpartyEmail, reason, createdAt }], nextCursor }

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
  if (isBillingDisabledForDev()) return "off";
  return process.env.ENTROPY_TRANSFER_SEND === "cloud" ? "cloud" : "off";
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
  // Cloud hasn't deployed the endpoint yet: same answer as "switched off".
  if (r.status === 404) return UNAVAILABLE;
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
