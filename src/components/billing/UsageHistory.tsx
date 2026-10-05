"use client";

import { useState } from "react";
import type { WalletEntry } from "@/lib/billing/cloudBilling";
import { useWallet } from "@/lib/billing/walletStore";
import { formatTokens } from "@/lib/entropy/pricing";
import { ledgerLabel } from "./ledgerLabels";

/** Ledger history of the shared wallet, newest first, paged by cursor. */
export default function UsageHistory() {
  const wallet = useWallet();
  const [more, setMore] = useState<WalletEntry[]>([]);
  const [cursor, setCursor] = useState<string | null | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  if (wallet.status !== "ready") return null;
  const entries = [...wallet.data.entries, ...more];
  const next = cursor === undefined ? wallet.data.nextCursor : cursor;

  async function loadMore() {
    if (!next) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/billing/wallet?cursor=${encodeURIComponent(next)}`, { cache: "no-store" });
      const body = await res.json();
      if (res.ok) {
        setMore((m) => [...m, ...body.entries]);
        setCursor(body.nextCursor);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="default-radius border border-gray-50 bg-gray-50 p-5">
      <h2 className="text-lg font-semibold text-gray-800">Usage history</h2>
      {entries.length === 0 ? (
        <p className="mt-3 text-sm text-gray-500">No activity yet.</p>
      ) : (
        <table className="mt-3 w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-400">
              <th className="py-2 font-medium">Date</th>
              <th className="py-2 font-medium">Activity</th>
              <th className="py-2 text-right font-medium">Tokens</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.id} className="border-t border-gray-100">
                <td className="py-2 whitespace-nowrap text-gray-500">{new Date(e.createdAt).toLocaleString()}</td>
                <td className="py-2 text-gray-700">{ledgerLabel(e)}</td>
                <td
                  className={[
                    "py-2 text-right font-medium",
                    e.amountCents < 0 ? "text-gray-700" : "text-green-700",
                  ].join(" ")}
                >
                  {e.amountCents > 0 ? "+" : "−"}
                  {formatTokens(Math.abs(e.amountCents))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {next && (
        <button
          type="button"
          onClick={loadMore}
          disabled={loading}
          className="mt-3 text-sm font-medium text-blue-600 hover:text-[var(--brand-primary)] cursor-pointer"
        >
          {loading ? "Loading…" : "Load more"}
        </button>
      )}
    </div>
  );
}
