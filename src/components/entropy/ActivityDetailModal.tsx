"use client";

import type { EntropyResult } from "@/lib/entropy/generate";
import ModalShell from "@/components/ui/ModalShell";
import { receiptPoolLabel } from "@/lib/receipts/pools";
import EntropyReceiptDetails from "./EntropyReceiptDetails";

export default function ActivityDetailModal({
  item,
  onClose,
}: {
  item: EntropyResult;
  onClose: () => void;
}) {
  return (
    <ModalShell title={receiptPoolLabel(item.receipt)} onClose={onClose} maxWidth="max-w-2xl">
      <div className="mt-4">
        <EntropyReceiptDetails result={item} />
      </div>
    </ModalShell>
  );
}
