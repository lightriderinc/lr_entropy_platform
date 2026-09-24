"use client";

export const QEC_MODES = [
  { mode: 2, name: "Repetition code", desc: "Distance 3, fast" },
  { mode: 3, name: "Surface code", desc: "Distance 3 rotated" },
  { mode: 4, name: "Five qubit code", desc: "Highest fidelity", default: true },
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
      <p className="text-xs font-semibold text-mist-600 mb-3">QEC mode</p>
      <div className="grid grid-cols-2 gap-2">
        {QEC_MODES.map((m) => (
          <button
            key={m.mode}
            type="button"
            onClick={() => onSelect(m.mode)}
            className={[
              "text-left default-radius border p-2.5 cursor-pointer transition-all text-xs",
              selectedMode === m.mode
                ? "border-brand-primary bg-mist-200"
                : "border-mist-200 bg-mist-200 hover:border-blue-300",
            ].join(" ")}
          >
            <p className="font-medium text-blue-800 leading-tight">
              {m.name}
              {m.default && (
                <span className="ml-1.5 text-[10px] bg-blue-500 text-white px-1.5 py-0.5 rounded-full">Default</span>
              )}
            </p>
            <p className="text-blue-500 mt-0.5">{m.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
