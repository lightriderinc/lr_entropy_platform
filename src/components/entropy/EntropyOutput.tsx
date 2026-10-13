"use client";

import type { EntropyResult } from "@/lib/entropy/generate";
import EntropyReceiptDetails from "./EntropyReceiptDetails";

export default function EntropyOutput({ result }: { result: EntropyResult | null }) {
  if (!result) {
    return (
      <div className="flex h-full min-h-[220px] flex-col items-center justify-center gap-2 default-radius border border-dashed border-gray-200 p-8 text-center">
        <p className="text-sm font-medium text-gray-500">No entropy generated yet</p>
        <p className="text-xs text-gray-400">
          Pick a source and byte length, then generate to see your output here.
        </p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <EntropyReceiptDetails result={result} />
    </div>
  );
}
