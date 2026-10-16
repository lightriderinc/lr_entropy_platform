export type ReceiptsTab = "signed-receipts" | "session-history";

export const RECEIPTS_TABS: readonly { id: ReceiptsTab; label: string }[] = [
  { id: "signed-receipts", label: "Signed receipts" },
  { id: "session-history", label: "Session history" },
];

export function isReceiptsTab(value: string | null): value is ReceiptsTab {
  return !!value && RECEIPTS_TABS.some((t) => t.id === value);
}

/** Link to a tab of the Receipts page, with optional extra query params. */
export function receiptsTabHref(tab: ReceiptsTab, params?: Record<string, string>): string {
  return `/receipts?${new URLSearchParams({ tab, ...params }).toString()}`;
}
