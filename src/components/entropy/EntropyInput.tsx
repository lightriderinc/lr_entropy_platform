"use client";

import LRButton from "@/components/ui/LRButton";
import { isValidByteCount, MAX_BYTES, MIN_BYTES } from "@/lib/entropy/generate";
import { useState } from "react";
import { MdArrowForward } from "react-icons/md";
import EntropyByteCountInput from "./EntropyByteCountInput";
import EntropySourceSelector, { SOURCES } from "./EntropySourceSelector";
import QecPanel from "./QecPanel";
import { QEC_MODES } from "./QecModeSelector";

export interface EntropyGenerateRequest {
  sourceId: string;
  sourceName: string;
  bytes: number;
}

export default function EntropyInput({
  generating,
  error,
  onGenerate,
}: {
  generating: boolean;
  error: string | null;
  onGenerate: (request: EntropyGenerateRequest) => void;
}) {
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [bytes, setBytes] = useState<number>(32);
  const [customBytes, setCustomBytes] = useState<string>("32");
  const [isCustom, setIsCustom] = useState(false);
  const [qecEnabled, setQecEnabled] = useState(false);
  const [qecMode, setQecMode] = useState(4);

  const sourceData = SOURCES.find((s) => s.id === selectedSourceId);
  const isIQM = selectedSourceId === "iqm-resonance";
  const bytesValid = isValidByteCount(bytes);
  const canGenerate = !!sourceData && bytesValid && !generating;

  function handleSelectSource(id: string) {
    setSelectedSourceId(id);
    if (id !== "iqm-resonance") setQecEnabled(false);
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
    if (!sourceData || !bytesValid) return;
    onGenerate({
      sourceId: isIQM && qecEnabled ? `iqm-qec-${qecMode}` : sourceData.id,
      sourceName: isIQM && qecEnabled
        ? `IQM Resonance + QEC (${QEC_MODES.find((m) => m.mode === qecMode)?.name})`
        : sourceData.name,
      bytes,
    });
  }

  return (
    <section className="flex flex-col gap-5 default-radius border-2 border-gray-50 p-5">
      <EntropySourceSelector selectedId={selectedSourceId} onSelect={handleSelectSource} />

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
