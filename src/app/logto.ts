// Logto configuration for this app. Env var names are shared across every
// Light Rider platform — see docs/adding-a-new-platform.md in the cloud
// platform repo for the canonical list. NEXT_BASE_URL (not LOGTO_BASE_URL) is
// the one name for this app's own origin; every redirect URI is built from it.
export const logtoConfig = {
  endpoint: process.env.LOGTO_ENDPOINT as string,
  appId: process.env.LOGTO_APP_ID as string,
  appSecret: process.env.LOGTO_APP_SECRET as string,
  // Fallback matches this app's pinned dev port (see package.json "dev").
  // A wrong fallback here silently produces a redirect_uri Logto will reject.
  baseUrl: process.env.NEXT_BASE_URL || 'http://localhost:3002',
  cookieSecret: process.env.LOGTO_COOKIE_SECRET as string,
  cookieSecure: process.env.NODE_ENV === 'production',
  // 'identities' surfaces linked social accounts on /api/my-account for the
  // "Connected accounts" section — no Management API app is registered for
  // this tenant, so that's the only source we have for them.
  scopes: ['email', 'profile', 'identities'],
};
