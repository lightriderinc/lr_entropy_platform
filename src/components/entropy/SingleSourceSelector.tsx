"use client";

import {
  COMING_SOON_SOURCES,
  SINGLE_SOURCE_OPTIONS,
  type EntropyCatalog,
  type SourceStatus,
} from "@/lib/entropy/modes";
import { use } from "react";
import { MdBlurOn } from "react-icons/md";
import EntropySourceCard from "./EntropySourceCard";

/** Live state of a source's own pool, from EMS /v1/entropy/sources. */
function SourceStateBadge({ status }: { status: SourceStatus }) {
  const [text, cls] =
    status.state === "ready"
      ? [`Ready · up to ${status.max_draw_bytes} B now`, "bg-green-50 text-green-700"]
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
}: {
  catalogPromise: Promise<EntropyCatalog>;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const catalog = use(catalogPromise);
  // Available: only sources with their OWN pool can be served alone. EMS
  // reports a source with no own ring as `unavailable`; it is not offered
  // (an empty own pool is still listed, with its refill-pending badge).
  const offered = SINGLE_SOURCE_OPTIONS.flatMap((source) => {
    const status = catalog.sources.find((s) => s.source_id === source.id);
    return status && status.state !== "unavailable" ? [{ source, status }] : [];
  });
  return (
    <div className="flex flex-col gap-2">
      {offered.length === 0 && (
        <p className="text-xs text-gray-500">No single sources are available right now.</p>
      )}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {offered.map(({ source, status }) => (
          <EntropySourceCard
            key={source.id}
            id={source.id}
            name={source.name}
            description={source.description}
            icon={<MdBlurOn />}
            selected={selectedId === source.id}
            badge={<SourceStateBadge status={status} />}
            onSelect={() => onSelect(source.id)}
          />
        ))}
        {COMING_SOON_SOURCES.map((source) => (
          <EntropySourceCard
            key={source.id}
            id={source.id}
            name={source.name}
            description={source.description}
            icon={<MdBlurOn />}
            selected={false}
            disabled
            onSelect={() => {}}
          />
        ))}
      </div>
    </div>
  );
}
