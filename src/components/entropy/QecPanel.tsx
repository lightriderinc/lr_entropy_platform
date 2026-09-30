"use client";

import QecModeSelector from "./QecModeSelector";

export default function QecPanel({
  enabled,
  onToggle,
  mode,
  onModeChange,
}: {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  mode: number;
  onModeChange: (mode: number) => void;
}) {
  return (
    <div className="default-radius border border-gray-50 bg-gray-50 p-4">
      <div className="flex items-start justify-between gap-3 mb-6">
        <div>
          <p className="text-md font-semibold">QEC error correction</p>
          <p className="text-xs mt-1">Add quantum error correction on top of IQM entropy</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={() => onToggle(!enabled)}
          className={[
            "relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200",
            enabled ? "bg-brand-primary" : "bg-gray-300",
          ].join(" ")}
        >
          <span className={[
            "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200",
            enabled ? "translate-x-4" : "translate-x-0",
          ].join(" ")} />
        </button>
      </div>

      {enabled && <QecModeSelector selectedMode={mode} onSelect={onModeChange} />}
    </div>
  );
}
