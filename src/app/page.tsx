import InfoBox from "@/components/InfoBox";
import SourceCard from "@/components/SourceCard";
import StatCard from "@/components/StatCard";
import Link from "next/link";

const SOURCES = [
  {
    name: "ANU Quantum RNG",
    type: "Quantum optical source (photon vacuum)",
    tier: "highest-quality",
    online: true,
  },
  {
    name: "Cisco Outshift QRNG",
    type: "Cloud quantum random number generator",
    tier: "highest-quality",
    online: true,
  },
  {
    name: "IQM Resonance",
    type: "Superconducting QPU with optional error correction",
    tier: "highest-quality",
    online: true,
  },
  {
    name: "Inmetro Beacon",
    type: "Public randomness beacon (Brazil)",
    tier: "fastest",
    online: true,
  },
  {
    name: "NIST Beacon",
    type: "Public randomness beacon (US)",
    tier: "fastest",
    online: true,
  },

  {
    name: "RDSEED",
    type: "CPU hardware entropy pool",
    tier: "fastest",
    online: true,
  },
];

const STATS = [
  { label: "Sources active", value: "6", sub: "across 2 tiers" },
  { label: "Avg quality score", value: "89", sub: "out of 100" },
  {
    label: "Extraction method",
    value: "SHAKE-256",
    sub: "HMAC-DRBG-SHA-512",
    small: true,
  },
];

export default function DashboardPage() {
  return (
    <div className="animate-fade-in-up pb-12">
      <div className="mb-12">
        <h1 className="text-2xl font-semibold text-gray-700 mb-2">Overview</h1>
        <p className="text-sm text-gray-500">
          Quantum-backed randomness for your applications.
        </p>
      </div>
      <div className="mb-8">
        <InfoBox>
          Every drawn byte is health-tested, cryptographically extracted, and
          signed with a verifiable receipt.
        </InfoBox>
      </div>

      <div className="grid  grid-cols-2 sm:gird-cols-2 lg:grid-cols-3  xl:grid-cols-4 gap-4 mb-8">
        {STATS.map((s) => (
          <StatCard
            key={s.label}
            label={s.label}
            value={s.value}
            sub={s.sub}
            small={s.small}
          />
        ))}
      </div>

      <h2 className="text-xl font-bold text-gray-600 mb-4">Active sources</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
        {SOURCES.map((s) => (
          <SourceCard
            key={s.name}
            name={s.name}
            type={s.type}
            tier={s.tier}
            online={s.online}
          />
        ))}
      </div>

      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
        How it works
      </p>
      <div className="grid grid-cols-4 border border-gray-100 rounded-xl overflow-hidden mb-8">
        {[
          {
            n: "01",
            title: "Collect",
            desc: "Raw bits arrive from real quantum and certified hardware sources.",
          },
          {
            n: "02",
            title: "Test",
            desc: "Every batch passes NIST SP 800-90B health checks before being stored.",
          },
          {
            n: "03",
            title: "Extract",
            desc: "Sources are combined using SHAKE-256 so no single weak source can bias the output.",
          },
          {
            n: "04",
            title: "Deliver",
            desc: "You receive bytes and a signed receipt proving exactly what backed your draw.",
          },
        ].map((step, i) => (
          <div
            key={step.n}
            className={`p-4 bg-white ${i < 3 ? "border-r border-gray-100" : ""}`}
          >
            <p className="text-xs text-gray-300 mb-2">{step.n}</p>
            <p className="text-sm font-medium text-gray-700 mb-2">
              {step.title}
            </p>
            <p className="text-xs text-gray-400 leading-relaxed">{step.desc}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-4 p-5 border border-gray-100 rounded-xl bg-white">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-700 mb-1">
            Ready to generate
          </p>
          <p className="text-sm text-gray-400">
            Pick a source and draw verified random bytes with a signed receipt.
          </p>
        </div>
        <Link
          href="/entropy"
          className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium px-5 py-2 rounded-lg whitespace-nowrap transition-colors"
        >
          Go to entropy
        </Link>
      </div>
    </div>
  );
}
