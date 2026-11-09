"use client";

import LRButton from "@/components/ui/LRButton";
import { useState } from "react";

/**
 * Payment method card for Payment & History. Same frame as the cloud
 * platform's PaymentMethodCard. The Stripe customer belongs to the Light Rider
 * account behind the shared wallet, so "Manage billing" asks this app's
 * /api/billing/portal (which asks Light Rider Cloud) for a Stripe Customer
 * Portal session and opens it here; Stripe returns to this page.
 */
export default function PaymentMethodCard() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) throw new Error(data.error ?? `Request failed (${res.status}).`);
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setLoading(false);
    }
  }

  return (
    <div className="default-radius border border-gray-50 bg-gray-50 p-4">
      <h2 className="mb-2 font-semibold text-gray-800">Payment method</h2>
      <p className="text-sm text-gray-600">
        Payments are processed by Stripe through your Light Rider account, so your payment method and
        invoices are the same across all Light Rider platforms.
      </p>
      <div className="flex flex-col gap-3 mt-6">
        <p className="text-sm text-gray-600">
          Update your payment method or view invoices in the billing portal.
        </p>
        <div className="flex flex-col gap-1">
          <div className="flex">
            <LRButton type="button" variant="secondary" onClick={handleClick} disabled={loading}>
              {loading ? "Loading…" : "Manage billing"}
            </LRButton>
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
      </div>
    </div>
  );
}
