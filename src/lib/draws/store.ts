import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { parseReceiptLossless, stringifyLossless, verifyReceipt } from "@/lib/receipts/canonical";
import { getReceiptPublicKey } from "@/lib/receipts/publicKey";

// Server-only. Draws and their signed receipts in the entropy schema.
//
// Ownership is ALWAYS the signed-in user's Logto id (`claims.sub` from the
// server session), passed in by the route - never an id from the browser.
// Every read below filters on it, so another user's draw simply isn't found.
// Entropy bytes are never written here.

export type DrawMode = "pool" | "custom" | "source" | "card";

export async function createDraw(input: {
  drawId: string;
  userSub: string;
  mode: DrawMode;
  request: Prisma.InputJsonValue;
  bytes: number;
  costTokens: number;
}): Promise<void> {
  await db.draw.create({
    data: {
      drawId: input.drawId,
      logtoUserId: input.userSub,
      mode: input.mode,
      request: input.request,
      bytes: input.bytes,
      costTokens: input.costTokens,
    },
  });
}

/** Best-effort status change for a draw that ends without a receipt. */
export async function markDraw(drawId: string, status: "refused" | "failed", reason: string): Promise<void> {
  try {
    await db.draw.update({ where: { drawId }, data: { status, failureReason: reason.slice(0, 200) } });
  } catch (err) {
    console.error(`[draws] could not mark ${drawId} ${status}:`, err);
  }
}

export async function markSettled(drawId: string): Promise<void> {
  try {
    await db.draw.updateMany({
      where: { drawId, status: "delivered" },
      data: { status: "settled", settledAt: new Date() },
    });
  } catch (err) {
    console.error(`[draws] could not mark ${drawId} settled:`, err);
  }
}

/**
 * The receipt object exactly as the egress returned it, from the raw response
 * text. Parsed losslessly and re-serialised compactly, which reproduces the
 * egress's own compact serde output - so the stored text is the signed text.
 */
export function extractSignedReceipt(egressResponseText: string): string {
  const body = parseReceiptLossless(egressResponseText);
  if (!body.receipt || typeof body.receipt !== "object") throw new Error("egress response has no receipt");
  return stringifyLossless(body.receipt);
}

/**
 * Saves the signed receipt and marks the draw delivered, in ONE transaction.
 * The route returns bytes only after this resolves; if it throws, the draw is
 * refunded and no bytes are returned.
 *
 * Verification here is a cross-check (EMS is the signer): a receipt that does
 * not verify against the EMS key is still stored, flagged
 * verified_at_save = false, and logged.
 */
export async function saveReceiptAndDeliver(input: {
  drawId: string;
  userSub: string;
  mode: DrawMode;
  signedJson: string;
}): Promise<{ requestId: string; verified: boolean }> {
  const r = parseReceiptLossless(input.signedJson);
  const str = (k: string) => {
    const v = r[k];
    if (typeof v !== "string") throw new Error(`receipt field ${k} missing`);
    return v;
  };
  const num = (k: string) => String(r[k]); // LosslessNumber -> exact digits
  const requestId = str("request_id");
  if (str("application_id") !== `entropy-site:${input.drawId}`) {
    throw new Error("receipt application_id does not match this draw");
  }

  let fingerprint: string | null = null;
  let verified = false;
  try {
    const key = await getReceiptPublicKey();
    fingerprint = key.fingerprint;
    const v = verifyReceipt(input.signedJson, key.publicKeyHex);
    verified = v.valid;
    if (!v.valid) console.error(`[receipts] ${requestId} did not verify at save: ${v.reason}`);
  } catch (err) {
    console.error(`[receipts] EMS public key unavailable while saving ${requestId}:`, err);
  }

  const sources = Array.isArray(r.contributing_sources)
    ? (r.contributing_sources as unknown[]).map(String)
    : [];

  await db.$transaction([
    db.receipt.create({
      data: {
        requestId,
        drawId: input.drawId,
        logtoUserId: input.userSub,
        signedJson: input.signedJson,
        mode: input.mode,
        policy: str("policy"),
        poolId: str("pool_id"),
        contributingSources: sources,
        outputBytes: Number(num("output_bytes")),
        signatureAlg: str("signature_alg"),
        timestampUnixNs: BigInt(num("timestamp_unix_ns")),
        signingKeyFingerprint: fingerprint,
        verifiedAtSave: verified,
      },
    }),
    db.draw.update({
      where: { drawId: input.drawId },
      data: { status: "delivered", deliveredAt: new Date(), egressRequestId: requestId },
    }),
  ]);
  return { requestId, verified };
}

// ---------------------------------------------------------------------------
// Receipts page reads (always scoped to one user)
// ---------------------------------------------------------------------------

export const RECEIPTS_PAGE_SIZE = 25;

/** Draws a user would expect to see: delivered/settled, and charged-then-refunded. */
const LISTED_STATUSES = ["delivered", "settled", "failed"];

export type ReceiptRow = {
  drawId: string;
  createdAt: string;
  mode: string;
  bytes: number;
  costTokens: number;
  status: string;
  requestId: string | null;
  poolId: string | null;
  contributingSources: string[];
};

export async function listReceipts(
  userSub: string,
  opts: { cursor?: string | null; mode?: string | null; pool?: string | null },
): Promise<{ rows: ReceiptRow[]; nextCursor: string | null }> {
  const where: Prisma.DrawWhereInput = {
    logtoUserId: userSub,
    status: { in: LISTED_STATUSES },
    ...(opts.mode ? { mode: opts.mode } : {}),
    ...(opts.pool ? { receipt: { is: { poolId: opts.pool, logtoUserId: userSub } } } : {}),
  };
  // The cursor is a draw id; only honoured if it is one of this user's draws.
  const cursorOk =
    opts.cursor &&
    (await db.draw.findFirst({ where: { drawId: opts.cursor, logtoUserId: userSub }, select: { drawId: true } }));

  const draws = await db.draw.findMany({
    where,
    orderBy: [{ createdAt: "desc" }, { drawId: "desc" }],
    take: RECEIPTS_PAGE_SIZE + 1,
    ...(cursorOk ? { cursor: { drawId: opts.cursor! }, skip: 1 } : {}),
    include: { receipt: { select: { requestId: true, poolId: true, contributingSources: true } } },
  });
  const page = draws.slice(0, RECEIPTS_PAGE_SIZE);
  return {
    rows: page.map((d) => ({
      drawId: d.drawId,
      createdAt: d.createdAt.toISOString(),
      mode: d.mode,
      bytes: d.bytes,
      costTokens: d.costTokens,
      status: d.status,
      requestId: d.receipt?.requestId ?? null,
      poolId: d.receipt?.poolId ?? null,
      contributingSources: d.receipt?.contributingSources ?? [],
    })),
    nextCursor: draws.length > RECEIPTS_PAGE_SIZE ? page[page.length - 1].drawId : null,
  };
}

/** Pools this user has receipts from, for the filter. */
export async function listReceiptPools(userSub: string): Promise<string[]> {
  const rows = await db.receipt.groupBy({ by: ["poolId"], where: { logtoUserId: userSub }, orderBy: { poolId: "asc" } });
  return rows.map((r) => r.poolId);
}

/** One of this user's receipts, or null (also for someone else's). */
export async function getReceipt(userSub: string, requestId: string) {
  const r = await db.receipt.findFirst({
    where: { requestId, logtoUserId: userSub },
    include: { draw: { select: { status: true, costTokens: true, bytes: true, createdAt: true } } },
  });
  if (!r) return null;
  return {
    requestId: r.requestId,
    drawId: r.drawId,
    mode: r.mode,
    signedJson: r.signedJson,
    signingKeyFingerprint: r.signingKeyFingerprint,
    verifiedAtSave: r.verifiedAtSave,
    status: r.draw.status,
    costTokens: r.draw.costTokens,
    createdAt: r.createdAt.toISOString(),
  };
}
