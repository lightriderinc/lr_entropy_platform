"use client";

import LRButton from "@/components/ui/LRButton";
import TabBar from "@/components/ui/TabBar";
import type { TransferHistoryPage, TransferRecord, TransferView } from "@/lib/billing/transferTypes";
import { useWallet } from "@/lib/billing/walletStore";
import { formatCredits } from "@/lib/entropy/pricing";
import { useEffect, useState } from "react";

/**
 * Sent / received transfer history, ported from the cloud platform's
 * TransferHistory. Reads this app's /api/billing/transfers, newest first and
 * cursor-paged ("Load more", like UsageHistory). Reloads whenever the shared
 * wallet is re-read, so a send from ShareCredits shows up here at once.
 */

const TABS = [
  { id: "sent", label: "Sent" },
  { id: "received", label: "Received" },
] as const satisfies readonly { id: TransferView; label: string }[];

async function fetchPage(view: TransferView, cursor: string | null): Promise<TransferHistoryPage> {
  const qs = new URLSearchParams({ view });
  if (cursor) qs.set("cursor", cursor);
  const res = await fetch(`/api/billing/transfers?${qs}`, { cache: "no-store" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message ?? data.error ?? `Request failed (${res.status}).`);
  return data as TransferHistoryPage;
}

function headersFor(view: TransferView) {
  return ["Date", view === "sent" ? "Sent to" : "Received from", "Type", "Amount"];
}

/** "transfer_sent:9f1c…" -> "Transfer sent", without showing a raw id. */
function describeReason(reason: string): string {
  const [prefix] = reason.split(":");
  if (prefix === "transfer_sent") return "Transfer sent";
  if (prefix === "transfer_received") return "Transfer received";
  return prefix.replace(/_/g, " ");
}

type State = {
  key: string;
  transfers: TransferRecord[];
  nextCursor: string | null;
  error: string | null;
};

export default function TransferHistory() {
  const [view, setView] = useState<TransferView>("sent");
  const [state, setState] = useState<State | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  // A new wallet read (after a send, a purchase, a refocus) means history may
  // have changed: reload the first page.
  const wallet = useWallet();
  const walletData = wallet.status === "ready" ? wallet.data : null;
  const [walletVersion, setWalletVersion] = useState(0);
  const [seenWallet, setSeenWallet] = useState(walletData);
  if (walletData !== seenWallet) {
    setSeenWallet(walletData);
    setWalletVersion((v) => v + 1);
  }

  const key = `${view}:${walletVersion}`;

  useEffect(() => {
    let cancelled = false;
    fetchPage(view, null)
      .then((page) => {
        if (!cancelled) setState({ key, transfers: page.transfers, nextCursor: page.nextCursor, error: null });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setState({ key, transfers: [], nextCursor: null, error: err instanceof Error ? err.message : String(err) });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [view, key]);

  async function loadMore() {
    if (!state?.nextCursor) return;
    setLoadingMore(true);
    try {
      const page = await fetchPage(view, state.nextCursor);
      setState((s) => (s ? { ...s, transfers: [...s.transfers, ...page.transfers], nextCursor: page.nextCursor } : s));
    } catch (err) {
      setState((s) => (s ? { ...s, error: err instanceof Error ? err.message : String(err) } : s));
    } finally {
      setLoadingMore(false);
    }
  }

  const headers = headersFor(view);
  // Only the first load of a view shows skeletons; a background reload keeps
  // the previous rows on screen.
  const isLoading = state === null || (!state.key.startsWith(`${view}:`));
  const transfers = isLoading ? [] : state.transfers;

  return (
    <div>
      <TabBar tabs={TABS} activeTab={view} onTabChange={setView} />

      {!isLoading && state.error ? (
        <p className="text-sm text-red-500">{state.error}</p>
      ) : !isLoading && transfers.length === 0 ? (
        <div className="default-radius border border-dashed border-gray-200 bg-gray-50 p-16 text-center text-sm text-gray-500">
          {view === "sent" ? "Credits you send will appear here." : "Credits other people send you will appear here."}
        </div>
      ) : (
        <>
          <div className="overflow-x-auto default-radius border border-gray-100">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-100">
                <tr>
                  {headers.map((h) => (
                    <th key={h} className="whitespace-nowrap px-4 py-2 font-medium text-gray-700">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className={isLoading ? "animate-pulse" : undefined}>
                {isLoading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="border-b border-gray-100 last:border-0">
                        {headers.map((h) => (
                          <td key={h} className="px-4 py-3">
                            <div className="h-4 w-20 rounded bg-gray-100" />
                          </td>
                        ))}
                      </tr>
                    ))
                  : transfers.map((row) => (
                      <tr key={row.id} className="border-b border-gray-100 bg-white last:border-0">
                        <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                          {new Date(row.createdAt).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {row.counterpartyEmail ?? <span className="text-gray-400">Unknown</span>}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-gray-500">{describeReason(row.reason)}</td>
                        <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-800">
                          {view === "sent" ? "−" : "+"}
                          {formatCredits(row.amountCents)}
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
          {!isLoading && state.nextCursor && (
            <div className="mt-3 flex justify-center">
              <LRButton variant="secondary-outline" onClick={loadMore} disabled={loadingMore}>
                {loadingMore ? "Loading…" : "Load more"}
              </LRButton>
            </div>
          )}
        </>
      )}
    </div>
  );
}
