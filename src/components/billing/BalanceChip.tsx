"use client";

import Link from "next/link";
import { MdToll } from "react-icons/md";
import { formatTokens } from "@/lib/entropy/pricing";
import { useWallet } from "@/lib/billing/walletStore";

/** Header balance: the shared Light Rider wallet, in tokens (= credits). */
export default function BalanceChip() {
  const wallet = useWallet();
  if (wallet.status !== "ready" || wallet.data.disabled) return null;
  const low = wallet.data.balanceCents < 16; // under one 4 KiB draw
  return (
    <Link
      href="/settings/credits"
      title="Your Light Rider credit balance (1 token = 1 credit = $0.01)"
      className={[
        "mr-2 hidden sm:inline-flex items-center gap-1.5 default-radius border px-2.5 py-1 text-xs font-medium transition-colors",
        low
          ? "border-amber-200 bg-amber-50 text-amber-800 hover:border-amber-300"
          : "border-gray-200 bg-white text-gray-700 hover:border-gray-300",
      ].join(" ")}
    >
      <MdToll className="text-sm" />
      {formatTokens(wallet.data.balanceCents)}
    </Link>
  );
}
