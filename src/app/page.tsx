import Link from "next/link";

const SOURCES = [
  { name: "Cisco Outshift QRNG", type: "Cloud quantum random number generator", tier: "highest-quality", online: true },
  { name: "Inmetro Beacon", type: "Public randomness beacon — Brazil", tier: "fastest", online: true },
  { name: "NIST Beacon", type: "Public randomness beacon — US", tier: "fastest", online: true },
  { name: "ANU Quantum RNG", type: "Quantum optical source — photon vacuum", tier: "highest-quality", online: true },
  { name: "RDSEED", type: "CPU hardware entropy pool", tier: "fastest", online: true },
  { name: "IQM Resonance", type: "Cloud superconducting QPU, optional QEC error correction", tier: "highest-quality", online: true },
];

const TIER_LABEL: Record<string, string> = {
  "highest-quality": "Highest quality",
  "fastest": "Fastest",
};

export default function DashboardPage() {
  return (
    <div className="animate-fade-in-up max-w-2xl pb-12">
      <div className="pb-6 mb-8 border-b border-gray-100">
        <h1 className="text-2xl font-semibold text-gray-700 mb-2">Overview</h1>
        <p className="text-sm text-gray-500 leading-relaxed max-w-lg">
          Quantum-backed randomness for your applications. Every byte drawn here is health-tested,
          cryptographically extracted, and signed with a receipt you can verify.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-8">
        {[
          { label: "Sources active", value: "6", sub: "across 2 tiers" },
          { label: "Avg quality score", value: "89", sub: "out of 100" },
          { label: "Extraction method", value: "SHAKE-256", sub: "HMAC-DRBG-SHA-512", small: true },
        ].map((s) => (
          <div key={s.label} className="bg-gray-50 rounded-lg p-4">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">{s.label}</p>
            <p className={`font-medium text-gray-800 ${s.small ? "text-base mt-1" : "text-2xl"}`}>{s.value}</p>
            <p className="text-xs text-gray-400 mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Active sources</p>
      <div className="grid grid-cols-2 gap-3 mb-8">
        {SOURCES.map((s) => (
          <div key={s.name} className="border border-gray-100 rounded-xl p-4 bg-white">
            <div className="flex justify-between items-start mb-2">
              <p className="text-sm font-medium text-gray-700">{s.name}</p>
              <span className={`w-2 h-2 rounded-full mt-1 shrink-0 ${s.online ? "bg-emerald-500" : "bg-gray-300"}`} />
            </div>
            <p className="text-xs text-gray-400 mb-3">{s.type}</p>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              s.tier === "highest-quality" ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"
            }`}>
              {TIER_LABEL[s.tier]}
            </span>
          </div>
        ))}
      </div>

      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">How it works</p>
      <div className="grid grid-cols-4 border border-gray-100 rounded-xl overflow-hidden mb-8">
        {[
          { n: "01", title: "Collect", desc: "Raw bits arrive from real quantum and certified hardware sources." },
          { n: "02", title: "Test", desc: "Every batch passes NIST SP 800-90B health checks before being stored." },
          { n: "03", title: "Extract", desc: "Sources are combined using SHAKE-256 so no single weak source can bias the output." },
          { n: "04", title: "Deliver", desc: "You receive bytes and a signed receipt proving exactly what backed your draw." },
        ].map((step, i) => (
          <div key={step.n} className={`p-4 bg-white ${i < 3 ? "border-r border-gray-100" : ""}`}>
            <p className="text-xs text-gray-300 mb-2">{step.n}</p>
            <p className="text-sm font-medium text-gray-700 mb-2">{step.title}</p>
            <p className="text-xs text-gray-400 leading-relaxed">{step.desc}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-4 p-5 border border-gray-100 rounded-xl bg-white">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-700 mb-1">Ready to generate</p>
          <p className="text-sm text-gray-400">Pick a source and draw verified random bytes with a signed receipt.</p>
        </div>
        <Link href="/entropy" className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium px-5 py-2 rounded-lg whitespace-nowrap transition-colors">
          Go to entropy
        </Link>
      </div>
    </div>
  );
}