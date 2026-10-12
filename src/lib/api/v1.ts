import { createHash, randomUUID } from "crypto";
import { BillingUnavailableError, isBillingConfigured, resolveApiKey } from "@/lib/billing/cloudBilling";

// Server-only helpers for the developer API (/api/v1/*).
//
// Keys are the customer's own Light Rider API key from cloud (ApiKey, one per
// customer, made under Cloud > Settings > API Keys): the same key cloud's
// /api/lr/* accepts. This site never stores keys; it forwards them to cloud,
// which resolves the owner, enforces the per-key rate limit and charges.
//
// Every error is JSON { error: <code>, message: <text> } with a stable code:
//   400 invalid_request       401 invalid_api_key       402 insufficient_credits | credits_locked
//   404 not_found             409 already_processed     429 rate_limited
//   502 upstream_unavailable  503 source_empty | source_unavailable | billing_unavailable | unavailable

const NO_STORE = { "Cache-Control": "no-store" };

export function apiError(
  status: number,
  error: string,
  message: string,
  extra: Record<string, unknown> = {},
  headers: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify({ error, message, ...extra }), {
    status,
    headers: { "Content-Type": "application/json", ...NO_STORE, ...headers },
  });
}

/** A JSON body built from parts, so a signed receipt can be embedded byte-for-byte. */
export function rawJson(body: string, status = 200): Response {
  return new Response(body, { status, headers: { "Content-Type": "application/json", ...NO_STORE } });
}

export function okJson(body: unknown, status = 200): Response {
  return rawJson(JSON.stringify(body), status);
}

/** A request authenticated with a Light Rider API key. */
export type ApiCaller = {
  /** The key itself, forwarded to cloud for every billing call. */
  key: string;
  /** The owner's Logto id: whose draws and receipts these are. */
  userSub: string;
  keyPrefix: string;
  rateLimitPerMinute: number;
};

const KEY_RE = /^lr_(live|test)_[0-9a-f]{48}$/;

function unauthorized(message: string): Response {
  return apiError(401, "invalid_api_key", message, {}, { "WWW-Authenticate": "Bearer" });
}

/**
 * Resolves `Authorization: Bearer lr_...` to its owner through cloud, which
 * also counts the call against the key's per-minute limit. Returns the
 * caller, or the error response.
 */
export async function authenticate(request: Request): Promise<ApiCaller | Response> {
  const m = request.headers.get("authorization")?.match(/^Bearer\s+(\S+)\s*$/i);
  if (!m) return unauthorized("Send your Light Rider API key as: Authorization: Bearer lr_...");
  const key = m[1];
  if (!KEY_RE.test(key)) return unauthorized("This API key is invalid or has been revoked.");
  if (!isBillingConfigured()) return apiError(503, "unavailable", "The API is temporarily unavailable.");

  let r;
  try {
    r = await resolveApiKey(key);
  } catch (err) {
    if (!(err instanceof BillingUnavailableError)) console.error("[api] key check failed:", err);
    return apiError(503, "unavailable", "The API is temporarily unavailable.");
  }
  if (r.status === 429) {
    return apiError(429, "rate_limited", "Too many requests for this key. Slow down and retry.", {}, {
      "Retry-After": String(r.data.retryAfterSeconds ?? 60),
    });
  }
  if (r.status !== 200 || !r.data.logtoUserId || !r.data.keyPrefix) {
    return unauthorized("This API key is invalid or has been revoked.");
  }
  return {
    key,
    userSub: r.data.logtoUserId,
    keyPrefix: r.data.keyPrefix,
    rateLimitPerMinute: r.data.rateLimitPerMinute ?? 60,
  };
}

const IDEMPOTENCY_RE = /^[\x21-\x7e]{1,200}$/;

/**
 * The draw id for an API request. With an `Idempotency-Key`, it is derived
 * from (owner, idempotency key), so a retry of the same request maps to the
 * same draw and can never be charged or drawn twice - even across a key
 * rotation. Without one, a fresh id. Returns null for a malformed header.
 */
export function drawIdFor(userSub: string, idempotencyKey: string | null): string | null {
  if (idempotencyKey === null) return randomUUID();
  if (!IDEMPOTENCY_RE.test(idempotencyKey)) return null;
  const h = createHash("sha256").update(`${userSub}:${idempotencyKey}`).digest();
  h[6] = (h[6] & 0x0f) | 0x40; // version 4 layout, so it is a valid UUID
  h[8] = (h[8] & 0x3f) | 0x80;
  const x = h.subarray(0, 16).toString("hex");
  return `${x.slice(0, 8)}-${x.slice(8, 12)}-${x.slice(12, 16)}-${x.slice(16, 20)}-${x.slice(20, 32)}`;
}

/** Absolute "buy credits" link for 402 answers. */
export function buyUrl(): string {
  const base = (process.env.NEXT_BASE_URL || "").replace(/\/$/, "");
  return `${base}/settings/credits`;
}

/**
 * Maps a failed draw (performDraw / runPaidDraw body, or the egress's own
 * error passed through) to one stable API error. Strict by design: a source
 * that can't serve is an error, never a substitute.
 */
export function drawError(status: number, body: Record<string, unknown>): Response {
  const code = typeof body.error === "string" ? body.error : undefined;
  const message = String(body.message ?? "Entropy request failed.");
  const refunded = typeof body.refunded === "boolean" ? { refunded: body.refunded } : {};

  switch (code) {
    case "insufficient_credits":
    case "credits_locked":
      return apiError(402, code, message, {
        cost_tokens: body.costTokens,
        balance_tokens: body.balanceTokens,
        buy_url: buyUrl(),
      });
    case "billing_unavailable":
    case "receipt_unavailable":
    case "unavailable":
      return apiError(503, code === "receipt_unavailable" ? "unavailable" : code, message, refunded);
    case "draw_already_processed":
      return apiError(409, "already_processed", message);
    case "source_empty":
    case "source_unavailable":
      return apiError(503, code, message, { ...refunded, ...(body.source_id ? { source_id: body.source_id } : {}) });
    case "not_single_source_eligible":
    case "invalid_request":
      return apiError(400, "invalid_request", message);
    case "upstream_unavailable":
      return apiError(502, "upstream_unavailable", message, refunded);
  }
  // Plain-text egress errors (custom pool): map by meaning.
  if (/pool empty|refill pending|own pool low/i.test(message)) return apiError(503, "source_empty", message, refunded);
  if (/no live entropy|not live|disabled/i.test(message)) return apiError(503, "source_unavailable", message, refunded);
  if (status === 400) return apiError(400, "invalid_request", message, refunded);
  return apiError(502, "upstream_unavailable", message, refunded);
}
