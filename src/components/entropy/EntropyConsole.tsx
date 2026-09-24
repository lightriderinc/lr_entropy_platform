"use client";

import { requestEntropy, type EntropyResult } from "@/lib/entropy/generate";
import { useState } from "react";
import EntropyInput, { type EntropyGenerateRequest } from "./EntropyInput";
import EntropyOutput from "./EntropyOutput";

const HISTORY_LIMIT = 20;

export default function EntropyConsole() {
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<EntropyResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate(request: EntropyGenerateRequest) {
    setGenerating(true);
    setError(null);
    try {
      const next = await requestEntropy(request);
      setResult(next);
      try {
        const saved = sessionStorage.getItem("entropy-history");
        const prev: EntropyResult[] = saved ? JSON.parse(saved) : [];
        const updated = [next, ...prev].slice(0, HISTORY_LIMIT);
        sessionStorage.setItem("entropy-history", JSON.stringify(updated));
      } catch {}
    } catch (err) {
      setError(err instanceof Error ? err.message : "Entropy request failed.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <EntropyInput generating={generating} error={error} onGenerate={handleGenerate} />

        <section className="flex flex-col default-radius border-2 border-gray-50 bg-gray-50 p-5">
          <h2 className="block text-md font-semibold text-gray-400 mb-6">Output</h2>
          <div className="flex-1">
            <EntropyOutput result={result} />
          </div>
        </section>
      </div>
    </div>
  );
}
