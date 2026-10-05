"use client";

import ActivityHistoryList from "@/components/entropy/ActivityHistoryList";
import InfoBox from "@/components/InfoBox";
import type { EntropyResult } from "@/lib/entropy/generate";
import { readSessionHistory, removeFromSessionHistory } from "@/lib/entropy/sessionHistory";
import { useEffect, useState } from "react";

export default function ActivityHistoryPage() {
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
    <div className="animate-fade-in-up">
      <h1 className="text-2xl font-semibold text-gray-700">
        Session History
      </h1>
      <p className="mb-12 text-sm text-gray-600">
        Track and manage your generated entropy in this session.
      </p>
      <div className="mb-8">
        <InfoBox>
          This list, including the entropy bytes, is stored only in your browser for the current tab
          and is cleared when you close it. The bytes are never stored on our servers: copy or export
          any values you need to keep. Every draw&apos;s signed receipt is kept for your account under
          Receipts.
        </InfoBox>
      </div>
      <ActivityHistoryList items={items} onDelete={handleDelete} />
    </div>
  );
}
