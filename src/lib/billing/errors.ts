// Billing errors, in their own module so pure code (paidDraw.ts) can use them
// without importing the Logto SDK through cloudBilling.ts.

/** The cloud billing API can't be reached or answered 401/403/5xx. */
export class BillingUnavailableError extends Error {}

/**
 * The session can't mint a token for the billing resource. Logto only issues
 * resource tokens for resources requested at sign-in, so a session that began
 * before the resource was added to logtoConfig needs one fresh sign-in.
 */
export class ReauthRequiredError extends Error {}
