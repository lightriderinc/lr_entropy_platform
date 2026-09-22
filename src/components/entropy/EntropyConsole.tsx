"use client";

import { useState, useEffect } from "react";
import { MdArrowForward, MdBlurOn, MdCellTower, MdHub, MdMemory, MdWaves, MdScience } from "react-icons/md";
import LRButton from "@/components/ui/LRButton";
import EntropyOutput from "./EntropyOutput";
import EntropyHistory from "./EntropyHistory";
import {
  BYTE_PRESETS,
  MAX_BYTES,
  MIN_BYTES,
  isValidByteCount,
  requestEntropy,
  type EntropyResult,
} from "@/lib/entropy/generate";

const SOURCES = [
  {
    id: "cisco-qrng",
    name: "Cisco Outshift QRNG",
    description: "Quantum-generated random numbers from Cisco's cloud quantum service.",
    icon: <MdWaves />,
  },
  {
    id: "inmetro-beacon",
    name: "Inmetro Beacon",
    description: "Publicly verifiable random values from Brazil's national metrology institute.",
    icon: <MdCellTower />,
  },
  {
    id: "nist-beacon",
    name: "NIST Beacon",
    description: "Publicly verifiable random values from the National Institute of Standards and Technology.",
    icon: <MdHub />,
  },
  {
    id: "anu-qrng",
    name: "ANU Quantum RNG",
    description: "True quantum randomness from quantum vacuum fluctuations at the Australian National University.",
    icon: <MdBlurOn />,
  },
  {
    id: "rdseed",
    name: "RDSEED",
    description: "CSPRNG randomness seeded by the operating system entropy pool and CPU hardware sources.",
    icon: <MdMemory />,
  },
  {
    id: "iqm-resonance",
    name: "IQM Resonance",
    description: "Cloud superconducting quantum processor. Optionally apply QEC error correction.",
    icon: <MdScience />,
  },
];

const QEC_MODES = [
  { mode: 2, name: "Repetition code", desc: "Distance 3, fast" },
  { mode: 3, name: "Surface code", desc: "Distance 3 rotated" },
  { mode: 4, name: "Five qubit code", desc: "Highest fidelity", default: true },
  { mode: 5, name: "Color code", desc: "Distance 3" },
];

const HISTORY_LIMIT = 20;

export default function EntropyConsole() {
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [bytes, setBytes] = useState<number>(32);
  const [customBytes, setCustomBytes] = useState<string>("32");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<EntropyResult | null>(null);
  const [history, setHistory] = useState<EntropyResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [qecEnabled, setQecEnabled] = useState(false);
  const [qecMode, setQecMode] = useState(4);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const saved = sessionStorage.getItem("entropy-history");
        if (saved) setHistory(JSON.parse(saved));
      } catch {}
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const sourceData = SOURCES.find((s) => s.id === selectedSourceId);
  const isIQM = selectedSourceId === "iqm-resonance";
  const bytesValid = isValidByteCount(bytes);
  const canGenerate = !!sourceData && bytesValid && !generating;

  async function handleGenerate() {
    if (!sourceData || !bytesValid) return;
    setGenerating(true);
    setError(null);
    try {
      const next = await requestEntropy({
        sourceId: isIQM && qecEnabled ? `iqm-qec-${qecMode}` : sourceData.id,
        sourceName: isIQM && qecEnabled
          ? `IQM Resonance + QEC (${QEC_MODES.find(m => m.mode === qecMode)?.name})`
          : sourceData.name,
        bytes,
      });
      setResult(next);
      setHistory((prev) => {
        const updated = [next, ...prev].slice(0, HISTORY_LIMIT);
        try { sessionStorage.setItem("entropy-history", JSON.stringify(updated)); } catch {}
        return updated;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Entropy request failed.");
    } finally {
      setGenerating(false);
    }
  }

  function handlePreset(n: number) {
    setBytes(n);
    setCustomBytes(String(n));
  }

  function handleCustom(val: string) {
    setCustomBytes(val);
    const n = parseInt(val, 10);
    if (!isNaN(n)) setBytes(n);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="flex flex-col gap-5 default-radius border border-gray-100 bg-gray-50 p-5">

          <div>
            <label className="mb-2.5 block text-sm font-medium text-gray-700">Entropy source</label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {SOURCES.map((source) => (
                <button
                  key={source.id}
                  type="button"
                  onClick={() => { setSelectedSourceId(source.id); if (source.id !== "iqm-resonance") setQecEnabled(false); }}
                  className={[
                    "text-left default-radius border p-3 transition-all cursor-pointer",
                    selectedSourceId === source.id
                      ? "border-[var(--brand-primary)] bg-white"
                      : "border-gray-200 bg-white hover:border-gray-300",
                  ].join(" ")}
                >
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 text-lg text-gray-500">{source.icon}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 leading-tight">{source.name}</p>
                      <p className="mt-0.5 text-xs text-gray-400 leading-relaxed">{source.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {isIQM && (
            <div className="default-radius border border-blue-200 bg-blue-50 p-4">
              <div className="flex items-start justify-between gap-3 mb-0">
                <div>
                  <p className="text-sm font-medium text-blue-800">Apply QEC error correction</p>
                  <p className="text-xs text-blue-600 mt-0.5">Optional — adds quantum error correction on top of IQM entropy</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={qecEnabled}
                  onClick={() => setQecEnabled(!qecEnabled)}
                  className={[
                    "relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200",
                    qecEnabled ? "bg-blue-500" : "bg-gray-300",
                  ].join(" ")}
                >
                  <span className={[
                    "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200",
                    qecEnabled ? "translate-x-4" : "translate-x-0",
                  ].join(" ")} />
                </button>
              </div>

              {qecEnabled && (
                <div className="mt-3 border-t border-blue-100 pt-3">
                  <p className="text-xs font-medium text-blue-700 mb-2">QEC mode</p>
                  <div className="grid grid-cols-2 gap-2">
                    {QEC_MODES.map((m) => (
                      <button
                        key={m.mode}
                        type="button"
                        onClick={() => setQecMode(m.mode)}
                        className={[
                          "text-left rounded-lg border p-2.5 cursor-pointer transition-all text-xs",
                          qecMode === m.mode
                            ? "border-blue-400 bg-white"
                            : "border-blue-100 bg-white hover:border-blue-300",
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
              )}
            </div>
          )}

          <div>
            <label className="mb-2.5 block text-sm font-medium text-gray-700">Number of entropy bytes</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {BYTE_PRESETS.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => handlePreset(n)}
                  className={[
                    "px-3 py-1.5 default-radius border text-xs font-medium cursor-pointer transition-all",
                    bytes === n
                      ? "border-[var(--brand-primary)] text-[var(--brand-primary)] bg-white"
                      : "border-gray-200 text-gray-600 bg-white hover:border-gray-300",
                  ].join(" ")}
                >
                  {n}B
                </button>
              ))}
            </div>
            <input
              type="number"
              min={MIN_BYTES}
              max={MAX_BYTES}
              value={customBytes}
              onChange={(e) => handleCustom(e.target.value)}
              placeholder={`Custom (${MIN_BYTES}–${MAX_BYTES})`}
              className="w-full default-radius border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-[var(--brand-primary)] bg-white"
            />
            {!bytesValid && (
              <p className="mt-1.5 text-xs text-[var(--brand-primary)]">
                Enter a byte count between {MIN_BYTES} and {MAX_BYTES}.
              </p>
            )}
          </div>

          {error && <p className="text-xs text-[var(--brand-primary)]">{error}</p>}

          <LRButton
            type="button"
            disabled={!canGenerate}
            onClick={handleGenerate}
            variant="primary"
            icon={generating ? undefined : <MdArrowForward className="text-lg" />}
            iconPosition="right"
            className="mt-auto"
          >
            {generating ? "Generating…" : "Generate entropy"}
          </LRButton>
        </section>

        <section className="flex flex-col default-radius border border-gray-100 bg-white p-5">
          <h2 className="mb-3 text-sm font-bold text-gray-600">Output</h2>
          <div className="flex-1">
            <EntropyOutput result={result} />
          </div>
        </section>
      </div>

      <EntropyHistory
        items={history}
        onSelect={setResult}
        onClear={() => { setHistory([]); try { sessionStorage.removeItem("entropy-history"); } catch {} }}
      />
    </div>
  );
}