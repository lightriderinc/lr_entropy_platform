import SourceCard from "@/components/SourceCard";
import type { Source } from "@/lib/sources/filters";

export default function SourceGrid({ sources }: { sources: Source[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {sources.map((s) => (
        <SourceCard
          key={s.name}
          name={s.name}
          type={s.type}
          tier={s.policy}
          online={s.online}
        />
      ))}
    </div>
  );
}
