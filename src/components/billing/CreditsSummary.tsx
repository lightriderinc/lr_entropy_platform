"use client";

import LRButton from "@/components/ui/LRButton";
import { useWallet } from "@/lib/billing/walletStore";
import { BYTES_PER_CREDIT } from "@/lib/entropy/pricing";
import Link from "next/link";
import { MdArrowForward, MdLockOutline } from "react-icons/md";

export const PURCHASE_CREDITS_HREF = "/settings/manage-credits/purchase";
export const CREDIT_HISTORY_HREF = "/settings/payment-and-history";

/**
 * Balance card for the shared Light Rider wallet, mirroring the cloud
 * platform's CreditsSummary: locked (signup credits not yet unlocked) and
 * unlocked states, a purchase button, and an optional history link. Used on
 * the dashboard and on Manage Credits.
 */
export default function CreditsSummary({ historyLink = false }: { historyLink?: boolean }) {
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

  // Billing switched off (local dev only).
  if (wallet.data.disabled) {
    return (
      <div className="default-radius border border-gray-50 bg-gray-50 p-4 text-sm text-gray-500">
        Billing is switched off in this environment, so draws are free.
      </div>
    );
  }

  const balance = wallet.data.balanceCents;

  // Signup credits stay locked until a first purchase (or a received transfer).
  if (!wallet.data.unlocked) {
    return (
      <div className="default-radius border border-gray-50 bg-gray-50 p-4">
        <p className="mb-1 flex items-center gap-1.5 font-medium text-gray-800 opacity-80">
          <MdLockOutline className="text-gray-400" />
          Unlock {balance.toLocaleString()} bonus Light Rider credits
        </p>
        <p className="text-xs text-gray-500">
          Complete your first purchase to claim your credits and spend them on entropy.
        </p>
        <div className="flex mt-6">
          <Link href={PURCHASE_CREDITS_HREF}>
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
        1 credit buys {BYTES_PER_CREDIT} bytes of entropy. Your balance is shared with the Light Rider
        Cloud platform.
      </p>

      <div className="flex w-full flex-wrap justify-between items-end gap-3 mt-8">
        <Link href={PURCHASE_CREDITS_HREF}>
          <LRButton variant="primary">Purchase credits</LRButton>
        </Link>
        {historyLink && (
          <Link
            href={CREDIT_HISTORY_HREF}
            className="text-sm font-medium text-gray-700 inline-flex items-center gap-2 hover:text-[var(--brand-primary)]"
          >
            View usage history <MdArrowForward />
          </Link>
        )}
      </div>
    </div>
  );
}
