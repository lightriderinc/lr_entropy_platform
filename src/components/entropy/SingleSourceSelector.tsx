"use client";

import {
  COMING_SOON_SOURCES,
  QEC_VARIANT,
  SINGLE_SOURCE_OPTIONS,
  sourceDisplayName,
  type EntropyCatalog,
  type SourceStatus,
} from "@/lib/entropy/modes";
import { use } from "react";
import { MdBlurOn } from "react-icons/md";
import EntropySourceCard from "./EntropySourceCard";
import QecPanel from "./QecPanel";

/** What the user needs: how much the source has right now. */
function BalanceBadge({ status }: { status: SourceStatus | undefined }) {
  const [text, cls] =
    status?.state === "ready"
      ? [`${status.max_draw_bytes.toLocaleString()} B available`, "bg-green-50 text-green-700"]
      : ["Out of entropy — refill pending", "bg-amber-50 text-amber-700"];
  return (
    <span className={`inline-block default-radius px-1.5 py-0.5 text-[11px] font-medium ${cls}`}>
      {text}
    </span>
  );
}

export default function SingleSourceSelector({
  catalogPromise,
  selectedId,
  onSelect,
  qec,
  onQecChange,
  qecMode,
  onQecModeChange,
}: {
  catalogPromise: Promise<EntropyCatalog>;
  /** The card picked (the parent id when a QEC variant is in use). */
  selectedId: string | null;
  onSelect: (id: string) => void;
  qec: boolean;
  onQecChange: (qec: boolean) => void;
  qecMode: number;
  onQecModeChange: (mode: number) => void;
}) {
  const catalog = use(catalogPromise);
  const statusOf = (id: string) => {
    const s = catalog.sources.find((x) => x.source_id === id);
    return s && s.state !== "unavailable" ? s : undefined;
  };
  // Available: only sources with their OWN pool can be served alone. EMS
  // reports a source with no own ring as `unavailable`; it is not offered
  // (an empty own pool is still listed, with its refill-pending badge).
  const offered = SINGLE_SOURCE_OPTIONS.flatMap((source) => {
    const status = statusOf(source.id);
    return status ? [{ source, status }] : [];
  });
  const offeredIds = new Set(offered.map((o) => o.source.id));
  // A QEC variant lives under its parent's toggle, not as a second card,
  // unless the parent itself isn't offered right now.
  const variantOf = new Map(Object.entries(QEC_VARIANT).map(([parent, variant]) => [variant, parent]));
  const cards = offered.filter(({ source }) => {
    const parent = variantOf.get(source.id);
    return !(parent && offeredIds.has(parent));
  });

  const variantId = selectedId ? QEC_VARIANT[selectedId] : undefined;
  const showQec = !!selectedId && !!variantId && offeredIds.has(selectedId);
  const variantStatus = variantId ? statusOf(variantId) : undefined;
  const usedId = qec && variantId ? variantId : selectedId;

  return (
    <div className="flex flex-col gap-2">
      {cards.length === 0 && (
        <p className="text-xs text-gray-500">No single sources are available right now.</p>
      )}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {cards.map(({ source, status }) => (
          <EntropySourceCard
            key={source.id}
            id={source.id}
            name={source.name}
            tag={source.tag}
            icon={<MdBlurOn />}
            selected={selectedId === source.id}
            badge={<BalanceBadge status={status} />}
            onSelect={() => onSelect(source.id)}
          />
        ))}
        {COMING_SOON_SOURCES.map((source) => (
          <EntropySourceCard
            key={source.id}
            id={source.id}
            name={source.name}
            icon={<MdBlurOn />}
            selected={false}
            disabled
            onSelect={() => {}}
          />
        ))}
      </div>
      {showQec && usedId && (
        <QecPanel
          enabled={qec}
          onToggle={onQecChange}
          // Can't switch QEC on while its pool is unavailable; can always switch off.
          toggleDisabled={!qec && !variantStatus}
          mode={qecMode}
          onModeChange={onQecModeChange}
          note={
            <>
              Using <span className="font-semibold">{sourceDisplayName(usedId)}</span>
              {" · "}
              <BalanceBadge status={statusOf(usedId)} />
            </>
          }
        />
      )}
    </div>
  );
}
