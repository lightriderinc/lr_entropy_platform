import { apiKeyRoute } from "@/lib/apiKeyRoute";
import { apiKeyAccount } from "@/lib/billing/cloudBilling";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The signed-in user's ONE Light Rider API key (stored only in cloud; the same
 * key as Light Rider Cloud's API Keys page). GET = metadata, POST = generate
 * (full key returned once), DELETE = revoke.
 */
export async function GET() {
  return apiKeyRoute(apiKeyAccount.get);
}

export async function POST() {
  return apiKeyRoute(apiKeyAccount.create);
}

export async function DELETE() {
  return apiKeyRoute(apiKeyAccount.revoke);
}
