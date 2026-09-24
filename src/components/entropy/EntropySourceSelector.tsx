"use client";

import {
  MdBlurOn,
  MdCellTower,
  MdDeveloperBoard,
  MdHub,
  MdMemory,
  MdScience,
  MdWaves,
} from "react-icons/md";
import EntropySourceCard from "./EntropySourceCard";

export const SOURCES = [
  {
    id: "cisco-qrng",
    name: "Cisco Outshift QRNG",
    description:
      "Quantum-generated random numbers from Cisco's cloud quantum service.",
    icon: <MdWaves />,
  },
  {
    id: "inmetro-beacon",
    name: "Inmetro Beacon",
    description:
      "Publicly verifiable random values from Brazil's national metrology institute.",
    icon: <MdCellTower />,
  },
  {
    id: "nist-beacon",
    name: "NIST Beacon",
    description:
      "Publicly verifiable random values from the National Institute of Standards and Technology.",
    icon: <MdHub />,
  },
  {
    id: "anu-qrng",
    name: "ANU Quantum RNG",
    description:
      "True quantum randomness from quantum vacuum fluctuations at the Australian National University.",
    icon: <MdBlurOn />,
  },
  {
    id: "rdseed",
    name: "RDSEED",
    description:
      "CSPRNG randomness seeded by the operating system entropy pool and CPU hardware sources.",
    icon: <MdMemory />,
  },
  {
    id: "iqm-resonance",
    name: "IQM Resonance",
    description:
      "Cloud superconducting quantum processor. Optionally apply QEC error correction.",
    icon: <MdScience />,
  },
  {
    id: "rigetti-cepheus",
    name: "Rigetti Cepheus-1-108Q",
    description:
      "Superconducting QPU measured on Light Rider's own Q-ENTROPY runs, pooled per chiplet and drawn as one stream.",
    icon: <MdDeveloperBoard />,
  },
];

export default function EntropySourceSelector({
  selectedId,
  onSelect,
}: {
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div>
      <label className="block text-md font-semibold text-gray-400 mb-6">
        Entropy source
      </label>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {SOURCES.map((source) => (
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
