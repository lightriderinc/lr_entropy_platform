import { ed25519 } from "@noble/curves/ed25519.js";
import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex, hexToBytes } from "@noble/hashes/utils.js";
import { isLosslessNumber, parse, stringify } from "lossless-json";

// EMS receipt signatures, shared by the server (verify at save time) and the
// browser (the Receipts page's "Verify signature").
//
// What EMS signs (entropy-core/src/receipt.rs): the receipt with its
// `signature` field removed, keys sorted, as compact JSON - and it signs those
// bytes directly with Ed25519 (no pre-hash).
//
// Numbers must be reproduced EXACTLY as EMS wrote them: timestamp_unix_ns is a
// u64 (~1.7e18) beyond JavaScript's safe-integer range, so a plain JSON.parse
// would round it and every signature would "fail". Everything here therefore
// parses with lossless-json, which keeps each number's original digits.

const ED25519_PUBLIC_KEY_BYTES = 32;
const ED25519_SIGNATURE_BYTES = 64;

/** Byte-wise UTF-8 key order, as Rust's BTreeMap<String, _> sorts. */
function compareKeys(a: string, b: string): number {
  const ea = new TextEncoder().encode(a);
  const eb = new TextEncoder().encode(b);
  const n = Math.min(ea.length, eb.length);
  for (let i = 0; i < n; i++) if (ea[i] !== eb[i]) return ea[i] - eb[i];
  return ea.length - eb.length;
}

function serialize(v: unknown): string {
  if (v === null) return "null";
  if (isLosslessNumber(v)) return v.value; // the original digits
  if (typeof v === "string") return JSON.stringify(v);
  if (typeof v === "boolean") return v ? "true" : "false";
  if (Array.isArray(v)) return `[${v.map(serialize).join(",")}]`;
  if (typeof v === "object") {
    const o = v as Record<string, unknown>;
    return `{${Object.keys(o)
      .sort(compareKeys)
      .map((k) => `${JSON.stringify(k)}:${serialize(o[k])}`)
      .join(",")}}`;
  }
  throw new Error(`unsupported JSON value: ${typeof v}`);
}

/** Parse receipt JSON keeping every number's exact digits. */
export function parseReceiptLossless(json: string): Record<string, unknown> {
  const v = parse(json);
  if (!v || typeof v !== "object" || Array.isArray(v)) throw new Error("receipt is not a JSON object");
  return v as Record<string, unknown>;
}

/** Compact JSON of a losslessly-parsed value, numbers exactly as parsed. */
export function stringifyLossless(v: unknown): string {
  return stringify(v) ?? "null";
}

/** The exact text EMS signed: every field but `signature`, sorted, compact. */
export function canonicalReceipt(signedJson: string): string {
  const obj = { ...parseReceiptLossless(signedJson) };
  delete obj.signature;
  return serialize(obj);
}

/** sha256 of the raw public-key bytes, hex - the id stored on each receipt. */
export function keyFingerprint(publicKeyHex: string): string {
  return bytesToHex(sha256(hexToBytes(publicKeyHex.trim().toLowerCase())));
}

export type VerifyResult = { valid: boolean; reason: string };

/** Verify an Ed25519-signed EMS receipt against a public key (hex). */
export function verifyReceipt(signedJson: string, publicKeyHex: string): VerifyResult {
  let receipt: Record<string, unknown>;
  try {
    receipt = parseReceiptLossless(signedJson);
  } catch {
    return { valid: false, reason: "Receipt is not valid JSON." };
  }
  if (receipt.signature_alg !== "Ed25519") {
    return { valid: false, reason: `Unsupported signature algorithm: ${String(receipt.signature_alg)}.` };
  }
  let sig: Uint8Array;
  let key: Uint8Array;
  try {
    sig = hexToBytes(String(receipt.signature ?? ""));
    key = hexToBytes(publicKeyHex.trim().toLowerCase());
  } catch {
    return { valid: false, reason: "Signature or public key is not valid hex." };
  }
  if (sig.length !== ED25519_SIGNATURE_BYTES) return { valid: false, reason: "Signature is not 64 bytes." };
  if (key.length !== ED25519_PUBLIC_KEY_BYTES) return { valid: false, reason: "Public key is not 32 bytes." };
  try {
    const message = new TextEncoder().encode(canonicalReceipt(signedJson));
    return ed25519.verify(sig, message, key, { zip215: false })
      ? { valid: true, reason: "Ed25519 signature is valid for this public key." }
      : { valid: false, reason: "Signature does not match this receipt and public key." };
  } catch {
    return { valid: false, reason: "Signature could not be checked (malformed)." };
  }
}
