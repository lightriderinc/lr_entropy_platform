"use client";

import { useSyncExternalStore } from "react";
import type { WalletData } from "./cloudBilling";

// One client-side copy of the shared wallet for every component on the page
// (header chip, Get Entropy console, credits page). A draw's response carries
// the new balance, so the console updates it in place without a refetch.

export type WalletState =
  | { status: "loading" }
  | { status: "ready"; data: WalletData & { disabled?: boolean } }
  | { status: "error"; error: string };

let state: WalletState = { status: "loading" };
let inflight: Promise<void> | null = null;
const listeners = new Set<() => void>();

function emit(next: WalletState) {
  state = next;
  for (const l of listeners) l();
}

/** Re-read the wallet (balance + first ledger page) from /api/billing/wallet. */
export function refreshWallet(): Promise<void> {
  inflight ??= (async () => {
    try {
      const res = await fetch("/api/billing/wallet", { cache: "no-store" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) emit({ status: "error", error: String(body?.error ?? res.status) });
      else emit({ status: "ready", data: body });
    } catch {
      emit({ status: "error", error: "network" });
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

/**
 * Apply the balance a draw reported (tokens) at once, then re-read the wallet
 * in the background so the history gains the draw's ledger row too. (Before,
 * only the balance moved, and a later visit to /settings/credits within the
 * same page session showed the history from the first load.)
 */
export function setWalletBalance(balanceTokens: number) {
  if (state.status === "ready") emit({ status: "ready", data: { ...state.data, balanceCents: balanceTokens } });
  void refreshWallet();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1 && state.status === "loading" && !inflight) void refreshWallet();
  return () => listeners.delete(listener);
}

export function useWallet(): WalletState {
  return useSyncExternalStore(subscribe, () => state, () => ({ status: "loading" }) as WalletState);
}
