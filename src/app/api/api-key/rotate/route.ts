import { apiKeyRoute } from "@/lib/apiKeyRoute";
import { apiKeyAccount } from "@/lib/billing/cloudBilling";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** POST: rotate the signed-in user's API key (new key returned once; the old one stops working everywhere at once). */
export async function POST() {
  return apiKeyRoute(apiKeyAccount.rotate);
}
