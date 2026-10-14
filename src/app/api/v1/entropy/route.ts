import { after } from "next/server";
import { apiError, authenticate, drawError, drawIdFor, rawJson } from "@/lib/api/v1";
import { apiKeyBilling, isBillingDisabledForDev } from "@/lib/billing/cloudBilling";
import { DRAW_MAX_BYTES, DRAW_MIN_BYTES, performDraw } from "@/lib/draws/performDraw";
import { getDrawForReplay } from "@/lib/draws/store";
import { resolveSourceName, sourceAliasList } from "@/lib/entropy/modes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Single source and custom pool only. The tier pools blend in host
 * randomness (hardware RNG backstops, and the pool DRBG mixes host bytes into
 * every request), so the API never offers them.
 */
const API_MODES: ReadonlySet<string> = new Set(["source", "custom"]);

/**
 * POST /api/v1/entropy
 *   Authorization: Bearer lr_live_...   (the account's Light Rider API key)
 *   Idempotency-Key: <optional, any string up to 200 printable characters>
 *   { "bytes": 1..4096, "mode": "source", "id": "anu" }
 *   { "bytes": 1..4096, "mode": "custom", "ids": ["anu", "cisco", ...] }    (2 to 8)
 * A source is named by its alias ("anu") or full id ("anu_aws_001"); the
 * receipt always carries the full id.
 *
 * 200 { request_id, bytes, bytes_hex, billing: { cost_tokens, balance_tokens }, receipt }
 * The receipt is the EMS-signed JSON exactly as stored (verify it with
 * GET /api/v1/public-key). Same flow and price as the website: 1 credit per
 * 256 bytes, charged before the draw, refunded if nothing is delivered.
 * Strict: a source that can't serve returns 503 (source_empty /
 * source_unavailable). Nothing is ever substituted.
 */
export async function POST(request: Request) {
  const key = await authenticate(request);
  if (key instanceof Response) return key;

  const body = ((await request.json().catch(() => null)) ?? {}) as Record<string, unknown>;
  const bytes = Number(body.bytes);
  if (!Number.isInteger(bytes) || bytes < DRAW_MIN_BYTES || bytes > DRAW_MAX_BYTES) {
    return apiError(400, "invalid_request", `bytes must be an integer from ${DRAW_MIN_BYTES} to ${DRAW_MAX_BYTES}.`);
  }
  const mode = String(body.mode ?? "");
  if (mode === "pool") {
    return apiError(
      400,
      "invalid_request",
      "Pools are not offered by the API (they blend in host randomness). Use mode \"source\" or \"custom\".",
    );
  }
  if (!API_MODES.has(mode)) {
    return apiError(400, "invalid_request", "mode must be \"source\" (with \"id\") or \"custom\" (with \"ids\").");
  }
  if (mode === "source" && typeof body.id !== "string") {
    return apiError(400, "invalid_request", "mode \"source\" needs \"id\": a source id from GET /api/v1/sources.");
  }
  if (mode === "custom" && !(Array.isArray(body.ids) && body.ids.every((i) => typeof i === "string"))) {
    return apiError(400, "invalid_request", "mode \"custom\" needs \"ids\": 2 to 8 source ids from GET /api/v1/sources.");
  }

  // Aliases ("anu") or full ids, resolved to full ids before anything else.
  const names = mode === "source" ? [body.id as string] : (body.ids as string[]);
  const unknown = names.filter((n) => !resolveSourceName(n));
  if (unknown.length) {
    return apiError(
      400,
      "invalid_request",
      `Unknown source ${unknown.map((n) => `'${n}'`).join(", ")}. Use one of: ${sourceAliasList().join(", ")} (or a full id from GET /api/v1/sources).`,
      { valid_sources: sourceAliasList() },
    );
  }
  const ids = names.map((n) => resolveSourceName(n)!);

  const idempotencyKey = request.headers.get("idempotency-key");
  const drawId = drawIdFor(key.userSub, idempotencyKey);
  if (!drawId) return apiError(400, "invalid_request", "Idempotency-Key must be 1 to 200 printable characters.");

  const result = await performDraw({
    userSub: key.userSub,
    drawId,
    input: mode === "source" ? { mode, id: ids[0], bytes } : { mode, ids, bytes },
    channel: "api",
    apiKeyPrefix: key.keyPrefix,
    biller: isBillingDisabledForDev() ? null : apiKeyBilling(key.key),
    allowedModes: API_MODES,
  });
  if (result.afterResponse) after(result.afterResponse);

  if (result.alreadyProcessed) {
    // A retry with the same Idempotency-Key: never drawn or charged again.
    // The bytes were returned once and are not stored; the receipt is.
    const prior = await getDrawForReplay(key.userSub, drawId).catch(() => null);
    const parts = [
      `"error":"already_processed"`,
      `"message":${JSON.stringify(
        "This Idempotency-Key was already used. Its bytes were returned once and are never stored; use a new key for new bytes.",
      )}`,
      `"status":${JSON.stringify(prior?.status ?? "unknown")}`,
    ];
    if (prior?.requestId && prior.signedJson) {
      parts.push(`"request_id":${JSON.stringify(prior.requestId)}`, `"receipt":${prior.signedJson}`);
    }
    return rawJson(`{${parts.join(",")}}`, 409);
  }

  if (result.status !== 200 || !result.signedJson) return drawError(result.status, result.body);

  const b = result.body as {
    bytes_hex?: string;
    receipt?: { request_id?: string };
    billing?: { costTokens: number; balanceTokens: number | null } | null;
  };
  const billing = b.billing ? { cost_tokens: b.billing.costTokens, balance_tokens: b.billing.balanceTokens } : null;
  return rawJson(
    `{"request_id":${JSON.stringify(b.receipt?.request_id ?? null)},"bytes":${bytes},` +
      `"bytes_hex":${JSON.stringify(b.bytes_hex ?? "")},"billing":${JSON.stringify(billing)},` +
      `"receipt":${result.signedJson}}`,
  );
}
