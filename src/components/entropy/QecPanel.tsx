"use client";

import QecModeSelector from "./QecModeSelector";

import type React from "react";

/**
 * QEC toggle. Source cards: with the per-code mode selector. Single source:
 * no selector (`mode` omitted; there is one QEC pool, not one per code),
 * plus a `note` saying which source the draw uses.
 */
export default function QecPanel({
  enabled,
  onToggle,
  mode,
  onModeChange,
  note,
  toggleDisabled = false,
}: {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  mode?: number;
  onModeChange?: (mode: number) => void;
  note?: React.ReactNode;
  toggleDisabled?: boolean;
}) {
  const showModes = enabled && mode !== undefined && onModeChange !== undefined;
  return (
    <div className="default-radius border border-gray-50 bg-gray-50 p-4">
      <div className={["flex items-start justify-between gap-3", showModes || note ? "mb-3" : ""].join(" ")}>
        <div>
          <p className="text-md font-semibold">QEC error correction</p>
          <p className="text-xs mt-1">Add quantum error correction on top of IQM entropy</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label="QEC error correction"
          disabled={toggleDisabled}
          onClick={() => onToggle(!enabled)}
          className={[
            "relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200",
            toggleDisabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
            enabled ? "bg-brand-primary" : "bg-gray-300",
          ].join(" ")}
        >
          <span className={[
            "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200",
            enabled ? "translate-x-4" : "translate-x-0",
          ].join(" ")} />
        </button>
      </div>

      {note && <p className="text-xs text-gray-600">{note}</p>}
      {showModes && <QecModeSelector selectedMode={mode} onSelect={onModeChange} />}
    </div>
  );
}
