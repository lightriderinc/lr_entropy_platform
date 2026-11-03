/** Draw mode as the Get Entropy tabs name it. A single Custom pool pick is sent as "source". */
export const MODE_LABELS: Record<string, string> = {
  pool: "Preset pool",
  custom: "Custom pool",
  source: "Custom pool",
  card: "Source card",
};

/** Receipts mode filter: one option per Get Entropy tab, each covering the draw modes it sends. */
export const MODE_FILTERS: { value: string; label: string; modes: string[] }[] = [
  { value: "pool", label: "Preset pool", modes: ["pool"] },
  { value: "custom", label: "Custom pool", modes: ["custom", "source", "card"] },
];

/** Draw status as the user should read it. */
export const STATUS_LABELS: Record<string, string> = {
  delivered: "Delivered",
  settled: "Settled",
  failed: "Refunded",
};
