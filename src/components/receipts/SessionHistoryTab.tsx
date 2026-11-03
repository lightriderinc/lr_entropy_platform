"use client";

import ActivityHistoryList from "@/components/entropy/ActivityHistoryList";
import InfoBox from "@/components/InfoBox";
import type { EntropyResult } from "@/lib/entropy/generate";
import {
  readSessionHistory,
  removeFromSessionHistory,
} from "@/lib/entropy/sessionHistory";
import Link from "next/link";
import { useEffect, useState } from "react";

/** Entropy generated in this browser tab, kept only in session storage. */
export default function SessionHistoryTab() {
  const [items, setItems] = useState<EntropyResult[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setItems(readSessionHistory());
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  function handleDelete(id: string) {
    setItems(removeFromSessionHistory(id));
  }

  return (
    <div>
      <p className="mb-4 text-sm text-gray-600">
        Track and manage your generated entropy from this session.
      </p>
      <div className="mb-8">
        <InfoBox>
          Session history is stored only in your browser for the current tab and
          is cleared when you close the tab. Copy or export any entropy values
          you need to keep. <br /> Signed receipts for all your entropy requests
          are accessible from{" "}
          <Link
            href="/receipts?tab=signed-receipts"
            className="font-medium text-blue-600 underline hover:text-[var(--brand-primary)]"
          >
            Signed receipts
          </Link>
          .
        </InfoBox>
      </div>
      <ActivityHistoryList items={items} onDelete={handleDelete} />
    </div>
  );
}
