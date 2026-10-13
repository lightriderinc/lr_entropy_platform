// Entropy pricing, shared by the console (price shown before generating) and
// /api/entropy (what is charged). Must match cloud_platform_nextjs
// src/lib/billing/entropyCharges.ts::entropyDrawCostCents, which is what the
// shared wallet actually debits.
//
// 1 Light Rider credit = $0.01, and one credit buys up to 256 bytes:
// ceil(bytes / 256), minimum 1 - the same for every mode and source.

export const BYTES_PER_CREDIT = 256;

export function creditsFor(bytes: number): number {
  return Math.max(1, Math.ceil(bytes / BYTES_PER_CREDIT));
}

/** "1 credit", "4,096 credits". */
export function formatCredits(n: number): string {
  return `${n.toLocaleString()} ${n === 1 ? "credit" : "credits"}`;
}

/** Credits are cents: 1 credit = $0.01. */
export function formatUsd(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

/** "256 B", "4 KiB", "2.5 MiB" - binary units, matching the byte counts users draw. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes.toLocaleString()} B`;
  const units = ["KiB", "MiB", "GiB"];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${value.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${units[unit]}`;
}
