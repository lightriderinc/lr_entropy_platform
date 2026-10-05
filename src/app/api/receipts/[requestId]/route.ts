import { NextResponse } from "next/server";
import { requireLogtoUser } from "@/lib/auth/session";
import { getReceipt } from "@/lib/draws/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/receipts/:requestId - one of the signed-in user's receipts, with
 * the verbatim signed JSON. Someone else's receipt is a 404, same as none.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ requestId: string }> }) {
  let user;
  try {
    user = await requireLogtoUser();
  } catch {
    return NextResponse.json({ error: "sign_in_required" }, { status: 401 });
  }
  const { requestId } = await params;
  const receipt = await getReceipt(user.sub, requestId);
  if (!receipt) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json(receipt);
}
