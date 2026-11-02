"use client";

import {
  isOfferedSource,
  MAX_CUSTOM_SOURCES,
  siteSource,
  sourceDisplayName,
  sourceIcon,
  type EntropyCatalog,
  type SourceStatus,
} from "@/lib/entropy/modes";
import { use } from "react";
import EntropySourceCard from "./EntropySourceCard";

/** What one draw from the source can return right now. */
function BalanceBadge({
  status,
  reason,
}: {
  status: SourceStatus;
  reason: string | null;
}) {
  const [text, cls] =
    status.state === "ready"
      ? reason
        ? [reason, "bg-gray-100 text-gray-500"]
        : [
            `${status.max_draw_bytes.toLocaleString()} B available`,
            "bg-green-50 text-green-700",
          ]
      : ["Out of entropy — refill pending", "bg-amber-50 text-amber-700"];
  return (
    <span
      className={`inline-block default-radius px-1.5 py-0.5 text-[11px] font-medium ${cls}`}
    >
      {text}
    </span>
  );
}

/**
 * Pick 1-8 sources. One pick is a single-source draw from that source's own
 * ring; two or more are blended (EMS /v1/entropy/multi). Cards are the
 * sources in SITE_SOURCES (modes.ts) that the single-source catalog reports
 * with their own ring; the byte count is that catalog's `max_draw_bytes`.
 * A source the custom-pool list marks not selectable is greyed out with
 * EMS's reason. /api/entropy re-checks the picks against fresh EMS state
 * before drawing, so a stale page cannot slip one through.
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
  const { sources, multiSources } = use(catalogPromise);
  if (sources.length === 0) {
    return (
      <p className="text-xs text-[var(--brand-primary)]">
        Could not load sources from EMS.
      </p>
    );
  }
  const cards = sources
    .filter((s) => isOfferedSource(s.source_id) && s.state !== "unavailable")
    .map((status) => {
      const multi = multiSources.find((m) => m.source_id === status.source_id);
      const reason =
        multi && !multi.selectable ? (multi.reason ?? "not selectable") : null;
      return {
        status,
        reason,
        selectable: status.state === "ready" && !reason,
      };
    })
    // Selectable first, then the rest, each alphabetical by display name.
    .sort(
      (a, b) =>
        Number(b.selectable) - Number(a.selectable) ||
        sourceDisplayName(a.status.source_id).localeCompare(
          sourceDisplayName(b.status.source_id),
        ),
    );
  const full = picked.length >= MAX_CUSTOM_SOURCES;

  return (
    <div className="flex flex-col gap-2">
      <label className="block text-md font-semibold text-gray-400 mb-1">
        Select sources
      </label>
      <p className="text-xs text-gray-500">
        {picked.length} of up to {MAX_CUSTOM_SOURCES} selected. Pick a single source
        to draw from it alone, or several to blend them.
      </p>
      {cards.length === 0 && (
        <p className="text-xs text-gray-500">
          No sources are available right now.
        </p>
      )}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {cards.map(({ status, reason, selectable }) => {
          const id = status.source_id;
          const isPicked = picked.includes(id);
          const Icon = sourceIcon(id);
          return (
            <EntropySourceCard
              key={id}
              id={id}
              name={sourceDisplayName(id)}
              tag={siteSource(id)?.tag}
              icon={<Icon />}
              selected={isPicked}
              // A picked source can always be unpicked, even if it went unavailable.
              unavailable={!isPicked && (!selectable || full)}
              badge={<BalanceBadge status={status} reason={reason} />}
              onSelect={() => onToggle(id)}
            />
          );
        })}
      </div>
    </div>
  );
}

export function CatalogSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading sources"
      className="grid grid-cols-1 gap-2 sm:grid-cols-2"
    >
      {Array.from({ length: 4 }, (_, i) => (
        <div
          key={i}
          className="h-20 w-full default-radius border border-gray-100 bg-white animate-pulse"
        />
      ))}
    </div>
  );
}
