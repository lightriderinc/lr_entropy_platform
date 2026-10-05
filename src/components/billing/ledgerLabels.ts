import type { WalletEntry } from "@/lib/billing/cloudBilling";

// Human labels for the shared ledger's `reason` strings ("namespace:detail",
// written by the cloud platform). The wallet is shared across Light Rider
// platforms, so history includes cloud activity too.

const MODE_LABELS: Record<string, string> = {
  pool: "pool",
  custom: "custom pool",
  source: "single source",
  card: "source card",
};

function formatBytes(bytes: number): string {
  if (bytes >= 1024 && bytes % 1024 === 0) return `${bytes / 1024} KiB`;
  return `${bytes.toLocaleString()} B`;
}

/** "(single source, 256 B)", or "(single source)" for rows that predate the byte link. */
function entropyDetail(e: WalletEntry, prefix: string): string {
  const mode = e.entropy?.mode ?? e.reason.slice(prefix.length);
  const parts = [MODE_LABELS[mode] ?? mode];
  if (typeof e.entropy?.bytes === "number") parts.push(formatBytes(e.entropy.bytes));
  return `(${parts.join(", ")})`;
}

export function ledgerLabel(e: WalletEntry): string {
  const r = e.reason;
  if (r === "signup_credit") return "Signup credits";
  if (r.startsWith("checkout:")) return "Credit purchase";
  if (r.startsWith("plan_credit:")) return "Plan credits";
  if (r.startsWith("entropy:draw:")) return `Entropy draw ${entropyDetail(e, "entropy:draw:")}`;
  if (r.startsWith("entropy:refund:")) return `Entropy refund ${entropyDetail(e, "entropy:refund:")}`;
  if (r.startsWith("transfer_sent:")) return e.counterpartyEmail ? `Sent to ${e.counterpartyEmail}` : "Credits sent";
  if (r.startsWith("transfer_received:")) {
    return e.counterpartyEmail ? `Received from ${e.counterpartyEmail}` : "Credits received";
  }
  if (r.startsWith("referral_reward:")) return "Referral reward";
  if (r.startsWith("quantum_job:")) return "Quantum job (Cloud)";
  if (r.startsWith("reservation:")) return "Reservation (Cloud)";
  if (r.startsWith("entropy_withdraw:")) return "Entropy withdrawal (Cloud)";
  return r;
}
