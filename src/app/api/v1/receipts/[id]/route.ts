import { apiError, authenticate, rawJson } from "@/lib/api/v1";
import { getReceipt } from "@/lib/draws/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/v1/receipts/:request_id  (Authorization: Bearer lr_live_...)
 * One of the key owner's receipts, exactly as EMS signed it. Anyone else's
 * receipt id is "not found".
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const key = await authenticate(request);
  if (key instanceof Response) return key;
  const { id } = await params;
  if (!/^[A-Za-z0-9_-]{1,100}$/.test(id)) return apiError(404, "not_found", "No such receipt.");
  let receipt;
  try {
    receipt = await getReceipt(key.userSub, id);
  } catch (err) {
    console.error("[api] receipt lookup failed:", err);
    return apiError(503, "unavailable", "The API is temporarily unavailable.");
  }
  if (!receipt) return apiError(404, "not_found", "No such receipt.");
  return rawJson(receipt.signedJson);
}
