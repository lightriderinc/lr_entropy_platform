import { apiError, okJson } from "@/lib/api/v1";
import { getReceiptPublicKey } from "@/lib/receipts/publicKey";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/v1/public-key  (no key needed)
 * The EMS key that signs receipts: verify a receipt's Ed25519 signature over
 * its canonical form (every field except "signature", keys sorted, compact).
 */
export async function GET() {
  try {
    const k = await getReceiptPublicKey();
    return okJson({ signature_alg: k.signatureAlg, public_key_hex: k.publicKeyHex, fingerprint_sha256: k.fingerprint });
  } catch (err) {
    console.error("[api] public key unavailable:", err);
    return apiError(503, "unavailable", "The receipt public key is temporarily unavailable.");
  }
}
