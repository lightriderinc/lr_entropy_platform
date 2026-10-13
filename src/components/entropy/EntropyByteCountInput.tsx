"use client";

import { BYTE_PRESETS, MAX_BYTES, MIN_BYTES } from "@/lib/entropy/generate";

export default function EntropyByteCountInput({
  bytes,
  customBytes,
  bytesValid,
  isCustom,
  onPresetSelect,
  onCustomSelect,
  onCustomChange,
}: {
  bytes: number;
  customBytes: string;
  bytesValid: boolean;
  isCustom: boolean;
  onPresetSelect: (n: number) => void;
  onCustomSelect: () => void;
  onCustomChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-2.5 block text-sm font-medium text-gray-700">
        Number of entropy bytes
      </label>
      <div className="flex flex-wrap gap-2 mb-3">
        {BYTE_PRESETS.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onPresetSelect(n)}
            className={[
              "px-3 py-1.5 default-radius border text-xs font-medium cursor-pointer transition-all",
              !isCustom && bytes === n
                ? "border-[var(--brand-primary)] text-[var(--brand-primary)] bg-white"
                : "border-gray-200 text-gray-600 bg-white hover:border-gray-300",
            ].join(" ")}
          >
            {n}B
          </button>
        ))}
        <button
          type="button"
          onClick={onCustomSelect}
          className={[
            "px-3 py-1.5 default-radius border text-xs font-medium cursor-pointer transition-all",
            isCustom
              ? "border-[var(--brand-primary)] text-[var(--brand-primary)] bg-white"
              : "border-gray-200 text-gray-600 bg-white hover:border-gray-300",
          ].join(" ")}
        >
          Custom
        </button>
      </div>
      {isCustom && (
        <>
          <input
            type="number"
            min={MIN_BYTES}
            max={MAX_BYTES}
            value={customBytes}
            onChange={(e) => onCustomChange(e.target.value)}
            placeholder={`Custom (${MIN_BYTES}–${MAX_BYTES})`}
            autoFocus
            className="w-full default-radius border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-[var(--brand-primary)] bg-white"
          />
          {bytesValid && (
            <p className="mt-1.5 text-xs text-gray-700">
              Enter a byte count between {MIN_BYTES} and {MAX_BYTES}.
            </p>
          )}
        </>
      )}
      {isCustom && !bytesValid && (
        <p className="mt-1.5 text-xs text-red-500">
          Enter a byte count between {MIN_BYTES} and {MAX_BYTES}.
        </p>
      )}
    </div>
  );
}
