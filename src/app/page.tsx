import HowItWorksCard from "@/components/HowItWorksCard";
import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="animate-fade-in-up pb-12">
      <div className="mb-12">
        <h1 className="text-2xl font-semibold text-gray-700 mb-2">Getting started</h1>
        <p className="text-sm text-gray-500">
          Quantum-backed randomness for your applications.
        </p>
      </div>

      <h2 className="text-xl font-bold text-gray-600 mb-4">How it works</h2>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 mb-8">
        <HowItWorksCard
          n="01"
          title="Collect"
          desc="Raw bits arrive from real quantum and certified hardware sources."
        />
        <HowItWorksCard
          n="02"
          title="Test"
          desc="Every batch passes NIST SP 800-90B health checks before being stored."
        />
        <HowItWorksCard
          n="03"
          title="Extract"
          desc="Sources are combined using SHAKE-256 so no single weak source can bias the output."
        />
        <HowItWorksCard
          n="04"
          title="Deliver"
          desc="You receive bytes and a signed receipt proving exactly what backed your draw."
          last
        />
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
