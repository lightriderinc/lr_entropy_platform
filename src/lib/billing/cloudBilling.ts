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
// Developer-API draws have no user token. They forward the developer's own
// Light Rider API key (cloud's ApiKey, one per customer) as X-LR-Api-Key
// instead, and cloud resolves the wallet from that key. See apiKeyBilling()
// and resolveApiKey() below, and cloud's lib/billing/entropyInternal.ts.
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

/** Whose wallet a call acts on: the signed-in user (their token) or the owner of an API key. */
type Caller = { kind: "user" } | { kind: "apiKey"; key: string };

async function call<T>(
  method: "GET" | "POST",
  path: string,
  body?: unknown,
  caller: Caller = { kind: "user" },
  /** Statuses returned to the caller instead of thrown (e.g. 401 for a bad API key). */
  passStatuses: number[] = [],
): Promise<BillingResponse<T>> {
  if (!isBillingConfigured()) throw new BillingUnavailableError("Billing API is not configured.");
  const headers: Record<string, string> = {
    "X-Entropy-Billing-Secret": process.env.ENTROPY_BILLING_SECRET!,
    "Content-Type": "application/json",
  };
  if (caller.kind === "apiKey") {
    headers["X-LR-Api-Key"] = caller.key;
  } else {
    try {
      const token = await getAccessToken(logtoConfig, BILLING_RESOURCE);
      // TEMP DEBUG: claims only (never the token), to compare with cloud's verify().
      if (process.env.NODE_ENV !== "production") {
        try {
          const c = JSON.parse(Buffer.from(token.split(".")[1] ?? "", "base64url").toString());
          console.warn("[billing][debug] token claims: " + JSON.stringify({
            parts: token.split(".").length,
            iss: c.iss,
            aud: c.aud,
            client_id: c.client_id,
            exp: c.exp && new Date(c.exp * 1000).toISOString(),
          }));
        } catch {
          console.warn("[billing][debug] token is not a JWT (opaque), parts:", token.split(".").length);
        }
      }
      headers["X-LR-User-Authorization"] = `Bearer ${token}`;
    } catch (err) {
      // Logged (message only, never a token) so "Please sign in again" can be
      // traced: "Refresh token not found" means the session lost its refresh
      // token (Logto's "Always issue Refresh Token"); invalid_grant means a
      // revoked or reused one.
      console.warn("[billing] could not get the user's billing token:", err instanceof Error ? err.message : String(err));
      throw new ReauthRequiredError(`Could not get the user's billing token: ${String(err)}`);
    }
  }
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
  if (!passStatuses.includes(res.status) && (res.status >= 500 || res.status === 401 || res.status === 403)) {
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
  /** Entropy draw/refund rows: what was drawn. bytes/channel are null on rows that predate them. */
  entropy?: { mode: string; bytes: number | null; channel?: string | null } | null;
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

export type ResolvedApiKey = { logtoUserId?: string; keyPrefix?: string; rateLimitPerMinute?: number; error?: string; retryAfterSeconds?: number };

/**
 * Who owns a developer's Light Rider API key, counting the request against the
 * key's per-minute window (cloud does both in one statement). 200 = valid,
 * 401 = invalid or revoked, 429 = rate limited; other failures throw.
 */
export function resolveApiKey(key: string) {
  return call<ResolvedApiKey>("POST", "/api/internal/entropy/api-key/resolve", {}, { kind: "apiKey", key }, [401, 429]);
}

/**
 * Billing for developer-API draws: the same charge / settle / refund, acting on
 * the wallet of the API key's owner instead of a signed-in user's token.
 */
export function apiKeyBilling(key: string) {
  const caller: Caller = { kind: "apiKey", key };
  return {
    charge: (drawId: string, mode: string, bytes: number) =>
      call<ChargeData>("POST", "/api/internal/entropy/charge", { drawId, mode, bytes }, caller),
    settle: (drawId: string, egressRequestId: string) =>
      call<{ status?: string; error?: string }>(
        "POST",
        "/api/internal/entropy/settle",
        { drawId, egressRequestId },
        caller,
      ),
    refund: (drawId: string, reason: string) =>
      call<{ status?: string; balanceCents?: number; error?: string }>(
        "POST",
        "/api/internal/entropy/refund",
        { drawId, reason },
        caller,
      ),
  };
}
