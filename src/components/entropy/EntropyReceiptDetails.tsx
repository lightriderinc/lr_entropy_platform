"use client";

import type { ReactNode } from "react";
import CopyButton from "@/components/ui/CopyButton";
import type { EntropyResult } from "@/lib/entropy/generate";

function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <p className="mb-0.5 text-xs text-gray-400">{label}</p>
      <p className="break-all font-medium text-gray-800 text-sm">{value}</p>
    </div>
  );
}

function PassBadge({ pass }: { pass: boolean }) {
  return (
    <span
      className={[
        "inline-block default-radius px-1.5 py-0.5 text-xs font-medium",
        pass ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700",
      ].join(" ")}
    >
      {pass ? "Pass" : "Fail"}
    </span>
  );
}

function formatIssuedAt(timestampUnixNs: number): string {
  if (!timestampUnixNs) return "—";
  return new Date(timestampUnixNs / 1_000_000).toLocaleString();
}

export default function EntropyReceiptDetails({ result }: { result: EntropyResult }) {
  const r = result.receipt;

  return (
    <div className="space-y-4">
      <div className="default-radius border border-gray-100 bg-gray-50 p-4">
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <Field label="Source" value={result.sourceName} />
          <Field label="Bytes" value={result.bytes} />
          <Field label="Policy" value={r.policy} />
          <Field label="Pool" value={r.pool_id} />
          <Field label="Extractor" value={r.extractor_alg} />
          <Field label="DRBG" value={r.drbg_alg} />
          <Field label="Quality score" value={r.quality_score} />
          <Field
            label="Health gates"
            value={
              <span className="flex gap-2">
                <span>RCT <PassBadge pass={r.rct_pass} /></span>
                <span>APT <PassBadge pass={r.apt_pass} /></span>
              </span>
            }
          />
          <Field label="Input min-entropy" value={`${r.input_min_entropy_bits} bits`} />
          <Field label="Issued at" value={formatIssuedAt(r.timestamp_unix_ns)} />
          <Field label="Request ID" value={r.request_id} />
          <Field label="Audit event" value={r.audit_event_id} />
        </div>
        <div className="mt-3 border-t border-gray-100 pt-3">
          <div className="mb-1 flex items-center justify-between">
            <p className="text-xs text-gray-400">Signature ({r.signature_alg})</p>
            <CopyButton value={r.signature} />
          </div>
          <p className="break-all font-mono text-xs text-gray-600">{r.signature}</p>
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-bold text-gray-700">Entropy output</p>
          <CopyButton value={result.value} />
        </div>
        <div className="default-radius overflow-x-auto border border-gray-800 bg-gray-800 p-4">
          <p className="break-all font-mono text-xs leading-relaxed text-green-300">
            {result.value}
          </p>
        </div>
      </div>
    </div>
  );
}
