"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { MdArrowForward, MdBlurOn, MdCellTower, MdDeveloperBoard, MdHub, MdCheckBox, MdCheckBoxOutlineBlank, MdLayers, MdMemory, MdWaves, MdScience } from "react-icons/md";
import LRButton from "@/components/ui/LRButton";
import EntropyOutput from "./EntropyOutput";
import {
  BYTE_PRESETS,
  EntropyRequestError,
  MAX_BYTES,
  MIN_BYTES,
  isValidByteCount,
  requestEntropy,
  type EntropyRequest,
  type EntropyResult,
} from "@/lib/entropy/generate";
import {
  MAX_CUSTOM_SOURCES,
  MIN_CUSTOM_SOURCES,
  POOL_OPTIONS,
  SINGLE_SOURCE_OPTIONS,
  sourceDisplayName,
  type EntropyCatalog,
  type EntropyMode,
  type MultiSourceStatus,
  type SourceStatus,
} from "@/lib/entropy/modes";

const MODE_TABS: { id: EntropyMode; label: string; hint: string }[] = [
  { id: "pool", label: "Pools", hint: "Draw from a shared tier pool. Several sources feed each pool; the receipt lists which ones contributed." },
  { id: "custom", label: "Custom pool", hint: "Blend only the named sources, nothing else." },
  { id: "source", label: "Single source", hint: "Bytes from one source only, from its own dedicated pool." },
  { id: "card", label: "Source cards", hint: "The original source cards. Each draws from a shared tier pool; the receipt shows which one." },
];

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
  {
    id: "rigetti-cepheus",
    name: "Rigetti Cepheus-1-108Q",
    description:
      "Superconducting QPU measured on Light Rider's own Q-ENTROPY runs, pooled per chiplet and drawn as one stream.",
    icon: <MdDeveloperBoard />,
  },
];

const QEC_MODES = [
  { mode: 2, name: "Repetition code", desc: "Distance 3, fast" },
  { mode: 3, name: "Surface code", desc: "Distance 3 rotated" },
  { mode: 4, name: "Five qubit code", desc: "Highest fidelity", default: true },
  { mode: 5, name: "Color code", desc: "Distance 3" },
];

const HISTORY_LIMIT = 20;

function OptionCard({
  selected,
  onClick,
  icon,
  title,
  description,
  badge,
}: {
  selected: boolean;
  onClick: () => void;
  icon: ReactNode;
  title: string;
  description: string;
  badge?: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "text-left default-radius border p-3 transition-all cursor-pointer",
        selected
          ? "border-[var(--brand-primary)] bg-white"
          : "border-gray-200 bg-white hover:border-gray-300",
      ].join(" ")}
    >
      <div className="flex items-start gap-2">
        <span className="mt-0.5 text-lg text-gray-500">{icon}</span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-800 leading-tight">{title}</p>
          <p className="mt-0.5 text-xs text-gray-400 leading-relaxed">{description}</p>
          {badge && <div className="mt-1.5">{badge}</div>}
        </div>
      </div>
    </button>
  );
}

/** Per-source state + custom pool definitions; null when unreachable. */
async function fetchCatalog(): Promise<EntropyCatalog | null> {
  try {
    const res = await fetch("/api/entropy/sources", { cache: "no-store" });
    return (await res.json()) as EntropyCatalog;
  } catch {
    return null;
  }
}

/** Where a custom draw would read this source's share from. */
function ringLabel(s: MultiSourceStatus): string {
  return s.bytes_from === "own_ring"
    ? `own pool (${s.ring})`
    : `shared tier pool (${s.ring})`;
}

function CustomSourcePicker({
  sources,
  picked,
  loaded,
  onToggle,
}: {
  sources: MultiSourceStatus[];
  picked: string[];
  loaded: boolean;
  onToggle: (id: string) => void;
}) {
  if (!loaded) return <p className="text-xs text-gray-400">Loading sources…</p>;
  if (sources.length === 0) {
    return <p className="text-xs text-[var(--brand-primary)]">Could not load sources from EMS.</p>;
  }
  const full = picked.length >= MAX_CUSTOM_SOURCES;
  // Selectable first, then the rest, each alphabetical by display name.
  const ordered = [...sources].sort(
    (a, b) =>
      Number(b.selectable) - Number(a.selectable) ||
      sourceDisplayName(a.source_id).localeCompare(sourceDisplayName(b.source_id)),
  );
  return (
    <div>
      <p className="mb-2 text-xs text-gray-500">
        {picked.length} of {MIN_CUSTOM_SOURCES}–{MAX_CUSTOM_SOURCES} selected. Only these sources
        are blended (cascade extractor).
      </p>
      <ul className="flex flex-col gap-1.5">
        {ordered.map((s) => {
          const isPicked = picked.includes(s.source_id);
          const disabled = !s.selectable || (full && !isPicked);
          return (
            <li key={s.source_id}>
              <button
                type="button"
                role="checkbox"
                aria-checked={isPicked}
                aria-disabled={disabled}
                disabled={disabled}
                onClick={() => onToggle(s.source_id)}
                className={[
                  "flex w-full items-start gap-2 text-left default-radius border p-2.5 transition-all",
                  disabled ? "cursor-not-allowed border-gray-100 bg-gray-50 opacity-60" : "cursor-pointer bg-white",
                  isPicked ? "border-[var(--brand-primary)]" : !disabled ? "border-gray-200 hover:border-gray-300" : "",
                ].join(" ")}
              >
                <span className="mt-0.5 text-lg text-gray-500">
                  {isPicked ? <MdCheckBox /> : <MdCheckBoxOutlineBlank />}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-gray-800 leading-tight">
                    {sourceDisplayName(s.source_id)}{" "}
                    <span className="font-mono text-[11px] font-normal text-gray-400">{s.source_id}</span>
                  </span>
                  <span className="mt-0.5 block text-xs text-gray-500">Bytes from: {ringLabel(s)}</span>
                  {s.reason && (
                    <span
                      className={[
                        "mt-1 inline-block default-radius px-1.5 py-0.5 text-[11px] font-medium",
                        s.live && !s.ring_healthy ? "bg-red-50 text-red-700" : "bg-gray-100 text-gray-500",
                      ].join(" ")}
                    >
                      {s.reason}
                    </span>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Live state of a source's own pool, from EMS /v1/entropy/sources. */
function SourceStateBadge({ status }: { status?: SourceStatus }) {
  if (!status) return null;
  const [text, cls] =
    status.state === "ready"
      ? [`Ready · up to ${status.max_draw_bytes} B now`, "bg-green-50 text-green-700"]
      : status.state === "empty"
        ? ["Out of entropy — refill pending", "bg-amber-50 text-amber-700"]
        : ["Not collecting", "bg-gray-100 text-gray-500"];
  return (
    <span className={`inline-block default-radius px-1.5 py-0.5 text-[11px] font-medium ${cls}`}>
      {text}
    </span>
  );
}

export default function EntropyConsole() {
  const [mode, setMode] = useState<EntropyMode>("pool");
  const [selectedPoolId, setSelectedPoolId] = useState<string | null>(null);
  const [pickedIds, setPickedIds] = useState<string[]>([]);
  const [selectedSingleId, setSelectedSingleId] = useState<string | null>(null);
  const [catalog, setCatalog] = useState<EntropyCatalog | null>(null);
  const [outOfEntropy, setOutOfEntropy] = useState<string | null>(null);
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [bytes, setBytes] = useState<number>(32);
  const [customBytes, setCustomBytes] = useState<string>("32");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<EntropyResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [qecEnabled, setQecEnabled] = useState(false);
  const [qecMode, setQecMode] = useState(4);

  const sourceData = SOURCES.find((s) => s.id === selectedSourceId);
  const isIQM = mode === "card" && selectedSourceId === "iqm-resonance";
  const bytesValid = isValidByteCount(bytes);

  const refreshCatalog = useCallback(() => {
    fetchCatalog().then(setCatalog);
  }, []);

  useEffect(() => {
    let active = true;
    fetchCatalog().then((c) => {
      if (active) setCatalog(c);
    });
    return () => {
      active = false;
    };
  }, []);

  const statusOf = (id: string) => catalog?.sources.find((s) => s.source_id === id);
  const multiSources = catalog?.multiSources ?? [];
  // Picks that are still selectable in the latest catalog; a source that
  // went offline since it was ticked silently drops out of the request.
  const livePicks = pickedIds.filter((id) =>
    multiSources.some((s) => s.source_id === id && s.selectable),
  );
  const customTitle = livePicks.map(sourceDisplayName).join(" + ");

  function togglePick(id: string) {
    setPickedIds((prev) =>
      prev.includes(id)
        ? prev.filter((p) => p !== id)
        : prev.length >= MAX_CUSTOM_SOURCES
          ? prev
          : [...prev, id],
    );
  }

  // The request for whatever is selected in the active mode, or null.
  function currentRequest(): EntropyRequest | null {
    if (mode === "pool") {
      const pool = POOL_OPTIONS.find((p) => p.id === selectedPoolId);
      return pool ? { mode, id: pool.id, label: pool.name, bytes } : null;
    }
    if (mode === "custom") {
      return livePicks.length >= MIN_CUSTOM_SOURCES && livePicks.length <= MAX_CUSTOM_SOURCES
        ? { mode, id: "custom", ids: livePicks, label: `Custom pool: ${customTitle}`, bytes }
        : null;
    }
    if (mode === "source") {
      const source = SINGLE_SOURCE_OPTIONS.find((s) => s.id === selectedSingleId);
      return source ? { mode, id: source.id, label: `Single source: ${source.name}`, bytes } : null;
    }
    if (!sourceData) return null;
    return {
      mode,
      id: isIQM && qecEnabled ? `iqm-qec-${qecMode}` : sourceData.id,
      label: isIQM && qecEnabled
        ? `IQM Resonance + QEC (${QEC_MODES.find(m => m.mode === qecMode)?.name})`
        : sourceData.name,
      bytes,
    };
  }

  const canGenerate = !!currentRequest() && bytesValid && !generating;

  function switchMode(next: EntropyMode) {
    setMode(next);
    setError(null);
    setOutOfEntropy(null);
  }

  async function handleGenerate() {
    const req = currentRequest();
    if (!req || !bytesValid) return;
    setGenerating(true);
    setError(null);
    setOutOfEntropy(null);
    try {
      const next = await requestEntropy(req);
      setResult(next);
      try {
        const saved = sessionStorage.getItem("entropy-history");
        const prev: EntropyResult[] = saved ? JSON.parse(saved) : [];
        const updated = [next, ...prev].slice(0, HISTORY_LIMIT);
        sessionStorage.setItem("entropy-history", JSON.stringify(updated));
      } catch {}
    } catch (err) {
      if (err instanceof EntropyRequestError && err.outOfEntropy) {
        setOutOfEntropy(err.sourceId ? sourceDisplayName(err.sourceId) : req.label);
      } else {
        setError(err instanceof Error ? err.message : "Entropy request failed.");
      }
    } finally {
      setGenerating(false);
      // Ready / empty badges change with every draw.
      if (req.mode === "source" || req.mode === "custom") refreshCatalog();
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
            <label className="mb-2.5 block text-sm font-medium text-gray-700">Mode</label>
            <div role="tablist" className="flex flex-wrap gap-1 default-radius border border-gray-200 bg-white p-1">
              {MODE_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={mode === tab.id}
                  onClick={() => switchMode(tab.id)}
                  className={[
                    "flex-1 whitespace-nowrap default-radius px-3 py-1.5 text-xs font-medium cursor-pointer transition-colors",
                    mode === tab.id ? "bg-gray-700 text-white" : "text-gray-600 hover:bg-gray-100",
                  ].join(" ")}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-gray-400">{MODE_TABS.find((t) => t.id === mode)?.hint}</p>
          </div>

          {mode === "pool" && (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {POOL_OPTIONS.map((pool) => (
                <OptionCard
                  key={pool.id}
                  selected={selectedPoolId === pool.id}
                  onClick={() => setSelectedPoolId(pool.id)}
                  icon={<MdLayers />}
                  title={pool.name}
                  description={pool.description}
                />
              ))}
            </div>
          )}

          {mode === "custom" && (
            <CustomSourcePicker
              sources={multiSources}
              picked={livePicks}
              loaded={catalog !== null}
              onToggle={togglePick}
            />
          )}

          {mode === "source" && (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {SINGLE_SOURCE_OPTIONS.map((source) => (
                <OptionCard
                  key={source.id}
                  selected={selectedSingleId === source.id}
                  onClick={() => setSelectedSingleId(source.id)}
                  icon={<MdBlurOn />}
                  title={source.name}
                  description={source.description}
                  badge={<SourceStateBadge status={statusOf(source.id)} />}
                />
              ))}
            </div>
          )}

          {mode === "card" && (
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
          )}

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
    </div>
  );
}