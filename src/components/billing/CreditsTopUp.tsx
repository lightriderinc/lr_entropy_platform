"use client";

import LRButton from "@/components/ui/LRButton";
import { useWallet } from "@/lib/billing/walletStore";
import { BYTES_PER_CREDIT, formatBytes, formatCredits } from "@/lib/entropy/pricing";
import { useState } from "react";

// Same packs, limits and unit price as the cloud platform's top-up
// (cloud_platform_nextjs src/components/billing/CreditsTopUp.tsx), so the one
// wallet is bought the same way on either platform. Layout mirrors cloud's;
// checkout goes through this app's /api/billing/checkout.
const PRESETS = [5000, 10000, 25000, 100000];
const MIN_CREDITS = 500;
const MAX_CREDITS = 1000000;
const CREDIT_PRICE_USD = 0.01;

export default function CreditsTopUp() {
  const [credits, setCredits] = useState(10000);
  const [customValue, setCustomValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wallet = useWallet();

  const customCredits = customValue === "" ? null : Number(customValue);
  const isCustomOutOfRange =
    customCredits !== null && (customCredits < MIN_CREDITS || customCredits > MAX_CREDITS);
  const priceUsd = credits * CREDIT_PRICE_USD;

  function selectPreset(value: number) {
    setCredits(value);
    setCustomValue("");
  }

  function handleCustomChange(value: string) {
    if (value !== "" && !/^\d+$/.test(value)) return;
    setCustomValue(value);
    const n = Number(value);
    if (Number.isInteger(n) && n >= MIN_CREDITS && n <= MAX_CREDITS) setCredits(n);
  }

  async function buy() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountUsd: priceUsd }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.url) throw new Error(body.error ?? `Checkout failed (${res.status}).`);
      window.location.assign(body.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout failed.");
      setBusy(false);
    }
  }

  return (
    <div className="flex-1 default-radius border border-gray-50 bg-gray-50 p-5">
      <div className="flex flex-row flex-wrap justify-between items-end gap-2">
        <h2 className="text-lg font-semibold text-gray-800">Buy credits</h2>
        <div className="inline-flex">
          <span className="text-sm">Current balance:</span>
          {wallet.status === "loading" ? (
            <span className="ml-1 h-5 w-20 animate-pulse rounded bg-gray-200" />
          ) : (
            <span className="ml-1 text-sm font-medium">
              {wallet.status === "ready" && !wallet.data.disabled
                ? formatCredits(wallet.data.balanceCents)
                : "—"}
            </span>
          )}
        </div>
      </div>

      <div className="my-8">
        <span className="mb-2 block text-sm font-medium text-gray-600">Choose an amount</span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          {PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => selectPreset(preset)}
              className={`pl-3 px-6 py-3 default-radius text-md font-medium border transition-colors cursor-pointer ${
                credits === preset && !customValue
                  ? "border-[var(--brand-primary)] bg-red-50 text-[var(--brand-primary)]"
                  : "border-gray-100 bg-white text-gray-600 hover:border-[var(--brand-primary)]"
              }`}
            >
              <div className="flex flex-col items-start">
                <span className="text-lg">{preset.toLocaleString()}</span>
                <span className="text-xs opacity-75 mb-4">Credits</span>
                <span className="text-sm">${(preset * CREDIT_PRICE_USD).toFixed(2)}</span>
              </div>
            </button>
          ))}
        </div>

        <label className="mb-1 block text-sm text-gray-600">
          Custom amount
          <div className="relative mt-1">
            <input
              type="text"
              inputMode="numeric"
              value={customValue}
              onChange={(e) => handleCustomChange(e.target.value)}
              placeholder="e.g. 30000"
              className={`w-full default-radius border bg-white py-2 pl-3 pr-16 text-sm text-gray-700 focus:outline-none focus:border-[var(--brand-primary)] ${
                isCustomOutOfRange ? "border-red-400" : "border-gray-300"
              }`}
            />
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-gray-500">
              Credits
            </span>
          </div>
        </label>
        <span className={`text-xs ${isCustomOutOfRange ? "text-red-600" : "text-gray-500"}`}>
          Enter a value between {MIN_CREDITS.toLocaleString()}-{MAX_CREDITS.toLocaleString()}
        </span>
      </div>

      <div className="flex flex-col default-radius bg-gray-100 my-4 p-3">
        <span className="text-sm font-medium mb-4 text-gray-300">Summary</span>
        <div className="flex flex-col gap-1 pb-4">
          <SummaryRow label="Credits" value={credits.toLocaleString()} />
          <SummaryRow label="Price per credit" value={`$${CREDIT_PRICE_USD}`} />
          <SummaryRow label="Entropy" value={`Up to ${formatBytes(credits * BYTES_PER_CREDIT)}`} />
        </div>
        <div className="pt-3 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Total</span>
            <span className="text-lg font-medium text-gray-800">${priceUsd.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <LRButton
          type="button"
          variant="primary"
          className="w-full"
          onClick={buy}
          disabled={busy || isCustomOutOfRange}
        >
          {busy ? "Opening checkout…" : `Buy for $${priceUsd.toFixed(2)}`}
        </LRButton>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <p className="mt-1 text-xs text-gray-500">Secure checkout by Stripe. Credits never expire.</p>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-600">{label}</span>
      <span className="text-sm font-medium text-gray-500">{value}</span>
    </div>
  );
}
