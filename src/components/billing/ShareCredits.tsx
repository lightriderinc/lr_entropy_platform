"use client";

import InfoBox from "@/components/InfoBox";
import WarningBox from "@/components/WarningBox";
import LRButton from "@/components/ui/LRButton";
import ModalShell from "@/components/ui/ModalShell";
import { beginProtectedWork } from "@/lib/auth/protected-work";
import {
  MAX_TRANSFER_ROWS,
  type TransferBatchOk,
  type TransferErrorCode,
  type TransferRowInput,
  type TransferRowResult,
} from "@/lib/billing/transferTypes";
import { refreshWallet, useWallet } from "@/lib/billing/walletStore";
import { formatCredits } from "@/lib/entropy/pricing";
import { useCallback, useEffect, useState } from "react";
import { MdAdd, MdArrowOutward, MdClose } from "react-icons/md";

/**
 * Send credits to one or more Light Rider users by email. Ported from the
 * cloud platform's ShareCredits: same form, review step and per-row results.
 *
 * Transfers are final (no pending/accept step, no way to pull them back), so
 * the submit goes through a review step listing every recipient and the total
 * before anything is sent. Amounts are whole credits (1 credit = 1 cent).
 *
 * Talks only to this app's /api/billing/transfers. Which backend actually
 * moves the credits is decided server-side (lib/billing/transfers.ts); while
 * none is enabled, `canSend` is false and the form is shown read-only.
 */

type FormRow = { id: string; email: string; amount: string };

type Failure = { code: TransferErrorCode; message: string; rows?: TransferRowResult[] };

function blankRow(): FormRow {
  return { id: crypto.randomUUID(), email: "", amount: "" };
}

async function postBatch(rows: TransferRowInput[], idempotencyKey: string): Promise<TransferBatchOk> {
  const res = await fetch("/api/billing/transfers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rows, idempotencyKey }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const failure: Failure = {
      code: (data.error as TransferErrorCode) ?? "error",
      message: data.message ?? data.error ?? `Request failed (${res.status}).`,
      rows: data.rows,
    };
    throw failure;
  }
  return data as TransferBatchOk;
}

export default function ShareCredits({
  canSend,
  cloudShareUrl,
}: {
  canSend: boolean;
  /** Cloud's Share Credits page, offered while sending is unavailable here. */
  cloudShareUrl: string | null;
}) {
  const wallet = useWallet();
  const [rows, setRows] = useState<FormRow[]>([blankRow()]);
  // Set when the user asks to send; cleared on edit or completion. Doubles as
  // the idempotency key, so a double-click on confirm reuses it.
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<TransferBatchOk | null>(null);
  const [failure, setFailure] = useState<Failure | null>(null);

  const ready = wallet.status === "ready" && !wallet.data.disabled;
  const balanceCents = ready ? wallet.data.balanceCents : 0;

  const parsed = rows.map((row) => ({ ...row, credits: row.amount === "" ? null : Number(row.amount) }));
  const filled = parsed.filter((row) => row.email.trim() !== "" && row.credits !== null && row.credits > 0);
  const totalCents = filled.reduce((sum, row) => sum + (row.credits ?? 0), 0);
  const isOverBalance = totalCents > balanceCents;

  // Mirrors cloud's server-side dedupe, so the review shows exactly what will happen.
  const payload: TransferRowInput[] = (() => {
    const merged = new Map<string, TransferRowInput>();
    for (const row of filled) {
      const email = row.email.trim();
      const key = email.toLowerCase();
      const existing = merged.get(key);
      if (existing) existing.credits += row.credits as number;
      else merged.set(key, { email, credits: row.credits as number });
    }
    return [...merged.values()];
  })();

  const canReview =
    canSend &&
    ready &&
    filled.length > 0 &&
    filled.length === rows.filter((r) => r.email.trim() !== "").length &&
    !isOverBalance &&
    !sending;

  // Hold off the silent SSO check (a full-page reload) while a batch is being
  // filled in, reviewed or sent.
  const busy = payload.length > 0 || pendingKey !== null || sending;
  useEffect(() => (busy ? beginProtectedWork() : undefined), [busy]);

  function clearLastResult() {
    setResult(null);
    setFailure(null);
    setPendingKey(null);
  }

  function updateRow(id: string, patch: Partial<FormRow>) {
    clearLastResult();
    setRows((current) => current.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }

  function handleAmountChange(id: string, value: string) {
    if (value !== "" && !/^\d+$/.test(value)) return;
    updateRow(id, { amount: value });
  }

  function addRow() {
    clearLastResult();
    setRows((current) => (current.length >= MAX_TRANSFER_ROWS ? current : [...current, blankRow()]));
  }

  function removeRow(id: string) {
    clearLastResult();
    setRows((current) => (current.length === 1 ? current : current.filter((row) => row.id !== id)));
  }

  function handleReview(e: React.FormEvent) {
    e.preventDefault();
    if (!canReview) return;
    setPendingKey(crypto.randomUUID());
  }

  async function handleConfirm() {
    if (!pendingKey || sending) return;
    setSending(true);
    try {
      const ok = await postBatch(payload, pendingKey);
      setResult(ok);
      setFailure(null);
      setRows([blankRow()]);
      // New balance everywhere, and TransferHistory reloads off the same store.
      void refreshWallet();
    } catch (err) {
      setFailure(
        err && typeof err === "object" && "code" in err
          ? (err as Failure)
          : { code: "error", message: "Something went wrong. Nothing was sent." },
      );
    } finally {
      setSending(false);
      setPendingKey(null);
    }
  }

  const resultRows = result?.rows ?? failure?.rows;

  return (
    <div className="flex-1 default-radius border border-gray-50 bg-gray-50 p-5">
      <div className="flex flex-row flex-wrap items-end justify-between gap-2">
        <h2 className="text-lg font-semibold text-gray-800">Send credits</h2>
        <div className="inline-flex">
          <span className="text-sm">Current balance:</span>
          {wallet.status === "loading" ? (
            <span className="ml-1 h-5 w-20 animate-pulse rounded bg-gray-200" />
          ) : (
            <span className="ml-1 text-sm font-medium">{ready ? formatCredits(balanceCents) : "—"}</span>
          )}
        </div>
      </div>

      {!canSend && (
        <div className="mt-6">
          <InfoBox>
            Sending credits from the Entropy platform isn&apos;t available yet. Your transfer history below is up to
            date.
            {cloudShareUrl && (
              <>
                {" "}
                <a
                  href={cloudShareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-0.5 font-medium text-blue-700 underline"
                >
                  Send from Light Rider Cloud <MdArrowOutward />
                </a>
              </>
            )}
          </InfoBox>
        </div>
      )}

      <form onSubmit={handleReview}>
        <fieldset disabled={!canSend} className="disabled:opacity-60">
          <div className="my-8">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Recipients</span>
              <span className="text-xs text-gray-500">
                {rows.length} of {MAX_TRANSFER_ROWS}
              </span>
            </div>

            <div className="flex flex-col gap-2">
              {rows.map((row) => (
                <div key={row.id} className="flex items-center gap-2">
                  <input
                    type="email"
                    value={row.email}
                    onChange={(e) => updateRow(row.id, { email: e.target.value })}
                    placeholder="teammate@example.com"
                    aria-label="Recipient email"
                    className="min-w-0 flex-1 default-radius border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:border-[var(--brand-primary)]"
                  />
                  <div className="relative w-36 shrink-0 sm:w-44">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={row.amount}
                      onChange={(e) => handleAmountChange(row.id, e.target.value)}
                      placeholder="500"
                      aria-label="Credits"
                      className="w-full default-radius border border-gray-300 bg-white py-2 pl-3 pr-16 text-sm focus:outline-none focus:border-[var(--brand-primary)]"
                    />
                    <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-gray-500">
                      Credits
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeRow(row.id)}
                    disabled={rows.length === 1}
                    aria-label="Remove recipient"
                    className="default-radius p-2 cursor-pointer text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <MdClose />
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addRow}
              disabled={rows.length >= MAX_TRANSFER_ROWS}
              className="mt-3 inline-flex cursor-pointer items-center gap-1 text-sm font-medium text-gray-700 transition-colors hover:text-[var(--brand-primary)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <MdAdd /> Add recipient
            </button>
          </div>

          <div className="my-4 flex flex-col default-radius bg-gray-100 p-3">
            <span className="mb-4 text-sm font-medium text-gray-300">Summary</span>
            <div className="flex flex-col gap-1 pb-4">
              <SummaryRow label="Recipients" value={String(payload.length)} />
              <SummaryRow
                label="Balance after transfer"
                value={formatCredits(balanceCents - totalCents)}
                danger={isOverBalance}
              />
            </div>
            <div className="border-t border-gray-200 pt-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Total outbound</span>
                <span className={`text-lg font-medium ${isOverBalance ? "text-red-600" : "text-gray-800"}`}>
                  {formatCredits(totalCents)}
                </span>
              </div>
            </div>
            {isOverBalance && (
              <p className="mt-2 text-xs text-red-600">
                That&apos;s {formatCredits(totalCents - balanceCents)} more than your balance of{" "}
                {formatCredits(balanceCents)}.
              </p>
            )}
          </div>

          <div className="mb-4">
            <WarningBox>Transfers can not be cancelled or reversed.</WarningBox>
          </div>

          <LRButton variant="primary" type="submit" disabled={!canReview} className="w-full">
            Review and send
          </LRButton>
        </fieldset>
      </form>

      {result && (
        <p className="mt-3 text-sm text-green-700">
          {result.replayed
            ? "This batch was already sent. Nothing was sent twice."
            : `Sent ${formatCredits(result.totalSentCents)}. Your new balance is ${formatCredits(result.senderBalanceCents)}.`}
        </p>
      )}
      {failure && <p className="mt-3 text-sm text-red-600">{failure.message}</p>}
      {resultRows && resultRows.length > 0 && <RowResults rows={resultRows} />}

      {pendingKey && (
        <ReviewModal
          rows={payload}
          totalCents={totalCents}
          balanceCents={balanceCents}
          isPending={sending}
          onConfirm={handleConfirm}
          onCancel={() => setPendingKey(null)}
        />
      )}
    </div>
  );
}

function SummaryRow({ label, value, danger = false }: { label: string; value: string; danger?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-600">{label}</span>
      <span className={`text-sm font-medium ${danger ? "text-red-600" : "text-gray-500"}`}>{value}</span>
    </div>
  );
}

/**
 * The step between "I filled in a form" and "credits moved". Closing (Esc,
 * backdrop, X) is ignored while the send is in flight so the outcome can't be
 * dismissed unseen.
 */
function ReviewModal({
  rows,
  totalCents,
  balanceCents,
  isPending,
  onConfirm,
  onCancel,
}: {
  rows: TransferRowInput[];
  totalCents: number;
  balanceCents: number;
  isPending: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const close = useCallback(() => {
    if (!isPending) onCancel();
  }, [isPending, onCancel]);

  return (
    <ModalShell title="Confirm transfer" onClose={close} maxWidth="max-w-lg">
      <div className="mt-8">
        <div className="mb-8">
          <span className="mb-2 block text-sm font-medium text-gray-600">Recipients</span>
          <ul className="mb-4 max-h-64 divide-y divide-gray-100 overflow-y-auto border-y border-gray-100">
            {rows.map((row) => (
              <li key={row.email} className="flex items-center justify-between gap-4 py-2 text-sm">
                <span className="truncate text-gray-800">{row.email}</span>
                <span className="whitespace-nowrap font-medium text-gray-800">{formatCredits(row.credits)}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mb-4 flex flex-col default-radius bg-gray-50 p-3">
          <div className="flex flex-col gap-1 pb-4">
            <SummaryRow label="Current balance" value={formatCredits(balanceCents)} />
            <SummaryRow label="Balance after" value={formatCredits(balanceCents - totalCents)} />
          </div>
          <div className="border-t border-gray-200 pt-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">
                Total to {rows.length} recipient{rows.length === 1 ? "" : "s"}
              </span>
              <span className="text-lg font-medium text-gray-800">{formatCredits(totalCents)}</span>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <WarningBox>Your transfer can not be cancelled or reversed after being sent.</WarningBox>
        </div>

        <div className="flex gap-2">
          <LRButton variant="secondary-outline" onClick={close} disabled={isPending}>
            Cancel
          </LRButton>
          <LRButton variant="primary" onClick={onConfirm} disabled={isPending} className="flex-1">
            {isPending ? "Sending..." : `Send ${formatCredits(totalCents)}`}
          </LRButton>
        </div>
      </div>
    </ModalShell>
  );
}

/** Per-row outcomes, so one bad address never hides what happened to the rest. */
function RowResults({ rows }: { rows: TransferRowResult[] }) {
  return (
    <ul className="mt-3 flex flex-col gap-2">
      {rows.map((row, i) => {
        if (row.status === "ok") {
          return (
            <li key={i} className="text-sm text-green-700">
              Sent {formatCredits(row.amountCents)} to {row.recipientEmail || row.email}.
            </li>
          );
        }
        if (row.status === "recipient_not_found") {
          return (
            <li key={i} className="default-radius border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              {row.email} doesn&apos;t have a Light Rider account yet.
            </li>
          );
        }
        if (row.status === "self_transfer") {
          return (
            <li key={i} className="text-sm text-red-600">
              {row.email} is your own address. You can&apos;t send credits to yourself.
            </li>
          );
        }
        return (
          <li key={i} className="text-sm text-red-600">
            {row.email || "This row"}: {row.message}
          </li>
        );
      })}
    </ul>
  );
}
