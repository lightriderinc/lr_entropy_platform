import ComingSoonTag from "@/components/ui/ComingSoonTag";
import type { SourceTag } from "@/lib/entropy/modes";
import type { DirectorySource } from "@/lib/sources/filters";

const TAG_CLASS: Record<SourceTag, string> = {
  QPU: "text-purple-700 border border-purple-600 bg-purple-100",
  QRNG: "text-blue-700 border border-blue-600 bg-blue-50",
  "Hardware RNG": "text-emerald-600 border border-emerald-600 bg-emerald-50",
  Beacon: "text-amber-700 border border-amber-600 bg-amber-50",
};

export function SourceTagBadge({ tag, muted = false }: { tag: SourceTag; muted?: boolean }) {
  const cls = muted ? "text-gray-400 border border-gray-200 bg-gray-50" : TAG_CLASS[tag];
  return <span className={`text-xs font-medium px-2 py-0.5 rounded ${cls}`}>{tag}</span>;
}

function Dot({ label, dot, text }: { label: string; dot: string; text: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-medium ${text}`}>
      <span className={`h-2 w-2 rounded-full ${dot}`} />
      {label}
    </span>
  );
}

/** Coming soon / Offline / Refill pending / Online. */
export function SourceStatus({ source }: { source: DirectorySource }) {
  if (source.availability === "coming_soon") return <ComingSoonTag />;
  if (!source.online) return <Dot label="Offline" dot="bg-gray-400" text="text-gray-400" />;
  if (source.ringState === "empty") return <Dot label="Refill pending" dot="bg-amber-500" text="text-amber-700" />;
  return <Dot label="Online" dot="bg-emerald-500" text="text-emerald-700" />;
}
