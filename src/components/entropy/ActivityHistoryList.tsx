"use client";

import ConfirmDeleteModal from "@/components/ui/ConfirmDeleteModal";
import type { EntropyResult } from "@/lib/entropy/generate";
import { useState } from "react";
import ActivityDetailModal from "./ActivityDetailModal";
import ActivityItemMenu from "./ActivityItemMenu";

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default function ActivityHistoryList({
  items,
  onDelete,
}: {
  items: EntropyResult[];
  onDelete: (id: string) => void;
}) {
  const [pendingDelete, setPendingDelete] = useState<EntropyResult | null>(
    null,
  );
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
            className="relative flex flex-row justify-between cursor-pointer gap-3 default-radius border border-gray-100 bg-gray-100 p-3 transition-colors card-hover-primary"
          >
            <div>
              <p className="truncate font-mono text-xs text-gray-400">
                {item.id}
              </p>

              <div className="flex flex-wrap items-center gap-2">
                <span className="mt-2 font-medium text-sm text-gray-600">
                  {item.sourceName} . {item.bytes}B
                </span>
              </div>
            </div>
            <div className="flex flex-col self-end">
              <div
                className="absolute top-2 right-2"
                onClick={(e) => e.stopPropagation()}
              >
                <ActivityItemMenu onDelete={() => setPendingDelete(item)} />
              </div>
              <span className="text-xs text-gray-500 font-medium self-end">
                {formatTime(item.createdAt)}
              </span>
            </div>
          </li>
        ))}
      </ul>

      {selected && (
        <ActivityDetailModal
          item={selected}
          onClose={() => setSelected(null)}
        />
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
