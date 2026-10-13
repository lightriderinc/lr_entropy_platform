"use client";

import { useEffect } from "react";
import { refreshWallet } from "@/lib/billing/walletStore";

/**
 * Re-reads the shared wallet whenever the credits page is opened (including
 * client-side navigation, where the page-wide store would otherwise still hold
 * an earlier load) and whenever the tab regains focus - activity on the Cloud
 * platform or in another tab lands in the same wallet.
 */
export default function WalletAutoRefresh() {
  useEffect(() => {
    void refreshWallet();
    const onFocus = () => void refreshWallet();
    const onVisible = () => {
      if (document.visibilityState === "visible") void refreshWallet();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);
  return null;
}
