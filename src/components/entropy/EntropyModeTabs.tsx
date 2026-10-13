"use client";

import type { EntropyMode } from "@/lib/entropy/modes";

export const MODE_TABS: { id: EntropyMode; label: string; hint: string }[] = [
  { id: "pool", label: "Pools", hint: "Draw from a tier pool of several sources." },
  { id: "custom", label: "Custom pool", hint: "Draw from a custom blend of pools and sources." },
  { id: "source", label: "Single source", hint: "Draw from the dedicated pool of a single source." },
  { id: "card", label: "Source cards", hint: "Draw from the shared tier pool of each source." },
];

export default function EntropyModeTabs({
  mode,
  onChange,
}: {
  mode: EntropyMode;
  onChange: (mode: EntropyMode) => void;
}) {
  return (
    <div>
      <label className="block text-md font-semibold text-gray-400 mb-3">Mode</label>
      <div role="tablist" className="flex flex-wrap gap-1 default-radius border border-gray-100 bg-white p-1">
        {MODE_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={mode === tab.id}
            onClick={() => onChange(tab.id)}
            className={[
              "flex-1 whitespace-nowrap default-radius px-3 py-1.5 text-xs font-medium cursor-pointer transition-colors",
              mode === tab.id ? "bg-brand-primary text-white" : "text-gray-600 hover:bg-gray-100",
            ].join(" ")}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <p className="mt-2 text-xs text-gray-400">{MODE_TABS.find((t) => t.id === mode)?.hint}</p>
    </div>
  );
}
