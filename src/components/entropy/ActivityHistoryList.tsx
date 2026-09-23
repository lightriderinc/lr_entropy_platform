"use client";

import { useState } from "react";
import type { EntropyResult } from "@/lib/entropy/generate";
import ConfirmDeleteModal from "@/components/ui/ConfirmDeleteModal";
import ActivityDetailModal from "./ActivityDetailModal";
import ActivityItemMenu from "./ActivityItemMenu";

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

async function copyToClipboard(value: string) {
  try {
    await navigator.clipboard.writeText(value);
  } catch {
    /* silent */
  }
}

export default function ActivityHistoryList({
  items,
  onDelete,
}: {
  items: EntropyResult[];
  onDelete: (id: string) => void;
}) {
  const [pendingDelete, setPendingDelete] = useState<EntropyResult | null>(null);
  const [selected, setSelected] = useState<EntropyResult | null>(null);

  if (items.length === 0) {
    return (
      <div className="default-radius border border-dashed border-gray-200 p-8 text-center text-sm text-gray-400">
        Entropy you generate will be listed here.
      </div>
    );
  }

  return (
    <>
      <ul className="flex flex-col gap-2">
        {items.map((item) => (
          <li
            key={item.id}
            onClick={() => setSelected(item)}
            className="relative flex cursor-pointer items-center gap-3 default-radius border border-gray-100 bg-gray-100 p-3 pr-10 transition-colors card-hover-primary"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-gray-800">{item.sourceName}</span>
                <span className="text-xs text-gray-400">
                  {item.bytes}B · {formatTime(item.createdAt)}
                </span>
              </div>
              <p className="mt-0.5 truncate font-mono text-xs text-gray-500">{item.value}</p>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                copyToClipboard(item.value);
              }}
              className="shrink-0 cursor-pointer default-radius border border-gray-200 bg-white px-2.5 py-1 text-xs text-gray-600 transition-colors hover:bg-gray-50"
            >
              Copy
            </button>

            <div className="absolute right-2 top-2" onClick={(e) => e.stopPropagation()}>
              <ActivityItemMenu onDelete={() => setPendingDelete(item)} />
            </div>
          </li>
        ))}
      </ul>

      {selected && (
        <ActivityDetailModal item={selected} onClose={() => setSelected(null)} />
      )}

      {pendingDelete && (
        <ConfirmDeleteModal
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => {
            onDelete(pendingDelete.id);
            setPendingDelete(null);
          }}
        />
      )}
    </>
  );
}
