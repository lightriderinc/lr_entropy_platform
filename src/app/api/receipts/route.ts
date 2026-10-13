import { NextRequest, NextResponse } from "next/server";
import { requireLogtoUser } from "@/lib/auth/session";
import { listReceiptPools, listReceipts } from "@/lib/draws/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/receipts?cursor=<drawId>&mode=<mode>&pool=<pool_id>
 * The signed-in user's draws with their receipts, newest first. The user is
 * the server session's Logto id; nothing from the query can widen that.
 */
export async function GET(request: NextRequest) {
  let user;
  try {
    user = await requireLogtoUser();
  } catch {
    return NextResponse.json({ error: "sign_in_required" }, { status: 401 });
  }
  const q = request.nextUrl.searchParams;
  const cursor = q.get("cursor");
  try {
    const [page, pools] = await Promise.all([
      listReceipts(user.sub, { cursor, mode: q.get("mode"), pool: q.get("pool") }),
      cursor ? Promise.resolve(null) : listReceiptPools(user.sub),
    ]);
    return NextResponse.json({ ...page, pools });
  } catch (err) {
    console.error("[receipts] list failed:", err);
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
}
