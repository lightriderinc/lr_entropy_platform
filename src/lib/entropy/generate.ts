// Entropy generation for the Light Rider Entropy Platform.
// Backed by the real EMS egress service via /api/entropy.

import type { EntropyMode } from "./modes";

export const BYTE_PRESETS = [16, 32, 64, 128, 256, 512];
export const MIN_BYTES = 1;
export const MAX_BYTES = 4096;

export type OutputFormat = "hex";

export interface EntropyReceipt {
  request_id: string;
  application_id: string;
  policy: string;
  contributing_sources: string[];
  pool_id: string;
  quality_score: number;
  rct_pass: boolean;
  apt_pass: boolean;
  extractor_alg: string;
  input_min_entropy_bits: number;
  output_bytes: number;
  drbg_alg: string;
  drbg_reseed_id: string;
  timestamp_unix_ns: number;
  raw_entropy_stored: boolean;
  audit_event_id: string;
  zone_id: string;
  signature_alg: string;
  signature: string;
}

/** What a paid draw cost, and the wallet balance after it (tokens). */
export interface DrawBilling {
  costTokens: number;
  balanceTokens: number | null;
}

export interface EntropyResult {
  id: string;
  /** What was clicked (card / pool / source id). Not the serving source. */
  sourceId: string;
  /** Label of what was clicked. The receipt says what actually served it. */
  sourceName: string;
  /** Absent on history items saved before modes existed. */
  mode?: EntropyMode;
  bytes: number;
  format: OutputFormat;
  value: string;
  createdAt: number;
  receipt: EntropyReceipt;
  /** Absent when billing is off (local dev) and on pre-billing history. */
  billing?: DrawBilling | null;
}

export interface EntropyRequest {
  /** Card id (mode "card", the default); pool or source id otherwise. */
  sourceId: string;
  sourceName: string;
  bytes: number;
  /** Omitted = the source cards, exactly as before modes existed. */
  mode?: EntropyMode;
  /** Picked source ids, mode "custom" only. */
  ids?: string[];
}

/**
 * A failed request. `outOfEntropy` is set when the serving ring is empty
 * (EMS 503 `source_empty`, or a 503 "pool empty" from a custom draw whose
 * source ring ran dry): the source refills on its own, so the caller should
 * show a "refill pending" state rather than a generic failure.
 */
export class EntropyRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly outOfEntropy: boolean,
    readonly emsSourceId?: string,
    /** Billing outcome: "insufficient_credits" | "credits_locked" | "reauth_required" | ... */
    readonly code?: string,
    /** Where to buy credits, on 402. */
    readonly buyUrl?: string,
  ) {
    super(message);
    this.name = "EntropyRequestError";
  }
}

export function isValidByteCount(bytes: number): boolean {
  return Number.isInteger(bytes) && bytes >= MIN_BYTES && bytes <= MAX_BYTES;
}

/** The JSON body for POST /api/entropy. */
function requestBody({ sourceId, bytes, mode = "card", ids }: EntropyRequest, drawId: string) {
  if (mode === "card") return { source: sourceId, bytes, drawId };
  if (mode === "custom") return { mode, ids: ids ?? [], bytes, drawId };
  return { mode, id: sourceId, bytes, drawId };
}

export async function requestEntropy(req: EntropyRequest): Promise<EntropyResult> {
  const { sourceId, sourceName, bytes, mode = "card" } = req;
  // One id per click: the charge's idempotency key, so a network retry of
  // this exact request can never be charged twice.
  const drawId = crypto.randomUUID();
  const res = await fetch("/api/entropy", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody(req, drawId)),
    cache: "no-store",
    credentials: "include",
  });

  const data = await res.json();
  if (!res.ok) {
    const message =
      typeof data?.message === "string"
        ? data.message
        : `Entropy request failed (${res.status}).`;
    const outOfEntropy =
      data?.error === "source_empty" ||
      (res.status === 503 && message.startsWith("pool empty:"));
    throw new EntropyRequestError(
      message,
      res.status,
      outOfEntropy,
      typeof data?.source_id === "string" ? data.source_id : undefined,
      typeof data?.error === "string" ? data.error : undefined,
      typeof data?.buyUrl === "string" ? data.buyUrl : undefined,
    );
  }

  const receipt = data.receipt as EntropyReceipt;
  return {
    id: receipt.request_id,
    sourceId,
    sourceName,
    mode,
    bytes,
    format: "hex",
    value: data.bytes_hex as string,
    createdAt: Math.floor(Number(receipt.timestamp_unix_ns) / 1_000_000),
    receipt,
    billing: (data.billing as DrawBilling | null | undefined) ?? null,
  };
}