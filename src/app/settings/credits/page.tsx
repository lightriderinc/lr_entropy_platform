import SignInRequired from "@/components/auth/SignInRequired";
import CheckoutReturn from "@/components/billing/CheckoutReturn";
import CreditsSummary from "@/components/billing/CreditsSummary";
import CreditsTopUp from "@/components/billing/CreditsTopUp";
import UsageHistory from "@/components/billing/UsageHistory";
import WalletAutoRefresh from "@/components/billing/WalletAutoRefresh";
import { getSession } from "@/lib/auth/session";

export const metadata = { title: "Credits" };

/**
 * Credits: the shared Light Rider wallet (the same balance as the Cloud
 * platform), buying credits through the same Stripe checkout, and the ledger.
 * Gated inline like /settings/account.
 */
export default async function CreditsPage() {
  const { isAuthenticated } = await getSession();
  if (!isAuthenticated) return <SignInRequired target="your credits" />;

  return (
    <div className="animate-fade-in-up flex max-w-4xl flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold text-gray-700">Credits</h1>
        <p className="mt-1 text-sm text-gray-600">
          Entropy is paid with Light Rider credits: 1 token per 256 bytes, in every mode.
        </p>
      </div>
      <WalletAutoRefresh />
      <CheckoutReturn />
      <div className="flex flex-col gap-4 lg:flex-row">
        <CreditsSummary />
        <CreditsTopUp />
      </div>
      <UsageHistory />
    </div>
  );
}
