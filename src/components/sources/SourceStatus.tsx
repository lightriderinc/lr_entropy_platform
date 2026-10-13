import ComingSoonTag from "@/components/ui/ComingSoonTag";
import type { DirectorySource } from "@/lib/sources/filters";

export const POLICY_LABEL: Record<string, string> = {
  "highest-quality": "Highest quality",
  "quantum-verified": "Quantum verified",
  fastest: "Fastest",
};

const POLICY_CLASS: Record<string, string> = {
  "highest-quality": "text-purple-700 border border-purple-600 bg-purple-100",
  "quantum-verified": "text-blue-700 border border-blue-600 bg-blue-50",
  fastest: "text-emerald-600 border border-emerald-600 bg-emerald-50",
};

export function PolicyTag({ policy, muted = false }: { policy: string; muted?: boolean }) {
  const cls = muted ? "text-gray-400 border border-gray-200 bg-gray-50" : POLICY_CLASS[policy] ?? POLICY_CLASS.fastest;
  return <span className={`text-xs font-medium px-2 py-0.5 rounded ${cls}`}>{POLICY_LABEL[policy] ?? policy}</span>;
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
