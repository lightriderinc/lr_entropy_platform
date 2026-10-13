"use client";

import { POOL_OPTIONS } from "@/lib/entropy/modes";
import { MdLayers } from "react-icons/md";
import EntropySourceCard from "./EntropySourceCard";

export default function PoolSelector({
  selectedId,
  onSelect,
}: {
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {POOL_OPTIONS.map((pool) => (
        <EntropySourceCard
          key={pool.id}
          id={pool.id}
          name={pool.name}
          description={pool.description}
          icon={<MdLayers />}
          selected={selectedId === pool.id}
          onSelect={() => onSelect(pool.id)}
        />
      ))}
    </div>
  );
}
