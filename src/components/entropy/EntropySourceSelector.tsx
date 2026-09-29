"use client";

import {
  MdBlurOn, MdCellTower, MdDeveloperBoard, MdHub, MdMemory, MdScience, MdWaves,
} from "react-icons/md";
import EntropySourceCard from "./EntropySourceCard";
import { useEffect, useState } from "react";

type Source = {
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

export const SOURCES: Source[] = [
  { id: "cisco-qrng", name: "Cisco Outshift QRNG", description: "Quantum-generated random numbers from Cisco's cloud quantum service.", icon: <MdWaves /> },
  { id: "inmetro-beacon", name: "Inmetro Beacon", description: "Publicly verifiable random values from Brazil's national metrology institute.", icon: <MdCellTower /> },
  { id: "nist-beacon", name: "NIST Beacon", description: "Publicly verifiable random values from the National Institute of Standards and Technology.", icon: <MdHub /> },
  { id: "anu-qrng", name: "ANU Quantum RNG", description: "True quantum randomness from quantum vacuum fluctuations at the Australian National University.", icon: <MdBlurOn /> },
  { id: "rdseed", name: "RDSEED", description: "CSPRNG randomness seeded by the operating system entropy pool and CPU hardware sources.", icon: <MdMemory /> },
  { id: "iqm-resonance", name: "IQM Resonance", description: "Cloud superconducting quantum processor. Optionally apply QEC error correction.", icon: <MdScience /> },
];

export default function EntropySourceSelector({
  selectedId,
  onSelect,
}: {
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const [sources, setSources] = useState<Source[]>(SOURCES);

  useEffect(() => {
    fetch("/api/sources", { credentials: "include" })
      .then(r => r.json())
      .then((data: Array<{ name: string; type: string; online: boolean }>) => {
        const mapped: Source[] = data.map(s => {
          const id = NAME_TO_ID[s.name] ?? s.name.toLowerCase().replace(/\s+/g, "-");
          const fallback = SOURCES.find(f => f.id === id);
          return {
            id,
            name: s.name,
            description: fallback?.description ?? s.type,
            icon: (ICON_MAP[id] ?? <MdBlurOn />) as React.ReactElement,
          };
        });
        if (mapped.length > 0) setSources(mapped);
      })
      .catch(() => {});
  }, []);

  return (
    <div>
      <label className="block text-md font-semibold text-gray-400 mb-6">
        Entropy source
      </label>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {sources.map((source) => (
          <EntropySourceCard
            key={source.id}
            id={source.id}
            name={source.name}
            description={source.description}
            icon={source.icon}
            selected={selectedId === source.id}
            onSelect={() => onSelect(source.id)}
          />
        ))}
      </div>
    </div>
  );
}