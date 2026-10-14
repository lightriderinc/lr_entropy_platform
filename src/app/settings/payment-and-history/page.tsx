import SignInRequired from "@/components/auth/SignInRequired";
import PaymentMethodCard from "@/components/billing/PaymentMethodCard";
import UsageHistory from "@/components/billing/UsageHistory";
import WalletAutoRefresh from "@/components/billing/WalletAutoRefresh";
import { getSession } from "@/lib/auth/session";
import { cloudPlatformUrl } from "@/lib/billing/cloudLinks";

export const metadata = { title: "Payment & History" };

/**
 * Payment & History, mirroring cloud's /settings/payment-and-history. The
 * history is the shared wallet's ledger (UsageHistory) rather than cloud's
 * purchases-only table, since this app reads the ledger, not Stripe.
 */
export default async function PaymentAndHistoryPage() {
  const { isAuthenticated } = await getSession();
  if (!isAuthenticated) return <SignInRequired target="your payment history" />;

  return (
    <div className="animate-fade-in-up">
      <h1 className="text-2xl font-semibold text-gray-700">Payment &amp; History</h1>
      <p className="mb-12 text-sm text-gray-600">
        Manage your payment method and view your credit history.
      </p>

      <WalletAutoRefresh />
      <div className="flex flex-col gap-4">
        <PaymentMethodCard manageUrl={cloudPlatformUrl("/settings/payment-and-history")} />
        <UsageHistory />
      </div>
    </div>
  );
}
