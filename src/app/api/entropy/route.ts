import { Prisma } from "@prisma/client";
import { after, NextRequest, NextResponse } from "next/server";
import {
  MAX_CUSTOM_SOURCES,
  MIN_CUSTOM_SOURCES,
  POOL_OPTIONS,
  SINGLE_SOURCE_OPTIONS,
} from "@/lib/entropy/modes";
import { requireLogtoUser } from "@/lib/auth/session";
import { cloudBilling, isBillingDisabledForDev } from "@/lib/billing/cloudBilling";
import { runPaidDraw } from "@/lib/billing/paidDraw";
import {
  createDraw,
  extractSignedReceipt,
  markDraw,
  markSettled,
  saveReceiptAndDeliver,
  type DrawMode,
} from "@/lib/draws/store";
import { tokensFor } from "@/lib/entropy/pricing";
import { EMS_EGRESS, egressHeaders, fetchMultiSources } from "@/lib/sources/egress";

// Source cards (`?source=<card id>`): each card draws from the tier pool its
// source feeds; the receipt shows which pool actually served it.
const POLICY_MAP: Record<string, string> = {
   "cisco-qrng":       "highest_quality",
  "anu-qrng":         "highest_quality",
  "iqm-resonance":    "quantum_verified",
  "iqm-qec-2":        "quantum_verified",
  "iqm-qec-3":        "quantum_verified",
  "iqm-qec-4":        "quantum_verified",
  "iqm-qec-5":        "quantum_verified",
  "inmetro-beacon":   "fastest_available",
  "nist-beacon":      "fastest_available",
  "rdseed":           "fastest_available",
  // Rigetti feeds pool_quantum_verified (ems-egress/src/policy.rs), so it is
  // the one source here that does NOT route to the fastest tier.
  "rigetti-cepheus":  "quantum_verified",
  default:            "fastest_available",
};

const MIN_BYTES = 1;
const MAX_BYTES = 4096;

interface EgressCall {
  path: string;
  body: Record<string, unknown>;
}

/**
 * Custom pool: the user's picks, re-validated against EMS's CURRENT picker
 * list (not the list the browser saw), so a source that went offline, was
 * disabled, is a beacon/simulator, or would read the corrupted pool_fastest
 * ring is refused here even if a stale page still offers it.
 */
async function customCall(
  rawIds: string,
  bytes: number,
): Promise<{ call: EgressCall } | { error: string; status: number }> {
  const ids = [...new Set(rawIds.split(",").map((s) => s.trim()).filter(Boolean))];
  if (ids.length < MIN_CUSTOM_SOURCES || ids.length > MAX_CUSTOM_SOURCES) {
    return {
      error: `Pick ${MIN_CUSTOM_SOURCES}–${MAX_CUSTOM_SOURCES} different sources.`,
      status: 400,
    };
  }
  let catalog;
  try {
    catalog = await fetchMultiSources();
  } catch (err) {
    console.error("[EMS multi sources error]", err);
    return { error: "Could not check source status with EMS.", status: 502 };
  }
  for (const id of ids) {
    const entry = catalog.find((s) => s.source_id === id);
    if (!entry) return { error: `Source '${id}' cannot be used in a custom pool.`, status: 400 };
    if (!entry.selectable) {
      return { error: `Source '${id}' is not available: ${entry.reason ?? "not selectable"}.`, status: 409 };
    }
  }
  return {
    call: { path: "/v1/entropy/multi", body: { bytes, method: "cascade", source_ids: ids } },
  };
}

// Explicit modes (pool / source). Every id is checked
// against an allowlist, so the client can never steer the egress path.
function explicitCall(mode: string, id: string, bytes: number): EgressCall | null {
  if (mode === "pool") {
    const pool = POOL_OPTIONS.find((p) => p.id === id);
    return pool ? { path: "/v1/entropy/request", body: { bytes, policy: pool.policy } } : null;
  }
  if (mode === "source") {
    const source = SINGLE_SOURCE_OPTIONS.find((s) => s.id === id);
    return source
      ? { path: `/v1/entropy/source/${encodeURIComponent(source.id)}`, body: { bytes } }
      : null;
  }
  return null;
}

const DRAW_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EGRESS_TIMEOUT_MS = 25_000;

type DrawBody = {
  mode?: "pool" | "custom" | "source";
  id?: string;
  ids?: string[];
  /** Source-card id (mode omitted). */
  source?: string;
  bytes?: number;
  /** UUID the browser makes per click; the idempotency key for the charge. */
  drawId?: string;
};

const json = (body: unknown, status = 200) => NextResponse.json(body, { status });

/** Settle/refund with one retry. A failure is logged and left to cloud's
 * sweep, which refunds anything still unsettled after ~10 minutes. */
async function finish(kind: "settle" | "refund", drawId: string, arg: string): Promise<boolean> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const r = kind === "settle" ? await cloudBilling.settle(drawId, arg) : await cloudBilling.refund(drawId, arg);
      if (r.status < 300) return true;
      console.error(`[billing] ${kind} ${drawId} -> ${r.status}`, r.data);
      return false;
    } catch (err) {
      console.error(`[billing] ${kind} ${drawId} attempt ${attempt + 1} failed:`, err);
    }
  }
  return false;
}

/**
 * POST /api/entropy - one paid draw.
 *
 * Order matters: sign-in -> validate everything (including custom picks
 * against EMS's live list) -> record the draw -> runPaidDraw
 * (lib/billing/paidDraw.ts): CHARGE the shared Light Rider wallet -> draw ->
 * save the signed receipt -> return bytes -> settle; refund on ANY failure.
 * The egress is never called unless the charge succeeded, a user is never
 * charged for bytes they did not receive, and no bytes leave without a
 * stored receipt.
 * Price: 1 LR token (= 1 credit = $0.01) per 256 bytes, minimum 1.
 */
export async function POST(request: NextRequest) {
  let user;
  try {
    user = await requireLogtoUser();
  } catch {
    return json({ error: "sign_in_required", message: "Sign in to generate entropy." }, 401);
  }

  const body = ((await request.json().catch(() => null)) ?? {}) as DrawBody;
  const bytes = Number(body.bytes);
  if (!Number.isInteger(bytes) || bytes < MIN_BYTES || bytes > MAX_BYTES) {
    return json({ message: `bytes must be ${MIN_BYTES}–${MAX_BYTES}` }, 400);
  }
  const drawId = String(body.drawId ?? "");
  if (!DRAW_ID_RE.test(drawId)) return json({ message: "Missing or invalid drawId." }, 400);

  // Build (and fully validate) the egress call before any money moves.
  let call: EgressCall | null;
  const mode = body.mode;
  if (mode === "custom") {
    const custom = await customCall((body.ids ?? []).join(","), bytes);
    if ("error" in custom) return json({ message: custom.error }, custom.status);
    call = custom.call;
  } else if (mode) {
    call = explicitCall(mode, String(body.id ?? ""), bytes);
  } else {
    const sourceId = body.source ?? "nist-beacon";
    const policy = POLICY_MAP[sourceId] ?? POLICY_MAP.default;
    call = { path: "/v1/entropy/request", body: { bytes, policy } };
  }
  if (!call) return json({ message: "Unknown entropy mode or id." }, 400);

  const drawMode: DrawMode = mode ?? "card";
  const costTokens = tokensFor(bytes);

  // Record the draw first: no row, no charge. A draw id already on record is
  // a retry of a click that was processed - never draw again for it.
  try {
    await createDraw({
      drawId,
      userSub: user.sub,
      mode: drawMode,
      request: { mode: drawMode, id: body.id ?? null, ids: body.ids ?? null, source: body.source ?? null },
      bytes,
      costTokens,
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return json({ error: "draw_already_processed", message: "This draw was already processed. Generate again for new bytes." }, 409);
    }
    console.error("[draws] could not record draw:", err);
    return json({ error: "unavailable", message: "Entropy is temporarily unavailable. Nothing was charged." }, 503);
  }

  // The draw id is stamped on the signed receipt, tying it to the charge.
  const egressCall = { ...call, body: { ...call.body, application_id: `entropy-site:${drawId}` } };

  const result = await runPaidDraw({
    billing: !isBillingDisabledForDev(),
    costTokens,
    charge: () => cloudBilling.charge(drawId, drawMode, bytes, user.email),
    draw: async () => {
      try {
        const res = await fetch(`${EMS_EGRESS}${egressCall.path}`, {
          method: "POST",
          headers: egressHeaders(),
          body: JSON.stringify(egressCall.body),
          cache: "no-store",
          signal: AbortSignal.timeout(EGRESS_TIMEOUT_MS),
        });
        // Egress errors are plain text, except single-source ones, which are
        // JSON ({ error: "source_empty", source_id, message, ... }).
        const text = await res.text();
        let data: unknown;
        try { data = JSON.parse(text); } catch { data = { message: text }; }
        console.log("[EMS egress]", egressCall.path, res.status, text.slice(0, 120));
        return { res: { ok: res.ok, status: res.status }, data, text, failure: null };
      } catch (err) {
        console.error("[EMS egress error]", err);
        const timeout = err instanceof Error && err.name === "TimeoutError";
        return { res: null, data: null, text: null, failure: timeout ? "timeout" : "unreachable" };
      }
    },
    saveReceipt: async (text) => {
      await saveReceiptAndDeliver({
        drawId,
        userSub: user.sub,
        mode: drawMode,
        signedJson: extractSignedReceipt(text),
      });
    },
    settle: (receiptId) => finish("settle", drawId, receiptId),
    refund: (reason) => finish("refund", drawId, reason),
    markRefused: (reason) => markDraw(drawId, "refused", reason),
    markFailed: (reason) => markDraw(drawId, "failed", reason),
    markSettled: () => markSettled(drawId),
  });
  // Settle once the bytes are on their way (a settle that never lands is
  // refunded by cloud's sweep).
  if (result.afterResponse) after(result.afterResponse);
  return json(result.body, result.status);
}
