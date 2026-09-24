"use client";

import CopyButton from "@/components/ui/CopyButton";
import type { EntropyResult } from "@/lib/entropy/generate";
import { useEffect, useRef, useState, type ReactNode } from "react";

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
        "inline-block rounded px-1.5 py-0.5 text-xs font-medium",
        pass ? "bg-green-50 text-green-700 border border-green-500" : "bg-red-50 text-red-700 border border-red-500",
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
              <span className="flex gap-3 mt-1">
                <span className="flex gap-1.5">RCT  <PassBadge pass={r.rct_pass} /></span>
                <span className="flex gap-1.5">APT <PassBadge pass={r.apt_pass} /></span>
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
        {/* key resets the expanded state when a new value is generated */}
        <EntropyOutput key={result.value} value={result.value} />
      </div>
    </div>
  );
}

function EntropyOutput({ value }: { value: string }) {
  const textRef = useRef<HTMLParagraphElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);

  // Re-measure on resize so the toggle only appears when the text exceeds two lines.
  useEffect(() => {
    const el = textRef.current;
    if (!el || expanded) return;
    // ResizeObserver fires once on observe, so this also covers the initial measurement.
    const observer = new ResizeObserver(() =>
      setOverflows(el.scrollHeight > el.clientHeight + 1),
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [value, expanded]);

  return (
    <div className="default-radius border border-gray-800 bg-gray-800 p-4">
      <p
        ref={textRef}
        className={[
          "break-all font-mono text-xs leading-relaxed text-green-300",
          expanded ? "" : "line-clamp-2",
        ].join(" ")}
      >
        {value}
      </p>
      {(overflows || expanded) && (
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          aria-expanded={expanded}
          className="mt-2 text-xs font-medium text-gray-300 hover:text-white"
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  );
}
