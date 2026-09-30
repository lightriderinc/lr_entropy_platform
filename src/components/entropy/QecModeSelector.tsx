"use client";

export const QEC_MODES = [
  { mode: 4, name: "Five qubit code", desc: "Highest fidelity", default: true },
  { mode: 2, name: "Repetition code", desc: "Distance 3, fast" },
  { mode: 3, name: "Surface code", desc: "Distance 3, rotated" },
  { mode: 5, name: "Color code", desc: "Distance 3" },
];

export default function QecModeSelector({
  selectedMode,
  onSelect,
}: {
  selectedMode: number;
  onSelect: (mode: number) => void;
}) {
  return (
    <div className="mt-3">
      <p className="text-sm font-medium text-gray-400 mb-3">Mode selection</p>
      <div className="grid grid-cols-2 gap-2">
        {QEC_MODES.map((m) => (
          <button
            key={m.mode}
            type="button"
            onClick={() => onSelect(m.mode)}
            className={[
              "text-left default-radius border p-2.5 cursor-pointer transition-all text-xs",
              selectedMode === m.mode
                ? "border-brand-primary bg-red-50"
                : "border-gray-100 bg-white card-hover-primary",
            ].join(" ")}
          >
            <p className="text-sm font-medium text-gray-800">
              {m.name}
              {m.default && (
                <span className="ml-1.5 text-[10px] bg-[var(--brand-tertiary)] text-white px-1.5 py-0.5 rounded">
                  Default
                </span>
              )}
            </p>
            <p className="text-gray-500 mt-0.5">{m.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
