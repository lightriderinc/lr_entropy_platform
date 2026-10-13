"use client";

import { useEffect, useState } from "react";
import { refreshWallet } from "@/lib/billing/walletStore";

/**
 * Banner after Stripe returns to /settings/credits. Stripe's webhook credits
 * the wallet on the cloud platform a moment after the redirect, so on success
 * this re-reads the balance a few times until it moves.
 */
export default function CheckoutReturn() {
  const [outcome, setOutcome] = useState<"success" | "canceled" | null>(null);

  useEffect(() => {
    const value = new URLSearchParams(window.location.search).get("checkout");
    if (value !== "success" && value !== "canceled") return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    // Deferred so the state update runs in a callback, not the effect body.
    timers.push(setTimeout(() => setOutcome(value), 0));
    if (value === "success") {
      for (const ms of [1000, 3000, 6000, 12000]) timers.push(setTimeout(() => void refreshWallet(), ms));
    }
    return () => timers.forEach(clearTimeout);
  }, []);

  if (outcome === "success") {
    return (
      <div role="status" className="default-radius border border-green-200 bg-green-50 p-3 text-sm text-green-800">
        Payment received. Your credits will appear in a few seconds.
      </div>
    );
  }
  if (outcome === "canceled") {
    return (
      <div role="status" className="default-radius border border-gray-200 bg-gray-50 p-3 text-sm text-gray-600">
        Checkout was canceled. Nothing was charged.
      </div>
    );
  }
  return null;
}
