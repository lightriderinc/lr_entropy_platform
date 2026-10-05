"use client";

import { useEffect, useMemo, useState } from "react";
import ModalShell from "@/components/ui/ModalShell";
import CopyButton from "@/components/ui/CopyButton";
import LRButton from "@/components/ui/LRButton";
import { parseReceiptLossless, verifyReceipt } from "@/lib/receipts/canonical";
import { stringify } from "lossless-json";
import { formatTokens } from "@/lib/entropy/pricing";
import { MODE_LABELS, STATUS_LABELS } from "./labels";

type Detail = {
  requestId: string;
  drawId: string;
  mode: string;
  signedJson: string;
  signingKeyFingerprint: string | null;
  verifiedAtSave: boolean;
  status: string;
  costTokens: number;
  createdAt: string;
};

type Verification =
  | { state: "idle" | "checking" }
  | { state: "done"; valid: boolean; reason: string; keyFingerprint: string; keyMatches: boolean | null };

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="mb-0.5 text-xs text-gray-400">{label}</p>
      <p className="break-all text-sm font-medium text-gray-800">{value}</p>
    </div>
  );
}

/** Nanoseconds (exact digits) -> local time, without losing precision first. */
function formatNs(ns: string): string {
  try {
    return new Date(Number(BigInt(ns) / BigInt(1_000_000))).toLocaleString();
  } catch {
    return ns;
  }
}

export default function ReceiptDetail({ requestId, onClose }: { requestId: string; onClose: () => void }) {
  const [detail, setDetail] = useState<Detail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [verification, setVerification] = useState<Verification>({ state: "idle" });

  useEffect(() => {
    let active = true;
    fetch(`/api/receipts/${encodeURIComponent(requestId)}`, { cache: "no-store" })
      .then(async (res) => {
        const body = await res.json().catch(() => ({}));
        if (!active) return;
        if (res.ok) setDetail(body as Detail);
        else setError(res.status === 404 ? "Receipt not found." : "This receipt could not be loaded.");
      })
      .catch(() => active && setError("This receipt could not be loaded."));
    return () => {
      active = false;
    };
  }, [requestId]);

  // Display only: lossless parse keeps the u64 timestamp's exact digits.
  const parsed = useMemo(() => (detail ? parseReceiptLossless(detail.signedJson) : null), [detail]);
  const pretty = useMemo(() => (parsed ? (stringify(parsed, null, 2) ?? "") : ""), [parsed]);
  const field = (k: string) => (parsed ? String(parsed[k] ?? "") : "");

  async function verify() {
    if (!detail) return;
    setVerification({ state: "checking" });
    try {
      const res = await fetch("/api/receipts/public-key", { cache: "no-store" });
      if (!res.ok) throw new Error("key");
      const key = (await res.json()) as { publicKeyHex: string; fingerprint: string };
      // The signature check itself runs here, in the browser.
      const result = verifyReceipt(detail.signedJson, key.publicKeyHex);
      setVerification({
        state: "done",
        ...result,
        keyFingerprint: key.fingerprint,
        keyMatches: detail.signingKeyFingerprint ? detail.signingKeyFingerprint === key.fingerprint : null,
      });
    } catch {
      setVerification({ state: "done", valid: false, reason: "The EMS public key could not be loaded.", keyFingerprint: "", keyMatches: null });
    }
  }

  return (
    <ModalShell title="Signed receipt" onClose={onClose} maxWidth="max-w-3xl">
      <div className="mt-4 space-y-4">
        {error && <p className="text-sm text-[var(--brand-primary)]">{error}</p>}
        {!detail && !error && <p className="h-40 animate-pulse rounded bg-gray-100" />}
        {detail && parsed && (
          <>
            <div className="default-radius border border-gray-100 bg-gray-50 p-4">
              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                <Field label="Mode" value={MODE_LABELS[detail.mode] ?? detail.mode} />
                <Field label="Status" value={STATUS_LABELS[detail.status] ?? detail.status} />
                <Field label="Pool" value={<span className="font-mono">{field("pool_id")}</span>} />
                <Field label="Policy" value={field("policy")} />
                <div className="col-span-2">
                  <Field
                    label="Contributing sources"
                    value={
                      Array.isArray(parsed.contributing_sources) && parsed.contributing_sources.length > 0
                        ? (parsed.contributing_sources as unknown[]).map(String).join(", ")
                        : "None tracked for this draw"
                    }
                  />
                </div>
                <Field label="Bytes" value={field("output_bytes")} />
                <Field label="Charged" value={formatTokens(detail.costTokens)} />
                <Field label="Input min-entropy" value={`${field("input_min_entropy_bits")} bits`} />
                <Field label="Quality score" value={field("quality_score")} />
                <Field label="Extractor" value={field("extractor_alg")} />
                <Field label="DRBG" value={field("drbg_alg")} />
                <Field label="Issued at" value={formatNs(field("timestamp_unix_ns"))} />
                <Field label="Request ID" value={<span className="font-mono text-xs">{detail.requestId}</span>} />
              </div>
            </div>

            <div className="default-radius border border-gray-100 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-gray-700">Signature ({field("signature_alg")})</p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    Checked in your browser against the public key EMS signs with.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={`/api/receipts/${encodeURIComponent(detail.requestId)}/download`}
                    className="default-radius border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:border-gray-300"
                  >
                    Download JSON
                  </a>
                  <LRButton type="button" variant="primary" onClick={verify} disabled={verification.state === "checking"}>
                    {verification.state === "checking" ? "Verifying…" : "Verify signature"}
                  </LRButton>
                </div>
              </div>
              {verification.state === "done" && (
                <div
                  role="status"
                  className={[
                    "mt-3 default-radius border p-3 text-sm",
                    verification.valid ? "border-green-200 bg-green-50 text-green-800" : "border-red-200 bg-red-50 text-red-800",
                  ].join(" ")}
                >
                  <p className="font-semibold">{verification.valid ? "Valid signature" : "Invalid signature"}</p>
                  <p className="mt-0.5 text-xs">{verification.reason}</p>
                  {verification.keyFingerprint && (
                    <p className="mt-1 break-all font-mono text-[11px] opacity-80">
                      Key fingerprint (sha256): {verification.keyFingerprint}
                      {verification.keyMatches === false && " (differs from the key recorded when this receipt was saved)"}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-700">Signed JSON</p>
                <CopyButton value={detail.signedJson} />
              </div>
              <pre className="max-h-80 overflow-auto default-radius bg-gray-800 p-4 font-mono text-xs leading-relaxed text-green-300">
                {pretty}
              </pre>
              <p className="mt-1 text-xs text-gray-400">
                The entropy bytes themselves are never stored, here or anywhere else.
              </p>
            </div>
          </>
        )}
      </div>
    </ModalShell>
  );
}
