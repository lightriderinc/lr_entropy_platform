"use client";

import LRButton from "@/components/ui/LRButton";
import { useState } from "react";

// Same packs, limits and unit price as the cloud platform's top-up
// (cloud_platform_nextjs src/components/billing/CreditsTopUp.tsx), so the one
// wallet is bought the same way on either platform.
const PRESETS = [5000, 10000, 25000, 100000];
const MIN_CREDITS = 500;
const MAX_CREDITS = 1000000;
const CREDIT_PRICE_USD = 0.01;

export default function CreditsTopUp() {
  const [credits, setCredits] = useState(10000);
  const [customValue, setCustomValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const customCredits = customValue === "" ? null : Number(customValue);
  const customOut =
    customCredits !== null && (customCredits < MIN_CREDITS || customCredits > MAX_CREDITS);
  const priceUsd = credits * CREDIT_PRICE_USD;

  function handleCustom(value: string) {
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
    <div id="buy" className="flex-1 default-radius border border-gray-50 bg-gray-50 p-5">
      <h2 className="text-lg font-semibold text-gray-800">Buy credits</h2>
      <p className="mt-1 text-sm text-gray-500">Secure checkout by Stripe. Credits never expire.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {PRESETS.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => {
              setCredits(n);
              setCustomValue("");
            }}
            className={[
              "px-3 py-2 default-radius border text-sm font-medium cursor-pointer transition-all",
              customValue === "" && credits === n
                ? "border-[var(--brand-primary)] text-[var(--brand-primary)] bg-white"
                : "border-gray-200 text-gray-700 bg-white hover:border-gray-300",
            ].join(" ")}
          >
            {n.toLocaleString()} credits
            <span className="ml-1.5 text-xs text-gray-400">${(n * CREDIT_PRICE_USD).toLocaleString()}</span>
          </button>
        ))}
      </div>
      <input
        type="text"
        inputMode="numeric"
        value={customValue}
        onChange={(e) => handleCustom(e.target.value)}
        placeholder={`Custom amount (${MIN_CREDITS.toLocaleString()}–${MAX_CREDITS.toLocaleString()} credits)`}
        className="mt-3 w-full default-radius border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-[var(--brand-primary)]"
      />
      {customOut && (
        <p className="mt-1.5 text-xs text-red-500">
          Enter between {MIN_CREDITS.toLocaleString()} and {MAX_CREDITS.toLocaleString()} credits.
        </p>
      )}
      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-sm text-gray-600">
          {credits.toLocaleString()} credits = <span className="font-semibold">${priceUsd.toLocaleString()}</span>
          <span className="ml-1 text-xs text-gray-400">
            (about {((credits * 256) / 1024).toLocaleString()} KiB of entropy)
          </span>
        </p>
        <LRButton type="button" variant="primary" onClick={buy} disabled={busy || customOut}>
          {busy ? "Opening checkout…" : "Buy credits"}
        </LRButton>
      </div>
      {error && <p className="mt-2 text-xs text-[var(--brand-primary)]">{error}</p>}
    </div>
  );
}
