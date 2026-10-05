import { keyFingerprint } from "./canonical";
import { EMS_EGRESS, egressHeaders } from "@/lib/sources/egress";

// Server-only. The Ed25519 key EMS signs receipts with.
//
// EMS_RECEIPT_PUBLIC_KEY (hex) pins it: when set, that is the key, full stop -
// a surprise key change at EMS (e.g. a regenerated key) then shows up as
// receipts that fail verification instead of being silently trusted. Unset,
// the key is read from the egress's GET /v1/pubkey (cached for a minute).

export type ReceiptPublicKey = {
  signatureAlg: "Ed25519";
  publicKeyHex: string;
  fingerprint: string;
  source: "pinned" | "ems";
};

const CACHE_MS = 60_000;
let cached: { key: ReceiptPublicKey; at: number } | null = null;

export async function getReceiptPublicKey(): Promise<ReceiptPublicKey> {
  const pinned = (process.env.EMS_RECEIPT_PUBLIC_KEY ?? "").trim().toLowerCase();
  if (pinned) {
    return { signatureAlg: "Ed25519", publicKeyHex: pinned, fingerprint: keyFingerprint(pinned), source: "pinned" };
  }
  if (cached && Date.now() - cached.at < CACHE_MS) return cached.key;
  const res = await fetch(`${EMS_EGRESS}/v1/pubkey`, {
    headers: egressHeaders(),
    cache: "no-store",
    signal: AbortSignal.timeout(5_000),
  });
  if (!res.ok) throw new Error(`EMS /v1/pubkey returned ${res.status}`);
  const body = (await res.json()) as { signature_alg?: string; public_key_hex?: string };
  if (body.signature_alg !== "Ed25519" || !body.public_key_hex) {
    throw new Error(`EMS signs with ${String(body.signature_alg)}; only Ed25519 is supported`);
  }
  const hex = body.public_key_hex.toLowerCase();
  const key: ReceiptPublicKey = { signatureAlg: "Ed25519", publicKeyHex: hex, fingerprint: keyFingerprint(hex), source: "ems" };
  cached = { key, at: Date.now() };
  return key;
}
