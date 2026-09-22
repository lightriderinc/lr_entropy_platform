import SourceCatalog from "@/components/sources/SourceCatalog";
import StatCard from "@/components/StatCard";
import { MdGrade } from "react-icons/md";
import { TbDatabaseExport } from "react-icons/tb";

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

      <h2 className="text-xl font-bold text-gray-600 mb-4">Stats overview</h2>
      <div className="grid  grid-cols-2 sm:gird-cols-2 lg:grid-cols-3  xl:grid-cols-4 gap-4 mb-8">
        <StatCard label="Avg quality score" value="89/100" icon={<MdGrade />} />
        <StatCard
          label="Extraction method"
          value="SHAKE-256"
          sub="HMAC-DRBG-SHA-512"
          small
          icon={<TbDatabaseExport />}
        />
      </div>

      <h2 className="text-xl font-bold text-gray-600 mb-4">Source catalog</h2>
      <SourceCatalog sources={SOURCES} />
    </div>
  );
}
