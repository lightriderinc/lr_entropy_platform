"use client";

import { useCallback, useEffect, useState } from "react";
import { formatTokens } from "@/lib/entropy/pricing";
import { sourceDisplayName } from "@/lib/entropy/modes";
import ReceiptDetail from "./ReceiptDetail";
import { MODE_LABELS, STATUS_LABELS } from "./labels";

type Row = {
  drawId: string;
  createdAt: string;
  mode: string;
  bytes: number;
  costTokens: number;
  status: string;
  requestId: string | null;
  poolId: string | null;
  contributingSources: string[];
};

type Page = { rows: Row[]; nextCursor: string | null; pools: string[] | null };

async function fetchPage(params: { cursor?: string | null; mode: string; pool: string }): Promise<Page> {
  const q = new URLSearchParams();
  if (params.cursor) q.set("cursor", params.cursor);
  if (params.mode) q.set("mode", params.mode);
  if (params.pool) q.set("pool", params.pool);
  const res = await fetch(`/api/receipts?${q}`, { cache: "no-store" });
  if (!res.ok) throw new Error(String(res.status));
  return res.json();
}

const selectClass =
  "default-radius border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-[var(--brand-primary)]";

/** The signed-in user's receipts: newest first, filterable, paged. */
export default function ReceiptsBrowser({ initialRequestId }: { initialRequestId: string | null }) {
  const [mode, setMode] = useState("");
  const [pool, setPool] = useState("");
  const [pools, setPools] = useState<string[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [next, setNext] = useState<string | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [loadingMore, setLoadingMore] = useState(false);
  const [open, setOpen] = useState<string | null>(initialRequestId);

  const load = useCallback((m: string, p: string) => {
    fetchPage({ mode: m, pool: p })
      .then((page) => {
        setRows(page.rows);
        setNext(page.nextCursor);
        if (page.pools) setPools(page.pools);
        setState("ready");
      })
      .catch(() => setState("error"));
  }, []);

  useEffect(() => {
    load("", "");
  }, [load]);

  function applyFilter(nextMode: string, nextPool: string) {
    setMode(nextMode);
    setPool(nextPool);
    setState("loading");
    load(nextMode, nextPool);
  }

  async function loadMore() {
    if (!next) return;
    setLoadingMore(true);
    try {
      const page = await fetchPage({ cursor: next, mode, pool });
      setRows((r) => [...r, ...page.rows]);
      setNext(page.nextCursor);
    } catch {
      setState("error");
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <div className="default-radius border border-gray-50 bg-gray-50 p-5">
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-xs text-gray-500">
          Mode
          <select className={selectClass} value={mode} onChange={(e) => applyFilter(e.target.value, pool)}>
            <option value="">All modes</option>
            {Object.entries(MODE_LABELS).map(([id, label]) => (
              <option key={id} value={id}>{label}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-gray-500">
          Pool
          <select className={selectClass} value={pool} onChange={(e) => applyFilter(mode, e.target.value)}>
            <option value="">All pools</option>
            {pools.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </label>
      </div>

      {state === "loading" && <p className="mt-4 h-24 animate-pulse rounded bg-gray-200" />}
      {state === "error" && <p className="mt-4 text-sm text-[var(--brand-primary)]">Receipts could not be loaded right now.</p>}
      {state === "ready" && rows.length === 0 && (
        <p className="mt-4 text-sm text-gray-500">No receipts yet. Every draw you make is listed here with its signed receipt.</p>
      )}
      {state === "ready" && rows.length > 0 && (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-400">
                <th className="py-2 pr-3 font-medium">Time</th>
                <th className="py-2 pr-3 font-medium">Mode</th>
                <th className="py-2 pr-3 font-medium">Pool</th>
                <th className="py-2 pr-3 font-medium">Sources</th>
                <th className="py-2 pr-3 text-right font-medium">Bytes</th>
                <th className="py-2 pr-3 text-right font-medium">Charged</th>
                <th className="py-2 pr-3 font-medium">Status</th>
                <th className="py-2 font-medium" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.drawId} className="border-t border-gray-100 align-top">
                  <td className="py-2 pr-3 whitespace-nowrap text-gray-500">{new Date(r.createdAt).toLocaleString()}</td>
                  <td className="py-2 pr-3 text-gray-700">{MODE_LABELS[r.mode] ?? r.mode}</td>
                  <td className="py-2 pr-3 font-mono text-xs text-gray-600">{r.poolId ?? "—"}</td>
                  <td className="py-2 pr-3 text-gray-600">
                    {r.contributingSources.length > 0 ? r.contributingSources.map(sourceDisplayName).join(", ") : "—"}
                  </td>
                  <td className="py-2 pr-3 text-right text-gray-700">{r.bytes.toLocaleString()}</td>
                  <td className="py-2 pr-3 text-right text-gray-700">
                    {r.status === "failed" ? "Not charged" : formatTokens(r.costTokens)}
                  </td>
                  <td className="py-2 pr-3">
                    <span
                      className={[
                        "inline-block default-radius px-1.5 py-0.5 text-xs font-medium",
                        r.status === "failed" ? "bg-gray-100 text-gray-600" : "bg-green-50 text-green-700",
                      ].join(" ")}
                    >
                      {STATUS_LABELS[r.status] ?? r.status}
                    </span>
                  </td>
                  <td className="py-2 text-right">
                    {r.requestId ? (
                      <button
                        type="button"
                        onClick={() => setOpen(r.requestId)}
                        className="text-sm font-medium text-blue-600 hover:text-[var(--brand-primary)] cursor-pointer"
                      >
                        View
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400">No receipt</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {next && state === "ready" && (
        <button
          type="button"
          onClick={loadMore}
          disabled={loadingMore}
          className="mt-3 text-sm font-medium text-blue-600 hover:text-[var(--brand-primary)] cursor-pointer"
        >
          {loadingMore ? "Loading…" : "Load more"}
        </button>
      )}

      {open && <ReceiptDetail requestId={open} onClose={() => setOpen(null)} />}
    </div>
  );
}
