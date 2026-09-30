"use client";

import InfoBox from "@/components/InfoBox";
import { EntropyRequestError, requestEntropy, type EntropyResult } from "@/lib/entropy/generate";
import { sourceDisplayName, type EntropyCatalog } from "@/lib/entropy/modes";
import type { Source } from "@/lib/sources/filters";
import Link from "next/link";
import { startTransition, useState } from "react";
import EntropyInput, { type EntropyGenerateRequest } from "./EntropyInput";
import EntropyOutput from "./EntropyOutput";

const HISTORY_LIMIT = 20;

/** Re-read the live catalog after a draw. Never rejects (feeds `use()`). */
async function fetchCatalog(): Promise<EntropyCatalog> {
  try {
    const res = await fetch("/api/entropy/sources", { cache: "no-store" });
    return (await res.json()) as EntropyCatalog;
  } catch {
    return { sources: [], multiSources: [] };
  }
}

export default function EntropyConsole({
  sourcesPromise,
  catalogPromise: initialCatalog,
}: {
  sourcesPromise: Promise<Source[]>;
  catalogPromise: Promise<EntropyCatalog>;
}) {
  // Starts as the page's streamed promise; replaced by a client refetch
  // after each single-source / custom draw so ring state stays current.
  const [catalogPromise, setCatalogPromise] = useState(initialCatalog);
  const [outOfEntropy, setOutOfEntropy] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<EntropyResult | null>(null);
  const [history, setHistory] = useState<EntropyResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  function clearMessages() {
    setError(null);
    setOutOfEntropy(null);
  }

  async function handleGenerate(request: EntropyGenerateRequest) {
    setGenerating(true);
    clearMessages();
    try {
      const next = await requestEntropy(request);
      setResult(next);
      setHistory((prev) => {
        const updated = [next, ...prev].slice(0, HISTORY_LIMIT);
        try { sessionStorage.setItem("entropy-history", JSON.stringify(updated)); } catch {}
        return updated;
      });
    } catch (err) {
      if (err instanceof EntropyRequestError && err.outOfEntropy) {
        setOutOfEntropy(err.emsSourceId ? sourceDisplayName(err.emsSourceId) : request.sourceName);
      } else {
        setError(err instanceof Error ? err.message : "Entropy request failed.");
      }
    } finally {
      setGenerating(false);
      // Ready / empty state changes with every draw. In a transition, so
      // the pickers keep showing the old list instead of the skeleton.
      if (request.mode === "source" || request.mode === "custom") {
        startTransition(() => setCatalogPromise(fetchCatalog()));
      }
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <EntropyInput
          sourcesPromise={sourcesPromise}
          catalogPromise={catalogPromise}
          generating={generating}
          error={error}
          outOfEntropy={outOfEntropy}
          onModeChange={clearMessages}
          onGenerate={handleGenerate}
        />

        <section className="flex flex-col default-radius border-2 border-gray-50 bg-gray-50 p-5">
          <h2 className="block text-md font-semibold text-gray-400 mb-6">Output</h2>
          <div className="flex-1">
            <EntropyOutput result={result} />
          </div>
          <div className="mt-6">
            <InfoBox>
              All entropy you request in this session will be accessible in{" "}
              <Link href="/history" className="font-medium text-blue-600 underline hover:text-[var(--brand-primary)]">
                Session History
              </Link>
              . This history is reset when you close the tab.
            </InfoBox>
          </div>
        </section>
      </div>
    </div>
  );
}