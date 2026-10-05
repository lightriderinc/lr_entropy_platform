import { NextResponse } from "next/server";
import { requireLogtoUser } from "@/lib/auth/session";
import { getReceipt } from "@/lib/draws/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/receipts/:requestId/download - the signed receipt as a JSON file,
 * byte-for-byte as EMS issued it (re-serialising would risk changing the
 * signed bytes). Someone else's receipt is a 404.
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
  const safeName = requestId.replace(/[^A-Za-z0-9_-]/g, "_");
  return new NextResponse(receipt.signedJson, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="receipt-${safeName}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
