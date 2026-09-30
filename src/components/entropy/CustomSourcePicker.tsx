"use client";

import {
  MAX_CUSTOM_SOURCES,
  MIN_CUSTOM_SOURCES,
  sourceDisplayName,
  type EntropyCatalog,
  type MultiSourceStatus,
} from "@/lib/entropy/modes";
import { use } from "react";
import { MdCheckBox, MdCheckBoxOutlineBlank } from "react-icons/md";

/** Where a custom draw would read this source's share from. */
function ringLabel(s: MultiSourceStatus): string {
  return s.bytes_from === "own_ring" ? `own pool (${s.ring})` : `shared tier pool (${s.ring})`;
}

/**
 * Pick 2-8 sources for a custom pool. The list (live status, and where each
 * source's bytes come from) is EMS /v1/entropy/multi/sources; beacons and
 * simulators never appear. Only selectable rows can be ticked; the rest are
 * greyed out with the reason. /api/entropy re-checks the picks against a
 * fresh list before drawing, so a stale page cannot slip one through.
 */
export default function CustomSourcePicker({
  catalogPromise,
  picked,
  onToggle,
}: {
  catalogPromise: Promise<EntropyCatalog>;
  picked: string[];
  onToggle: (id: string) => void;
}) {
  const { multiSources } = use(catalogPromise);
  if (multiSources.length === 0) {
    return <p className="text-xs text-[var(--brand-primary)]">Could not load sources from EMS.</p>;
  }
  const full = picked.length >= MAX_CUSTOM_SOURCES;
  // Selectable first, then the rest, each alphabetical by display name.
  const ordered = [...multiSources].sort(
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
                  "flex w-full items-start gap-2 text-left default-radius border p-3 transition-all duration-150",
                  disabled
                    ? "cursor-not-allowed border-gray-100 bg-gray-50 opacity-60"
                    : isPicked
                      ? "cursor-pointer border-[var(--brand-primary)] bg-red-50"
                      : "cursor-pointer border-gray-100 bg-white card-hover-primary",
                ].join(" ")}
              >
                <span className={["mt-0.5 text-lg", isPicked ? "text-[var(--brand-primary)]" : "text-gray-400"].join(" ")}>
                  {isPicked ? <MdCheckBox /> : <MdCheckBoxOutlineBlank />}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-gray-800 leading-tight">
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

export function CatalogSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading sources" className="flex flex-col gap-1.5">
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="h-14 w-full default-radius border border-gray-100 bg-white animate-pulse" />
      ))}
    </div>
  );
}
