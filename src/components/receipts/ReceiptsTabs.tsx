"use client";

import TabBar from "@/components/ui/TabBar";
import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import { RECEIPTS_TABS, isReceiptsTab, type ReceiptsTab } from "./tabs";

/**
 * Tabs for the Receipts page. The active tab is kept in the `?tab=` query
 * param so it can be linked to and survives a reload.
 */
export default function ReceiptsTabs({
  signedReceipts,
  sessionHistory,
}: {
  signedReceipts: React.ReactNode;
  sessionHistory: React.ReactNode;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const paramTab = searchParams.get("tab");

  const [tab, setTab] = useState<ReceiptsTab>(() =>
    isReceiptsTab(paramTab) ? paramTab : "signed-receipts",
  );
  const [syncedParamTab, setSyncedParamTab] = useState(paramTab);

  if (paramTab !== syncedParamTab) {
    setSyncedParamTab(paramTab);
    if (isReceiptsTab(paramTab)) {
      setTab(paramTab);
    }
  }

  const handleTabChange = (nextTab: ReceiptsTab) => {
    setTab(nextTab);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", nextTab);
    window.history.replaceState(null, "", `${pathname}?${params.toString()}`);
  };

  return (
    <div>
      <TabBar tabs={RECEIPTS_TABS} activeTab={tab} onTabChange={handleTabChange} />
      {tab === "signed-receipts" && signedReceipts}
      {tab === "session-history" && sessionHistory}
    </div>
  );
}
