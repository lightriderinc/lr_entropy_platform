"use client";

import LRButton from "@/components/ui/LRButton";
import { useWallet } from "@/lib/billing/walletStore";
import Link from "next/link";
import { MdArrowForward, MdLockOutline } from "react-icons/md";

const BUY_HREF = "/settings/credits#buy";

/**
 * Dashboard balance card, mirroring the cloud platform's dashboard
 * "Compute credits" card: the shared Light Rider wallet, a purchase button
 * and a link to the usage history. Same wallet store as the header chip.
 */
export default function DashboardCredits() {
  const wallet = useWallet();

  if (wallet.status === "loading") {
    return (
      <div className="animate-pulse">
        <div className="bg-gray-100 default-radius flex-col gap-2 flex p-4">
          <div className="h-5 bg-gray-200 w-40 rounded" />
          <div className="h-3 bg-gray-200 w-full rounded" />
          <div className="h-3 bg-gray-200 w-3/4 rounded" />
        </div>
      </div>
    );
  }

  if (wallet.status === "error") {
    return (
      <div className="default-radius border border-gray-50 bg-gray-50 p-4 text-sm text-gray-600">
        {wallet.error === "reauth_required"
          ? "Please sign out and sign in again to see your credits."
          : "Your balance could not be loaded right now."}
      </div>
    );
  }

  // Billing switched off (local dev): nothing to show.
  if (wallet.data.disabled) return null;

  const balance = wallet.data.balanceCents;

  // Signup credits stay locked until a first purchase (or a received transfer).
  if (!wallet.data.unlocked) {
    return (
      <div className="default-radius border border-gray-50 bg-gray-50 p-4">
        <p className="mb-1 flex items-center gap-1.5 font-medium text-gray-800 opacity-80">
          <MdLockOutline className="text-gray-400" />
          Unlock {balance.toLocaleString()} bonus Light Rider credits
        </p>
        <p className="text-xs text-gray-500">Complete your first purchase to claim your credits.</p>
        <div className="flex mt-6">
          <Link href={BUY_HREF}>
            <LRButton variant="primary">Purchase credits</LRButton>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="default-radius border border-gray-50 bg-gray-50 p-4">
      <p className="mb-2 flex flex-wrap items-end gap-1.5 text-gray-800">
        <span className="text-4xl font-medium mr-1">{balance.toLocaleString()}</span>
        <span className="pb-1">Light Rider credits remaining</span>
      </p>
      <p className="text-xs text-gray-500">
        1 credit = 1 token = 256 bytes of entropy. Shared with the Light Rider Cloud platform.
      </p>

      <div className="flex w-full flex-wrap justify-between items-end gap-3 mt-8">
        <Link href={BUY_HREF}>
          <LRButton variant="primary">Purchase credits</LRButton>
        </Link>
        <Link
          href="/settings/credits"
          className="text-sm font-medium text-gray-700 inline-flex items-center gap-2 hover:text-[var(--brand-primary)]"
        >
          View usage history <MdArrowForward />
        </Link>
      </div>
    </div>
  );
}
