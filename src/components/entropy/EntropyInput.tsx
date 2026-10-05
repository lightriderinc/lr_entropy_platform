"use client";

import LRButton from "@/components/ui/LRButton";
import { isValidByteCount, MAX_BYTES, MIN_BYTES, type EntropyRequest } from "@/lib/entropy/generate";
import {
  MAX_CUSTOM_SOURCES,
  MIN_CUSTOM_SOURCES,
  POOL_OPTIONS,
  SINGLE_SOURCE_OPTIONS,
  sourceDisplayName,
  type EntropyCatalog,
  type EntropyMode,
} from "@/lib/entropy/modes";
import type { Source } from "@/lib/sources/filters";
import { Suspense, useState } from "react";
import { MdArrowForward } from "react-icons/md";
import CustomSourcePicker, { CatalogSkeleton } from "./CustomSourcePicker";
import EntropyByteCountInput from "./EntropyByteCountInput";
import EntropyModeTabs from "./EntropyModeTabs";
import EntropySourceSelector, {
  EntropySourceSelectorSkeleton,
  type EntropySource,
} from "./EntropySourceSelector";
import PoolSelector from "./PoolSelector";
import { QEC_MODES } from "./QecModeSelector";
import QecPanel from "./QecPanel";
import SingleSourceSelector from "./SingleSourceSelector";

/** `mode` omitted = the source cards, as before modes existed. */
export type EntropyGenerateRequest = EntropyRequest;

export default function EntropyInput({
  sourcesPromise,
  catalogPromise,
  generating,
  error,
  outOfEntropy,
  onModeChange,
  onGenerate,
}: {
  sourcesPromise: Promise<Source[]>;
  catalogPromise: Promise<EntropyCatalog>;
  generating: boolean;
  error: string | null;
  /** Name of the source/pool that just ran dry, or null. */
  outOfEntropy: string | null;
  onModeChange: () => void;
  onGenerate: (request: EntropyGenerateRequest) => void;
}) {
  const [mode, setMode] = useState<EntropyMode>("pool");
  const [selectedPoolId, setSelectedPoolId] = useState<string | null>(null);
  const [selectedSingleId, setSelectedSingleId] = useState<string | null>(null);
  const [pickedIds, setPickedIds] = useState<string[]>([]);
  const [sourceData, setSourceData] = useState<EntropySource | null>(null);
  const [bytes, setBytes] = useState<number>(32);
  const [customBytes, setCustomBytes] = useState<string>("32");
  const [isCustom, setIsCustom] = useState(false);
  const [qecEnabled, setQecEnabled] = useState(false);
  const [qecMode, setQecMode] = useState(4);

  const isIQM = mode === "card" && sourceData?.id === "iqm-resonance";
  const bytesValid = isValidByteCount(bytes);

  // The request for whatever is selected in the active mode, or null.
  function currentRequest(): EntropyGenerateRequest | null {
    if (mode === "pool") {
      const pool = POOL_OPTIONS.find((p) => p.id === selectedPoolId);
      return pool ? { mode, sourceId: pool.id, sourceName: pool.name, bytes } : null;
    }
    if (mode === "source") {
      const source = SINGLE_SOURCE_OPTIONS.find((s) => s.id === selectedSingleId);
      return source
        ? { mode, sourceId: source.id, sourceName: `Single source: ${source.name}`, bytes }
        : null;
    }
    if (mode === "custom") {
      if (pickedIds.length < MIN_CUSTOM_SOURCES || pickedIds.length > MAX_CUSTOM_SOURCES) return null;
      return {
        mode,
        sourceId: "custom",
        ids: pickedIds,
        sourceName: `Custom pool: ${pickedIds.map(sourceDisplayName).join(" + ")}`,
        bytes,
      };
    }
    if (!sourceData) return null;
    return {
      sourceId: isIQM && qecEnabled ? `iqm-qec-${qecMode}` : sourceData.id,
      sourceName: isIQM && qecEnabled
        ? `IQM Resonance + QEC (${QEC_MODES.find((m) => m.mode === qecMode)?.name})`
        : sourceData.name,
      bytes,
    };
  }

  const canGenerate = !!currentRequest() && bytesValid && !generating;

  function handleModeChange(next: EntropyMode) {
    setMode(next);
    onModeChange();
  }

  function togglePick(id: string) {
    setPickedIds((prev) =>
      prev.includes(id)
        ? prev.filter((p) => p !== id)
        : prev.length >= MAX_CUSTOM_SOURCES
          ? prev
          : [...prev, id],
    );
  }

  function handleSelectSource(source: EntropySource) {
    setSourceData(source);
    if (source.id !== "iqm-resonance") setQecEnabled(false);
  }

  function handlePreset(n: number) {
    setIsCustom(false);
    setBytes(n);
    setCustomBytes(String(n));
  }

  function handleCustomSelect() {
    setIsCustom(true);
    const n = parseInt(customBytes, 10);
    setBytes(!isNaN(n) ? n : 0);
  }

  function handleCustom(val: string) {
    if (val === "") {
      setCustomBytes(val);
      setBytes(0);
      return;
    }
    const n = parseInt(val, 10);
    if (isNaN(n)) {
      setCustomBytes(val);
      return;
    }
    const clamped = Math.min(MAX_BYTES, Math.max(MIN_BYTES, n));
    setCustomBytes(String(clamped));
    setBytes(clamped);
  }

  function handleGenerateClick() {
    const request = currentRequest();
    if (!request || !bytesValid) return;
    onGenerate(request);
  }

  return (
    <section className="flex flex-col gap-5 default-radius border-2 border-gray-50 p-5">
      <EntropyModeTabs mode={mode} onChange={handleModeChange} />

      {mode === "pool" && <PoolSelector selectedId={selectedPoolId} onSelect={setSelectedPoolId} />}

      {mode === "custom" && (
        <Suspense fallback={<CatalogSkeleton />}>
          <CustomSourcePicker catalogPromise={catalogPromise} picked={pickedIds} onToggle={togglePick} />
        </Suspense>
      )}

      {mode === "source" && (
        <Suspense fallback={<CatalogSkeleton />}>
          <SingleSourceSelector
            catalogPromise={catalogPromise}
            selectedId={selectedSingleId}
            onSelect={setSelectedSingleId}
          />
        </Suspense>
      )}

      {mode === "card" && (
        <Suspense fallback={<EntropySourceSelectorSkeleton />}>
          <EntropySourceSelector
            sourcesPromise={sourcesPromise}
            selectedId={sourceData?.id ?? null}
            onSelect={handleSelectSource}
          />
        </Suspense>
      )}

      {isIQM && (
        <QecPanel enabled={qecEnabled} onToggle={setQecEnabled} mode={qecMode} onModeChange={setQecMode} />
      )}

      <EntropyByteCountInput
        bytes={bytes}
        customBytes={customBytes}
        bytesValid={bytesValid}
        isCustom={isCustom}
        onPresetSelect={handlePreset}
        onCustomSelect={handleCustomSelect}
        onCustomChange={handleCustom}
      />

      {outOfEntropy && (
        <div role="status" className="default-radius border border-amber-200 bg-amber-50 p-3">
          <p className="text-sm font-medium text-amber-800">Out of entropy — refill pending</p>
          <p className="mt-0.5 text-xs text-amber-700">
            {outOfEntropy} has no bytes left to serve right now. It refills on its own;
            try again in a few minutes, or request fewer bytes.
          </p>
        </div>
      )}

      {error && <p className="text-xs text-[var(--brand-primary)]">{error}</p>}

      <LRButton
        type="button"
        disabled={!canGenerate}
        onClick={handleGenerateClick}
        variant="primary"
        icon={generating ? undefined : <MdArrowForward className="text-lg" />}
        iconPosition="right"
        className="mt-auto"
      >
        {generating ? "Generating…" : "Generate entropy"}
      </LRButton>
    </section>
  );
}
