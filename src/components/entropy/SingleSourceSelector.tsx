"use client";

import { SINGLE_SOURCE_OPTIONS, type EntropyCatalog, type SourceStatus } from "@/lib/entropy/modes";
import { use } from "react";
import { MdBlurOn } from "react-icons/md";
import EntropySourceCard from "./EntropySourceCard";

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
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {SINGLE_SOURCE_OPTIONS.map((source) => (
        <EntropySourceCard
          key={source.id}
          id={source.id}
          name={source.name}
          description={source.description}
          icon={<MdBlurOn />}
          selected={selectedId === source.id}
          badge={<SourceStateBadge status={catalog.sources.find((s) => s.source_id === source.id)} />}
          onSelect={() => onSelect(source.id)}
        />
      ))}
    </div>
  );
}
