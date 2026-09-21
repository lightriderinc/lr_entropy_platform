"use client";

import { useState, useEffect } from "react";
import { MdArrowForward, MdBlurOn, MdCellTower, MdHub, MdMemory, MdWaves, MdScience, MdComputer } from "react-icons/md";
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
    warning: null,
  },
  {
    id: "inmetro-beacon",
    name: "Inmetro Beacon",
    description: "Publicly verifiable random values from Brazil's national metrology institute.",
    icon: <MdCellTower />,
    warning: null,
  },
  {
    id: "nist-beacon",
    name: "NIST Beacon",
    description: "Publicly verifiable random values from the National Institute of Standards and Technology.",
    icon: <MdHub />,
    warning: null,
  },
  {
    id: "anu-qrng",
    name: "ANU Quantum RNG",
    description: "True quantum randomness from quantum vacuum fluctuations at the Australian National University.",
    icon: <MdBlurOn />,
    warning: null,
  },
  {
    id: "rdseed",
    name: "RDSEED",
    description: "CSPRNG randomness seeded by the operating system entropy pool and CPU hardware sources.",
    icon: <MdMemory />,
    warning: null,
  },
  {
    id: "lightrider-qec-sim",
    name: "Lightrider QEC (Simulator)",
    description: "Quantum Error Correction circuits on a fully connected classical simulator. Free and instant.",
    icon: <MdComputer />,
    warning: "This source uses a classical simulation with all-to-all qubit connectivity. Results are not real quantum randomness and could theoretically be reproduced. Do not use for security-critical applications.",
  },
  {
    id: "lightrider-qec-qpu",
    name: "Lightrider QEC (IQM QPU)",
    description: "Quantum Error Correction circuits executed on real IQM quantum hardware. Genuine quantum randomness.",
    icon: <MdScience />,
    warning: null,
  },
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


  // Load history from sessionStorage after mount to avoid hydration mismatch
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("entropy-history");
      if (saved) setHistory(JSON.parse(saved));
    } catch {}
  }, []);
  const sourceData = SOURCES.find((s) => s.id === selectedSourceId);
  const bytesValid = isValidByteCount(bytes);
  const canGenerate = !!sourceData && bytesValid && !generating;

  async function handleGenerate() {
    if (!sourceData || !bytesValid) return;
    setGenerating(true);
    setError(null);
    try {
      const next = await requestEntropy({
        sourceId: sourceData.id,
        sourceName: sourceData.name,
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
        {/* Configure */}
        <section className="flex flex-col gap-5 default-radius border border-gray-100 bg-gray-50 p-5">
          <div>
            <label className="mb-2.5 block text-sm font-medium text-gray-700">
              Entropy source
            </label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {SOURCES.map((source) => (
                <button
                  key={source.id}
                  type="button"
                  onClick={() => setSelectedSourceId(source.id)}
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

          {/* Simulator warning */}
          {sourceData?.warning && (
            <div className="default-radius border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-xs font-medium text-amber-800 mb-1">⚠ Classical simulation only</p>
              <p className="text-xs text-amber-700 leading-relaxed">{sourceData.warning}</p>
            </div>
          )}

          <div>
            <label className="mb-2.5 block text-sm font-medium text-gray-700">
              Number of entropy bytes
            </label>
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

          {error && (
            <p className="text-xs text-[var(--brand-primary)]">{error}</p>
          )}

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

        {/* Output */}
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