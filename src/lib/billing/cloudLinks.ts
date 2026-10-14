// Links into the Light Rider Cloud platform, which owns the shared wallet, the
// Stripe customer and the API key. Server-only: reads env, so resolve the URL
// in a server component and pass it down.
//
// The Cloud origin is taken from CLOUD_BILLING_URL (the billing API lives on
// Cloud itself), the same way /settings/api-keys always has.

/** Absolute URL of a Cloud platform page, or null when no Cloud origin is configured. */
export function cloudPlatformUrl(path: string): string | null {
  try {
    return `${new URL(process.env.CLOUD_BILLING_URL ?? "").origin}${path}`;
  } catch {
    return null;
  }
}
