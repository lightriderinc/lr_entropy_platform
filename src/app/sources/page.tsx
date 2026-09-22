import SourceCatalog from "@/components/sources/SourceCatalog";

const SOURCES = [
  {
    name: "ANU Quantum RNG",
    type: "Quantum optical source (photon vacuum)",
    policy: "highest-quality",
    online: true,
  },
  {
    name: "Cisco Outshift QRNG",
    type: "Cloud quantum random number generator",
    policy: "highest-quality",
    online: true,
  },
  {
    name: "IQM Resonance",
    type: "Superconducting QPU with optional error correction",
    policy: "highest-quality",
    online: true,
  },
  {
    name: "Inmetro Beacon",
    type: "Public randomness beacon (Brazil)",
    policy: "fastest",
    online: true,
  },
  {
    name: "NIST Beacon",
    type: "Public randomness beacon (US)",
    policy: "fastest",
    online: true,
  },

  {
    name: "RDSEED",
    type: "CPU hardware entropy pool",
    policy: "fastest",
    online: true,
  },
];

export default function SourcesPage() {
  return (
    <div>
      <div className="mb-12">
        <h1 className="text-2xl font-semibold text-gray-700 mb-2">
          Entropy Sources
        </h1>
        <p className="text-sm text-gray-500">
          Verified quantum & classical entropy sources.
        </p>
      </div>
      <SourceCatalog sources={SOURCES} />
    </div>
  );
}
