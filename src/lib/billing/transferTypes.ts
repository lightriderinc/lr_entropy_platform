// Share Credits contract between this app's UI and its own /api/billing/transfers
// route. Client-safe (types and constants only). The shapes deliberately match
// the cloud platform's /api/billing/credits/transfer(s) responses, so whichever
// backend ends up serving transfers (see lib/billing/transfers.ts), the UI
// doesn't change.

/** Most recipients one batch can hold (same limit as cloud's Share Credits). */
export const MAX_TRANSFER_ROWS = 20;

export type TransferView = "sent" | "received";

/** One recipient as entered: whole credits (1 credit = 1 cent), never cents. */
export type TransferRowInput = { email: string; credits: number };

/** Per-recipient outcome, so one bad address never hides what happened to the rest. */
export type TransferRowResult =
  | { status: "ok"; email: string; amountCents: number; recipientEmail: string }
  | { status: "recipient_not_found"; email: string; amountCents: number }
  | { status: "self_transfer"; email: string; amountCents: number }
  | { status: "invalid_amount"; email: string; amountCents: number; message: string }
  | { status: "lookup_failed"; email: string; amountCents: number; message: string };

/** 200 from POST /api/billing/transfers. */
export type TransferBatchOk = {
  ok: true;
  batchId: string;
  rows: TransferRowResult[];
  totalSentCents: number;
  senderBalanceCents: number;
  replayed: boolean;
};

/** Error codes POST /api/billing/transfers can answer with, as `{ error, message, rows? }`. */
export type TransferErrorCode =
  | "insufficient_balance"
  | "no_valid_rows"
  | "too_many_rows"
  | "transfers_unavailable"
  | "error";

export type TransferRecord = {
  id: string;
  /** Always positive: direction comes from the view. */
  amountCents: number;
  counterpartyEmail: string | null;
  reason: string;
  createdAt: string;
};

/** GET /api/billing/transfers?view=sent|received&cursor=... - newest first, cursor-paged. */
export type TransferHistoryPage = {
  view: TransferView;
  transfers: TransferRecord[];
  nextCursor: string | null;
};
