"use client";

import { useWallet } from "@/lib/billing/walletStore";
import Link from "next/link";
import { useEffect, useState } from "react";
import { MdClose, MdWarningAmber } from "react-icons/md";

// Same threshold as the cloud platform's dashboard banner (1,000 credits,
// $10): the wallet is shared, so both sites warn at the same point.
const LOW_CREDIT_THRESHOLD = 1000;

const DISMISS_KEY = "lr_low_credits_dismissed";

/**
 * Amber "running low" banner on the dashboard, mirroring cloud's. Only for
 * unlocked accounts (a locked one has nothing to run low on). Dismiss lasts
 * for the browser session.
 */
export default function LowCreditsBanner() {
  // Hidden until the sessionStorage check resolves, so a dismissed banner
  // never flashes.
  const [dismissed, setDismissed] = useState(true);
  const wallet = useWallet();

  useEffect(() => {
    let value: string | null = null;
    try {
      value = sessionStorage.getItem(DISMISS_KEY);
    } catch {}
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDismissed(value === "true");
  }, []);

  const data = wallet.status === "ready" ? wallet.data : null;
  const isLow = !!data && !data.disabled && data.unlocked && data.balanceCents <= LOW_CREDIT_THRESHOLD;
  if (!isLow || dismissed) return null;

  function handleDismiss() {
    try {
      sessionStorage.setItem(DISMISS_KEY, "true");
    } catch {}
    setDismissed(true);
  }

  return (
    <div className="mb-6 flex items-start gap-2 default-radius border-l-2 border-amber-400 bg-amber-50 py-2 pl-3 pr-3">
      <MdWarningAmber className="mt-0.5 shrink-0 text-lg text-amber-500" />
      <p className="flex-1 text-xs text-black">
        Only {data!.balanceCents.toLocaleString()} Light Rider credits left — top up to keep generating entropy.
      </p>
      <Link
        href="/settings/credits#buy"
        className="shrink-0 default-radius bg-amber-500 px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90"
      >
        Buy more credits
      </Link>
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Dismiss"
        className="shrink-0 text-amber-500 transition-colors hover:text-amber-700"
      >
        <MdClose />
      </button>
    </div>
  );
}
