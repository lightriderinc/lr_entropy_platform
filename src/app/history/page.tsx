"use client";

import ActivityHistoryList from "@/components/entropy/ActivityHistoryList";
import InfoBox from "@/components/InfoBox";
import type { EntropyResult } from "@/lib/entropy/generate";
import { useEffect, useState } from "react";

const STORAGE_KEY = "entropy-history";

export default function ActivityHistoryPage() {
  const [items, setItems] = useState<EntropyResult[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const saved = sessionStorage.getItem(STORAGE_KEY);
        if (saved) setItems(JSON.parse(saved));
      } catch {}
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  function handleDelete(id: string) {
    setItems((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
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
          This history is stored only in your browser for the current tab
          session. It is cleared when you close the tab and no backups exist on our servers.<br/> Please copy or export any values you need to keep.
        </InfoBox>
      </div>
      <ActivityHistoryList items={items} onDelete={handleDelete} />
    </div>
  );
}
