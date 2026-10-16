"use client";

import { useCallback, useEffect, useState } from "react";
import { MdChevronRight } from "react-icons/md";
import { TbReceipt } from "react-icons/tb";
import FilterBar, { type FilterGroup } from "@/components/ui/FilterBar";
import { formatCredits } from "@/lib/entropy/pricing";
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

type FilterKey = "mode" | "pool";
type Filters = Record<FilterKey, Set<string>>;

const emptyFilters = (): Filters => ({ mode: new Set(), pool: new Set() });

async function fetchPage(params: { cursor?: string | null; filters: Filters }): Promise<Page> {
  const q = new URLSearchParams();
  if (params.cursor) q.set("cursor", params.cursor);
  params.filters.mode.forEach((m) => q.append("mode", m));
  params.filters.pool.forEach((p) => q.append("pool", p));
  const res = await fetch(`/api/receipts?${q}`, { cache: "no-store" });
  if (!res.ok) throw new Error(String(res.status));
  return res.json();
}

const HEADERS = ["Time", "Mode", "Pool", "Sources", "Bytes", "Charged", "Status", ""];

const STATUS_STYLES: Record<string, string> = {
  delivered: "bg-emerald-600 text-white",
  settled: "bg-emerald-600 text-white",
  failed: "bg-gray-100 text-gray-600",
};

function RowSkeleton() {
  return (
    <tr className="border-b border-gray-100 last:border-0">
      {HEADERS.map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 w-16 rounded bg-gray-100" />
        </td>
      ))}
    </tr>
  );
}

/** The signed-in user's receipts: newest first, filterable, paged. */
export default function ReceiptsBrowser({ initialRequestId }: { initialRequestId: string | null }) {
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [pools, setPools] = useState<string[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [next, setNext] = useState<string | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [loadingMore, setLoadingMore] = useState(false);
  const [open, setOpen] = useState<string | null>(initialRequestId);

  const load = useCallback((f: Filters) => {
    fetchPage({ filters: f })
      .then((page) => {
        setRows(page.rows);
        setNext(page.nextCursor);
        if (page.pools) setPools(page.pools);
        setState("ready");
      })
      .catch(() => setState("error"));
  }, []);

  useEffect(() => {
    load(emptyFilters());
  }, [load]);

  function applyFilters(nextFilters: Filters) {
    setFilters(nextFilters);
    setState("loading");
    load(nextFilters);
  }

  function toggleFilter(group: FilterKey, value: string) {
    const values = new Set(filters[group]);
    if (values.has(value)) {
      values.delete(value);
    } else {
      values.add(value);
    }
    applyFilters({ ...filters, [group]: values });
  }

  async function loadMore() {
    if (!next) return;
    setLoadingMore(true);
    try {
      const page = await fetchPage({ cursor: next, filters });
      setRows((r) => [...r, ...page.rows]);
      setNext(page.nextCursor);
    } catch {
      setState("error");
    } finally {
      setLoadingMore(false);
    }
  }

  const filterGroups: FilterGroup<FilterKey>[] = [
    {
      key: "mode",
      label: "Mode",
      options: Object.entries(MODE_LABELS).map(([value, label]) => ({ value, label })),
    },
    { key: "pool", label: "Pool", options: pools.map((p) => ({ value: p, label: p })) },
  ];
  const hasFilters = filters.mode.size > 0 || filters.pool.size > 0;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <span className="text-md text-gray-950">
          {state === "ready" &&
            `${rows.length}${next ? "+" : ""} ${rows.length === 1 && !next ? "Receipt" : "Receipts"}`}
        </span>
        <FilterBar
          label="Filter receipts"
          groups={filterGroups}
          filters={filters}
          onToggle={toggleFilter}
          onClearGroup={(group) => applyFilters({ ...filters, [group]: new Set() })}
          onClearAll={() => applyFilters(emptyFilters())}
        />
      </div>

      {state === "error" && (
        <p className="text-sm text-red-500">Receipts could not be loaded right now.</p>
      )}

      {state === "ready" && rows.length === 0 && (
        <div className="default-radius border border-dashed border-gray-200 bg-gray-50 p-16 text-center text-sm text-gray-500">
          <div className="mb-3 flex items-center justify-center text-6xl text-gray-200">
            <TbReceipt />
          </div>
          {hasFilters
            ? "No receipts match the selected filters."
            : "No receipts yet. Every draw you make is listed here with its signed receipt."}
        </div>
      )}

      {(state === "loading" || (state === "ready" && rows.length > 0)) && (
        <div className="overflow-x-auto default-radius border border-gray-100">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-100">
              <tr>
                {HEADERS.map((h, i) => (
                  <th
                    key={i}
                    className={[
                      "whitespace-nowrap px-4 py-2 font-medium text-gray-700",
                      h === "Bytes" || h === "Charged" ? "text-right" : "",
                    ].join(" ")}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className={state === "loading" ? "animate-pulse" : undefined}>
              {state === "loading"
                ? Array.from({ length: 5 }).map((_, i) => <RowSkeleton key={i} />)
                : rows.map((r) => (
                    <tr
                      key={r.drawId}
                      onClick={r.requestId ? () => setOpen(r.requestId) : undefined}
                      className={[
                        "border-b border-gray-100 bg-white transition-colors last:border-0",
                        r.requestId ? "cursor-pointer hover:bg-gray-50" : "",
                      ].join(" ")}
                    >
                      <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                        {new Date(r.createdAt).toLocaleString()}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span className="rounded bg-zinc-600 px-2.5 py-0.5 text-xs font-medium text-white">
                          {MODE_LABELS[r.mode] ?? r.mode}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-gray-500">
                        {r.poolId ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {r.contributingSources.length > 0
                          ? r.contributingSources.map(sourceDisplayName).join(", ")
                          : "—"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-gray-700">
                        {r.bytes.toLocaleString()}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-gray-700">
                        {r.status === "failed" ? "Not charged" : formatCredits(r.costTokens)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded px-2.5 py-0.5 text-xs font-medium ${
                            STATUS_STYLES[r.status] ?? "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {STATUS_LABELS[r.status] ?? r.status}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        {r.requestId ? (
                          <MdChevronRight className="ml-auto text-lg text-gray-400" aria-label="View receipt" />
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
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={loadMore}
            disabled={loadingMore}
            className="default-radius border border-gray-100 bg-white px-3 py-1.5 text-sm text-gray-500 transition-colors hover:bg-gray-50 cursor-pointer disabled:cursor-default"
          >
            {loadingMore ? "Loading…" : "Load more"}
          </button>
        </div>
      )}

      {open && <ReceiptDetail requestId={open} onClose={() => setOpen(null)} />}
    </div>
  );
}
