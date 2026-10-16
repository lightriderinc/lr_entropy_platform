"use client";

import { PLATFORMS } from "@/lib/developers/snippets";
import { usePlatform } from "@/lib/developers/usePlatform";

/** macOS / Linux, Windows PowerShell, Python, Google Colab. The choice is shared and remembered. */
export default function PlatformTabs() {
  const [platform, setPlatform] = usePlatform();
  return (
    <div role="tablist" className="flex flex-wrap gap-1 default-radius border border-gray-100 bg-white p-1">
      {PLATFORMS.map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-selected={platform === t.id}
          onClick={() => setPlatform(t.id)}
          className={[
            "flex-1 whitespace-nowrap default-radius px-3 py-1.5 text-xs font-medium cursor-pointer transition-colors",
            platform === t.id ? "bg-brand-primary text-white" : "text-gray-600 hover:bg-gray-100",
          ].join(" ")}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
