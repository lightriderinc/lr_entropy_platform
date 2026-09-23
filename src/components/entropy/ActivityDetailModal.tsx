"use client";

import type { EntropyResult } from "@/lib/entropy/generate";
import ModalShell from "@/components/ui/ModalShell";
import EntropyReceiptDetails from "./EntropyReceiptDetails";

export default function ActivityDetailModal({
  item,
  onClose,
}: {
  item: EntropyResult;
  onClose: () => void;
}) {
  return (
    <ModalShell title={item.sourceName} onClose={onClose} maxWidth="max-w-2xl">
      <div className="mt-4">
        <EntropyReceiptDetails result={item} />
      </div>
    </ModalShell>
  );
}
