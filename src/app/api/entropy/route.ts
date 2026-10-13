import { after, NextRequest, NextResponse } from "next/server";
import { requireLogtoUser } from "@/lib/auth/session";
import { cloudBilling, isBillingDisabledForDev } from "@/lib/billing/cloudBilling";
import { DRAW_MAX_BYTES, DRAW_MIN_BYTES, performDraw, type Biller } from "@/lib/draws/performDraw";

const DRAW_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** The website offers every mode, plus the Source cards ("card", mode omitted). */
const WEB_MODES: ReadonlySet<string> = new Set(["pool", "custom", "source", "card"]);

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

/**
 * POST /api/entropy - one paid draw from a signed-in click.
 *
 * Order matters: sign-in -> validate everything (including custom picks
 * against EMS's live list) -> record the draw -> runPaidDraw
 * (lib/billing/paidDraw.ts): CHARGE the shared Light Rider wallet -> draw ->
 * save the signed receipt -> return bytes -> settle; refund on ANY failure.
 * The egress is never called unless the charge succeeded, a user is never
 * charged for bytes they did not receive, and no bytes leave without a
 * stored receipt. The flow itself lives in lib/draws/performDraw.ts, shared
 * with the developer API (/api/v1/entropy).
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
  if (!Number.isInteger(bytes) || bytes < DRAW_MIN_BYTES || bytes > DRAW_MAX_BYTES) {
    return json({ message: `bytes must be ${DRAW_MIN_BYTES}–${DRAW_MAX_BYTES}` }, 400);
  }
  const drawId = String(body.drawId ?? "");
  if (!DRAW_ID_RE.test(drawId)) return json({ message: "Missing or invalid drawId." }, 400);

  const biller: Biller | null = isBillingDisabledForDev()
    ? null
    : {
        charge: (id, mode, n) => cloudBilling.charge(id, mode, n, user.email),
        settle: cloudBilling.settle,
        refund: cloudBilling.refund,
      };

  const result = await performDraw({
    userSub: user.sub,
    drawId,
    input: { mode: body.mode, id: body.id, ids: body.ids, source: body.source, bytes },
    channel: "web",
    biller,
    allowedModes: WEB_MODES,
  });
  // Settle once the bytes are on their way (a settle that never lands is
  // refunded by cloud's sweep).
  if (result.afterResponse) after(result.afterResponse);
  return json(result.body, result.status);
}
