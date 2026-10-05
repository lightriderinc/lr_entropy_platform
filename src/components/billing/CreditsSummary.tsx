"use client";

import Link from "next/link";
import { useWallet } from "@/lib/billing/walletStore";
import { formatTokens, formatUsd } from "@/lib/entropy/pricing";

/** Balance card for /settings/credits, matching the cloud platform's. */
export default function CreditsSummary() {
  const wallet = useWallet();
  return (
    <div className="flex-1 default-radius border border-gray-50 bg-gray-50 p-5">
      <h2 className="text-lg font-semibold text-gray-800">Balance</h2>
      {wallet.status === "loading" && <p className="mt-3 h-9 w-40 animate-pulse rounded bg-gray-200" />}
      {wallet.status === "error" && (
        <p className="mt-3 text-sm text-[var(--brand-primary)]">
          {wallet.error === "reauth_required"
            ? "Please sign out and sign in again to see your credits."
            : "Your balance could not be loaded right now."}
        </p>
      )}
      {wallet.status === "ready" && (
        <>
          <p className="mt-3 text-3xl font-semibold text-gray-800">{formatTokens(wallet.data.balanceCents)}</p>
          <p className="mt-1 text-sm text-gray-500">
            {formatUsd(wallet.data.balanceCents)} · 1 token = 1 Light Rider credit = $0.01 · one token buys 256
            bytes of entropy
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Shared with the Light Rider Cloud platform: one account, one balance.
          </p>
          {!wallet.data.unlocked && (
            <div className="mt-4 default-radius border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              Free signup credits can&apos;t be spent on entropy. Buy credits (or receive credits from another
              account) to unlock your whole balance.{" "}
              <Link href="#buy" className="font-medium underline">
                Buy credits
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}
