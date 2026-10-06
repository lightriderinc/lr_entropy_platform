"use client";

import LRButton from "@/components/ui/LRButton";
import { isValidByteCount, MAX_BYTES, MIN_BYTES, type EntropyRequest } from "@/lib/entropy/generate";
import {
  MAX_CUSTOM_SOURCES,
  MIN_CUSTOM_SOURCES,
  POOL_OPTIONS,
  SINGLE_SOURCE_OPTIONS,
  singleSourceDrawId,
  sourceDisplayName,
  type EntropyCatalog,
  type EntropyMode,
} from "@/lib/entropy/modes";
import type { Source } from "@/lib/sources/filters";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useWallet } from "@/lib/billing/walletStore";
import { formatTokens, tokensFor } from "@/lib/entropy/pricing";
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

/** "Not enough credits" / "credits locked" after a refused draw. */
export interface CreditsNotice {
  locked: boolean;
  message: string;
  buyUrl: string;
}

// sessionStorage-backed so the chosen tab survives navigating away and back
// within the tab (same pattern as the Sources page view toggle).
const MODE_KEY = "lr:entropy:mode";
const MODES: EntropyMode[] = ["pool", "custom", "source", "card"];

function isMode(value: string | null): value is EntropyMode {
  return MODES.includes(value as EntropyMode);
}

/** `mode` omitted = the source cards, as before modes existed. */
export type EntropyGenerateRequest = EntropyRequest;

export default function EntropyInput({
  sourcesPromise,
  catalogPromise,
  generating,
  error,
  outOfEntropy,
  creditsNotice,
  onModeChange,
  onGenerate,
}: {
  sourcesPromise: Promise<Source[]>;
  catalogPromise: Promise<EntropyCatalog>;
  generating: boolean;
  error: string | null;
  /** Name of the source/pool that just ran dry, or null. */
  outOfEntropy: string | null;
  creditsNotice: CreditsNotice | null;
  onModeChange: () => void;
  onGenerate: (request: EntropyGenerateRequest) => void;
}) {
  const [mode, setMode] = useState<EntropyMode>("pool");
  // Restore after mount, not in the initializer, so the server-rendered
  // markup and first client render still match.
  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = sessionStorage.getItem(MODE_KEY);
    } catch {}
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (isMode(stored)) setMode(stored);
  }, []);
  const [selectedPoolId, setSelectedPoolId] = useState<string | null>(null);
  const [selectedSingleId, setSelectedSingleId] = useState<string | null>(null);
  // Single source "QEC error correction" toggle (IQM card): picks a real,
  // separate source (QEC_VARIANT), unlike the Source cards QEC modes.
  const [singleQec, setSingleQec] = useState(false);
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
      if (!selectedSingleId) return null;
      // The source the draw really uses (the receipt names the same one).
      const source = SINGLE_SOURCE_OPTIONS.find((s) => s.id === singleSourceDrawId(selectedSingleId, singleQec));
      return source
        ? { mode, sourceId: source.id, sourceName: `Single source: ${sourceDisplayName(source.id)}`, bytes }
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
    try {
      sessionStorage.setItem(MODE_KEY, next);
    } catch {}
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
            qec={singleQec}
            onQecChange={setSingleQec}
            qecMode={qecMode}
            onQecModeChange={setQecMode}
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

      {creditsNotice && (
        <div role="status" className="default-radius border border-amber-200 bg-amber-50 p-3">
          <p className="text-sm font-medium text-amber-800">
            {creditsNotice.locked ? "Buy credits to unlock entropy" : "Not enough credits"}
          </p>
          <p className="mt-0.5 text-xs text-amber-700">
            {creditsNotice.message}{" "}
            <Link href={creditsNotice.buyUrl} className="font-medium underline">
              Buy credits
            </Link>
          </p>
        </div>
      )}

      {error && <p className="text-xs text-[var(--brand-primary)]">{error}</p>}

      <DrawPrice bytes={bytes} valid={bytesValid} />

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

/** "This draw costs N tokens", shown before generating, with the balance. */
function DrawPrice({ bytes, valid }: { bytes: number; valid: boolean }) {
  const wallet = useWallet();
  if (!valid) return null;
  const cost = tokensFor(bytes);
  const ready = wallet.status === "ready" && !wallet.data.disabled;
  const short = ready && wallet.data.balanceCents < cost;
  return (
    <p className="text-xs text-gray-500">
      This draw costs <span className="font-semibold text-gray-700">{formatTokens(cost)}</span>
      <span className="text-gray-400"> (1 token per 256 bytes)</span>
      {ready && (
        <>
          {" · "}
          <span className={short ? "font-medium text-amber-700" : undefined}>
            balance {formatTokens(wallet.data.balanceCents)}
          </span>
          {short && (
            <>
              {" · "}
              <Link href="/settings/credits" className="font-medium text-blue-600 underline">
                Buy credits
              </Link>
            </>
          )}
        </>
      )}
    </p>
  );
}
