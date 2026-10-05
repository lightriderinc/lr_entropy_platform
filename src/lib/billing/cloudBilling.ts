import { getAccessToken } from "@logto/next/server-actions";
import { logtoConfig } from "@/app/logto";
import { BillingUnavailableError, ReauthRequiredError } from "./errors";

// Server-only client for the cloud platform's billing API
// (cloud_platform_nextjs /api/internal/entropy/*), which owns the ONE wallet
// shared across Light Rider platforms. Never import from a client component:
// it holds ENTROPY_BILLING_SECRET.
//
// Every call carries:
//   X-Entropy-Billing-Secret: <ENTROPY_BILLING_SECRET> - proves this app is
//     calling; the same value is set in both Vercel projects, one value per
//     environment. Cloud checks it first, in constant time.
//   X-LR-User-Authorization: Bearer <token>  - the signed-in user's Logto
//     access token for the billing API resource; cloud takes the user id
//     (`sub`) from it, so the wallet is resolved from a token Logto signed,
//     never from anything we assert.
//
// Environments never cross: CLOUD_BILLING_URL points at cloud prod from
// entropy prod, and at cloud preview/dev from entropy preview/dev.

const CALL_TIMEOUT_MS = 10_000;

export const BILLING_RESOURCE = process.env.LOGTO_BILLING_API_RESOURCE || "";

export function isBillingConfigured(): boolean {
  return Boolean(
    /^https?:\/\//.test(process.env.CLOUD_BILLING_URL ?? "") &&
      BILLING_RESOURCE &&
      process.env.ENTROPY_BILLING_SECRET,
  );
}

/**
 * Local development without the billing setup: draws are free ONLY when
 * ENTROPY_BILLING=off AND this is not a Vercel production deployment. In
 * every other case an unconfigured billing API fails closed (no free draws).
 */
export function isBillingDisabledForDev(): boolean {
  return process.env.ENTROPY_BILLING === "off" && process.env.VERCEL_ENV !== "production";
}

export { BillingUnavailableError, ReauthRequiredError };

export type BillingResponse<T> = { status: number; data: T };

async function call<T>(method: "GET" | "POST", path: string, body?: unknown): Promise<BillingResponse<T>> {
  if (!isBillingConfigured()) throw new BillingUnavailableError("Billing API is not configured.");
  let userToken: string;
  try {
    userToken = await getAccessToken(logtoConfig, BILLING_RESOURCE);
  } catch (err) {
    throw new ReauthRequiredError(`Could not get the user's billing token: ${String(err)}`);
  }
  const headers: Record<string, string> = {
    "X-Entropy-Billing-Secret": process.env.ENTROPY_BILLING_SECRET!,
    "X-LR-User-Authorization": `Bearer ${userToken}`,
    "Content-Type": "application/json",
  };
  // Cloud preview deployments behind Vercel Deployment Protection.
  const bypass = process.env.CLOUD_VERCEL_PROTECTION_BYPASS;
  if (bypass) headers["x-vercel-protection-bypass"] = bypass;

  let res: Response;
  try {
    res = await fetch(`${process.env.CLOUD_BILLING_URL!.replace(/\/$/, "")}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(CALL_TIMEOUT_MS),
    });
  } catch (err) {
    throw new BillingUnavailableError(`Billing API unreachable: ${String(err)}`);
  }
  const data = (await res.json().catch(() => ({}))) as T;
  if (res.status >= 500 || res.status === 401 || res.status === 403) {
    throw new BillingUnavailableError(`Billing API ${path} returned ${res.status}: ${JSON.stringify(data)}`);
  }
  return { status: res.status, data };
}

export type ChargeData = {
  status?: "charged";
  error?: "insufficient_credits" | "credits_locked" | "invalid" | "conflict";
  message?: string;
  amountCents: number;
  balanceCents: number;
  replayed?: boolean;
  chargeStatus?: string;
};

export type WalletEntry = {
  id: string;
  amountCents: number;
  reason: string;
  counterpartyEmail: string | null;
  createdAt: string;
};
export type WalletData = {
  balanceCents: number;
  unlocked: boolean;
  entries: WalletEntry[];
  nextCursor: string | null;
};

export const cloudBilling = {
  charge: (drawId: string, mode: string, bytes: number, email?: string) =>
    call<ChargeData>("POST", "/api/internal/entropy/charge", { drawId, mode, bytes, email }),
  settle: (drawId: string, egressRequestId: string) =>
    call<{ status?: string; error?: string }>("POST", "/api/internal/entropy/settle", { drawId, egressRequestId }),
  refund: (drawId: string, reason: string) =>
    call<{ status?: string; balanceCents?: number; error?: string }>("POST", "/api/internal/entropy/refund", {
      drawId,
      reason,
    }),
  wallet: (cursor?: string | null) =>
    call<WalletData>("GET", `/api/internal/entropy/wallet${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ""}`),
  checkout: (amountUsd: number, returnOrigin: string, email?: string) =>
    call<{ url?: string; error?: string }>("POST", "/api/internal/entropy/checkout", {
      amountUsd,
      returnOrigin,
      email,
    }),
};
