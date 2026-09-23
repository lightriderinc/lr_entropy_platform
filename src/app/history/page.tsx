"use client";

import { useEffect, useState } from "react";
import ActivityHistoryList from "@/components/entropy/ActivityHistoryList";
import type { EntropyResult } from "@/lib/entropy/generate";

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
      <h1 className="text-2xl font-semibold text-gray-700 mb-2">Activity History</h1>
      <p className="mb-12 text-sm text-gray-600">
        Entropy you&apos;ve generated in this session, with quick access to copy values or remove entries.
      </p>
      <ActivityHistoryList items={items} onDelete={handleDelete} />
    </div>
  );
}
