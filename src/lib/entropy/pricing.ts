// Entropy pricing, shared by the console (price shown before generating) and
// /api/entropy (what is charged). Must match cloud_platform_nextjs
// src/lib/billing/entropyCharges.ts::entropyDrawCostCents, which is what the
// shared wallet actually debits.
//
// 1 LR token = 1 Light Rider credit = $0.01, and one token buys up to 256
// bytes: ceil(bytes / 256), minimum 1 - the same for every mode and source.

export const BYTES_PER_TOKEN = 256;

export function tokensFor(bytes: number): number {
  return Math.max(1, Math.ceil(bytes / BYTES_PER_TOKEN));
}

export function formatTokens(n: number): string {
  return `${n.toLocaleString()} ${n === 1 ? "token" : "tokens"}`;
}

/** Credits are cents: 1 token = $0.01. */
export function formatUsd(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}
