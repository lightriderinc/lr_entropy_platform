"use client";

import { useState } from "react";

const TIERS = [
  { id: "fastest", label: "Fastest", desc: "Low-latency local and public beacon sources.", pool: "pool_fastest" },
  { id: "highest_quality", label: "Highest quality", desc: "Vetted high-rate quantum optical and cloud QPU sources.", pool: "pool_highest_quality" },
];

type Receipt = {
  request_id: string;
  policy: string;
  pool_id: string;
  quality_score: number;
  rct_pass: boolean;
  apt_pass: boolean;
  extractor_alg: string;
  drbg_alg: string;
  signature_alg: string;
  signature: string;
  timestamp_unix_ns: number;
};

type Result = { bytes_hex: string; receipt: Receipt };

export default function EntropyPage() {
  const [tier, setTier] = useState(TIERS[0]);
  const [bytes, setBytes] = useState(32);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function request() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`/api/entropy?pool=${tier.pool}&bytes=${bytes}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? `Error ${res.status}`);
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="animate-fade-in-up max-w-2xl pb-12">

      <div className="pb-6 mb-8 border-b border-gray-100">
        <h1 className="text-2xl font-semibold text-gray-700 mb-2">Entropy</h1>
        <p className="text-sm text-gray-500">
          Request verified quantum random bytes. Every draw is health-tested and signed.
        </p>
      </div>

      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Quality tier</p>
      <div className="grid grid-cols-2 gap-3 mb-8">
        {TIERS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTier(t)}
            className={`text-left p-4 rounded-xl border transition-all ${
              tier.id === t.id
                ? "border-blue-400 bg-blue-50"
                : "border-gray-100 bg-white hover:border-gray-200"
            }`}
          >
            <p className="text-sm font-medium text-gray-700 mb-1">{t.label}</p>
            <p className="text-xs text-gray-400">{t.desc}</p>
          </button>
        ))}
      </div>

      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">How many bytes?</p>
      <div className="flex gap-2 items-center flex-wrap mb-8">
        {[16, 32, 64, 128, 256].map((n) => (
          <button
            key={n}
            onClick={() => setBytes(n)}
            className={`px-4 py-1.5 rounded-lg border text-sm transition-all ${
              bytes === n
                ? "border-blue-400 text-blue-600 bg-blue-50"
                : "border-gray-200 text-gray-500 hover:border-gray-300"
            }`}
          >
            {n}
          </button>
        ))}
        <input
          type="number"
          min={1}
          max={4096}
          value={bytes}
          onChange={(e) => setBytes(Number(e.target.value))}
          className="w-20 px-3 py-1.5 text-sm border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:border-blue-400"
        />
        <span className="text-sm text-gray-400">bytes</span>
      </div>

      <button
        onClick={request}
        disabled={loading}
        className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white text-sm font-medium px-6 py-2.5 rounded-lg mb-8 transition-colors"
      >
        {loading ? "Requesting…" : "Request entropy"}
      </button>

      {error && (
        <div className="mb-6 px-4 py-3 rounded-lg border border-red-100 bg-red-50 text-sm text-red-600">
          {error}
        </div>
      )}

      {result && (
        <div className="border border-gray-100 rounded-xl overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Random bytes</p>
            <p className="font-mono text-sm text-gray-700 break-all leading-relaxed">{result.bytes_hex}</p>
          </div>
          <div className="p-5">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-4">Receipt</p>
            {[
              { k: "Request ID", v: result.receipt.request_id },
              { k: "Policy", v: result.receipt.policy },
              { k: "Pool", v: result.receipt.pool_id },
              { k: "Algorithm", v: `${result.receipt.extractor_alg} + ${result.receipt.drbg_alg}` },
              { k: "Quality score", v: `${result.receipt.quality_score} / 100` },
              { k: "Health checks", v: `${result.receipt.rct_pass ? "✓ RCT" : "✗ RCT"}  ${result.receipt.apt_pass ? "✓ APT" : "✗ APT"}` },
              { k: "Signature", v: `${result.receipt.signature_alg} — ${result.receipt.signature.slice(0, 24)}…` },
            ].map((row) => (
              <div key={row.k} className="flex justify-between items-start py-2 border-t border-gray-50 first:border-t-0">
                <span className="text-sm text-gray-400 shrink-0 w-32">{row.k}</span>
                <span className="text-sm text-gray-700 text-right break-all font-mono ml-4">{row.v}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}