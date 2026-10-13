import { Prisma } from "@prisma/client";
import {
  isOfferedSource,
  MAX_CUSTOM_SOURCES,
  MIN_CUSTOM_SOURCES,
  POOL_OPTIONS,
  SINGLE_SOURCE_OPTIONS,
} from "@/lib/entropy/modes";
import type { BillingResponse, ChargeData } from "@/lib/billing/cloudBilling";
import { runPaidDraw, type PaidDrawResult } from "@/lib/billing/paidDraw";
import {
  createDraw,
  extractSignedReceipt,
  markDraw,
  markSettled,
  saveReceiptAndDeliver,
  type DrawMode,
} from "@/lib/draws/store";
import { creditsFor } from "@/lib/entropy/pricing";
import { EMS_EGRESS, egressHeaders, fetchMultiSources } from "@/lib/sources/egress";

// Server-only. One paid draw, shared by the website (/api/entropy, a signed-in
// click) and the developer API (/api/v1/entropy, an API key): the same
// validation, the same Available-only source rules, the same price, and the
// same charge -> draw -> save receipt -> answer -> settle / refund flow
// (lib/billing/paidDraw.ts). Only the caller's identity and how cloud is
// asked to charge differ.

export const DRAW_MIN_BYTES = 1;
export const DRAW_MAX_BYTES = 4096;

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

const EGRESS_TIMEOUT_MS = 25_000;

interface EgressCall {
  path: string;
  body: Record<string, unknown>;
}

type CallError = { error: string; message: string; status: number };

/**
 * Custom pool: the user's picks, re-validated against EMS's CURRENT picker
 * list (not the list the browser saw), so a source that went offline, was
 * disabled, is a beacon/simulator, or would read the corrupted pool_fastest
 * ring is refused here even if a stale page still offers it.
 */
async function customCall(rawIds: string[], bytes: number): Promise<{ call: EgressCall } | CallError> {
  const ids = [...new Set(rawIds.map((s) => String(s).trim()).filter(Boolean))];
  if (ids.length < MIN_CUSTOM_SOURCES || ids.length > MAX_CUSTOM_SOURCES) {
    return {
      error: "invalid_request",
      message: `Pick ${MIN_CUSTOM_SOURCES}–${MAX_CUSTOM_SOURCES} different sources.`,
      status: 400,
    };
  }
  let catalog;
  try {
    catalog = await fetchMultiSources();
  } catch (err) {
    console.error("[EMS multi sources error]", err);
    return { error: "upstream_unavailable", message: "Could not check source status with EMS.", status: 502 };
  }
  for (const id of ids) {
    // Same rule as the picker: hidden and coming-soon sources are never drawn.
    if (!isOfferedSource(id)) {
      return { error: "invalid_request", message: `Source '${id}' cannot be used in a custom pool.`, status: 400 };
    }
    const entry = catalog.find((s) => s.source_id === id);
    if (!entry) return { error: "invalid_request", message: `Source '${id}' cannot be used in a custom pool.`, status: 400 };
    if (!entry.selectable) {
      const reason = entry.reason ?? "not selectable";
      return {
        error: /refill pending|own pool low/i.test(reason) ? "source_empty" : "source_unavailable",
        message: `Source '${id}' is not available: ${reason}.`,
        status: 409,
      };
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

/** How cloud is asked to charge: as the signed-in user, or as the owner of an API key. */
export type Biller = {
  charge: (drawId: string, mode: string, bytes: number) => Promise<BillingResponse<ChargeData>>;
  settle: (drawId: string, egressRequestId: string) => Promise<BillingResponse<unknown>>;
  refund: (drawId: string, reason: string) => Promise<BillingResponse<unknown>>;
};

export type DrawInput = {
  mode?: string;
  id?: string;
  ids?: string[];
  /** Source-card id (website only, mode omitted). */
  source?: string;
  bytes: number;
};

export type PerformResult = PaidDrawResult & {
  /** The stored receipt text, exactly as signed (delivered draws only). */
  signedJson?: string;
  /** The draw id was already on record: a retry of a request that was processed. */
  alreadyProcessed?: boolean;
};

/** Settle/refund with one retry. A failure is logged and left to cloud's
 * sweep, which refunds anything still unsettled after ~10 minutes. */
async function finish(
  biller: Biller,
  kind: "settle" | "refund",
  drawId: string,
  arg: string,
): Promise<boolean> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const r = kind === "settle" ? await biller.settle(drawId, arg) : await biller.refund(drawId, arg);
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
 * One draw end to end. `biller` null = billing switched off (local dev only).
 * `allowedModes` is the caller's menu: the website offers every mode and the
 * Source cards; the API offers only "source" and "custom".
 */
export async function performDraw(opts: {
  userSub: string;
  drawId: string;
  input: DrawInput;
  channel: "web" | "api";
  apiKeyPrefix?: string;
  biller: Biller | null;
  allowedModes: ReadonlySet<string>;
}): Promise<PerformResult> {
  const { userSub, drawId, input, channel, biller } = opts;
  const { bytes } = input;
  const mode = input.mode;

  // Build (and fully validate) the egress call before any money moves.
  let call: EgressCall | null;
  if (!opts.allowedModes.has(mode ?? "card")) {
    return { status: 400, body: { error: "invalid_request", message: "Unknown entropy mode or id." } };
  }
  if (mode === "custom") {
    const custom = await customCall(Array.isArray(input.ids) ? input.ids : [], bytes);
    if ("error" in custom) {
      return { status: custom.status, body: { error: custom.error, message: custom.message } };
    }
    call = custom.call;
  } else if (mode) {
    call = explicitCall(mode, String(input.id ?? ""), bytes);
  } else {
    const sourceId = input.source ?? "nist-beacon";
    const policy = POLICY_MAP[sourceId] ?? POLICY_MAP.default;
    call = { path: "/v1/entropy/request", body: { bytes, policy } };
  }
  if (!call) return { status: 400, body: { error: "invalid_request", message: "Unknown entropy mode or id." } };

  const drawMode = (mode ?? "card") as DrawMode;
  const costTokens = creditsFor(bytes);

  // Record the draw first: no row, no charge. A draw id already on record is
  // a retry of a request that was processed - never draw again for it.
  try {
    await createDraw({
      drawId,
      userSub,
      mode: drawMode,
      request: { mode: drawMode, id: input.id ?? null, ids: input.ids ?? null, source: input.source ?? null },
      bytes,
      costTokens,
      channel,
      apiKeyPrefix: opts.apiKeyPrefix,
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return {
        status: 409,
        body: { error: "draw_already_processed", message: "This draw was already processed. Generate again for new bytes." },
        alreadyProcessed: true,
      };
    }
    console.error("[draws] could not record draw:", err);
    return { status: 503, body: { error: "unavailable", message: "Entropy is temporarily unavailable. Nothing was charged." } };
  }

  // The draw id is stamped on the signed receipt, tying it to the charge.
  const egressCall = { ...call, body: { ...call.body, application_id: `entropy-site:${drawId}` } };

  let signedJson: string | undefined;
  const result = await runPaidDraw({
    billing: biller !== null,
    costTokens,
    charge: () => biller!.charge(drawId, drawMode, bytes),
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
      const signed = extractSignedReceipt(text);
      await saveReceiptAndDeliver({ drawId, userSub, mode: drawMode, signedJson: signed });
      signedJson = signed;
    },
    settle: (receiptId) => finish(biller!, "settle", drawId, receiptId),
    refund: (reason) => finish(biller!, "refund", drawId, reason),
    markRefused: (reason) => markDraw(drawId, "refused", reason),
    markFailed: (reason) => markDraw(drawId, "failed", reason),
    markSettled: () => markSettled(drawId),
  });
  return { ...result, signedJson };
}
