"use client";

import type { Source as EmsSource } from "@/lib/sources/filters";
import {
  MdBlurOn, MdCellTower, MdDeveloperBoard, MdHub, MdMemory, MdScience, MdWaves,
} from "react-icons/md";
import EntropySourceCard from "./EntropySourceCard";
import { use, useMemo } from "react";

export type EntropySource = {
  id: string;
  name: string;
  description: string;
  icon: React.ReactElement;
};

const ICON_MAP: Record<string, React.ReactElement> = {
  "cisco-qrng": <MdWaves />,
  "inmetro-beacon": <MdCellTower />,
  "nist-beacon": <MdHub />,
  "anu-qrng": <MdBlurOn />,
  "rdseed": <MdMemory />,
  "iqm-resonance": <MdScience />,
  "rigetti-cepheus": <MdDeveloperBoard />,
};

const NAME_TO_ID: Record<string, string> = {
  "Cisco Outshift QRNG": "cisco-qrng",
  "Inmetro Beacon": "inmetro-beacon",
  "NIST Beacon": "nist-beacon",
  "ANU Quantum RNG": "anu-qrng",
  "RDSEED": "rdseed",
  "IQM Resonance": "iqm-resonance",
  "Rigetti Cepheus-1-108Q": "rigetti-cepheus",
};

const DESCRIPTIONS: Record<string, string> = {
  "cisco-qrng": "Quantum-generated random numbers from Cisco's cloud quantum service.",
  "inmetro-beacon": "Publicly verifiable random values from Brazil's national metrology institute.",
  "nist-beacon": "Publicly verifiable random values from the National Institute of Standards and Technology.",
  "anu-qrng": "True quantum randomness from quantum vacuum fluctuations at the Australian National University.",
  "rdseed": "CSPRNG randomness seeded by the operating system entropy pool and CPU hardware sources.",
  "iqm-resonance": "Cloud superconducting quantum processor. Optionally apply QEC error correction.",
};

function toEntropySource(s: EmsSource): EntropySource {
  const id = NAME_TO_ID[s.name] ?? s.name.toLowerCase().replace(/\s+/g, "-");
  return {
    id,
    name: s.name,
    description: DESCRIPTIONS[id] ?? s.type,
    icon: ICON_MAP[id] ?? <MdBlurOn />,
  };
}

function SelectorLabel() {
  return (
    <label className="block text-md font-semibold text-gray-400 mb-6">
      Entropy source
    </label>
  );
}

export default function EntropySourceSelector({
  sourcesPromise,
  selectedId,
  onSelect,
}: {
  sourcesPromise: Promise<EmsSource[]>;
  selectedId: string | null;
  onSelect: (source: EntropySource) => void;
}) {
  const emsSources = use(sourcesPromise);
  const sources = useMemo(() => emsSources.map(toEntropySource), [emsSources]);

  return (
    <div>
      <SelectorLabel />
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {sources.map((source) => (
          <EntropySourceCard
            key={source.id}
            id={source.id}
            name={source.name}
            description={source.description}
            icon={source.icon}
            selected={selectedId === source.id}
            onSelect={() => onSelect(source)}
          />
        ))}
      </div>
    </div>
  );
}

export function EntropySourceSelectorSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div aria-busy="true" aria-label="Loading entropy sources">
      <SelectorLabel />
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {Array.from({ length: count }, (_, i) => (
          <div
            key={i}
            className="w-full p-4 default-radius border border-gray-100 bg-white animate-pulse"
          >
            <div className="flex items-start gap-3 pr-12">
              <span className="mt-0.5 h-5 w-5 shrink-0 rounded bg-gray-100" />
              <div className="flex-1">
                <div className="h-4 w-2/3 rounded bg-gray-100" />
                <div className="mt-2 h-3 w-full rounded bg-gray-100" />
                <div className="mt-1 h-3 w-4/5 rounded bg-gray-100" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
