"use client";

import ConfirmDeleteModal from "@/components/ui/ConfirmDeleteModal";
import type { EntropyResult } from "@/lib/entropy/generate";
import Link from "next/link";
import { useState } from "react";
import { FaDice } from "react-icons/fa6";
import { GiPerspectiveDiceSixFacesRandom } from "react-icons/gi";
import { MdArrowForward } from "react-icons/md";
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
      <div className="default-radius border border-dashed border-gray-200 bg-gray-50 p-16 text-center mt-5 text-sm text-gray-500">
        <div className="mb-3 flex items-center justify-center text-6xl text-gray-200">
          <GiPerspectiveDiceSixFacesRandom />
        </div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">
          Submit your first entropy request
        </h3>
        <div className="mb-6">
          <span>
            Entropy generated this session will appear here. You can view full request details and output once they are generated.
          </span>
        </div>

        <div>
          <Link
            href="/entropy"
            className="inline-flex w-fit items-center gap-1.5 default-radius text-sm font-medium text-gray-700 transition-colors"
          >
            <FaDice className="text-xl text-gray-400" />
            <span className="brand-link flex flex-row inline-flex items-center gap-1">
              {" "}
              Get Entropy <MdArrowForward className="text-xs" />
            </span>
          </Link>
        </div>
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
                  {item.sourceName} · {item.receipt.pool_id} · {item.bytes}B
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
