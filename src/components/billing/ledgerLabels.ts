import type { WalletEntry } from "@/lib/billing/cloudBilling";

// Human labels for the shared ledger's `reason` strings ("namespace:detail",
// written by the cloud platform). The wallet is shared across Light Rider
// platforms, so history includes cloud activity too.

const MODE_LABELS: Record<string, string> = {
  pool: "Pool",
  custom: "Custom pool",
  source: "Single source",
  card: "Source card",
};

export function ledgerLabel(e: WalletEntry): string {
  const r = e.reason;
  const mode = (prefix: string) => MODE_LABELS[r.slice(prefix.length)] ?? r.slice(prefix.length);
  if (r === "signup_credit") return "Signup credits";
  if (r.startsWith("checkout:")) return "Credit purchase";
  if (r.startsWith("plan_credit:")) return "Plan credits";
  if (r.startsWith("entropy:draw:")) return `Entropy draw · ${mode("entropy:draw:")}`;
  if (r.startsWith("entropy:refund:")) return `Entropy refund · ${mode("entropy:refund:")}`;
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
