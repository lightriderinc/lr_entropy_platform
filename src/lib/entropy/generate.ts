// Entropy generation for the Light Rider Entropy Platform.
// Backed by the real EMS egress service via /api/entropy.

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

export interface EntropyResult {
  id: string;
  sourceId: string;
  sourceName: string;
  bytes: number;
  format: OutputFormat;
  value: string;
  createdAt: number;
  receipt: EntropyReceipt;
}

export interface EntropyRequest {
  sourceId: string;
  sourceName: string;
  bytes: number;
}

export function isValidByteCount(bytes: number): boolean {
  return Number.isInteger(bytes) && bytes >= MIN_BYTES && bytes <= MAX_BYTES;
}

export async function requestEntropy({
  sourceId,
  sourceName,
  bytes,
}: EntropyRequest): Promise<EntropyResult> {
  const res = await fetch(`/api/entropy?source=${sourceId}&bytes=${bytes}`, {
    cache: "no-store",
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(
      typeof data?.message === "string"
        ? data.message
        : `Entropy request failed (${res.status}).`
    );
  }

  const receipt = data.receipt as EntropyReceipt;
  return {
    id: receipt.request_id,
    sourceId,
    sourceName,
    bytes,
    format: "hex",
    value: data.bytes_hex as string,
    createdAt: Math.floor(Number(receipt.timestamp_unix_ns) / 1_000_000),
    receipt,
  };
}